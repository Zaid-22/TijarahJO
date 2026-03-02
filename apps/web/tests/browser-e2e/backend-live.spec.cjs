const { test, expect } = require("@playwright/test");

test.skip(
  process.env.E2E_BACKEND_LIVE !== "1",
  "Set E2E_BACKEND_LIVE=1 to run backend-connected browser journeys.",
);

const PNG_ONE_BY_ONE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6pJ4kAAAAASUVORK5CYII=";

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildJordanPhone(seed) {
  const digits = String(seed).replace(/\D/g, "").slice(-7).padStart(7, "0");
  return `+96279${digits}`;
}

async function registerUser(page, user) {
  await page.goto("/login");

  const firstNameField = page.locator("#firstName");
  const isSignUpMode = await firstNameField.isVisible().catch(() => false);
  if (!isSignUpMode) {
    await page.getByRole("button", { name: /sign up/i }).first().click();
  }

  await expect(page.locator("#firstName")).toBeVisible();

  await page.locator("#firstName").fill(user.firstName);
  await page.locator("#lastName").fill(user.lastName);
  await page.locator("#phone").fill(user.phone);
  await page.locator("#city").fill("Amman");
  await page.locator("#area").fill("Khalda");
  await page.locator("#authIdentifier").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#confirmPassword").fill(user.password);

  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(page.getByRole("button", { name: /create post/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function searchForPost(page, title) {
  await page.goto("/");
  const searchInput = page.getByRole("textbox", {
    name: /search in tijarahjo/i,
  });
  await searchInput.fill(title);
  await searchInput.press("Enter");

  const navigatedToSearchPage = await page
    .waitForURL(/\/search$/, { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  const detailsButton = page.getByRole("button", {
    name: new RegExp(`view details for ${escapeForRegex(title)}`, "i"),
  });
  await expect(detailsButton.first()).toBeVisible({
    timeout: navigatedToSearchPage ? 20_000 : 10_000,
  });
}

async function openSearchResult(page, title) {
  const detailsButton = page.getByRole("button", {
    name: new RegExp(`view details for ${escapeForRegex(title)}`, "i"),
  });
  await expect(detailsButton.first()).toBeVisible({ timeout: 20_000 });
  await detailsButton.first().click({ force: true });
  await expect(page).toHaveURL(/\/post\/\d+$/);
}

test("backend live journey: auth, search, favorites, and post CRUD", async ({
  page,
  browser,
}) => {
  const runSeed = Date.now();
  const createdPostTitle = `E2E Live Post ${runSeed}`;
  const updatedPostTitle = `E2E Live Updated ${runSeed}`;
  const userOne = {
    firstName: "Live",
    lastName: "Seller",
    email: `pw_live_${runSeed}_seller@example.com`,
    phone: buildJordanPhone(runSeed),
    password: "P@ssw0rd123",
  };
  const userTwo = {
    firstName: "Live",
    lastName: "Buyer",
    email: `pw_live_${runSeed}_buyer@example.com`,
    phone: buildJordanPhone(runSeed + 1),
    password: "P@ssw0rd123",
  };

  test.setTimeout(150_000);

  await registerUser(page, userOne);

  await page.goto("/sell");
  await page.locator("#title").fill(createdPostTitle);
  await page.locator("#price").fill("777");
  await page.locator("#category").click();
  await page.getByRole("option", { name: "Electronics" }).click();
  await page.locator("#location").click();
  await page.getByRole("option", { name: "Amman" }).click();
  await page.locator("#description").fill("Playwright backend live post creation");
  await page.locator("input#image-upload").last().setInputFiles({
    name: "post.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_ONE_BY_ONE_BASE64, "base64"),
  });
  await expect(page.getByText(/1\/5 images uploaded/i)).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: /publish post/i }).click();
  await expect(page).toHaveURL(/\/$/);

  await searchForPost(page, createdPostTitle);
  await openSearchResult(page, createdPostTitle);
  await expect(page.getByRole("button", { name: /edit post/i }).first()).toBeVisible();

  const frontendBaseUrl =
    process.env.E2E_FRONTEND_BASE_URL || "http://127.0.0.1:4173";
  const userTwoContext = await browser.newContext({ baseURL: frontendBaseUrl });
  const userTwoPage = await userTwoContext.newPage();

  try {
    await registerUser(userTwoPage, userTwo);
    await searchForPost(userTwoPage, createdPostTitle);

    await Promise.all([
      userTwoPage.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          /\/api(?:\/v[0-9]+)?\/favorites$/i.test(response.url()) &&
          response.ok(),
      ),
      userTwoPage
        .getByRole("button", {
          name: new RegExp(
            `add ${escapeForRegex(createdPostTitle)} to favorites`,
            "i",
          ),
        })
        .first()
        .click(),
    ]);

    await userTwoPage.goto("/favorites");
    await expect(userTwoPage.getByText("My Favorites")).toBeVisible();
    const removeFavoriteButton = userTwoPage.getByRole("button", {
      name: new RegExp(
        `remove ${escapeForRegex(createdPostTitle)} from favorites`,
        "i",
      ),
    });
    await expect(removeFavoriteButton.first()).toBeVisible();

    await Promise.all([
      userTwoPage.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          /\/api(?:\/v[0-9]+)?\/favorites\/\d+$/i.test(response.url()) &&
          response.ok(),
      ),
      removeFavoriteButton.first().click(),
    ]);
    await expect(userTwoPage.getByText("No Favorites Yet")).toBeVisible();
  } finally {
    await userTwoContext.close();
  }

  await searchForPost(page, createdPostTitle);
  await openSearchResult(page, createdPostTitle);

  await page.getByRole("button", { name: /edit post/i }).first().click();
  await page.locator("#edit-name").fill(updatedPostTitle);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        /\/api(?:\/v[0-9]+)?\/posts\/\d+$/i.test(response.url()) &&
        response.ok(),
    ),
    page.getByRole("button", { name: /save changes/i }).click(),
  ]);

  await searchForPost(page, updatedPostTitle);
  await openSearchResult(page, updatedPostTitle);

  await page.getByRole("button", { name: /delete post/i }).first().click();
  const deleteDialog = page.getByRole("alertdialog");
  await expect(deleteDialog).toBeVisible();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        /\/api(?:\/v[0-9]+)?\/posts\/\d+$/i.test(response.url()) &&
        response.ok(),
    ),
    deleteDialog.getByRole("button", { name: /^delete$/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/$/);

  await searchForPost(page, updatedPostTitle);
  await expect(
    page.getByRole("button", {
      name: new RegExp(`view details for ${escapeForRegex(updatedPostTitle)}`, "i"),
    }),
  ).toHaveCount(0);
});
