const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
  buildPostMapDestination,
  formatDistance,
  formatDuration,
} = require("../../.unit-dist/features/post-details/postLocationMapUtils.js");

test("buildPostMapDestination prefers post area and city for Google query", () => {
  const destination = buildPostMapDestination(
    {
      area: "Khalda",
      location: "Amman",
      areaAr: "خلدا",
      locationAr: "عمان",
    },
    "en",
  );

  assert.deepEqual(destination, {
    query: "Khalda, Amman, Jordan",
    displayLabel: "Khalda, Amman",
  });
});

test("buildPostMapDestination falls back to Arabic fields when English values are missing", () => {
  const destination = buildPostMapDestination(
    {
      areaAr: "خلدا",
      locationAr: "عمان",
    },
    "ar",
  );

  assert.deepEqual(destination, {
    query: "خلدا, عمان, Jordan",
    displayLabel: "خلدا, عمان",
  });
});

test("buildPostMapDestination returns null when no usable location is present", () => {
  assert.equal(
    buildPostMapDestination({ area: " ", location: "Jordan" }, "en"),
    null,
  );
});

test("Google Maps URLs encode destination and origin correctly", () => {
  assert.equal(
    buildGoogleMapsSearchUrl("Khalda, Amman, Jordan"),
    "https://www.google.com/maps/search/?api=1&query=Khalda%2C%20Amman%2C%20Jordan",
  );
  assert.equal(
    buildGoogleMapsDirectionsUrl("Khalda, Amman, Jordan", {
      lat: 31.95,
      lng: 35.91,
    }),
    "https://www.google.com/maps/dir/?api=1&origin=31.95%2C35.91&destination=Khalda%2C%20Amman%2C%20Jordan&travelmode=driving",
  );
});

test("distance and duration labels format in English and Arabic", () => {
  assert.equal(formatDistance(8400, "en"), "8.4 km");
  assert.equal(formatDuration(1080, "en"), "18 min");
  assert.match(formatDistance(8400, "ar"), /كم/);
  assert.match(formatDuration(1080, "ar"), /دقيقة/);
});
