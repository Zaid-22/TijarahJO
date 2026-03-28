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

async function selectRadixOption(page, triggerSelector, optionName) {
  await page.locator(triggerSelector).click();
  const option = page.getByRole("option", {
    name: new RegExp(`^${escapeForRegex(optionName)}$`, "i"),
  });
  await expect(option).toBeVisible({ timeout: 20_000 });
  await option.click();
}

function buildJordanPhone(seed) {
  const digits = String(seed).replace(/\D/g, "").slice(-7).padStart(7, "0");
  return `79${digits}`;
}

function normalizeApiBaseUrl(value) {
  const normalized = String(value || "http://localhost:5033/api/v1").replace(
    /\/+$/,
    "",
  );
  return /\/api$/i.test(normalized) ? `${normalized}/v1` : normalized;
}

async function forceEnglishUi(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("tijarahjo_language", JSON.stringify("en"));
  });
}

async function primeLocationLookups(page, cityName, areaName) {
  const apiBaseUrl = normalizeApiBaseUrl(process.env.VITE_API_BASE_URL);
  const lookupState = await page.evaluate(
    async ({ resolvedApiBaseUrl, targetCityName, targetAreaName }) => {
      const citiesResponse = await fetch(`${resolvedApiBaseUrl}/cities`, {
        credentials: "include",
      });
      const citiesPayload = citiesResponse.ok ? await citiesResponse.json() : [];
      const normalizedCityName = targetCityName.trim().toLowerCase();
      const city = Array.isArray(citiesPayload)
        ? citiesPayload.find((item) => {
            const cityName = String(item?.cityName ?? item?.CityName ?? "")
              .trim()
              .toLowerCase();
            return cityName === normalizedCityName;
          })
        : null;

      const cityId = Number(city?.cityId ?? city?.CityId ?? 0);
      if (!citiesResponse.ok || !Number.isFinite(cityId) || cityId < 1) {
        return {
          citiesOk: citiesResponse.ok,
          cityResolved: false,
          areaResolved: false,
        };
      }

      const areasResponse = await fetch(
        `${resolvedApiBaseUrl}/cities/${cityId}/areas`,
        {
          credentials: "include",
        },
      );
      const areasPayload = areasResponse.ok ? await areasResponse.json() : [];
      const normalizedAreaName = targetAreaName.trim().toLowerCase();
      const areaResolved = Array.isArray(areasPayload)
        ? areasPayload.some((item) => {
            const areaName = String(item?.areaName ?? item?.AreaName ?? "")
              .trim()
              .toLowerCase();
            return areaName === normalizedAreaName;
          })
        : false;

      return {
        citiesOk: citiesResponse.ok,
        cityResolved: true,
        areaResolved,
      };
    },
    {
      resolvedApiBaseUrl: apiBaseUrl,
      targetCityName: cityName,
      targetAreaName: areaName,
    },
  );

  expect(lookupState.citiesOk).toBeTruthy();
  expect(lookupState.cityResolved).toBeTruthy();
  expect(lookupState.areaResolved).toBeTruthy();
}

async function registerUser(page, user) {
  await forceEnglishUi(page);
  await page.goto("/login");
  await primeLocationLookups(page, "Amman", "Sweifieh");

  const firstNameField = page.locator("#firstName");
  const isSignUpMode = await firstNameField.isVisible().catch(() => false);
  if (!isSignUpMode) {
    await page.getByRole("button", { name: /sign up/i }).first().click();
  }

  await expect(page.locator("#firstName")).toBeVisible();

  await page.locator("#firstName").fill(user.firstName);
  await page.locator("#lastName").fill(user.lastName);
  await page.locator("#phone").fill(user.phone);
  await page.locator("#city").selectOption("Amman");
  await page.locator("#area").fill("Sweifieh");
  await page.locator("#authIdentifier").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#confirmPassword").fill(user.password);

  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(
    page.getByRole("button", {
      name: /^create post$/i,
    }),
  ).toBeVisible({ timeout: 30_000 });
}

async function searchForPost(page, title) {
  await page.goto("/");
  const searchInput = page.getByRole("textbox", {
    name: /search in tijarahjo/i,
  });
  await searchInput.fill(title);
  await page.evaluate((query) => {
    window.localStorage.setItem("tijarahjo_search_query", JSON.stringify(query));
    window.localStorage.setItem(
      "tijarahjo_active_search_query",
      JSON.stringify(query),
    );
  }, title);
  await searchInput.press("Enter");

  const navigatedToSearchPage = await page
    .waitForURL(/\/search$/, { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedToSearchPage) {
    await page.goto("/search");
    await page.waitForURL(/\/search$/, { timeout: 10_000 });
  }

  const resultTitle = page.getByRole("heading", {
    name: new RegExp(`^${escapeForRegex(title)}$`, "i"),
  });
  await expect(resultTitle.first()).toBeVisible({
    timeout: navigatedToSearchPage ? 20_000 : 20_000,
  });
}

async function openSearchResult(page, title) {
  const resultTitle = page.getByRole("heading", {
    name: new RegExp(`^${escapeForRegex(title)}$`, "i"),
  });
  const resultTitleVisible = await resultTitle
    .first()
    .isVisible()
    .catch(() => false);

  if (resultTitleVisible) {
    await resultTitle.first().click({ force: true });
    await expect(page).toHaveURL(/\/post\/\d+$/);
    return;
  }

  const detailsButton = page.getByRole("button", {
    name: new RegExp(`view details for ${escapeForRegex(title)}`, "i"),
  });
  await expect(detailsButton.first()).toBeVisible({ timeout: 20_000 });
  await detailsButton.first().click({ force: true });
  await expect(page).toHaveURL(/\/post\/\d+$/);
}

async function expectPostAbsentInSearch(page, title) {
  await page.goto("/");
  await page.evaluate((query) => {
    window.localStorage.setItem("tijarahjo_search_query", JSON.stringify(query));
    window.localStorage.setItem(
      "tijarahjo_active_search_query",
      JSON.stringify(query),
    );
  }, title);
  await page.goto("/search");
  await page.waitForURL(/\/search$/, { timeout: 10_000 });
  const apiBaseUrl = normalizeApiBaseUrl(process.env.VITE_API_BASE_URL);
  const searchResult = await page.evaluate(
    async ({ resolvedApiBaseUrl, query }) => {
      const queryParams = new URLSearchParams({
        query,
        status: "ACTIVE",
        page: "1",
        limit: "100",
        sortBy: "date",
        sortOrder: "desc",
      });
      const response = await fetch(
        `${resolvedApiBaseUrl}/search?${queryParams.toString()}`,
        {
          credentials: "include",
        },
      );

      return {
        ok: response.ok,
        payload: await response.json(),
      };
    },
    {
      resolvedApiBaseUrl: apiBaseUrl,
      query: title,
    },
  );

  expect(searchResult.ok).toBeTruthy();
  expect(Array.isArray(searchResult.payload?.posts)).toBeTruthy();
  expect(searchResult.payload.posts).toHaveLength(0);
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
  await selectRadixOption(page, "#category", "Electronics");
  await selectRadixOption(page, "#location", "Amman");
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

  await page.getByRole("button", { name: /remove post/i }).first().click();
  const deleteDialog = page.getByRole("alertdialog");
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByLabel(/listed by mistake/i).check();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        /\/api(?:\/v[0-9]+)?\/posts\/\d+$/i.test(response.url()) &&
        response.ok(),
    ),
    deleteDialog.getByRole("button", { name: /confirm removal/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/$/);

  await expectPostAbsentInSearch(page, updatedPostTitle);
});
