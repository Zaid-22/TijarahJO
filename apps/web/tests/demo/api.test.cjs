const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
fs.writeFileSync(path.join(__dirname, "../../.unit-dist/demo/package.json"), '{"type":"commonjs"}');
const { demoRequest } = require("../../.unit-dist/demo/demo/api.js");
const { readState, resetState, DEMO_STORAGE_KEY } = require("../../.unit-dist/demo/demo/store.js");
const storage = new Map();
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
global.fetch = () => { throw new Error("Demo must never fetch backend data"); };
const call = (url, method = "GET", body, options = {}) => demoRequest(url, { method, ...(body ? { body: JSON.stringify(body) } : {}), ...options });
const login = name => call("/auth/login", "POST", { Login: name + "@demo.example", Password: "Demo123!" });
beforeEach(() => { storage.clear(); resetState(); });

test("homepage banners load for guests with bundled responsive images and populated destinations", async () => {
  const response = await call("/banners");
  assert.equal(response.success, true);
  assert.equal(response.data.success, true);
  assert.equal(response.data.banners.length, 3);
  for (const banner of response.data.banners) {
    assert.equal(banner.isActive, true);
    for (const field of ["title", "titleAr", "subtitle", "subtitleAr", "buttonText", "buttonTextAr"]) {
      assert.ok(banner[field].trim());
    }
    const asset = path.join(__dirname, "../../public", banner.imageUrl);
    for (const file of [asset, asset.replace(".webp", "-360w.webp"), asset.replace(".webp", ".png")]) {
      assert.ok(fs.statSync(file).size > 0, `Missing banner media: ${file}`);
    }
    const destination = banner.linkUrl === "/posts" ? "/posts/feed" : `/search?category=${banner.linkUrl.split("/").pop()}`;
    assert.ok((await call(destination)).data.posts.length > 0);
  }
  await call("/demo/reset", "POST");
  assert.deepEqual((await call("/banners")).data, response.data);
});

test("fresh catalog, filters and pagination return real API shapes", async () => {
  const feed = await call("/posts/feed?page=1&limit=12");
  assert.equal(feed.success, true); assert.equal(feed.data.posts.length, 12);
  assert.equal(feed.data.pagination.totalPosts, 30);
  const search = await call("/search?query=iPhone&minPrice=200&maxPrice=300");
  assert.equal(search.data.posts.length, 2);
  assert.ok(search.data.posts.every(p => p.Price >= 200 && p.Price <= 300));
  const category = await call("/search?category=Books&sortBy=price&sortOrder=asc");
  assert.deepEqual(category.data.posts.map(p => p.Price), [12, 15, 18, 22, 25]);
});
test("guest and owner permissions are enforced and unsupported requests never escape", async () => {
  assert.equal((await call("/admin/stats")).error.code, "HTTP_401");
  assert.equal((await call("/something-new")).error.code, "DEMO_UNAVAILABLE");
  await login("buyer");
  assert.equal((await call("/admin/stats")).error.code, "HTTP_403");
  assert.equal((await call("/posts/1", "DELETE")).error.code, "HTTP_403");
});
test("favorites persist independently for each account", async () => {
  await login("buyer"); await call("/favorites", "POST", { postId: "6" });
  await login("seller"); assert.deepEqual((await call("/favorites")).data.favorites, ["2"]);
  await login("buyer"); assert.ok((await call("/favorites")).data.favorites.includes("6"));
  await call("/favorites/6", "DELETE"); assert.ok(!(await call("/favorites")).data.favorites.includes("6"));
});
test("seller can create, edit, sell and delete a listing without it being reseeded", async () => {
  await login("seller");
  const created = await call("/posts", "POST", { PostTitle: "Demo desk", Price: 50, CategoryID: 3, CityId: 1 });
  assert.equal(created.success, true); const id = created.data.PostID;
  await call("/posts/" + id, "PUT", { PostTitle: "Updated desk", Price: 45 });
  await call("/posts/" + id + "/status", "PATCH", { Status: "SOLD" });
  assert.equal((await call("/posts/" + id)).data.Status, "SOLD");
  await call("/posts/" + id, "DELETE");
  assert.equal((await call("/posts/" + id)).error.code, "HTTP_404");
  assert.equal((await call("/posts/feed?limit=100")).data.pagination.totalPosts, 30);
  assert.equal(readState().posts.find(p => p.id === String(id)).status, "DELETED");
});
test("admin moderation updates public visibility, counts and audit log", async () => {
  await login("admin"); const before = (await call("/admin/stats")).data;
  await call("/admin/posts/1/status", "PATCH", { Status: "BLOCKED" });
  assert.equal((await call("/posts/1")).error.code, "HTTP_404");
  const after = (await call("/admin/stats")).data;
  assert.equal(after.activeListings, before.activeListings - 1);
  assert.equal(after.blockedListings, before.blockedListings + 1);
  assert.equal((await call("/admin/audit-logs")).data.totalCount, 1);
  await call("/admin/reports/1/status", "PUT", { Status: 1, ResolutionNotes: "Reviewed" });
  assert.equal((await call("/admin/reports?status=1")).data.reports[0].resolutionNotes, "Reviewed");
});
test("conversations are scoped to the selected account and simulated replies persist", async () => {
  await login("buyer");
  const sent = await call("/chat/send", "POST", { ReceiverId: 2, Content: "Is this available?", PostId: 1 });
  const reply = await call("/chat/demo-reply", "POST", { messageId: sent.data.messageId });
  assert.match(reply.data.content, /Demo reply/);
  assert.equal((await call("/chat/history/2")).data.length, 3);
  await login("admin"); assert.equal((await call("/chat/recent")).data.length, 0);
});
test("comparison labels simulated analysis and uses the actual selected prices", async () => {
  await login("buyer"); const result = await call("/compare", "POST", { PostIds: [1, 7], Language: "en" });
  assert.equal(result.data.Posts.length, 2);
  assert.match(result.data.PriceComparison, /not live AI/);
  assert.equal(result.data.FinalRecommendation.WinnerName, "Laptop for university");
});
test("parallel requests do not lose favorite changes", async () => {
  await login("buyer");
  await Promise.all([4, 5, 6, 7].map(id => call("/favorites", "POST", { postId: String(id) })));
  assert.equal((await call("/favorites")).data.favorites.length, 6);
});
test("abort prevents mutation and supports callers requesting AbortError", async () => {
  await login("buyer"); const controller = new AbortController(); controller.abort();
  const result = await call("/favorites", "POST", { postId: "6" }, { signal: controller.signal });
  assert.equal(result.error.code, "ABORTED");
  await assert.rejects(call("/favorites", "POST", { postId: "6" }, { signal: controller.signal, throwOnAbort: true }), { name: "AbortError" });
  assert.equal((await call("/favorites")).data.favorites.length, 2);
});
test("corrupt storage recovers and reset restores original data and clears session", async () => {
  storage.set(DEMO_STORAGE_KEY, "not json");
  assert.equal((await call("/posts/feed")).data.pagination.totalPosts, 30);
  await login("seller"); await call("/posts/1", "DELETE"); resetState();
  assert.equal(readState().posts.length, 30); assert.equal(readState().session, null);
  assert.equal((await call("/posts/1")).success, true);
});
test("profile edits preserve persona login and seeded accounts have complete routing fields", async () => {
  await login("seller");
  const user = (await call("/auth/me")).data;
  assert.ok(user.Phone && user.CityId && user.AreaId);
  await call("/users/2", "PUT", { Email: "edited@demo.example", Bio: "Updated profile" });
  await login("buyer");
  assert.equal((await login("seller")).success, true);
  assert.equal((await call("/auth/me")).data.Bio, "Updated profile");
});
test("bulk ban, reactivation and timed suspension affect login and public listings", async () => {
  await login("admin");
  assert.equal((await call("/users/Exists/2")).data, true);
  await call("/admin/users/bulk-status", "PUT", { userIds: [2], status: "banned" });
  assert.equal((await login("seller")).success, false);
  assert.equal((await call("/posts/1")).success, false);
  await call("/admin/users/bulk-status", "PUT", { userIds: [2], status: "active" });
  assert.equal((await call("/posts/1")).success, true);
  await call("/admin/users/2/suspend", "POST", { DurationHours: 24 });
  assert.equal((await login("seller")).success, false);
  assert.equal((await call("/posts/1")).success, false);
  assert.equal((await call("/admin/users/3/suspend", "POST", { DurationHours: null })).success, false);
});
test("invalid uploads fail before listing creation", async () => {
  await login("seller");
  const form = new FormData(); form.set("File", new File(["text"], "notes.txt", { type: "text/plain" }));
  const result = await demoRequest("/post-images/validate", { method: "POST", body: form });
  assert.equal(result.success, false); assert.equal(result.error.code, "HTTP_400");
});
test("storage quota failure never returns the stale persisted dataset", async () => {
  await login("buyer");
  const setItem = localStorage.setItem;
  try {
    localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    await call("/favorites", "POST", { postId: "6" });
    assert.ok((await call("/favorites")).data.favorites.includes("6"));
  } finally { localStorage.setItem = setItem; resetState(); }
});
