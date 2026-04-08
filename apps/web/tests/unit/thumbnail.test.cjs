const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getResponsiveImageProps,
  toThumbnailUrl,
} = require("../../.unit-dist/shared/lib/thumbnail.js");

test("toThumbnailUrl keeps local thumbs and rewrites local uploads", () => {
  assert.equal(
    toThumbnailUrl("/uploads/post-images/example.webp"),
    "/uploads/post-images/example.thumb.webp",
  );
  assert.equal(
    toThumbnailUrl("/uploads/post-images/example.thumb.webp"),
    "/uploads/post-images/example.thumb.webp",
  );
});

test("getResponsiveImageProps emits bounded unsplash srcset candidates", () => {
  const props = getResponsiveImageProps(
    "https://images.unsplash.com/photo-1?w=1080&h=720&fit=max&fm=jpg&q=80",
    {
      width: 480,
      aspectRatio: 4 / 3,
      quality: 60,
      sizes: "(max-width: 639px) 44vw, 18vw",
      widths: [240, 360, 480],
    },
  );

  assert.ok(props.src);
  const srcUrl = new URL(props.src);
  assert.equal(srcUrl.searchParams.get("w"), "480");
  assert.equal(srcUrl.searchParams.get("h"), "360");
  assert.equal(srcUrl.searchParams.get("fit"), "crop");
  assert.equal(srcUrl.searchParams.get("q"), "60");
  assert.equal(srcUrl.searchParams.get("auto"), "format");
  assert.equal(srcUrl.searchParams.get("crop"), "entropy");

  const srcSetCandidates = (props.srcSet || "").split(", ");
  assert.deepEqual(
    srcSetCandidates.map((candidate) => candidate.split(" ").at(-1)),
    ["240w", "360w", "480w"],
  );
  const smallestCandidate = new URL(srcSetCandidates[0].split(" ")[0]);
  assert.equal(smallestCandidate.searchParams.get("w"), "240");
  assert.equal(smallestCandidate.searchParams.get("h"), "180");
  assert.equal(props.sizes, "(max-width: 639px) 44vw, 18vw");
});

test("getResponsiveImageProps falls back to single src for non-unsplash images", () => {
  const props = getResponsiveImageProps("https://example.com/image.jpg", {
    width: 480,
    widths: [240, 360, 480],
    sizes: "50vw",
  });

  assert.equal(props.src, "https://example.com/image.jpg");
  assert.equal(props.srcSet, undefined);
  assert.equal(props.sizes, "50vw");
});
