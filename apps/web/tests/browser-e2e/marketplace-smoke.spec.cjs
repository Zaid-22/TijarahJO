const { test, expect } = require("@playwright/test");
const {
  createMarketplaceApiMock,
} = require("./support/mockMarketplaceApi.cjs");

const PNG_ONE_BY_ONE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pJ4kAAAAASUVORK5CYII=";
const SIGN_IN_BUTTON_PATTERN = /^(sign in|تسجيل الدخول)$/i;
const GLOBAL_SEARCH_INPUT_PATTERN = /search in tijarahjo|ابحث في تجارة جو/i;
const HOME_HERO_HEADING_PATTERN =
  /buy & sell anything in jordan|اشتري وبيع أي شيء في الأردن/i;
const SEARCH_LOADING_PATTERN = /searching|جاري البحث/i;
const POST_LOADING_PATTERN = /loading post|جار تحميل المنشور/i;
const PROFILE_PAGE_HEADING_PATTERN = /my profile|ملفي الشخصي/i;
const PROFILE_PAGE_CONTENT_PATTERN =
  /member since|عضو منذ|contact information|معلومات التواصل|active listings|الإعلانات النشطة/i;
const FAVORITES_HEADING_PATTERN = /my favorites|مفضلتي/i;
const PUBLISH_POST_BUTTON_PATTERN = /publish post|نشر المنشور/i;
const EDIT_POST_BUTTON_PATTERN = /edit post|تعديل المنشور/i;
const SAVE_CHANGES_BUTTON_PATTERN = /save changes|حفظ التغييرات/i;
const DELETE_BUTTON_PATTERN =
  /^(delete|حذف|confirm removal|تأكيد الإزالة)$/i;
const FAVORITES_MUTATION_RESPONSE_PATTERN =
  /\/api(?:\/v[0-9]+)?\/favorites(?:\/[^/?#]+)?(?:\/)?(?:\?.*)?$/i;
const AUTH_ME_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/auth\/me$/i;
const POSTS_COLLECTION_RESPONSE_PATTERN =
  /\/api(?:\/v[0-9]+)?\/posts(?:\/|$)/i;
const POSTS_ITEM_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/posts\/\d+$/i;
const SEARCH_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/search(?:\?.*)?$/i;
const POST_IMAGE_VALIDATE_RESPONSE_PATTERN =
  /\/api(?:\/v[0-9]+)?\/post-images\/validate$/i;

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function setUiLanguage(page, language) {
  await page.addInitScript((nextLanguage) => {
    window.localStorage.setItem(
      "tijarahjo_language",
      JSON.stringify(nextLanguage),
    );
  }, language);
}

async function signInAndOpenProfile(page) {
  await page.goto("/login");
  await page.locator("#authIdentifier").fill("buyer@example.com");
  const passwordInput = page.locator("#password");
  await passwordInput.fill("Password123!");
  const signInButton = page.getByRole("button", {
    name: SIGN_IN_BUTTON_PATTERN,
  });
  await expect(signInButton).toBeEnabled();
  const authBootstrap = waitForAuthBootstrap(page);
  await passwordInput.press("Enter");
  await authBootstrap;
  await page.goto("/profile");
  await expectProfilePageLoaded(page);
}

function waitForAuthBootstrap(page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      AUTH_ME_RESPONSE_PATTERN.test(response.url()) &&
      response.ok(),
  );
}

function removeFavoriteButtonPatternForPost(title) {
  return new RegExp(
    `(remove\\s+${escapeForRegex(title)}\\s+from favorites|إزالة\\s*${escapeForRegex(title)}\\s*من المفضلة)`,
    "i",
  );
}

function postTitleHeading(page, title) {
  return page.getByRole("heading", {
    name: new RegExp(`^${escapeForRegex(title)}$`, "i"),
  }).first();
}

async function expectPostTitleVisible(page, title) {
  await expect(postTitleHeading(page, title)).toBeVisible({ timeout: 20_000 });
}

async function expectPostTitleAbsent(page, title) {
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^${escapeForRegex(title)}$`, "i"),
    }),
  ).toHaveCount(0);
}

async function expectProfilePageLoaded(page) {
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByRole("heading", { name: PROFILE_PAGE_HEADING_PATTERN }).first(),
  ).toBeVisible();
  await expect(page.getByText(PROFILE_PAGE_CONTENT_PATTERN).first()).toBeVisible();
}

async function waitForSearchResultsLoaded(page) {
  await expect(page.getByText(SEARCH_LOADING_PATTERN).first()).toBeHidden({
    timeout: 20_000,
  });
}

async function waitForPostDetailsLoaded(page) {
  await expect(page.getByText(POST_LOADING_PATTERN).first()).toBeHidden({
    timeout: 20_000,
  });
}

async function submitMarketplaceSearch(page, query) {
  const currentUrl = new URL(page.url());
  if (currentUrl.pathname !== "/" || currentUrl.search) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  }

  // The global header renders before the lazy home route. Wait for the route
  // to mount so its one-time search reset cannot clear a freshly filled input.
  await expect(
    page.getByRole("heading", { name: HOME_HERO_HEADING_PATTERN }).first(),
  ).toBeVisible({ timeout: 20_000 });

  const searchInput = page.getByRole("textbox", {
    name: GLOBAL_SEARCH_INPUT_PATTERN,
  }).first();
  await expect(searchInput).toBeEditable({ timeout: 20_000 });
  await searchInput.fill(query);
  await expect(searchInput).toHaveValue(query);

  await searchInput.press("Enter");
  await expect
    .poll(
      () => {
        const url = new URL(page.url());
        return url.pathname === "/search" ? url.searchParams.get("q") : null;
      },
      { timeout: 20_000 },
    )
    .toBe(query);

  expect(new URL(page.url()).searchParams.get("q")).toBe(query);
  await waitForSearchResultsLoaded(page);
}

async function openPostDetailsByTitle(page, title) {
  const detailsButton = page.getByRole("button", {
    name: new RegExp(
      `(view details for|عرض تفاصيل)\\s*${escapeForRegex(title)}`,
      "i",
    ),
  });
  await expect(detailsButton.first()).toBeVisible({ timeout: 20_000 });
  await Promise.all([
    page.waitForURL(/\/post\/\d+$/),
    page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        POSTS_ITEM_RESPONSE_PATTERN.test(response.url()) &&
        response.ok(),
    ),
    detailsButton.first().click({ force: true }),
  ]);
  await expect(page).toHaveURL(/\/post\/\d+$/);
  await waitForPostDetailsLoaded(page);
}

async function fillEditedPostTitle(page, nextTitle) {
  const editDialog = page.getByRole("dialog");
  await expect(editDialog).toBeVisible();

  const titleInput = editDialog.getByLabel(
    /post name|title|اسم المنشور|اسم المنتج|عنوان المنشور/i,
  ).first();
  await expect(titleInput).toBeVisible();
  await titleInput.fill(nextTitle);
  await expect(titleInput).toHaveValue(nextTitle);
}

function getPostFavoriteToggle(page) {
  return page
    .getByRole("button", {
      name: /add(?:\s+.+)?\s+to favorites|remove(?:\s+.+)?\s+from favorites|إضافة(?:\s+.+)?\s+إلى المفضلة|إزالة(?:\s+.+)?\s+من المفضلة/i,
    })
    .first();
}

async function setPostFavoriteState(page, shouldBeFavorited) {
  const favoriteToggle = getPostFavoriteToggle(page);
  await expect(favoriteToggle).toBeVisible();

  const ariaLabel = (await favoriteToggle.getAttribute("aria-label")) || "";
  const currentlyFavorited =
    /remove from favorites|إزالة من المفضلة/i.test(ariaLabel);

  if (currentlyFavorited === shouldBeFavorited) {
    return;
  }

  await Promise.all([
    page.waitForResponse((response) => {
      if (!response.ok()) {
        return false;
      }

      const request = response.request();
      const method = request.method().toUpperCase();
      const isAddFavorite = shouldBeFavorited && method === "POST";
      const isRemoveFavorite = !shouldBeFavorited && method === "DELETE";
      if (!isAddFavorite && !isRemoveFavorite) {
        return false;
      }

      return (
        FAVORITES_MUTATION_RESPONSE_PATTERN.test(response.url()) &&
        response.ok()
      );
    }),
    favoriteToggle.click(),
  ]);
}

async function selectComboboxOption(page, labelPattern, optionPattern) {
  const combobox = page.getByRole("combobox", { name: labelPattern }).first();
  await expect(combobox).toBeVisible();
  await combobox.click({ force: true });
  const option = page.getByRole("option", { name: optionPattern }).first();
  await expect(option).toBeVisible();
  await option.click({ force: true });
}

async function ensureFavoriteListingVisible(page, postId, postTitle) {
  const removeFavoriteButton = page
    .getByRole("button", {
      name: removeFavoriteButtonPatternForPost(postTitle),
    })
    .first();

  if (!(await removeFavoriteButton.isVisible())) {
    await page.goto(`/post/${postId}`);
    await setPostFavoriteState(page, true);
    await page.goto("/favorites");
  }

  await expect(removeFavoriteButton).toBeVisible({ timeout: 15_000 });

  return removeFavoriteButton;
}

test("home feed resilience: Arabic offline state explains recovery", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({
    authenticated: false,
    online: false,
  });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(
      "تعذّر تحميل المنشورات. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "إعادة المحاولة" }),
  ).toBeVisible();
  await expect(
    page.getByText(/We're having trouble loading the marketplace feed/i),
  ).toHaveCount(0);
});

test("home feed resilience: warm listings stay visible after going offline", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");

  await page.goto("/");
  await expectPostTitleVisible(page, "Demo Phone");

  const promotionalBanner = page.getByRole("region", {
    name: "بيع في كل مكان بالأردن",
  });
  await expect(
    promotionalBanner.getByRole("button", { name: "سجل الآن" }),
  ).toBeVisible();

  await page.evaluate(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    window.dispatchEvent(new Event("offline"));
  });

  await expectPostTitleVisible(page, "Demo Phone");
  await expect(
    page.getByText(
      "أنت غير متصل بالإنترنت — يتم عرض آخر محتوى محفوظ",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" }),
  ).toHaveCount(0);
  await expect(
    promotionalBanner.getByRole("button", { name: "سجل الآن" }),
  ).toHaveCount(0);
});

test("home feed resilience: online error retries in place and restores listings", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({
    authenticated: false,
    feedFailureCount: 2,
    feedFailureStatus: 500,
  });
  await apiMock.install(page);
  await setUiLanguage(page, "en");

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Couldn't load listings" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("Something went wrong on our side. Please try again.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No internet connection" }),
  ).toHaveCount(0);

  await page.evaluate(() => {
    window.__feedRetryDocumentMarker = "preserved";
  });

  await page.getByRole("button", { name: "Try again" }).click();

  await expectPostTitleVisible(page, "Demo Phone");
  await expect(
    page.getByRole("heading", { name: "Couldn't load listings" }),
  ).toHaveCount(0);
  await expect
    .poll(() => apiMock.getFeedRequestCount())
    .toBeGreaterThanOrEqual(3);
  await expect
    .poll(() =>
      page.evaluate(() => window.__feedRetryDocumentMarker),
    )
    .toBe("preserved");
});

["en", "ar"].forEach((lang) => {
  const suffix = lang === "ar" ? " (arabic)" : "";

  test(`auth journey${suffix}: user can sign in and access profile`, async ({ page }) => {
    const apiMock = createMarketplaceApiMock({ authenticated: false });
    await apiMock.install(page);
    await setUiLanguage(page, lang);
    await signInAndOpenProfile(page);
  });

  test(`search journey${suffix}: global search navigates to search results`, async ({ page }) => {
    const apiMock = createMarketplaceApiMock({ authenticated: false });
    await apiMock.install(page);
    await setUiLanguage(page, lang);

    await page.goto("/");
    await submitMarketplaceSearch(page, "phone");
    await expectPostTitleVisible(page, "Demo Phone");
    await expectPostTitleAbsent(page, "Vintage Camera");

    const shareableSearchUrl = page.url();
    expect(new URL(shareableSearchUrl).searchParams.get("q")).toBe("phone");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          SEARCH_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      page.reload(),
    ]);
    await waitForSearchResultsLoaded(page);
    await expect(
      page
        .getByRole("textbox", { name: GLOBAL_SEARCH_INPUT_PATTERN })
        .first(),
    ).toHaveValue("phone");
    await expectPostTitleVisible(page, "Demo Phone");

    await page.goto("/");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          SEARCH_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      page.goto(shareableSearchUrl),
    ]);
    await waitForSearchResultsLoaded(page);
    expect(new URL(page.url()).searchParams.get("q")).toBe("phone");
    await expectPostTitleVisible(page, "Demo Phone");
  });

  test(`favorites journey${suffix}: add and remove favorites for authenticated user`, async ({ page }) => {
    const apiMock = createMarketplaceApiMock({ authenticated: true });
    await apiMock.install(page);
    await setUiLanguage(page, lang);
    await signInAndOpenProfile(page);
    await submitMarketplaceSearch(page, "phone");
    await expectPostTitleVisible(page, "Demo Phone");

    await page.goto("/post/101");
    await waitForPostDetailsLoaded(page);
    await setPostFavoriteState(page, true);

    await page.goto("/favorites");
    await expect(page.getByText(FAVORITES_HEADING_PATTERN)).toBeVisible();
    await expectPostTitleVisible(page, "Demo Phone");
    const removeDemoPhoneFromFavoritesButton = await ensureFavoriteListingVisible(
      page,
      "101",
      "Demo Phone",
    );
    await removeDemoPhoneFromFavoritesButton.click({ force: true });
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByText(FAVORITES_HEADING_PATTERN)).toBeVisible();
    await expectPostTitleAbsent(page, "Demo Phone");
  });

  test(`post CRUD journey${suffix}: create, update, and delete a post`, async ({ page }) => {
    const apiMock = createMarketplaceApiMock({ authenticated: true });
    await apiMock.install(page);
    await setUiLanguage(page, lang);

    const isAr = lang === "ar";
    const createdPostTitle = isAr ? "E2E Arabic Created Post" : "E2E Created Post";
    const updatedPostTitle = isAr ? "E2E Arabic Updated Post" : "E2E Updated Post";
    let createdPostId = "";

    await signInAndOpenProfile(page);
    await page.goto("/sell");

    await page.locator("#title").fill(createdPostTitle);
    await page.locator("#price").fill(isAr ? "888" : "777");
    await selectComboboxOption(
      page,
      /category|الفئة/i,
      /electronics|إلكترونيات/i,
    );
    await page.locator("#description").fill(
      isAr ? "Playwright Arabic E2E post creation" : "Playwright E2E post creation"
    );
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          POST_IMAGE_VALIDATE_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      page.setInputFiles("#image-upload", {
        name: isAr ? "post-ar.png" : "post.png",
        mimeType: "image/png",
        buffer: Buffer.from(PNG_ONE_BY_ONE_BASE64, "base64"),
      }),
    ]);
    await expect(page.getByText(/1\/5 images uploaded|1\/5 صور محملة/i)).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          POSTS_COLLECTION_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      page.getByRole("button", { name: PUBLISH_POST_BUTTON_PATTERN }).click({
        force: true,
      }),
    ]);
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/");
    await submitMarketplaceSearch(page, createdPostTitle);
    await openPostDetailsByTitle(page, createdPostTitle);
    createdPostId = page.url().split("/").pop() || "";
    expect(createdPostId).toMatch(/^\d+$/);

    await page.getByRole("button", { name: EDIT_POST_BUTTON_PATTERN }).first().click();
    await fillEditedPostTitle(page, updatedPostTitle);
    const saveChangesButton = page.getByRole("button", {
      name: SAVE_CHANGES_BUTTON_PATTERN,
    });
    await expect(saveChangesButton).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "PUT" &&
          POSTS_ITEM_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      saveChangesButton.click({ force: true }),
    ]);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          POSTS_ITEM_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      page.goto(`/post/${createdPostId}`),
    ]);
    await expect(page).toHaveURL(new RegExp(`/post/${createdPostId}$`));
    await waitForPostDetailsLoaded(page);
    await expectPostTitleVisible(page, updatedPostTitle);

    const deletePostButton = page.getByRole("button", {
      name: /delete post|remove post|حذف المنشور|إزالة المنشور/i,
    }).first();
    await expect(deletePostButton).toBeVisible();
    await deletePostButton.evaluate((button) => button.click());
    const deleteDialog = page.getByRole("alertdialog");
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByText(/no longer available|لم يعد متاحاً/i).click();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          POSTS_ITEM_RESPONSE_PATTERN.test(response.url()) &&
          response.ok(),
      ),
      deleteDialog.getByRole("button", { name: DELETE_BUTTON_PATTERN }).click(),
    ]);

    await expect(page).toHaveURL(/\/$/);
    await page.goto("/");
    await submitMarketplaceSearch(page, updatedPostTitle);
    await expect(
      page.getByRole("button", {
        name: new RegExp(
          `(view details for|عرض تفاصيل)\\s*${escapeForRegex(updatedPostTitle)}`,
          "i",
        ),
      }),
    ).toHaveCount(0);
  });
});
