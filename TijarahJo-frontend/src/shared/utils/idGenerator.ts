// Unique ID Generator for Frontend Entities - FIXED VERSION
// Generates unique IDs using timestamp + random value approach with collision prevention

/**
 * Validate prefix format
 * Prefix must be lowercase alphanumeric, no spaces or special chars
 */
function isValidPrefix(prefix: string): boolean {
  return /^[a-z][a-z0-9]*$/.test(prefix);
}

// Counter for handling same-millisecond ID generation
let lastTimestamp = 0;
let counter = 0;

/**
 * Generates a unique ID using timestamp and random value with collision prevention
 * Format: {prefix}_{timestamp}_{random} or {prefix}_{timestamp-counter}_{random}
 * Example: "post_1734602400000_a7f3d" or "post_1734602400000-1_a7f3d"
 */
export function generateId(prefix: string = 'id'): string {
  // Validate prefix format
  if (!isValidPrefix(prefix)) {
    throw new Error(
      `Invalid prefix "${prefix}". Prefix must be lowercase alphanumeric and start with a letter. Examples: "user", "post", "cat"`
    );
  }

  let timestamp = Date.now();
  
  // Handle same-millisecond calls to prevent collisions
  if (timestamp === lastTimestamp) {
    counter++;
  } else {
    counter = 0;
    lastTimestamp = timestamp;
  }
  
  // Use crypto.getRandomValues for better randomness if available
  let random: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    random = buffer[0].toString(36);
  } else {
    // Fallback to Math.random
    random = Math.random().toString(36).substring(2);
  }
  
  // Ensure random part is at least 5 characters by padding
  random = (random + '00000').substring(0, 5);
  
  // Include counter for same-millisecond uniqueness (only if > 0)
  const counterStr = counter > 0 ? `-${counter.toString(36)}` : '';
  
  return `${prefix}_${timestamp}${counterStr}_${random}`;
}

/**
 * Generate a UUID v4-like string
 * Uses crypto.randomUUID() if available, falls back to custom implementation
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short unique ID (exactly 8 characters)
 * Format: abc123de
 * FIXED: Now always returns exactly 8 characters
 */
export function generateShortId(): string {
  const random = Math.random().toString(36).substring(2);
  // Pad with zeros and take exactly 8 characters
  return (random + '00000000').substring(0, 8);
}

/**
 * ID Generators for specific entity types
 */
export const idGenerators = {
  user: () => generateId('user'),
  post: () => generateId('post'),
  category: () => generateId('cat'),
  image: () => generateId('img'),
  location: () => generateId('loc'),
  
  // Alternative using UUID
  userUUID: () => generateUUID(),
  postUUID: () => generateUUID(),
  categoryUUID: () => generateUUID(),
  imageUUID: () => generateUUID(),
  locationUUID: () => generateUUID(),
} as const;

/**
 * Validate if a string is a valid ID format
 * FIXED: Now actually validates format, not just non-empty check
 */
export function isValidId(id: string, prefix?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Check for valid characters only
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return false;
  }
  
  // Check length constraints
  if (id.length === 0 || id.length > 100) {
    return false;
  }
  
  // Check prefix if specified
  if (prefix) {
    if (!id.startsWith(`${prefix}_`)) {
      return false;
    }
    
    // Validate format: prefix_timestamp_random or prefix_timestamp-counter_random
    const parts = id.split('_');
    if (parts.length < 3) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate ID format with detailed checking
 * Returns validation result with error message
 * FIXED: Improved empty string handling and logic flow
 */
export function validateId(id: any, options?: {
  prefix?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
}): { valid: boolean; error?: string } {
  const opts = {
    required: true,
    maxLength: 100,
    minLength: 1,
    ...options
  };
  
  // Check if value is provided (null, undefined, or empty string)
  const isEmpty = id === null || id === undefined || id === '';
  
  // Handle required validation
  if (isEmpty) {
    if (opts.required) {
      return { valid: false, error: 'ID is required' };
    }
    // If not required and empty, it's valid - return early
    return { valid: true };
  }
  
  // From here, we know id is not empty
  // Check type
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' };
  }
  
  // Check length
  if (id.length < opts.minLength) {
    return { valid: false, error: `ID must be at least ${opts.minLength} character${opts.minLength === 1 ? '' : 's'}` };
  }
  
  if (id.length > opts.maxLength) {
    return { valid: false, error: `ID must be at most ${opts.maxLength} characters` };
  }
  
  // Check prefix if specified
  if (opts.prefix) {
    if (!isValidPrefix(opts.prefix)) {
      return { valid: false, error: `Invalid prefix format: "${opts.prefix}"` };
    }
    
    if (!id.startsWith(`${opts.prefix}_`)) {
      return { valid: false, error: `ID must start with "${opts.prefix}_"` };
    }
  }
  
  // Check for invalid characters (allow alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, error: 'ID contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.' };
  }
  
  return { valid: true };
}

/**
 * Validate entity-specific IDs
 */
export const idValidators = {
  user: (id: any) => validateId(id, { prefix: 'user', required: true }),
  post: (id: any) => validateId(id, { prefix: 'post', required: true }),
  category: (id: any) => validateId(id, { prefix: 'cat', required: true }),
  image: (id: any) => validateId(id, { prefix: 'img', required: true }),
  location: (id: any) => validateId(id, { prefix: 'loc', required: true }),
  
  // UUID validators (no prefix requirement)
  // FIXED: Improved null/undefined/empty handling
  uuid: (id: any) => {
    // Check null/undefined/empty
    if (id == null || id === '') {
      return { valid: false, error: 'UUID is required' };
    }
    
    // Check type
    if (typeof id !== 'string') {
      return { valid: false, error: 'UUID must be a string' };
    }
    
    // Validate UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return { valid: false, error: 'Invalid UUID v4 format. Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' };
    }
    
    return { valid: true };
  }
};

/**
 * Sanitize ID input (remove invalid characters, trim whitespace)
 * FIXED: Now returns result object instead of silently failing
 */
export function sanitizeId(id: any): { sanitized: string; valid: boolean; removed?: string } {
  // Handle non-string input
  if (id === null || id === undefined) {
    return { sanitized: '', valid: false };
  }
  
  // Convert to string if not already
  const str = String(id);
  const original = str;
  
  // Sanitize: trim, remove invalid chars, limit length
  const sanitized = str
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 100);
  
  // Check if anything was removed (for debugging/logging)
  let removed: string | undefined;
  if (original !== original.trim()) {
    removed = (removed || '') + ' (whitespace) ';
  }
  if (original.replace(/[a-zA-Z0-9_-]/g, '').length > 0) {
    const invalidChars = original
      .replace(/[a-zA-Z0-9_-]/g, '')
      .split('')
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .join('');
    removed = (removed || '') + invalidChars;
  }
  if (original.length > 100) {
    removed = (removed || '') + ` (truncated from ${original.length} to 100 chars)`;
  }
  
  return {
    sanitized,
    valid: sanitized.length > 0,
    removed: removed?.trim()
  };
}

/**
 * Simple sanitize function for backward compatibility
 * Returns just the sanitized string
 */
export function sanitizeIdSimple(id: string): string {
  return sanitizeId(id).sanitized;
}

/**
 * Check if an ID exists in a collection
 */
export function idExists<T extends { id: string }>(id: string, collection: T[]): boolean {
  if (!id || !Array.isArray(collection)) {
    return false;
  }
  return collection.some(item => item.id === id);
}

/**
 * Find entity by ID in a collection
 */
export function findById<T extends { id: string }>(id: string, collection: T[]): T | undefined {
  if (!id || !Array.isArray(collection)) {
    return undefined;
  }
  return collection.find(item => item.id === id);
}

/**
 * Validate array of IDs
 * FIXED: Added required option and better error reporting
 */
export function validateIds(ids: any[], options?: {
  prefix?: string;
  allowEmpty?: boolean;
  required?: boolean; // Whether individual IDs are required (not null/undefined)
}): { valid: boolean; error?: string; invalidIds?: Array<{ index: number; value: any; error?: string }> } {
  if (!Array.isArray(ids)) {
    return { valid: false, error: 'IDs must be an array' };
  }
  
  if (!options?.allowEmpty && ids.length === 0) {
    return { valid: false, error: 'IDs array cannot be empty' };
  }
  
  const invalidIds: Array<{ index: number; value: any; error?: string }> = [];
  
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const result = validateId(id, { 
      prefix: options?.prefix,
      required: options?.required ?? true // Default to required
    });
    
    if (!result.valid) {
      invalidIds.push({ 
        index: i, 
        value: id, 
        error: result.error 
      });
    }
  }
  
  if (invalidIds.length > 0) {
    const positions = invalidIds.map(x => x.index).join(', ');
    return { 
      valid: false, 
      error: `${invalidIds.length} invalid ID(s) found at position${invalidIds.length === 1 ? '' : 's'}: ${positions}`,
      invalidIds 
    };
  }
  
  return { valid: true };
}

/**
 * Extract timestamp from ID if it follows our format
 * FIXED: Now validates format and timestamp range
 */
export function extractTimestampFromId(id: string): number | null {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  const parts = id.split('_');
  
  // Our format should have exactly 3 parts: prefix_timestamp_random
  if (parts.length !== 3) {
    return null;
  }
  
  // Handle counter format in timestamp: timestamp-counter
  let timestampPart = parts[1];
  if (timestampPart.includes('-')) {
    timestampPart = timestampPart.split('-')[0];
  }
  
  const timestamp = parseInt(timestampPart, 10);
  
  // Validate timestamp is a number
  if (isNaN(timestamp)) {
    return null;
  }
  
  // Validate timestamp is within reasonable range
  // After Jan 1, 2020 and before Jan 1, 2100
  const MIN_TIMESTAMP = 1577836800000; // Jan 1, 2020 00:00:00 UTC
  const MAX_TIMESTAMP = 4102444800000; // Jan 1, 2100 00:00:00 UTC
  
  if (timestamp < MIN_TIMESTAMP || timestamp > MAX_TIMESTAMP) {
    return null;
  }
  
  return timestamp;
}

/**
 * Extract prefix from ID
 */
export function extractPrefixFromId(id: string): string | null {
  if (!id || typeof id !== 'string') {
    return null;
  }
  
  const parts = id.split('_');
  if (parts.length < 3) {
    return null;
  }
  
  return parts[0];
}

/**
 * Check if two IDs are from the same entity type (same prefix)
 */
export function isSameEntityType(id1: string, id2: string): boolean {
  const prefix1 = extractPrefixFromId(id1);
  const prefix2 = extractPrefixFromId(id2);
  
  return prefix1 !== null && prefix2 !== null && prefix1 === prefix2;
}

/**
 * Get ID age in milliseconds
 */
export function getIdAge(id: string): number | null {
  const timestamp = extractTimestampFromId(id);
  if (timestamp === null) {
    return null;
  }
  
  return Date.now() - timestamp;
}

/**
 * Check if ID was created within the last N milliseconds
 */
export function isRecentId(id: string, maxAgeMs: number): boolean {
  const age = getIdAge(id);
  return age !== null && age <= maxAgeMs;
}
