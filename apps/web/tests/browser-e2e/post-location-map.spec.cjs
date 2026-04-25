const { test, expect } = require("@playwright/test");
const {
  createMarketplaceApiMock,
} = require("./support/mockMarketplaceApi.cjs");

const POST_LOADING_PATTERN = /loading post|جار تحميل المنشور/i;

async function waitForPostDetailsLoaded(page) {
  await expect(page.getByText(POST_LOADING_PATTERN).first()).toBeHidden({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("heading", { name: /^Demo Phone$/i }).first(),
  ).toBeVisible({ timeout: 20_000 });
}

async function setEnglishLanguage(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("tijarahjo_language", JSON.stringify("en"));
  });
}

async function installGoogleMapsMock(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success) {
          success({
            coords: {
              latitude: 31.95,
              longitude: 35.91,
            },
          });
        },
      },
    });

    window.google = {
      maps: {
        Geocoder: class {
          geocode(_request, callback) {
            callback(
              [
                {
                  geometry: {
                    location: {
                      lat: () => 31.98,
                      lng: () => 35.84,
                    },
                  },
                },
              ],
              "OK",
            );
          }
        },
        GeocoderStatus: { OK: "OK" },
        importLibrary(libraryName) {
          if (libraryName === "routes") {
            return Promise.resolve(window.google.maps.routes);
          }
          return Promise.resolve({});
        },
        Map: class {
          constructor(element, options) {
            this.element = element;
            this.options = options;
            element.dataset.mockGoogleMap = "ready";
            element.dataset.mockGoogleMapStyles = options.styles ? "dark" : "light";
          }
          setCenter(position) {
            this.options.center = position;
          }
          setOptions(options) {
            this.options = { ...this.options, ...options };
            this.element.dataset.mockGoogleMapStyles = options.styles ? "dark" : "light";
          }
        },
        Marker: class {
          constructor(options) {
            this.options = options;
          }
          setMap(map) {
            this.options.map = map;
          }
        },
        TravelMode: { DRIVING: "DRIVING" },
        routes: {
          Route: {
            computeRoutes(request) {
              if (
                typeof request.origin?.lat !== "number" ||
                typeof request.origin?.lng !== "number" ||
                typeof request.destination?.lat !== "number" ||
                typeof request.destination?.lng !== "number"
              ) {
                return Promise.reject(new Error("Invalid route coordinate shape"));
              }
              return Promise.resolve({
                routes: [
                  {
                    distanceMeters: 8400,
                    durationMillis: 1080_000,
                  },
                ],
              });
            },
          },
        },
      },
    };
  });
}

test("post details shows map card under seller card with Google Maps fallback", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setEnglishLanguage(page);
  await page.route("https://maps.googleapis.com/**", (route) => route.abort());

  await page.goto("/post/101");
  await waitForPostDetailsLoaded(page);

  const mapCard = page.getByTestId("post-location-map-card");
  await expect(mapCard).toBeVisible();
  await expect(mapCard).not.toContainText("Khalda, Amman");
  await expect(mapCard).toContainText("Google Maps is not configured yet.");
  await expect(mapCard).toContainText("Open in Google Maps");
});

test("post details calculates distance and travel time from user location", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setEnglishLanguage(page);
  await installGoogleMapsMock(page);

  await page.goto("/post/101");
  await waitForPostDetailsLoaded(page);

  const mapCard = page.getByTestId("post-location-map-card");
  await expect(mapCard).toBeVisible();
  await mapCard.getByRole("button", { name: /use my location/i }).click();
  await expect(mapCard).toContainText("About 8.4 km away");
  await expect(mapCard).toContainText("18 min by car");
});

test("post details map card reflects dark mode", async ({ page }) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setEnglishLanguage(page);
  await installGoogleMapsMock(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("tijarahjo_dark_mode", JSON.stringify(true));
  });

  await page.goto("/post/101");
  await waitForPostDetailsLoaded(page);

  const mapCard = page.getByTestId("post-location-map-card");
  await expect(mapCard).toHaveAttribute("data-map-theme", "dark");
  await expect(mapCard.locator("[data-mock-google-map]")).toHaveAttribute(
    "data-mock-google-map-styles",
    "dark",
  );
});

test("post details resets distance state when navigating to another post", async ({
  page,
}) => {
  const apiMock = createMarketplaceApiMock({ authenticated: true });
  await apiMock.install(page);
  await setEnglishLanguage(page);
  await installGoogleMapsMock(page);

  await page.goto("/post/101");
  await waitForPostDetailsLoaded(page);

  const mapCard = page.getByTestId("post-location-map-card");
  await mapCard.getByRole("button", { name: /use my location/i }).click();
  await expect(mapCard).toContainText("About 8.4 km away");

  await page.goto("/post/102");
  await expect(
    page.getByRole("heading", { name: /^Vintage Camera$/i }).first(),
  ).toBeVisible({ timeout: 20_000 });

  const nextMapCard = page.getByTestId("post-location-map-card");
  await expect(nextMapCard).toContainText(
    "Use my location to see distance and time.",
  );
  await expect(nextMapCard).not.toContainText("About 8.4 km away");
});
