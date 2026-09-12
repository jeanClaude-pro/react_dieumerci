import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeJwtPayload,
  getTokenExpiry,
  isTokenExpired,
} from "../src/lib/sessionManager.ts";

function makeToken(payload: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.signature`;
}

test("decodes a well-formed JWT payload", () => {
  const token = makeToken({ id: "abc123", exp: 1999999999 });
  assert.deepEqual(decodeJwtPayload(token), { id: "abc123", exp: 1999999999 });
});

test("rejects tokens that are not three dot-separated segments", () => {
  assert.equal(decodeJwtPayload("not-a-jwt"), null);
  assert.equal(decodeJwtPayload("a.b"), null);
  assert.equal(decodeJwtPayload(""), null);
});

test("rejects a payload segment that isn't valid base64url JSON", () => {
  assert.equal(decodeJwtPayload("header.%%%not-base64%%%.sig"), null);
});

test("getTokenExpiry reads the exp claim in seconds", () => {
  const token = makeToken({ id: "u1", exp: 1700000000 });
  assert.equal(getTokenExpiry(token), 1700000000);
});

test("getTokenExpiry returns null when exp is missing or not a number", () => {
  assert.equal(getTokenExpiry(makeToken({ id: "u1" })), null);
  assert.equal(getTokenExpiry(makeToken({ id: "u1", exp: "soon" })), null);
});

test("isTokenExpired is true for a token whose exp is in the past", () => {
  const pastExp = Math.floor(Date.now() / 1000) - 60;
  assert.equal(isTokenExpired(makeToken({ id: "u1", exp: pastExp })), true);
});

test("isTokenExpired is false for a token whose exp is in the future", () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  assert.equal(isTokenExpired(makeToken({ id: "u1", exp: futureExp })), false);
});

test("isTokenExpired treats missing/undecodable/no-exp tokens as expired", () => {
  assert.equal(isTokenExpired(null), true);
  assert.equal(isTokenExpired(undefined), true);
  assert.equal(isTokenExpired(""), true);
  assert.equal(isTokenExpired("garbage"), true);
  assert.equal(isTokenExpired(makeToken({ id: "u1" })), true);
});
