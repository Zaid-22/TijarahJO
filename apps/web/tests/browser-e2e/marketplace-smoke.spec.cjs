const { test, expect } = require("@playwright/test");
const {
  createMarketplaceApiMock,
} = require("./support/mockMarketplaceApi.cjs");

const PNG_ONE_BY_ONE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pJ4kAAAAASUVORK5CYII=";
const SIGN_IN_BUTTON_PATTERN = /^(sign in|تسجيل الدخول)$/i;
const GLOBAL_SEARCH_INPUT_PATTERN = /search in tijarahjo|ابحث في تجارة جو/i;
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
const AUTH_LOGIN_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/auth\/login$/i;
const POSTS_COLLECTION_RESPONSE_PATTERN =
  /\/api(?:\/v[0-9]+)?\/posts(?:\/|$)/i;
const POSTS_ITEM_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/posts\/\d+$/i;
const SEARCH_RESPONSE_PATTERN = /\/api(?:\/v[0-9]+)?\/search(?:\?.*)?$/i;
const POST_IMAGES_RESPONSE_PATTERN =
  /\/api(?:\/v[0-9]+)?\/post-images(?:\/|$)/i;

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

function isFavoritesMutationResponse(response, method) {
  return (
    response.request().method().toUpperCase() === method &&
    FAVORITES_MUTATION_RESPONSE_PATTERN.test(response.url()) &&
    response.ok()
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
  await page.goto("/");
  const searchInput = page.getByRole("textbox", {
    name: GLOBAL_SEARCH_INPUT_PATTERN,
  }).first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(query);
  await Promise.all([
    page.waitForURL(/\/search$/),
    page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        SEARCH_RESPONSE_PATTERN.test(response.url()) &&
        response.ok(),
    ),
    searchInput.press("Enter"),
  ]);
  await expect(page).toHaveURL(/\/search$/);
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
    /post name|title|اسم المنشور|اسم المنتج/i,
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

test("auth journey: user can sign in and access profile", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);
  await setUiLanguage(page, "en");
  await signInAndOpenProfile(page);
});

test("search journey: global search navigates to search results", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);
  await setUiLanguage(page, "en");

  await page.goto("/");
  await submitMarketplaceSearch(page, "phone");
  await expectPostTitleVisible(page, "Demo Phone");
  await expectPostTitleAbsent(page, "Vintage Camera");
});

test("favorites journey: add and remove favorites for authenticated user", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setUiLanguage(page, "en");
  await signInAndOpenProfile(page);
  await submitMarketplaceSearch(page, "phone");
  await expectPostTitleVisible(page, "Demo Phone");

  await page.goto("/post/101");
  const favoriteToggle = getPostFavoriteToggle(page);
  await expect(favoriteToggle).toBeVisible();
  await favoriteToggle.click({ force: true });
  await expect(favoriteToggle).toHaveAttribute(
    "aria-label",
    /remove from favorites|إزالة من المفضلة/i,
  );

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

test("post CRUD journey: create, update, and delete a post", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setUiLanguage(page, "en");

  const createdPostTitle = "E2E Created Post";
  const updatedPostTitle = "E2E Updated Post";
  let createdPostId = "";

  await signInAndOpenProfile(page);
  await page.goto("/sell");

  await page.locator("#title").fill(createdPostTitle);
  await page.locator("#price").fill("777");
  await selectComboboxOption(
    page,
    /category|الفئة/i,
    /electronics|إلكترونيات/i,
  );
  await page.locator("#description").fill("Playwright E2E post creation");
  await page.setInputFiles("#image-upload", {
    name: "post.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_ONE_BY_ONE_BASE64, "base64"),
  });
  await expect(page.getByText(/1\/5 images uploaded/i)).toBeVisible();

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

test("auth journey (arabic): user can sign in and access profile", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");
  await signInAndOpenProfile(page);
});

test("search journey (arabic): global search navigates to search results", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");

  await page.goto("/");
  await submitMarketplaceSearch(page, "phone");
  await expectPostTitleVisible(page, "Demo Phone");
  await expectPostTitleAbsent(page, "Vintage Camera");
});

test("favorites journey (arabic): add and remove favorites for authenticated user", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");
  await signInAndOpenProfile(page);
  await submitMarketplaceSearch(page, "phone");
  await expectPostTitleVisible(page, "Demo Phone");

  await page.goto("/post/101");
  const favoriteToggle = getPostFavoriteToggle(page);
  await expect(favoriteToggle).toBeVisible();
  await favoriteToggle.click({ force: true });
  await expect(favoriteToggle).toHaveAttribute(
    "aria-label",
    /remove from favorites|إزالة من المفضلة/i,
  );

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

test("post CRUD journey (arabic): create, update, and delete a post", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setUiLanguage(page, "ar");

  const createdPostTitle = "E2E Arabic Created Post";
  const updatedPostTitle = "E2E Arabic Updated Post";
  let createdPostId = "";

  await signInAndOpenProfile(page);
  await page.goto("/sell");

  await page.locator("#title").fill(createdPostTitle);
  await page.locator("#price").fill("888");
  await selectComboboxOption(
    page,
    /category|الفئة/i,
    /electronics|إلكترونيات/i,
  );
  await page.locator("#description").fill("Playwright Arabic E2E post creation");
  await page.setInputFiles("#image-upload", {
    name: "post-ar.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_ONE_BY_ONE_BASE64, "base64"),
  });
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
