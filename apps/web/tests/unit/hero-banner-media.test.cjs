const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolveHeroBannerMedia,
} = require("../../.unit-dist/features/home/components/heroBannerData.js");

test("resolveHeroBannerMedia derives responsive sources for bundled hero assets", () => {
  assert.deepEqual(resolveHeroBannerMedia("/banners/asset-slide-2.webp"), {
    imageSrcSet:
      "/banners/asset-slide-2-360w.webp 360w, /banners/asset-slide-2.webp 640w",
    pngFallbackUrl: "/banners/asset-slide-2.png",
  });
});

test("resolveHeroBannerMedia leaves external or unknown banner URLs untouched", () => {
  assert.deepEqual(resolveHeroBannerMedia("https://cdn.example.com/banner.webp"), {});
  assert.deepEqual(resolveHeroBannerMedia("/uploads/admin/banner-custom.webp"), {});
});
