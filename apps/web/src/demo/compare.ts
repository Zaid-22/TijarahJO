import type { DemoRequest } from "./types";
import { DemoError, requireUser } from "./store";
import { visiblePosts } from "./marketplace";

export function compare({ state, path, method, body }: DemoRequest): unknown {
  if (path === "/compare/videos" && method === "POST") return { IsConfigured: false, Message: "Video recommendations are unavailable in this demo.", Videos: [] };
  if (path !== "/compare" || method !== "POST") return undefined;
  requireUser(state);
  const ids = Array.isArray(body.PostIds) ? body.PostIds.map(String) : [];
  const posts = visiblePosts(state).filter(p => ids.includes(p.id));
  if (posts.length < 2) throw new DemoError("HTTP_400", "Choose at least two available listings.");
  const ar = body.Language === "ar";
  const cheapest = [...posts].sort((a, b) => a.price - b.price)[0];
  const label = ar ? "مقارنة تجريبية من بيانات الإعلان، وليست تحليلاً مباشراً بالذكاء الاصطناعي." : "Sample comparison using listing data, not live AI analysis.";
  return {
    Posts: posts.map(p => ({ PostId: Number(p.id), Name: p.name, Price: p.price, Category: p.category, Description: p.description, ImageUrl: p.image, City: p.location, Views: p.views })),
    PriceComparison: `${label} ${cheapest.name}: ${cheapest.price} JOD.`,
    PostSummaries: posts.map(p => ({ PostName: p.name, Summary: `${label} ${p.description}` })),
    FeatureDifferences: posts.map(p => ({ PostName: p.name, Features: [p.category, p.location, `${p.price} JOD`] })),
    ProsCons: posts.map(p => ({ PostName: p.name, Pros: [ar ? "معلومات الإعلان متاحة للمقارنة" : "Listing details available for comparison"], Cons: [ar ? "الحالة والمواصفات غير متحققة" : "Condition and specifications are unverified"] })),
    BestFor: null,
    FinalRecommendation: { WinnerName: cheapest.name, BestFor: ar ? "أقل سعر معلن" : "Lowest listed price", Reason: label },
  };
}
