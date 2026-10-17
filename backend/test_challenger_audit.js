import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

async function challenge(name, fn) {
  testCount++;
  process.stdout.write(`[CHALLENGE ${testCount}] ${name} ... `);
  try {
    await fn();
    passedCount++;
    console.log("\x1b[32mPASS\x1b[0m");
  } catch (err) {
    failedCount++;
    console.log("\x1b[31mFAIL\x1b[0m");
    console.error(`  -> ${err.message}`);
  }
}

async function runChallengerSuite() {
  console.log("==================================================");
  console.log("    EMPIRICAL CHALLENGER ADVERSARIAL SUITE        ");
  console.log("==================================================");
  console.log(`Target: ${BASE_URL}\n`);

  // --- AC 1: Preflight OPTIONS & CORS Origin Matching ---
  await challenge("AC1.1: Localhost origin http://localhost:5173 receives 200 & allow-origin", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.strictEqual(res.headers.get("access-control-allow-credentials"), "true");
  });

  await challenge("AC1.2: Vercel production domain receives 200 & allow-origin", async () => {
    const origin = "https://chat-app-3kx9.vercel.app";
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("access-control-allow-origin"), origin);
  });

  await challenge("AC1.3: Vercel preview domain (*.vercel.app) receives 200 & allow-origin", async () => {
    const origin = "https://preview-deploy-branch-1234.vercel.app";
    const res = await fetch(`${BASE_URL}/api/message/user`, {
      method: "OPTIONS",
      headers: {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("access-control-allow-origin"), origin);
  });

  await challenge("AC1.4: Disallowed origin does NOT receive access-control-allow-origin", async () => {
    const origin = "https://malicious-attacker-site.com";
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    assert.notStrictEqual(allowOrigin, origin, "Disallowed origin must NOT be reflected in access-control-allow-origin");
  });

  // --- AC 2: Dual Authentication Stress Tests ---
  const stamp = Date.now();
  const testEmail = `challenger_${stamp}@test.com`;
  const testPass = "Pass123!";

  let validToken = "";
  let validCookie = "";

  await challenge("AC2.1: Register and login to acquire valid JWT token & cookie", async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPass, name: "Challenger" }),
    });
    assert.ok(regRes.status === 200 || regRes.status === 201);

    const logRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPass }),
    });
    assert.strictEqual(logRes.status, 200);
    const logData = await logRes.json();
    assert.ok(logData.token);
    validToken = logData.token;

    const setCookie = logRes.headers.get("set-cookie");
    assert.ok(setCookie);
    const match = setCookie.match(/jwt=([^;]+)/);
    assert.ok(match);
    validCookie = `jwt=${match[1]}`;
  });

  await challenge("AC2.2: Pure Bearer header auth (no cookie) succeeds with 200", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer ${validToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.email, testEmail);
  });

  await challenge("AC2.3: Pure Cookie auth (no Authorization header) succeeds with 200", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Cookie": validCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.email, testEmail);
  });

  await challenge("AC2.4: Both Bearer header and Cookie present succeeds with 200", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: {
        "Authorization": `Bearer ${validToken}`,
        "Cookie": validCookie,
      },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.email, testEmail);
  });

  await challenge("AC2.5: Bearer header with excess whitespace 'Bearer    <token>' succeeds with 200", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer    ${validToken}` },
    });
    assert.strictEqual(res.status, 200);
  });

  await challenge("AC2.6: Bare token without 'Bearer' prefix succeeds with 200", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": validToken },
    });
    assert.strictEqual(res.status, 200);
  });

  await challenge("AC2.7: Invalid/corrupted Bearer token returns HTTP 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer corrupt.${validToken.substring(10)}` },
    });
    assert.strictEqual(res.status, 401);
  });

  await challenge("AC2.8: Completely missing authentication returns HTTP 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`);
    assert.strictEqual(res.status, 401);
  });

  // --- AC 3: Routing & Gateway Inspection ---
  await challenge("AC3.1: vercel.json rewrites structure validation", async () => {
    const fs = await import("node:fs/promises");
    const vercelConfig = JSON.parse(await fs.readFile("../frontend/vercel.json", "utf-8"));
    assert.ok(Array.isArray(vercelConfig.rewrites));
    const apiRewrite = vercelConfig.rewrites.find((r) => r.source === "/api/(.*)");
    assert.ok(apiRewrite, "Must contain rewrite rule for /api/(.*)");
    assert.ok(apiRewrite.destination.includes("railway.app/api/$1"));

    const uploadsRewrite = vercelConfig.rewrites.find((r) => r.source === "/uploads/(.*)");
    assert.ok(uploadsRewrite, "Must contain rewrite rule for /uploads/(.*)");

    const spaRewrite = vercelConfig.rewrites.find((r) => r.source === "/(.*)");
    assert.ok(spaRewrite, "Must contain SPA rewrite rule for /(.*)");
    assert.strictEqual(spaRewrite.destination, "/index.html");

    const apiIdx = vercelConfig.rewrites.indexOf(apiRewrite);
    const spaIdx = vercelConfig.rewrites.indexOf(spaRewrite);
    assert.ok(apiIdx < spaIdx, "/api/(.*) rewrite must precede /(.*) SPA rewrite");
  });

  // Clean up test user
  await challenge("AC2.9: Clean up test user via delete-account", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/delete-account`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${validToken}` },
    });
    assert.strictEqual(res.status, 200);
  });

  console.log("\n==================================================");
  console.log(`TOTAL: ${testCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error("Fatal in challenger suite:", err);
  process.exit(1);
});
