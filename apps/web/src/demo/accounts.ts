import type { DemoRequest } from "./types";
import { currentUser, DemoError, isActiveUser, requireAdmin, requireOwner, requireUser } from "./store";
import { cities, areas } from "./seed";
import { storeImage } from "./images";

export async function accounts({ state, path, method, body, form }: DemoRequest): Promise<unknown> {
  if (path === "/auth/login" && method === "POST") {
    const personaId = ["buyer@demo.example", "seller@demo.example", "admin@demo.example"].indexOf(String(body.Login).toLowerCase()) + 1;
    const user = state.users.find(u => personaId ? u.Id === personaId : u.Email === String(body.Login).toLowerCase());
    if (!user || ![1, 2, 3].includes(user.Id) || body.Password !== "Demo123!")
      throw new DemoError("HTTP_401", "Use the Buyer, Seller or Admin buttons above to enter the demo.");
    if (!isActiveUser(user)) throw new DemoError("HTTP_403", "This demo account is blocked. Reset the demo to restore it.");
    state.session = user.Id;
    return { Success: true, User: user, Message: "Demo account selected" };
  }
  if (path === "/auth/logout" && method === "POST") { state.session = null; return { Success: true }; }
  if (path === "/auth/me" && method === "GET") return requireUser(state);
  if (path === "/auth/refresh" && method === "POST") { requireUser(state); return { Success: true }; }
  if (path === "/auth/2fa/status" && method === "GET") return { Success: true, Enabled: false, HasPendingSetup: false };
  if (path.startsWith("/auth/")) throw new DemoError("DEMO_UNAVAILABLE", "Email, Google sign-in and security settings are unavailable in this demo. Use a sample account above. / استخدم أحد الحسابات التجريبية بالأعلى.");
  if (path === "/roles" && method === "GET") return [{ RoleID: 1, RoleName: "Admin" }, { RoleID: 2, RoleName: "User" }];
  if (path === "/users" && method === "GET") { requireAdmin(state); return state.users; }
  if (/^\/users\/Exists\/\d+$/.test(path) && method === "GET") {
    requireAdmin(state); return state.users.some(u => u.Id === Number(path.split("/")[3]) && !u.IsDeleted);
  }
  const match = path.match(/^\/users\/(\d+)(?:\/(avatar))?$/);
  if (!match) return undefined;
  const user = state.users.find(u => u.Id === Number(match[1]));
  if (!user) throw new DemoError("HTTP_404", "User not found.");
  if (method === "GET" && !match[2]) return user;
  requireOwner(state, user.Id);
  if (method === "POST" && match[2] === "avatar") {
    const file = form?.get("File") ?? form?.get("file");
    if (!(file instanceof File)) throw new DemoError("HTTP_400", "Choose an image.");
    user.Avatar = await storeImage(file); return { AvatarUrl: user.Avatar };
  }
  if (method === "DELETE") {
    requireAdmin(state);
    if (user.Id === state.session) throw new DemoError("HTTP_400", "Keep the active demo administrator available.");
    user.IsDeleted = true; return { success: true };
  }
  if (method === "PUT") {
    for (const key of ["FirstName", "LastName", "Bio", "Phone", "Email"] as const) {
      const value = body[key] ?? body[key[0].toLowerCase() + key.slice(1)];
      if (typeof value === "string") user[key] = value;
    }
    const city = cities.find(c => c.CityId === Number(body.CityId ?? body.CityID ?? body.cityId));
    const area = areas.find(a => a.AreaId === Number(body.AreaId ?? body.AreaID ?? body.areaId));
    if (city) { user.City = city.CityName; user.CityId = city.CityId; }
    if (area) { user.Area = area.AreaName; user.AreaId = area.AreaId; }
    if (currentUser(state)?.RoleID === 1 && user.Id !== state.session) {
      if (body.Status !== undefined) { user.Status = Number(body.Status); user.SuspendedUntil = undefined; }
      if (body.RoleID !== undefined) {
        user.RoleID = Number(body.RoleID); user.RoleName = user.RoleID === 1 ? "Admin" : "User";
        user.HasAdminAccess = user.RoleID === 1;
      }
    }
    state.posts.filter(p => p.sellerId === String(user.Id)).forEach(p => { p.seller = `${user.FirstName} ${user.LastName}`; });
    return user;
  }
  return undefined;
}
