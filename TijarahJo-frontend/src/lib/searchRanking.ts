import { Product } from "../types";

type SearchIntent = {
  queryTerms: string[];
  categoryTerms: string[];
  listingTerms: string[];
};

type QueryContext = {
  normalizedQuery: string;
  queryTokens: string[];
  queryTokenSet: Set<string>;
  expandedTokens: string[];
  activeIntents: SearchIntent[];
};

const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_SEARCH_CHAR_REGEX = /[^a-z0-9\u0600-\u06FF\s]/g;
const WHITESPACE_REGEX = /\s+/g;

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(NON_SEARCH_CHAR_REGEX, " ")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
}

function tokenize(value: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeTerms(terms: string[]): string[] {
  return [...new Set(terms.map((term) => normalizeSearchText(term)).filter(Boolean))];
}

const SEARCH_INTENTS: SearchIntent[] = [
  {
    // Vehicles intent boost: "car" searches should prioritize vehicle posts.
    queryTerms: normalizeTerms([
      "car",
      "cars",
      "vehicle",
      "vehicles",
      "auto",
      "automobile",
      "motor",
      "motors",
      "suv",
      "sedan",
      "truck",
      "trucks",
      "pickup",
      "van",
      "bike",
      "bikes",
      "motorcycle",
      "سياره",
      "سيارات",
      "مركبه",
      "مركبات",
      "شاحنه",
      "دراجه",
      "دراجات",
    ]),
    categoryTerms: normalizeTerms([
      "vehicle",
      "vehicles",
      "car",
      "cars",
      "automotive",
      "سيارات",
      "مركبات",
      "مركبه",
    ]),
    listingTerms: normalizeTerms([
      "car",
      "cars",
      "suv",
      "sedan",
      "truck",
      "pickup",
      "van",
      "motorcycle",
      "bike",
      "سياره",
      "سيارات",
      "شاحنه",
      "دراجه",
    ]),
  },
];

function toTimestamp(dateValue?: string): number {
  if (!dateValue) {
    return 0;
  }
  const timestamp = Date.parse(dateValue);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function recencyBoost(createdAt?: string): number {
  const timestamp = toTimestamp(createdAt);
  if (!timestamp) {
    return 0;
  }

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 12;
  if (ageDays <= 30) return 8;
  if (ageDays <= 90) return 4;
  return 0;
}

function viewsBoost(views?: number): number {
  const safeViews = Math.max(0, Number(views || 0));
  if (!safeViews) {
    return 0;
  }
  return Math.min(8, Math.log10(safeViews + 1) * 3);
}

function englishWordVariants(token: string): string[] {
  const variants = new Set<string>([token]);
  if (token.length > 3 && token.endsWith("ies")) {
    variants.add(`${token.slice(0, -3)}y`);
  }
  if (token.length > 3 && token.endsWith("es")) {
    variants.add(token.slice(0, -2));
  }
  if (token.length > 2 && token.endsWith("s")) {
    variants.add(token.slice(0, -1));
  }
  return [...variants];
}

function queryContainsTerm(
  normalizedQuery: string,
  queryTokenSet: Set<string>,
  term: string,
): boolean {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) {
    return false;
  }

  const termTokens = tokenize(normalizedTerm);
  if (termTokens.length <= 1) {
    return queryTokenSet.has(normalizedTerm);
  }

  return normalizedQuery.includes(normalizedTerm);
}

function buildQueryContext(query: string): QueryContext | null {
  const normalizedQuery = normalizeSearchText(query || "");
  if (!normalizedQuery) {
    return null;
  }

  const queryTokens = tokenize(normalizedQuery);
  const queryTokenSet = new Set(queryTokens);
  const expandedTokenSet = new Set(
    queryTokens.flatMap((token) => englishWordVariants(token)),
  );

  const activeIntents = SEARCH_INTENTS.filter((intent) =>
    intent.queryTerms.some((term) =>
      queryContainsTerm(normalizedQuery, queryTokenSet, term),
    ),
  );

  for (const intent of activeIntents) {
    for (const term of intent.queryTerms) {
      expandedTokenSet.add(term);
    }
  }

  return {
    normalizedQuery,
    queryTokens,
    queryTokenSet,
    expandedTokens: [...expandedTokenSet],
    activeIntents,
  };
}

function includesAnyIntentTerm(
  text: string,
  tokens: string[],
  terms: string[],
): boolean {
  return terms.some((term) => {
    const normalizedTerm = normalizeSearchText(term);
    if (!normalizedTerm) {
      return false;
    }

    const termTokens = tokenize(normalizedTerm);
    if (termTokens.length <= 1) {
      return tokens.includes(normalizedTerm);
    }

    return text.includes(normalizedTerm);
  });
}

function scoreProduct(product: Product, context: QueryContext): number {
  const { normalizedQuery, queryTokens, queryTokenSet, expandedTokens, activeIntents } =
    context;

  const name = normalizeSearchText(product.name || "");
  const category = normalizeSearchText(product.category || "");
  const location = normalizeSearchText(product.location || "");
  const seller = normalizeSearchText(product.seller || "");
  const description = normalizeSearchText(product.description || "");
  const nameTokens = tokenize(name);
  const categoryTokens = tokenize(category);
  const descriptionTokens = tokenize(description);

  let score = 0;

  if (name === normalizedQuery) score += 280;
  else if (name.startsWith(normalizedQuery)) score += 210;
  else if (name.includes(normalizedQuery)) score += 160;

  if (category === normalizedQuery) score += 260;
  else if (category.startsWith(normalizedQuery)) score += 200;
  else if (category.includes(normalizedQuery)) score += 150;

  if (description.includes(normalizedQuery)) score += 80;
  if (location.includes(normalizedQuery)) score += 40;
  if (seller.includes(normalizedQuery)) score += 30;

  for (const token of queryTokens) {
    if (!token) continue;
    if (category.includes(token)) score += 60;
    if (name.includes(token)) score += 50;
    if (description.includes(token)) score += 24;
    if (location.includes(token)) score += 16;
    if (seller.includes(token)) score += 10;
  }

  for (const token of expandedTokens) {
    if (queryTokenSet.has(token)) continue;
    if (category.includes(token)) score += 34;
    if (name.includes(token)) score += 24;
    if (description.includes(token)) score += 12;
  }

  for (const intent of activeIntents) {
    const hasCategoryIntentMatch = includesAnyIntentTerm(
      category,
      categoryTokens,
      intent.categoryTerms,
    );
    const hasListingIntentMatch =
      includesAnyIntentTerm(name, nameTokens, intent.listingTerms) ||
      includesAnyIntentTerm(description, descriptionTokens, intent.listingTerms);

    if (hasCategoryIntentMatch) {
      score += 170;
    } else if (hasListingIntentMatch) {
      score += 90;
    }
  }

  if (score <= 0) {
    return 0;
  }

  score += recencyBoost(product.createdAt);
  score += viewsBoost(product.views);
  return score;
}

export function isActiveProduct(product: Product): boolean {
  return product.status !== "SOLD" && product.status !== "DELETED";
}

export function rankProductsBySearch(products: Product[], query: string): Product[] {
  const activeProducts = products.filter(isActiveProduct);
  const context = buildQueryContext(query);

  if (!context) {
    return [...activeProducts];
  }

  return activeProducts
    .map((product, index) => ({
      product,
      index,
      score: scoreProduct(product, context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const createdDiff =
        toTimestamp(b.product.createdAt) - toTimestamp(a.product.createdAt);
      if (createdDiff !== 0) {
        return createdDiff;
      }

      const viewsDiff = (b.product.views || 0) - (a.product.views || 0);
      if (viewsDiff !== 0) {
        return viewsDiff;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.product);
}
