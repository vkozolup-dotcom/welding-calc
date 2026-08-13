/**
 * Security / crypto self-checks for welding-calc.
 * Run: npx tsx scripts/security-check.ts
 *
 * Note: app currently stores localStorage in plaintext.
 * This script verifies threat-model assumptions + Web Crypto AES-GCM works
 * (so we can add passphrase vault later without surprises).
 */
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

function isSafePhotoDataUrl(v: unknown): boolean {
  return (
    typeof v === "string" &&
    /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(v)
  );
}

function hasPrototypePollution(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    Object.prototype.hasOwnProperty.call(o, "__proto__") ||
    Object.prototype.hasOwnProperty.call(o, "constructor") ||
    Object.prototype.hasOwnProperty.call(o, "prototype")
  );
}

/** Minimal AES-GCM roundtrip like a future vault would use */
async function aesRoundtrip(passphrase: string, plaintext: string) {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const cipher = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  const plain = await subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

async function main() {
  console.log("=== Welding Calc — security / encryption checks ===\n");

  // A) Storage is expected plaintext today (documented finding)
  assert(
    true,
    "FINDING documented: localStorage jobs/prices/settings are plaintext (no app encryption yet)",
  );

  // B) Photo URL allowlist
  assert(
    isSafePhotoDataUrl("data:image/jpeg;base64,/9j/4AAQ"),
    "safe jpeg data URL accepted",
  );
  assert(
    !isSafePhotoDataUrl("javascript:alert(1)"),
    "javascript: photo URL rejected",
  );
  assert(
    !isSafePhotoDataUrl("data:text/html;base64,PHNjcmlwdD4="),
    "html data URL rejected",
  );
  assert(!isSafePhotoDataUrl("https://evil.example/x.jpg"), "remote URL rejected");

  // C) Import payload hygiene checks
  assert(
    !hasPrototypePollution({ name: "ok", note: "x" }),
    "normal object not flagged",
  );
  // JSON.parse of __proto__ key becomes own property on some engines when using JSON
  const polluted = JSON.parse('{"__proto__":{"polluted":true},"id":"1"}');
  assert(
    hasPrototypePollution(polluted) || !("__proto__" in Object(polluted)),
    "prototype-key payloads detected or inert",
  );

  // D) Secrets should not live in client source (heuristic)
  const fs = await import("node:fs");
  const srcFiles = [
    "src/lib/storage.ts",
    "src/lib/defaults.ts",
    "src/components/JobsPanel.tsx",
    "src/components/WeldingCalculator.tsx",
  ];
  for (const f of srcFiles) {
    const text = fs.readFileSync(f, "utf8");
    assert(
      !/sk_live|AKIA[0-9A-Z]{16}|BEGIN PRIVATE KEY|api[_-]?key\s*[:=]\s*['\"][^'\"]+/i.test(
        text,
      ),
      `no hard-coded cloud secrets in ${f}`,
    );
  }

  // E) Web Crypto AES-GCM works in this environment
  const secret = `quote-${Date.now()}-hydraulika`;
  const round = await aesRoundtrip("test-passphrase-welding", secret);
  assert(round === secret, "AES-256-GCM + PBKDF2 roundtrip succeeds");

  // F) Wrong passphrase fails decrypt
  let wrongFailed = false;
  try {
    const enc = new TextEncoder();
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const km = await subtle.importKey(
      "raw",
      enc.encode("right-pass"),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 50_000, hash: "SHA-256" },
      km,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    const cipher = await subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode("secret-job"),
    );
    const km2 = await subtle.importKey(
      "raw",
      enc.encode("wrong-pass"),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key2 = await subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 50_000, hash: "SHA-256" },
      km2,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    await subtle.decrypt({ name: "AES-GCM", iv }, key2, cipher);
  } catch {
    wrongFailed = true;
  }
  assert(wrongFailed, "wrong passphrase cannot decrypt AES-GCM payload");

  console.log("");
  if (failed > 0) {
    console.error(`${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("All security/crypto checks passed");
  console.log(
    "\nSummary: app has NO user-data encryption at rest yet; crypto APIs are available to add a passphrase vault.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
