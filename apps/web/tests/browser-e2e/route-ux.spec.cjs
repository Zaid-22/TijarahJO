const { test, expect } = require("@playwright/test");
const {
  createMarketplaceApiMock,
} = require("./support/mockMarketplaceApi.cjs");

async function clickBackControl(page) {
  const roleBackControl = page
    .getByRole("button", { name: /back|العودة|go back|رجوع/i })
    .first();
  if (await roleBackControl.isVisible().catch(() => false)) {
    await roleBackControl.click();
    return;
  }

  const ariaBackControl = page
    .locator(
      "button[aria-label*='Back' i], button[aria-label*='Go back' i], button[aria-label*='العودة'], button[aria-label*='رجوع']",
    )
    .first();
  if (await ariaBackControl.isVisible().catch(() => false)) {
    await ariaBackControl.click();
    return;
  }

  await page
    .locator("header button, header a")
    .first()
    .click();
}

test("unknown route shows recovery context and home action", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);

  await page.goto("/unknown/deep/link");

  await expect(
    page
      .getByRole("heading", { name: /page not found|الصفحة غير موجودة/i })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText(/requested path:|المسار المطلوب:/i),
  ).toContainText("/unknown/deep/link");
  await page
    .getByRole("button", { name: /go home|الذهاب إلى الرئيسية/i })
    .click();
  await expect(page).toHaveURL(/\/$/);
});

test("seller profile back path safely returns to marketplace", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);

  await page.goto("/seller/5");
  await expect(page).toHaveURL(/\/seller\/5$/);
  await clickBackControl(page);
  await expect(page).toHaveURL(/\/$/);
});

test("seller to chat preserves deterministic back path", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);

  await page.goto("/seller/5");
  await expect(page).toHaveURL(/\/seller\/5$/);

  await page
    .getByRole("button", { name: /chat with seller|الدردشة مع البائع/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/chat\/5$/);

  await clickBackControl(page);
  if (/\/chat$/.test(page.url())) {
    await clickBackControl(page);
  }
  await expect(page).toHaveURL(/\/seller\/5$/);
});

test("auth screen renders Arabic-first copy when language is Arabic", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({ authenticated: false });
  await apiMock.install(page);

  await page.addInitScript(() => {
    window.localStorage.setItem("tijarahjo_language", JSON.stringify("ar"));
  });

  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  await expect(page.getByText("البريد الإلكتروني أو الهاتف")).toBeVisible();
});
