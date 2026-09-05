import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProfilesCsv } from "./csv";
import { parseLanguages, parsePriceHkd } from "./fields";

test("quoted language lists stay one CSV field, then split to tags", () => {
  const csv = [
    "display_name,country,district,summary_en,image_folder,languages,description_en",
    'Sample,Hong Kong,TST,Short summary.,sample,"English,Russian","Hello, world. More text."',
  ].join("\n");
  const { rows } = parseProfilesCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].languages, "English,Russian");
  assert.deepEqual(parseLanguages(rows[0].languages), ["English", "Russian"]);
  assert.equal(rows[0].description_en, "Hello, world. More text.");
});

test("price_hkd rejects currency symbols and decimals", () => {
  assert.deepEqual(parsePriceHkd(""), { ok: true, value: undefined });
  assert.deepEqual(parsePriceHkd("1500"), { ok: true, value: 1500 });
  assert.equal(parsePriceHkd("HK$ 1500").ok, false);
  assert.equal(parsePriceHkd("1500.5").ok, false);
  assert.equal(parsePriceHkd("0").ok, false);
});
