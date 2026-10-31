import type { Post } from "../types";
import type { DemoRequest, DemoState } from "./types";
import { categories, cities, areas } from "./seed";
import { DemoError, isActiveUser, requireOwner, requireUser } from "./store";
import { persistedImage, storeImage } from "./images";

export function rawPost(post: Post) {
  return { ...post, PostID: Number(post.id), PostTitle: post.name, PostDescription: post.description,
    UserID: Number(post.sellerId), CategoryID: Number(post.categoryId), Price: post.price,
    City: post.location, Area: post.area, Seller: post.seller, Category: post.category,
    Images: post.images, Status: post.status, CreatedAt: post.createdAt, Views: post.views };
}
export function visiblePosts(state: DemoState) {
  return state.posts.filter(p => p.status !== "DELETED" && state.users.some(u =>
    String(u.Id) === p.sellerId && isActiveUser(u)));
}
export function pageItems<T>(items: T[], query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page")) || 1);
  const limit = Math.min(1000, Math.max(1, Number(query.get("limit") || query.get("pageSize")) || 20));
  return { items: items.slice((page - 1) * limit, page * limit), totalCount: items.length,
    pagination: { currentPage: page, totalPages: Math.ceil(items.length / limit), totalPosts: items.length, postsPerPage: limit } };
}
export function sellerProfile(state: DemoState, id: number) {
  const user = state.users.find(u => u.Id === id && !u.IsDeleted);
  if (!user) throw new DemoError("HTTP_404", "Seller not found.");
  const posts = visiblePosts(state).filter(p => p.sellerId === String(id));
  return { success: true, seller: { id: String(id), name: `${user.FirstName} ${user.LastName}`,
    phone: "", city: user.City, area: user.Area, bio: user.Bio, avatar: user.Avatar,
    joinedDate: user.JoinedDate, activeListingsCount: posts.filter(p => p.status === "ACTIVE").length,
    totalSalesCount: posts.filter(p => p.status === "SOLD").length, totalViews: posts.reduce((sum, p) => sum + (p.views ?? 0), 0) }, posts };
}
function findPost(state: DemoState, id: string) {
  const post = state.posts.find(p => p.id === id);
  if (!post) throw new DemoError("HTTP_404", "Listing not found.");
  return post;
}
export async function marketplace(request: DemoRequest): Promise<unknown> {
  const { state, path, method, query, body, form } = request;
  if (path === "/categories" && method === "GET") return categories;
  if (/^\/categories\/\d+$/.test(path) && method === "GET") return categories.find(c => c.CategoryID === Number(path.split("/")[2]));
  if (path === "/cities" && method === "GET") return cities;
  if (/^\/cities\/\d+\/areas$/.test(path) && method === "GET") return areas.filter(a => a.CityId === Number(path.split("/")[2]));
  if (path === "/sellers/top" && method === "GET") return [2, 4, 5].map(id => sellerProfile(state, id).seller);
  if (/^\/sellers\/\d+$/.test(path) && method === "GET") return sellerProfile(state, Number(path.split("/")[2]));
  if (["/posts/feed", "/search"].includes(path) && method === "GET") {
    let posts = visiblePosts(state);
    const words = (query.get("query") ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const category = query.get("category"); const city = query.get("city");
    posts = posts.filter(p => {
      const haystack = `${p.name} ${p.description} ${p.category}`.toLocaleLowerCase();
      return words.every(word => haystack.includes(word)) &&
        (!category || [p.category, p.categoryId].some(c => c?.toLowerCase() === category.toLowerCase())) &&
        (!city || p.location === city || p.locationAr === city || String(cities.find(c => c.CityName === p.location)?.CityId) === city) &&
        (!query.has("minPrice") || p.price >= Number(query.get("minPrice"))) &&
        (!query.has("maxPrice") || p.price <= Number(query.get("maxPrice"))) &&
        (!query.get("status") || p.status === query.get("status"));
    });
    const sort = query.get("sortBy") ?? "date";
    const direction = query.get("sortOrder") === "asc" ? 1 : -1;
    posts.sort((a, b) => direction * (sort === "price" ? a.price - b.price : sort === "views" ? (a.views ?? 0) - (b.views ?? 0) : Date.parse(a.createdAt ?? "") - Date.parse(b.createdAt ?? "")));
    const page = pageItems(posts, query);
    return { posts: page.items.map(rawPost), pagination: page.pagination };
  }
  if (path === "/posts" && method === "POST") {
    const user = requireUser(state);
    const category = categories.find(c => c.CategoryID === Number(body.CategoryID));
    const city = cities.find(c => c.CityId === Number(body.CityId)) ?? cities[0];
    if (!category || !String(body.PostTitle ?? "").trim() || !Number.isFinite(Number(body.Price)) || Number(body.Price) < 0)
      throw new DemoError("HTTP_400", "A title, category and valid price are required.");
    const post: Post = { id: String(state.nextId++), name: String(body.PostTitle).trim(), price: Number(body.Price),
      description: String(body.PostDescription ?? ""), sellerId: String(user.Id), seller: `${user.FirstName} ${user.LastName}`,
      categoryId: String(category.CategoryID), category: category.CategoryName, location: city.CityName,
      locationAr: city.CityNameAr, area: areas.find(a => a.AreaId === Number(body.AreaId))?.AreaName,
      image: "", images: [], createdAt: new Date().toISOString(), views: 0, status: "ACTIVE" };
    state.posts.unshift(post); return rawPost(post);
  }
  const match = path.match(/^\/posts\/(\d+)(?:\/(status|views))?$/);
  if (match) {
    const post = findPost(state, match[1]);
    if (method === "GET" && !match[2]) {
      if (!visiblePosts(state).includes(post)) throw new DemoError("HTTP_404", "This listing is no longer available.");
      return rawPost(post);
    }
    if (match[2] === "views" && method === "POST") { post.views = (post.views ?? 0) + 1; return { success: true }; }
    requireOwner(state, post.sellerId);
    if (method === "DELETE" && !match[2]) { post.status = "DELETED"; return { success: true }; }
    if (method === "PATCH" && match[2] === "status") {
      if (!["ACTIVE", "SOLD", "DELETED"].includes(String(body.Status))) throw new DemoError("HTTP_400", "Invalid status.");
      post.status = body.Status as Post["status"]; return rawPost(post);
    }
    if (method === "PUT" && !match[2]) {
      post.name = String(body.PostTitle ?? post.name); post.description = String(body.PostDescription ?? post.description);
      const price = Number(body.Price ?? post.price);
      if (!Number.isFinite(price) || price < 0) throw new DemoError("HTTP_400", "Invalid price.");
      post.price = price;
      const category = categories.find(c => c.CategoryID === Number(body.CategoryID));
      if (category) { post.categoryId = String(category.CategoryID); post.category = category.CategoryName; }
      const city = cities.find(c => c.CityId === Number(body.CityId));
      if (city) { post.location = city.CityName; post.locationAr = city.CityNameAr; }
      post.area = areas.find(a => a.AreaId === Number(body.AreaId))?.AreaName ?? post.area;
      return rawPost(post);
    }
  }
  if (path.startsWith("/post-images")) {
    if (path === "/post-images/validate" && method === "POST") {
      requireUser(state);
      const file = form?.get("File") ?? form?.get("file");
      if (!(file instanceof File) || !/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 10 * 1024 * 1024)
        throw new DemoError("HTTP_400", "Choose a JPG, PNG, WebP or GIF under 10 MB for the demo.");
      return { safe: true };
    }
    const id = String(form?.get("PostID") ?? body.PostID ?? query.get("postId") ?? path.match(/\/post\/(\d+)/)?.[1] ?? "");
    if (method === "GET") {
      const post = findPost(state, id);
      return (post.images ?? []).map((url, index) => ({ PostID: Number(post.id), PostImageID: Number(post.id) * 100 + index, PostImageURL: url }));
    }
    if (method === "DELETE") {
      const imageId = Number(path.split("/")[2]); const post = findPost(state, String(Math.floor(imageId / 100)));
      requireOwner(state, post.sellerId);
      // Keep slots stable during the existing client's parallel image deletion.
      post.images = (post.images ?? []).map((url, i) => i === imageId % 100 ? "" : url);
      post.image = post.images.find(Boolean) ?? ""; return { success: true };
    }
    if (method === "POST" && ["/post-images", "/post-images/upload"].includes(path)) {
      const post = findPost(state, id); requireOwner(state, post.sellerId);
      const file = form?.get("File");
      const url = file instanceof File ? await storeImage(file) : persistedImage(String(body.PostImageURL ?? ""));
      if (!url || (!url.startsWith("demo-image:") && !url.startsWith("/demo/"))) throw new DemoError("HTTP_400", "Upload a local image for this demo.");
      post.images = [...(post.images ?? []), url]; post.image = post.images.find(Boolean) ?? url;
      return { Url: url };
    }
  }
  return undefined;
}
