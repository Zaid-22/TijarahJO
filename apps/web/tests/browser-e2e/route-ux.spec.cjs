const { test, expect } = require("@playwright/test");
const {
  createMarketplaceApiMock,
} = require("./support/mockMarketplaceApi.cjs");

async function clickBackControl(page) {
  const ariaBackControl = page
    .locator(
      "button[aria-label='Back']:visible, button[aria-label='Go back']:visible, button[aria-label='العودة']:visible, button[aria-label='رجوع']:visible",
    )
    .first();
  if (await ariaBackControl.count()) {
    await ariaBackControl.click();
    return;
  }

  const roleBackControl = page
    .locator("button:visible", {
      hasText: /^(back|go back|العودة|رجوع)$/i,
    })
    .first();
  if (await roleBackControl.count()) {
    await roleBackControl.click();
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
    .getByRole("button", { name: /^(chat|دردشة)$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/chat\/5(?:\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: /messages|الرسائل/i }).first(),
  ).toBeVisible();

  await clickBackControl(page);
  if (/\/chat$/.test(page.url())) {
    await clickBackControl(page);
  }
  await expect(page).toHaveURL(/\/seller\/5$/);
});

test("direct chat route ignores stale persisted seller back path", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);

  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "chat:return-path",
      JSON.stringify({
        chatUserId: "5",
        returnPath: "/seller/5",
      }),
    );
  });

  await page.goto("/chat/42");
  await expect(page).toHaveURL(/\/chat\/42$/);

  await clickBackControl(page);
  if (/\/chat$/.test(page.url())) {
    await clickBackControl(page);
  }

  await expect(page).toHaveURL(/\/$/);
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
