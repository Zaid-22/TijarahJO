import type { DemoState, DemoUser } from "./types";

export const categories = [
  { CategoryID: 1, CategoryName: "Electronics", NameAr: "إلكترونيات", Image: "/demo/laptop.jpg" },
  { CategoryID: 2, CategoryName: "Phones", NameAr: "هواتف", Image: "/demo/phone.jpg" },
  { CategoryID: 3, CategoryName: "Furniture", NameAr: "أثاث", Image: "/demo/chair.jpg" },
  { CategoryID: 4, CategoryName: "Sports", NameAr: "رياضة", Image: "/demo/bicycle.jpg" },
  { CategoryID: 5, CategoryName: "Books", NameAr: "كتب", Image: "/demo/books.jpg" },
  { CategoryID: 6, CategoryName: "Cameras", NameAr: "كاميرات", Image: "/demo/camera.jpg" },
];
export const cities = [
  { CityId: 1, CityName: "Amman", CityNameAr: "عمّان" },
  { CityId: 2, CityName: "Irbid", CityNameAr: "إربد" },
  { CityId: 3, CityName: "Zarqa", CityNameAr: "الزرقاء" },
];
export const areas = [
  { AreaId: 1, CityId: 1, AreaName: "Khalda", AreaNameAr: "خلدا" },
  { AreaId: 2, CityId: 2, AreaName: "University Street", AreaNameAr: "شارع الجامعة" },
  { AreaId: 3, CityId: 3, AreaName: "New Zarqa", AreaNameAr: "الزرقاء الجديدة" },
];
const catalog: [string, number, number, string][] = [
  ["MacBook Air M1 · 256GB", 340, 1, "laptop"], ["iPhone 13 · 128GB", 245, 2, "phone"],
  ["Oak dining chair", 35, 3, "chair"], ["City bicycle", 95, 4, "bicycle"],
  ["Weekend reading collection", 18, 5, "books"], ["Mirrorless camera with lens", 285, 6, "camera"],
  ["Laptop for university", 230, 1, "laptop"], ["iPhone 12 · 64GB", 175, 2, "phone"],
  ["Reading chair", 55, 3, "chair"], ["Commuter bicycle", 125, 4, "bicycle"],
  ["Classic novels · set of five", 22, 5, "books"], ["Travel photography camera", 210, 6, "camera"],
  ["MacBook Pro · 512GB", 480, 1, "laptop"], ["iPhone 14 · 128GB", 325, 2, "phone"],
  ["Dining chairs · pair", 65, 3, "chair"], ["Weekend bicycle", 110, 4, "bicycle"],
  ["English reading starter set", 15, 5, "books"], ["Camera with spare battery", 310, 6, "camera"],
  ["Lightweight work laptop", 290, 1, "laptop"], ["iPhone 13 mini", 215, 2, "phone"],
  ["Minimal wooden chair", 40, 3, "chair"], ["Urban bicycle · medium frame", 140, 4, "bicycle"],
  ["Book club collection", 25, 5, "books"], ["Beginner photography kit", 195, 6, "camera"],
  ["Laptop with charger and case", 270, 1, "laptop"], ["iPhone 11 · 128GB", 145, 2, "phone"],
  ["Studio chair", 45, 3, "chair"], ["Bicycle with helmet", 155, 4, "bicycle"],
  ["Pre-loved paperback bundle", 12, 5, "books"], ["Compact camera kit", 165, 6, "camera"],
];

export function createSeed(): DemoState {
  const now = Date.now();
  const names = [["Lina", "Buyer"], ["Omar", "Seller"], ["Dana", "Admin"], ["Noor", "Seller"], ["Sami", "Seller"]];
  const users: DemoUser[] = names.map(([first, last], i) => ({
    Id: i + 1, UserID: i + 1, FirstName: first, LastName: last,
    Email: `${["buyer", "seller", "admin", "noor", "sami"][i]}@demo.example`,
    Phone: `+96200000000${i + 1}`, City: cities[i % 3].CityName, Area: areas[i % 3].AreaName,
    CityId: i % 3 + 1, AreaId: i % 3 + 1,
    Bio: "Fictional demo account. Exploring local finds and giving useful things a second home.",
    Avatar: "", JoinedDate: new Date(now - 90 * 86400000).toISOString(),
    RoleID: i === 2 ? 1 : 2, RoleName: i === 2 ? "Admin" : "User",
    HasAdminAccess: i === 2, Status: 1, IsDeleted: false,
  }));
  const posts = catalog.map(([name, price, categoryId, image], i) => {
    const owner = users[[1, 3, 4][i % 3]];
    return {
      id: String(i + 1), name, price, categoryId: String(categoryId),
      category: categories[categoryId - 1].CategoryName,
      location: owner.City, locationAr: cities[owner.CityId - 1].CityNameAr,
      area: owner.Area, areaAr: areas[owner.AreaId - 1].AreaNameAr,
      seller: `${owner.FirstName} ${owner.LastName}`, sellerId: String(owner.Id),
      image: `/demo/${image}.jpg`, images: [`/demo/${image}.jpg`],
      description: `${name}. Well cared for and ready for a new home. Collection in ${owner.City}. This is a fictional sample listing; the photo is illustrative.\nإعلان تجريبي ببيانات وصورة توضيحية، وليس عرضاً حقيقياً للبيع.`,
      createdAt: new Date(now - i * 3600000).toISOString(),
      views: 20 + i * 7, status: i === 29 ? "SOLD" as const : "ACTIVE" as const,
    };
  });
  return {
    version: 1, nextId: 100, session: null, users, posts,
    favorites: { "1": ["1", "3"], "2": ["2"] },
    messages: [{ messageId: 1, senderId: 2, receiverId: 1, conversationId: 12, postId: 1,
      content: "Welcome! This is a sample conversation. Try sending a message to see a simulated reply.",
      timestamp: new Date(now - 3600000).toISOString(), isRead: false }],
    notifications: [{ notificationId: 1, ownerId: 1, notificationType: "MESSAGE", title: "A message from Omar",
      body: "Explore your sample conversation.", senderUserId: 2, conversationId: 12, routeUrl: "/chat",
      isRead: false, createdAt: new Date(now - 3600000).toISOString() }],
    reviews: [2, 4, 5].map((id, i) => ({ ReviewID: i + 1, ReviewerID: 1, ReviewerName: "Lina Buyer",
      ReviewedUserID: id, Rating: i === 1 ? 4 : 5, Comment: "Sample review: friendly communication and an item as described.",
      Timestamp: new Date(now - 86400000).toISOString() })),
    comments: [], audit: [],
    reports: [{ reportID: 1, reportType: "LISTING", targetID: 6, targetLabel: posts[5].name,
      reason: "MISLEADING", description: "Sample report for practicing moderation.", imageUrl: null,
      reporterUserID: 1, reporterName: "Lina Buyer", reporterEmail: users[0].Email,
      targetUserID: 5, targetUserName: "Sami Seller", targetUserStatus: 1, targetUserSuspendedUntil: null,
      status: 0, statusLabel: "Pending", resolvedByUserID: null, resolvedByName: null,
      resolutionNotes: null, createdAt: new Date(now).toISOString(), resolvedAt: null }],
  };
}
