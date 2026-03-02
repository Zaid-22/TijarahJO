import { Post } from "../types";
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
  wantsAffordable: boolean;
  wantsPremium: boolean;
};

const ARABIC_DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_SEARCH_CHAR_REGEX = /[^a-z0-9\u0600-\u06FF\s]/g;
const WHITESPACE_REGEX = /\s+/g;

function normalizeSearchText(value: string): string {
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
  return [
    ...new Set(terms.map((term) => normalizeSearchText(term)).filter(Boolean)),
  ];
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

const AFFORDABLE_QUERY_TERMS = normalizeTerms([
  "cheap",
  "budget",
  "affordable",
  "low price",
  "best price",
  "deal",
  "deals",
  "economy",
  "رخيص",
  "رخيصه",
  "سعر منخفض",
  "سعر مناسب",
]);

const PREMIUM_QUERY_TERMS = normalizeTerms([
  "better",
  "best",
  "premium",
  "luxury",
  "top",
  "high end",
  "newest",
  "افضل",
  "الأفضل",
  "احسن",
  "ممتاز",
  "فخم",
]);

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

function queryHasAnyTerm(
  normalizedQuery: string,
  queryTokenSet: Set<string>,
  terms: string[],
): boolean {
  return terms.some((term) =>
    queryContainsTerm(normalizedQuery, queryTokenSet, term),
  );
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

  const wantsAffordable = queryHasAnyTerm(
    normalizedQuery,
    queryTokenSet,
    AFFORDABLE_QUERY_TERMS,
  );
  const wantsPremium = queryHasAnyTerm(
    normalizedQuery,
    queryTokenSet,
    PREMIUM_QUERY_TERMS,
  );

  return {
    normalizedQuery,
    queryTokens,
    queryTokenSet,
    expandedTokens: [...expandedTokenSet],
    activeIntents,
    wantsAffordable,
    wantsPremium,
  };
}

function includesAnyIntentTerm(
  text: string,
  tokenSet: Set<string>,
  terms: string[],
): boolean {
  return terms.some((term) => {
    if (!term) {
      return false;
    }

    const termTokens = tokenize(term);
    if (termTokens.length <= 1) {
      return tokenSet.has(term);
    }

    return text.includes(term);
  });
}

function listingQualityBoost(post: Post): number {
  const descriptionLength = normalizeSearchText(
    post.description || "",
  ).length;
  const imageCount =
    post.images?.filter(Boolean).length || (post.image ? 1 : 0);

  let score = 0;

  if (imageCount >= 4) score += 10;
  else if (imageCount >= 2) score += 6;
  else if (imageCount === 1) score += 3;
  else score -= 4;

  if (descriptionLength >= 80) score += 8;
  else if (descriptionLength >= 30) score += 5;
  else if (descriptionLength > 0) score += 2;
  else score -= 2;

  if (post.phone && post.phone.trim().length > 0) {
    score += 2;
  }

  return score;
}

function scorePost(post: Post, context: QueryContext): number {
  const {
    normalizedQuery,
    queryTokens,
    queryTokenSet,
    expandedTokens,
    activeIntents,
    wantsAffordable,
    wantsPremium,
  } = context;

  const name = normalizeSearchText(post.name || "");
  const category = normalizeSearchText(post.category || "");
  const location = normalizeSearchText(post.location || "");
  const seller = normalizeSearchText(post.seller || "");
  const description = normalizeSearchText(post.description || "");
  const nameTokenSet = new Set(tokenize(name));
  const categoryTokenSet = new Set(tokenize(category));
  const descriptionTokenSet = new Set(tokenize(description));

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
      categoryTokenSet,
      intent.categoryTerms,
    );
    const hasListingIntentMatch =
      includesAnyIntentTerm(name, nameTokenSet, intent.listingTerms) ||
      includesAnyIntentTerm(
        description,
        descriptionTokenSet,
        intent.listingTerms,
      );

    if (hasCategoryIntentMatch && hasListingIntentMatch) {
      score += 240;
    } else if (hasCategoryIntentMatch) {
      score += 190;
    } else if (hasListingIntentMatch) {
      score += 130;
    }
  }

  const numericPrice = Number(post.price);
  if (Number.isFinite(numericPrice) && numericPrice > 0) {
    if (wantsAffordable) {
      if (numericPrice <= 1_000) score += 22;
      else if (numericPrice <= 5_000) score += 12;
      else if (numericPrice <= 10_000) score += 4;
      else score -= 8;
    }

    if (wantsPremium) {
      if (numericPrice >= 20_000) score += 16;
      else if (numericPrice >= 10_000) score += 10;
      else if (numericPrice >= 5_000) score += 5;
    }
  }

  if (score <= 0) {
    return 0;
  }

  score += recencyBoost(post.createdAt);
  score += viewsBoost(post.views);
  score += listingQualityBoost(post);

  if (wantsPremium) {
    score += Math.min(
      10,
      Math.log10(Math.max(0, Number(post.views || 0)) + 1) * 4,
    );
  }

  return score;
}

export function isActivePost(post: Post): boolean {
  return post.status !== "SOLD" && post.status !== "DELETED";
}

export function rankPostsBySearch(
  posts: Post[],
  query: string,
): Post[] {
  const activePosts = posts.filter(isActivePost);
  const context = buildQueryContext(query);

  if (!context) {
    return [...activePosts];
  }

  return activePosts
    .map((post, index) => ({
      post,
      index,
      score: scorePost(post, context),
      createdAtTs: toTimestamp(post.createdAt),
      views: Number(post.views || 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const createdDiff = b.createdAtTs - a.createdAtTs;
      if (createdDiff !== 0) {
        return createdDiff;
      }

      const viewsDiff = b.views - a.views;
      if (viewsDiff !== 0) {
        return viewsDiff;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.post);
}
