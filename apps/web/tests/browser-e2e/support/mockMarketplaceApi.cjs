function toInteger(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function buildPagination(totalPosts, currentPage, postsPerPage) {
  const safeCurrentPage = Math.max(1, currentPage);
  const safePostsPerPage = Math.max(1, postsPerPage);
  const totalPages =
    totalPosts > 0 ? Math.ceil(totalPosts / safePostsPerPage) : 0;

  return {
    currentPage: safeCurrentPage,
    totalPages,
    totalPosts,
    postsPerPage: safePostsPerPage,
  };
}

function withCorsHeaders(route) {
  const requestHeaders = route.request().headers();
  const requestOrigin = normalizeString(requestHeaders.origin);
  const requestedAllowHeaders = normalizeString(
    requestHeaders["access-control-request-headers"],
  );

  return {
    "Access-Control-Allow-Origin": requestOrigin || "http://127.0.0.1:4173",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      requestedAllowHeaders || "Content-Type, X-CSRF-Token",
    "Access-Control-Allow-Private-Network": "true",
    Vary: "Origin",
  };
}

function createMarketplaceApiMock(options = {}) {
  const debugMockApi = process.env.PW_DEBUG_MOCK_API === "1";
  const configuredApiBaseUrl =
    process.env.VITE_API_BASE_URL || "http://localhost:5033/api";
  const normalizedApiBaseUrl = configuredApiBaseUrl.endsWith("/")
    ? configuredApiBaseUrl.slice(0, -1)
    : configuredApiBaseUrl;
  let apiBaseUrl;
  try {
    apiBaseUrl = new URL(normalizedApiBaseUrl);
  } catch {
    apiBaseUrl = new URL("http://localhost:5033/api");
  }
  const apiHost = apiBaseUrl.host.toLowerCase();
  const apiBasePath = apiBaseUrl.pathname.toLowerCase().replace(/\/+$/, "");
  const authUser = {
    Id: 10,
    Email: "buyer@example.com",
    FirstName: "Test",
    LastName: "Buyer",
    Name: "Test Buyer",
    Phone: "+962790000001",
    City: "Amman",
    Area: "Khalda",
    Avatar: "",
    RoleID: 2,
    JoinedDate: "2024-01-10T12:00:00.000Z",
    IsDeleted: false,
  };
  const users = [
    authUser,
    {
      Id: 5,
      Email: "seller@example.com",
      FirstName: "Demo",
      LastName: "Seller",
      Name: "Demo Seller",
      Phone: "+962790000005",
      City: "Amman",
      Area: "Abdoun",
      Avatar: "",
      RoleID: 2,
      JoinedDate: "2023-02-01T10:00:00.000Z",
      IsDeleted: false,
    },
  ];
  const reviewsByUserId = new Map([
    [
      "5",
      [
        {
          ReviewID: 9001,
          ReviewerID: authUser.Id,
          ReviewerName: authUser.Name,
          Rating: 5,
          Comment: "Excellent seller",
          Timestamp: "2026-02-20T10:00:00.000Z",
        },
      ],
    ],
    [String(authUser.Id), []],
  ]);
  const categories = [
    {
      CategoryID: 1,
      CategoryName: "Electronics",
      NameAr: "إلكترونيات",
      Icon: "smartphone",
      Color: "#0A4ABF",
    },
    {
      CategoryID: 2,
      CategoryName: "Home",
      NameAr: "منزل",
      Icon: "home",
      Color: "#0A4ABF",
    },
  ];
  const posts = [
    {
      postId: 101,
      userId: 5,
      categoryId: 1,
      categoryName: "Electronics",
      seller: "Demo Seller",
      title: "Demo Phone",
      description: "Battery 95%, good condition",
      price: 550,
      city: "Amman",
      area: "Khalda",
      createdAt: "2026-02-19T12:00:00.000Z",
      views: 20,
      status: 0,
      images: ["https://example.com/demo-phone.png"],
    },
    {
      postId: 102,
      userId: 5,
      categoryId: 1,
      categoryName: "Electronics",
      seller: "Demo Seller",
      title: "Vintage Camera",
      description: "Collector item",
      price: 310,
      city: "Irbid",
      area: "Downtown",
      createdAt: "2026-02-17T08:30:00.000Z",
      views: 8,
      status: 0,
      images: ["https://example.com/vintage-camera.png"],
    },
  ];
  const postImagesByPostId = new Map();
  let nextPostId = 400;
  let nextPostImageId = 700;
  let sessionAuthenticated = Boolean(options.authenticated);
  const favoritesByUserId = new Map([[String(authUser.Id), new Set()]]);

  for (const post of posts) {
    postImagesByPostId.set(String(post.postId), [
      {
        PostImageID: nextPostImageId++,
        PostID: post.postId,
        PostImageURL: post.images[0],
        UploadedAt: post.createdAt,
        IsDeleted: false,
      },
    ]);
  }

  function currentUserId() {
    return String(authUser.Id);
  }

  function ensureFavoriteSet() {
    const userId = currentUserId();
    if (!favoritesByUserId.has(userId)) {
      favoritesByUserId.set(userId, new Set());
    }

    return favoritesByUserId.get(userId);
  }

  function findUserById(id) {
    return users.find((user) => String(user.Id) === String(id)) || null;
  }

  function findCategoryById(id) {
    return categories.find(
      (category) => String(category.CategoryID) === String(id),
    );
  }

  function postToPayload(post) {
    return {
      PostID: post.postId,
      UserID: post.userId,
      CategoryID: post.categoryId,
      Category: post.categoryName,
      Seller: post.seller,
      PostTitle: post.title,
      PostDescription: post.description,
      Price: post.price,
      City: post.city,
      Area: post.area,
      CreatedAt: post.createdAt,
      Views: post.views,
      Status: post.status,
      Images: [...post.images],
      PostImageURL: post.images[0] || "",
    };
  }

  function sellerToPayload(user) {
    const sellerPosts = posts.filter(
      (post) => String(post.userId) === String(user.Id) && post.status !== 2,
    );
    const soldPosts = sellerPosts.filter((post) => post.status === 1);

    return {
      success: true,
      seller: {
        id: String(user.Id),
        name: user.Name || `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
        phone: user.Phone || "",
        city: user.City || "",
        area: user.Area || "",
        bio: user.Bio || "",
        avatar: user.Avatar || "",
        joinedDate: user.JoinedDate || nowIso(),
        activeListingsCount: sellerPosts.filter((post) => post.status === 0).length,
        totalSalesCount: soldPosts.length,
      },
      posts: sellerPosts.map((post) => postToPayload(post)),
    };
  }

  function listPaged(items, page, limit) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const start = (safePage - 1) * safeLimit;
    const pagedItems = items.slice(start, start + safeLimit);

    return {
      items: pagedItems,
      pagination: buildPagination(items.length, safePage, safeLimit),
    };
  }

  function getSortedPosts(params) {
    const {
      query = "",
      status = "",
      minPrice,
      maxPrice,
      sortBy = "date",
      sortOrder = "desc",
    } = params;
    const normalizedQuery = normalizeLower(query);

    let results = posts.filter((post) => {
      if (normalizeLower(status) === "active" && post.status !== 0) {
        return false;
      }

      if (typeof minPrice === "number" && post.price < minPrice) {
        return false;
      }

      if (typeof maxPrice === "number" && post.price > maxPrice) {
        return false;
      }

      if (!normalizedQuery) {
        return post.status !== 2;
      }

      const haystack = normalizeLower(
        `${post.title} ${post.description} ${post.categoryName} ${post.seller} ${post.city} ${post.area}`,
      );
      return post.status !== 2 && haystack.includes(normalizedQuery);
    });

    results = [...results].sort((a, b) => {
      if (sortBy === "price") {
        return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
      }

      if (sortBy === "views") {
        return sortOrder === "asc" ? a.views - b.views : b.views - a.views;
      }

      const dateA = Date.parse(a.createdAt) || 0;
      const dateB = Date.parse(b.createdAt) || 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return results;
  }

  async function fulfillJson(route, status, payload) {
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: withCorsHeaders(route),
      body: JSON.stringify(payload),
    });
  }

  function readBody(route) {
    const rawBody = route.request().postData();
    if (!rawBody) {
      return {};
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }

  async function install(page) {
    const shouldBootAuthenticatedSession = sessionAuthenticated;

    await page.addInitScript((bootAuthenticatedSession) => {
      try {
        Object.defineProperty(window.navigator, "onLine", {
          configurable: true,
          get: () => true,
        });
      } catch {
        // Ignore readonly navigator environments.
      }

      if (bootAuthenticatedSession) {
        window.localStorage.setItem("tijarahjo_has_authenticated", "true");
        window.localStorage.removeItem("tijarahjo_logged_out");
      }
    }, shouldBootAuthenticatedSession);

    await page.route("**/*", async (route) => {
      const request = route.request();
      const method = request.method().toUpperCase();
      const url = new URL(request.url());
      const pathname = url.pathname.toLowerCase();
      const requestHost = url.host.toLowerCase();
      const requestMatchesApiHost = requestHost === apiHost;
      const requestUsesApiPrefix =
        apiBasePath.length > 0 &&
        (pathname === apiBasePath || pathname.startsWith(`${apiBasePath}/`));

      if (!requestMatchesApiHost && !requestUsesApiPrefix) {
        await route.continue();
        return;
      }

      const withoutApiPrefix = requestUsesApiPrefix
        ? pathname.slice(apiBasePath.length) || "/"
        : pathname;
      const apiPathWithVersion = withoutApiPrefix.startsWith("/")
        ? withoutApiPrefix
        : `/${withoutApiPrefix}`;
      const apiPath =
        apiPathWithVersion.replace(/^\/v[0-9]+(?=\/|$)/, "") || "/";
      const isApiRequest =
        apiPath.startsWith("/auth/") ||
        apiPath.startsWith("/posts/") ||
        apiPath === "/posts" ||
        apiPath.startsWith("/userposts/") ||
        apiPath === "/search" ||
        apiPath.startsWith("/favorites") ||
        apiPath.startsWith("/categories") ||
        apiPath.startsWith("/users") ||
        apiPath.startsWith("/reviews") ||
        apiPath.startsWith("/sellers") ||
        apiPath.startsWith("/post-images") ||
        apiPath.startsWith("/notifications");

      if (!isApiRequest) {
        await route.continue();
        return;
      }

      if (debugMockApi) {
        // eslint-disable-next-line no-console
        console.log(`[mock-api] ${method} ${request.url()}`);
      }

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: withCorsHeaders(route),
          body: "",
        });
        return;
      }

      if (apiPath === "/auth/me" && method === "GET") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        await fulfillJson(route, 200, authUser);
        return;
      }

      if (apiPath === "/auth/login" && method === "POST") {
        const body = readBody(route);
        const login = normalizeString(body.Login || body.login || body.Email);
        const password = normalizeString(body.Password || body.password);

        if (!login || !password) {
          await fulfillJson(route, 400, {
            Success: false,
            Message: "Invalid credentials payload",
          });
          return;
        }

        sessionAuthenticated = true;
        await fulfillJson(route, 200, {
          Success: true,
          Message: "Login successful",
          User: authUser,
        });
        return;
      }

      if (apiPath === "/auth/logout" && method === "POST") {
        sessionAuthenticated = false;
        await fulfillJson(route, 200, { Success: true });
        return;
      }

      if (apiPath === "/notifications/unread-count" && method === "GET") {
        await fulfillJson(route, 200, { UnreadCount: 0 });
        return;
      }

      if (apiPath.startsWith("/notifications") && method === "GET") {
        await fulfillJson(route, 200, []);
        return;
      }

      if (apiPath === "/categories" && method === "GET") {
        await fulfillJson(route, 200, categories);
        return;
      }

      if (apiPath.startsWith("/reviews/user/") && method === "GET") {
        const userId = normalizeString(apiPath.split("/").pop());
        await fulfillJson(route, 200, reviewsByUserId.get(userId) || []);
        return;
      }

      if (apiPath === "/users" && method === "GET") {
        await fulfillJson(route, 200, users);
        return;
      }

      if (apiPath.startsWith("/users/") && method === "GET") {
        const userId = apiPath.split("/").pop();
        const user = findUserById(userId);
        if (!user) {
          await fulfillJson(route, 404, { Message: "User not found" });
          return;
        }

        await fulfillJson(route, 200, user);
        return;
      }

      if (apiPath === "/sellers/top" && method === "GET") {
        const take = toInteger(url.searchParams.get("take"), 6);
        const topSellers = users
          .filter((user) => String(user.Id) !== String(authUser.Id))
          .slice(0, Math.max(1, take))
          .map((user) => {
            const sellerPosts = posts.filter(
              (post) => String(post.userId) === String(user.Id) && post.status !== 2,
            );
            return {
              id: String(user.Id),
              name: user.Name || `${user.FirstName || ""} ${user.LastName || ""}`.trim(),
              phone: user.Phone || "",
              city: user.City || "",
              area: user.Area || "",
              avatar: user.Avatar || "",
              joinedDate: user.JoinedDate || nowIso(),
              activeListingsCount: sellerPosts.filter((post) => post.status === 0).length,
              totalSalesCount: sellerPosts.filter((post) => post.status === 1).length,
              totalViews: sellerPosts.reduce((sum, post) => sum + post.views, 0),
            };
          });
        await fulfillJson(route, 200, topSellers);
        return;
      }

      if (apiPath.startsWith("/sellers/") && method === "GET") {
        const sellerId = normalizeString(apiPath.split("/").pop());
        const seller = findUserById(sellerId);
        if (!seller) {
          await fulfillJson(route, 404, { Message: "Seller not found" });
          return;
        }

        await fulfillJson(route, 200, sellerToPayload(seller));
        return;
      }

      if (apiPath === "/favorites" && method === "GET") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const favorites = [...ensureFavoriteSet()];
        await fulfillJson(route, 200, { success: true, favorites });
        return;
      }

      if (apiPath === "/favorites" && method === "POST") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const body = readBody(route);
        const postId = normalizeString(body.postId || body.PostId);
        if (!postId) {
          await fulfillJson(route, 400, { success: false });
          return;
        }

        ensureFavoriteSet().add(postId);
        await fulfillJson(route, 200, { success: true });
        return;
      }

      if (apiPath.startsWith("/favorites/") && method === "DELETE") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const postId = decodeURIComponent(apiPath.split("/").pop() || "");
        ensureFavoriteSet().delete(postId);
        await fulfillJson(route, 200, { success: true });
        return;
      }

      if ((apiPath === "/posts/feed" || apiPath === "/userposts/feed") && method === "GET") {
        const page = toInteger(url.searchParams.get("page"), 1);
        const limit = toInteger(url.searchParams.get("limit"), 20);
        const includeDeleted =
          normalizeLower(url.searchParams.get("includedeleted")) === "true";

        const visiblePosts = posts.filter((post) =>
          includeDeleted ? true : post.status !== 2,
        );
        const { items, pagination } = listPaged(visiblePosts, page, limit);
        await fulfillJson(route, 200, {
          posts: items.map((post) => postToPayload(post)),
          pagination,
        });
        return;
      }

      if (apiPath === "/search" && method === "GET") {
        const page = toInteger(url.searchParams.get("page"), 1);
        const limit = toInteger(url.searchParams.get("limit"), 20);
        const minPrice = url.searchParams.has("minPrice")
          ? Number(url.searchParams.get("minPrice"))
          : undefined;
        const maxPrice = url.searchParams.has("maxPrice")
          ? Number(url.searchParams.get("maxPrice"))
          : undefined;
        const sortedPosts = getSortedPosts({
          query: url.searchParams.get("query") || "",
          status: url.searchParams.get("status") || "",
          minPrice:
            typeof minPrice === "number" && Number.isFinite(minPrice)
              ? minPrice
              : undefined,
          maxPrice:
            typeof maxPrice === "number" && Number.isFinite(maxPrice)
              ? maxPrice
              : undefined,
          sortBy: url.searchParams.get("sortBy") || "date",
          sortOrder: url.searchParams.get("sortOrder") || "desc",
        });
        if (debugMockApi) {
          // eslint-disable-next-line no-console
          console.log(
            `[mock-api] search query="${url.searchParams.get("query") || ""}" total=${sortedPosts.length}`,
          );
        }
        const { items, pagination } = listPaged(sortedPosts, page, limit);
        await fulfillJson(route, 200, {
          posts: items.map((post) => postToPayload(post)),
          pagination,
        });
        return;
      }

      if (apiPath === "/posts" && method === "POST") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const body = readBody(route);
        const categoryId = toInteger(body.CategoryID, 1);
        const matchedCategory = findCategoryById(categoryId) || categories[0];
        const nextPost = {
          postId: nextPostId++,
          userId: toInteger(body.UserID, authUser.Id),
          categoryId: toInteger(body.CategoryID, matchedCategory.CategoryID),
          categoryName: matchedCategory.CategoryName,
          seller: authUser.Name,
          title: normalizeString(body.PostTitle) || "Untitled Post",
          description: normalizeString(body.PostDescription),
          price: Number(body.Price) || 0,
          city: normalizeString(body.City) || "Amman",
          area: normalizeString(body.Area),
          createdAt: normalizeString(body.CreatedAt) || nowIso(),
          views: 0,
          status: toInteger(body.Status, 0),
          images: [],
        };
        posts.unshift(nextPost);
        postImagesByPostId.set(String(nextPost.postId), []);
        if (debugMockApi) {
          // eslint-disable-next-line no-console
          console.log(
            `[mock-api] created-post id=${nextPost.postId} title="${nextPost.title}"`,
          );
        }

        await fulfillJson(route, 200, postToPayload(nextPost));
        return;
      }

      if (apiPath.startsWith("/posts/") && method === "GET") {
        const postId = toInteger(apiPath.split("/").pop(), 0);
        const post = posts.find((item) => item.postId === postId);
        if (!post) {
          await fulfillJson(route, 404, { Message: "Post not found" });
          return;
        }

        await fulfillJson(route, 200, postToPayload(post));
        return;
      }

      if (apiPath.startsWith("/posts/user/") && method === "GET") {
        const userId = normalizeString(apiPath.split("/").pop());
        const userPosts = posts
          .filter((post) => String(post.userId) === userId && post.status !== 2)
          .map((post) => postToPayload(post));
        await fulfillJson(route, 200, userPosts);
        return;
      }

      if (apiPath.startsWith("/posts/") && method === "PUT") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const postId = toInteger(apiPath.split("/").pop(), 0);
        const targetPost = posts.find((item) => item.postId === postId);
        if (!targetPost) {
          await fulfillJson(route, 404, { Message: "Post not found" });
          return;
        }

        const body = readBody(route);
        targetPost.title = normalizeString(body.PostTitle) || targetPost.title;
        targetPost.description =
          normalizeString(body.PostDescription) || targetPost.description;
        targetPost.price = Number(body.Price) || targetPost.price;
        targetPost.city = normalizeString(body.City) || targetPost.city;
        targetPost.area = normalizeString(body.Area) || targetPost.area;
        targetPost.status = toInteger(body.Status, targetPost.status);
        targetPost.categoryId = toInteger(body.CategoryID, targetPost.categoryId);
        const matchedCategory = findCategoryById(targetPost.categoryId);
        if (matchedCategory) {
          targetPost.categoryName = matchedCategory.CategoryName;
        }

        await fulfillJson(route, 200, postToPayload(targetPost));
        return;
      }

      if (apiPath.startsWith("/posts/") && method === "DELETE") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const postId = toInteger(apiPath.split("/").pop(), 0);
        const postIndex = posts.findIndex((item) => item.postId === postId);
        if (postIndex < 0) {
          await fulfillJson(route, 404, { Message: "Post not found" });
          return;
        }

        posts.splice(postIndex, 1);
        postImagesByPostId.delete(String(postId));
        ensureFavoriteSet().delete(String(postId));

        await fulfillJson(route, 200, { Success: true });
        return;
      }

      if (apiPath.startsWith("/post-images/post/") && method === "GET") {
        const postId = normalizeString(apiPath.split("/").pop());
        const images = postImagesByPostId.get(postId) || [];
        await fulfillJson(route, 200, images);
        return;
      }

      if (apiPath === "/post-images" && method === "POST") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const body = readBody(route);
        const postId = toInteger(body.PostID, 0);
        const imageUrl = normalizeString(body.PostImageURL);
        if (!postId || !imageUrl) {
          await fulfillJson(route, 400, { Message: "Invalid image payload" });
          return;
        }

        const row = {
          PostImageID: nextPostImageId++,
          PostID: postId,
          PostImageURL: imageUrl,
          UploadedAt: nowIso(),
          IsDeleted: false,
        };

        const postIdKey = String(postId);
        const rows = postImagesByPostId.get(postIdKey) || [];
        rows.push(row);
        postImagesByPostId.set(postIdKey, rows);

        const post = posts.find((item) => item.postId === postId);
        if (post) {
          post.images = rows
            .filter((imageRow) => !imageRow.IsDeleted)
            .map((imageRow) => imageRow.PostImageURL);
        }

        await fulfillJson(route, 200, row);
        return;
      }

      if (apiPath.startsWith("/post-images/") && method === "DELETE") {
        if (!sessionAuthenticated) {
          await fulfillJson(route, 401, { Message: "Unauthorized" });
          return;
        }

        const imageId = toInteger(apiPath.split("/").pop(), 0);
        for (const [postId, rows] of postImagesByPostId.entries()) {
          const targetRow = rows.find((row) => row.PostImageID === imageId);
          if (!targetRow) {
            continue;
          }

          targetRow.IsDeleted = true;
          const post = posts.find((item) => String(item.postId) === postId);
          if (post) {
            post.images = rows
              .filter((row) => !row.IsDeleted)
              .map((row) => row.PostImageURL);
          }
          await fulfillJson(route, 200, { Success: true });
          return;
        }

        await fulfillJson(route, 404, { Message: "Image not found" });
        return;
      }

      await fulfillJson(route, 200, {});
    });
  }

  return {
    install,
  };
}

module.exports = {
  createMarketplaceApiMock,
};
