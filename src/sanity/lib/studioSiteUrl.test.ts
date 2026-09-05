import assert from "node:assert/strict";
import { test } from "node:test";
import { canHostedStudioReach, isHostedSanityStudio, revalidateApiUrl, studioTranslateOrigin, translateApiUrl } from "./studioSiteUrl";

test("hosted Studio uses the public HTTPS origin, not localhost", () => {
  assert.equal(
    studioTranslateOrigin({
      hostname: "exotichk-admin.sanity.studio",
      localUrl: "http://localhost:3000",
      publicUrl: "https://www.example.com/",
    }),
    "https://www.example.com",
  );
});

test("local Studio keeps the localhost origin", () => {
  assert.equal(
    studioTranslateOrigin({
      hostname: "localhost",
      localUrl: "http://localhost:3000",
      publicUrl: "https://www.example.com",
    }),
    "http://localhost:3000",
  );
});

test("translate API keeps the trailing slash required by Next", () => {
  assert.equal(translateApiUrl("https://www.example.com"), "https://www.example.com/api/translate/");
  assert.equal(translateApiUrl("https://www.example.com/"), "https://www.example.com/api/translate/");
});

test("revalidate API keeps the trailing slash required by Next", () => {
  assert.equal(revalidateApiUrl("https://www.example.com"), "https://www.example.com/api/revalidate/");
});

test("hosted Studio cannot reach localhost or http origins", () => {
  const host = "exotichk-admin.sanity.studio";
  assert.equal(isHostedSanityStudio(host), true);
  assert.equal(canHostedStudioReach("http://localhost:3000", host), false);
  assert.equal(canHostedStudioReach("http://127.0.0.1:3000", host), false);
  assert.equal(canHostedStudioReach("https://www.example.com", host), true);
  assert.equal(canHostedStudioReach("http://localhost:3000", "localhost"), true);
});
