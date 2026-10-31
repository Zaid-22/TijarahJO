const DB_NAME = "tijarahjo-demo-images";
const PREFIX = "demo-image:";
const urls = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Image storage is unavailable in this browser."));
  });
}
export async function storeImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 10 * 1024 * 1024)
    throw new Error("Choose a JPG, PNG, WebP or GIF under 10 MB for the demo.");
  const database = await openDatabase();
  const key = PREFIX + crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").put(file, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Unable to save image. Browser storage may be full."));
      transaction.onabort = () => reject(new Error("Image storage was cancelled."));
    });
    urls.set(key, URL.createObjectURL(file));
    return key;
  } finally { database.close(); }
}
export async function resolveImages(value: unknown): Promise<unknown> {
  if (typeof value === "string" && value.startsWith(PREFIX)) {
    if (urls.has(value)) return urls.get(value);
    try {
      const database = await openDatabase();
      const blob = await new Promise<Blob | undefined>((resolve, reject) => {
        const request = database.transaction("images").objectStore("images").get(value);
        request.onsuccess = () => resolve(request.result as Blob | undefined);
        request.onerror = () => reject(request.error);
      }).finally(() => database.close());
      if (blob) { const url = URL.createObjectURL(blob); urls.set(value, url); return url; }
    } catch { /* A deleted image has an explicit local fallback. */ }
    return "/demo/camera.jpg";
  }
  if (Array.isArray(value)) return Promise.all(value.map(resolveImages));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(
    Object.entries(value).map(async ([key, entry]) => [key, await resolveImages(entry)]),
  ));
  return value;
}
export function persistedImage(url: string): string {
  return [...urls.entries()].find(([, objectUrl]) => objectUrl === url)?.[0] ?? url;
}
export async function clearImages(): Promise<void> {
  urls.forEach(url => URL.revokeObjectURL(url)); urls.clear();
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => database.close());
  } catch { /* Reset still clears structured data when IndexedDB is unavailable. */ }
}
