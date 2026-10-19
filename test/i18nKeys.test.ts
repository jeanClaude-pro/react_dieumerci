import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const load = (lang: string) => JSON.parse(readFileSync(join(root, "src/i18n/locales", `${lang}.json`), "utf8"));
const fr = load("fr");
const en = load("en");

function flatten(node: Record<string, unknown>, prefix = "", out = new Map<string, unknown>()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value as Record<string, unknown>, path, out);
    else out.set(path, value);
  }
  return out;
}

const frKeys = flatten(fr);
const enKeys = flatten(en);

test("fr.json and en.json contain exactly the same keys", () => {
  const missingInEn = [...frKeys.keys()].filter((key) => !enKeys.has(key));
  const missingInFr = [...enKeys.keys()].filter((key) => !frKeys.has(key));
  assert.deepEqual(missingInEn, [], `missing in en.json: ${missingInEn.join(", ")}`);
  assert.deepEqual(missingInFr, [], `missing in fr.json: ${missingInFr.join(", ")}`);
});

test("no translation is empty and placeholders match between languages", () => {
  const placeholders = (value: unknown) => [...String(value).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();
  for (const [key, value] of frKeys) {
    assert.ok(String(value).trim() !== "", `fr ${key} is empty`);
    assert.ok(String(enKeys.get(key) ?? "").trim() !== "", `en ${key} is empty`);
    assert.deepEqual(placeholders(enKeys.get(key)), placeholders(value), `placeholders differ for ${key}`);
  }
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "locales" ? [] : sourceFiles(path);
    return /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

test("every literal t()/tr() key used in the code exists in both languages", () => {
  const exists = (key: string) => frKeys.has(key) || frKeys.has(`${key}_one`) || frKeys.has(`${key}_other`);
  const missing: string[] = [];
  for (const file of sourceFiles(join(root, "src"))) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\b(?:t|tr|i18n\.t)\(\s*["']([a-zA-Z][\w-]*(?:\.[\w-]+)+)["']/g)) {
      if (!exists(match[1])) missing.push(`${file.replace(root, "")}: ${match[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("French is the default language", () => {
  const init = readFileSync(join(root, "src/i18n/index.ts"), "utf8");
  assert.match(init, /DEFAULT_LANGUAGE[^=]*=\s*["']fr["']/);
  assert.match(init, /fallbackLng:\s*DEFAULT_LANGUAGE/);
});
