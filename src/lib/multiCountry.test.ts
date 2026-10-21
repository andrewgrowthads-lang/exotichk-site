import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveContact, resolveCountryContact } from "./contact";
import { countryFlagSrc, countryPhoto, resolveCurrency } from "./countryPresets";
import { districtExpandedLabel, districtNavLabel } from "./districtLabels";
import { formatPrice, isCurrencyCode } from "./formatPrice";
import { homeSeoDescription, homeSeoTitle, profileSeoTitle } from "./seo";
import { generateInternalId } from "../sanity/lib/generateInternalId";

const HK_LEGACY = {
  whatsappUrl: "https://wa.me/66955233905",
  telegramUrl: "https://t.me/missmiraevilgirl",
  telegramChannelUrl: "https://t.me/exotichk",
};

test("prices use the profile's country currency", () => {
  assert.equal(formatPrice(1500, resolveCurrency({ slug: "hong-kong", currency: "HKD" })), "HK$ 1500");
  assert.equal(formatPrice(1500, resolveCurrency({ slug: "singapore", currency: "SGD" })), "S$ 1500");
});

test("a country without a stored currency falls back to its own preset, never another country's", () => {
  assert.equal(resolveCurrency({ slug: "hong-kong" }), "HKD");
  assert.equal(resolveCurrency({ slug: "singapore" }), "SGD");
  assert.equal(resolveCurrency({ slug: "singapore", currency: undefined }), "SGD");
});

test("no price is rendered when the currency is unknown", () => {
  assert.equal(resolveCurrency({ slug: "elsewhere" }), undefined);
  assert.equal(formatPrice(1500, undefined), null);
  assert.equal(formatPrice(undefined, "SGD"), null);
  assert.equal(formatPrice(0, "SGD"), null);
});

test("currency and preset lookups ignore inherited object keys", () => {
  assert.equal(isCurrencyCode("toString"), false);
  assert.equal(resolveCurrency({ slug: "constructor" }), undefined);
  assert.equal(countryFlagSrc("constructor"), undefined);
  assert.equal(countryPhoto("__proto__"), undefined);
});

test("Singapore uses the centred local Marina Bay night backdrop", () => {
  const photo = countryPhoto("singapore");
  assert.equal(photo?.base, "/atmosphere/singapore-marina-bay-night");
  assert.equal(photo?.objectPosition, "center center");
});

test("Hong Kong keeps the legacy site-wide contacts until it has its own", () => {
  assert.deepEqual(resolveCountryContact({ slug: "hong-kong", contact: {} }, HK_LEGACY), HK_LEGACY);
  assert.deepEqual(resolveCountryContact({ slug: "hong-kong" }, HK_LEGACY), HK_LEGACY);
});

test("Singapore never receives Hong Kong contacts", () => {
  assert.deepEqual(resolveCountryContact({ slug: "singapore", contact: {} }, HK_LEGACY), {});
  assert.deepEqual(resolveCountryContact({ slug: "singapore" }, HK_LEGACY), {});

  const profile = resolveContact({}, resolveCountryContact({ slug: "singapore", contact: {} }, HK_LEGACY));
  assert.equal(profile.whatsappUrl, undefined);
  assert.equal(profile.telegramUrl, undefined);
  assert.equal(profile.telegramChannelUrl, undefined);
});

test("a country's own contacts are used as a set: empty fields hide, never borrow", () => {
  const singapore = resolveCountryContact(
    { slug: "singapore", contact: { whatsappUrl: "https://wa.me/6591234567" } },
    HK_LEGACY,
  );
  assert.deepEqual(singapore, {
    whatsappUrl: "https://wa.me/6591234567",
    telegramUrl: undefined,
    telegramChannelUrl: undefined,
  });

  const hongKong = resolveCountryContact(
    { slug: "hong-kong", contact: { telegramUrl: "https://t.me/newmanager" } },
    HK_LEGACY,
  );
  assert.equal(hongKong.telegramUrl, "https://t.me/newmanager");
  assert.equal(hongKong.whatsappUrl, undefined);
});

test("unsafe country contact URLs are dropped", () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const contact = resolveCountryContact(
      { slug: "singapore", contact: { whatsappUrl: "http://wa.me/1", telegramUrl: "https://evil.example/x" } },
      HK_LEGACY,
    );
    assert.equal(contact.whatsappUrl, undefined);
    assert.equal(contact.telegramUrl, undefined);
  } finally {
    console.warn = originalWarn;
  }
});

test("profile overrides win field by field over the country contacts", () => {
  const country = resolveCountryContact({ slug: "singapore", contact: { whatsappUrl: "https://wa.me/65111" } }, {});
  const contact = resolveContact({ telegramUrl: "https://t.me/override" }, country);
  assert.equal(contact.whatsappUrl, "https://wa.me/65111");
  assert.equal(contact.telegramUrl, "https://t.me/override");
});

test("curated district labels are scoped to their country", () => {
  assert.equal(districtNavLabel("hong-kong", "tst", "Tsim Sha Tsui"), "TST");
  assert.equal(districtExpandedLabel("hong-kong", "wan-chai", "Wan Chai"), "Wan Chai (灣仔)");
  assert.equal(districtNavLabel("singapore", "tst", "Tanjong"), "Tanjong");
  assert.equal(districtExpandedLabel("singapore", "wan-chai", "Somewhere"), "Somewhere");
});

test("internal IDs are prefixed by country and default to HK", () => {
  assert.match(generateInternalId(), /^HK[0-9A-F]{16}$/);
  assert.match(generateInternalId("hong-kong"), /^HK[0-9A-F]{16}$/);
  assert.match(generateInternalId("singapore"), /^SG[0-9A-F]{16}$/);
  assert.match(generateInternalId("constructor"), /^HK[0-9A-F]{16}$/);
});

test("location page metadata lists only the countries available in that language", () => {
  assert.equal(
    homeSeoTitle({ locale: "en", siteName: "ExoticHK", countries: ["Hong Kong", "Singapore"] }),
    "ExoticHK | Hong Kong & Singapore Profiles",
  );
  assert.equal(homeSeoTitle({ locale: "zh-Hant-HK", siteName: "ExoticHK", countries: ["香港"] }), "ExoticHK｜香港個人檔案");
  assert.equal(homeSeoTitle({ locale: "en", siteName: "ExoticHK", countries: [] }), "ExoticHK");
  assert.match(homeSeoDescription("en", ["Hong Kong", "Singapore"]), /Hong Kong or Singapore/);
});

test("profile titles name the district only when the profile has one", () => {
  const base = { siteName: "ExoticHK", profile: "Mia" };
  assert.equal(
    profileSeoTitle({ ...base, locale: "en", country: "Hong Kong", district: "TST" }),
    "Mia in TST, Hong Kong | ExoticHK",
  );
  assert.equal(profileSeoTitle({ ...base, locale: "zh-Hant-HK", country: "香港", district: "尖沙咀" }), "Mia－尖沙咀，香港｜ExoticHK");
  assert.equal(profileSeoTitle({ ...base, locale: "en", country: "Singapore" }), "Mia in Singapore | ExoticHK");
  assert.equal(profileSeoTitle({ ...base, locale: "zh-Hant-HK", country: "新加坡" }), "Mia－新加坡｜ExoticHK");
});
