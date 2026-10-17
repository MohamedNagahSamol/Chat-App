import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:3000";

// Helper for delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("================================================================================");
  console.log("       EMPIRICAL CHALLENGER: AUTHENTICATION STRESS TEST SUITE");
  console.log("================================================================================");

  // 1. Setup Test Users
  const timestamp = Date.now();
  const userAEmail = `challenger_a_${timestamp}@test.com`;
  const userBEmail = `challenger_b_${timestamp}@test.com`;

  console.log("\n[Setup] Registering User A:", userAEmail);
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userAEmail, password: "Password123!", name: "Challenger User A" }),
  });
  const regAData = await regARes.json();
  if (regARes.status !== 201 || !regAData.token) {
    throw new Error(`Failed to register User A: status=${regARes.status} data=${JSON.stringify(regAData)}`);
  }
  const tokenA = regAData.token;
  const userAId = regAData.user?._id || regAData._id;

  console.log("[Setup] Registering User B:", userBEmail);
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userBEmail, password: "Password123!", name: "Challenger User B" }),
  });
  const regBData = await regBRes.json();
  if (regBRes.status !== 201 || !regBData.token) {
    throw new Error(`Failed to register User B: status=${regBRes.status} data=${JSON.stringify(regBData)}`);
  }
  const tokenB = regBData.token;
  const userBId = regBData.user?._id || regBData._id;

  // Generate an expired token using standard JWT structure
  // Decoded tokenA header and payload
  const [headerB64, payloadB64, sigB64] = tokenA.split(".");
  const payloadA = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  
  // Construct expired payload
  const expiredPayload = { ...payloadA, iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600 };
  const expiredPayloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
  // Sign using known or dummy signature (or if we have secret from env)
  const secretKey = (process.env.JWT_SECRET_KEY || "hbwjhbiqwuihjhhwejjidjjdjkcdjd").trim();
  const expiredJwt = jwt.sign(expiredPayload, secretKey);

  // Tampered token (invalid signature)
  const tamperedJwt = `${headerB64}.${payloadB64}.invalidsignature1234567890`;

  // Valid token for non-existent user
  const nonexistentUserJwt = jwt.sign({ id: "600000000000000000000001" }, secretKey, { expiresIn: "1d" });

  const testCases = [
    // -------------------------------------------------------------
    // Category 1: Scheme Variations
    // -------------------------------------------------------------
    {
      id: "TC-01",
      category: "Scheme Variations",
      name: "Lowercase 'bearer <token>'",
      headers: { Authorization: `bearer ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-02",
      category: "Scheme Variations",
      name: "Uppercase 'BEARER <token>'",
      headers: { Authorization: `BEARER ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-03",
      category: "Scheme Variations",
      name: "Mixed-case 'bEaReR <token>'",
      headers: { Authorization: `bEaReR ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-04",
      category: "Scheme Variations",
      name: "Multiple spaces 'Bearer    <token>'",
      headers: { Authorization: `Bearer    ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-05",
      category: "Scheme Variations",
      name: "Tab separator 'Bearer\\t<token>'",
      headers: { Authorization: `Bearer\t${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-06",
      category: "Scheme Variations",
      name: "Mixed spaces/tabs 'Bearer \\t  <token>'",
      headers: { Authorization: `Bearer \t  ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-07",
      category: "Scheme Variations",
      name: "Surrounding whitespace '   Bearer <token>   '",
      headers: { Authorization: `   Bearer ${tokenA}   ` },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-08",
      category: "Scheme Variations",
      name: "Raw token without Bearer prefix '<token>'",
      headers: { Authorization: tokenA },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },

    // -------------------------------------------------------------
    // Category 2: Header-over-Cookie Precedence
    // -------------------------------------------------------------
    {
      id: "TC-09",
      category: "Precedence",
      name: "Expired cookie + Valid Bearer Header",
      headers: {
        Cookie: `jwt=${expiredJwt}`,
        Authorization: `Bearer ${tokenA}`,
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-10",
      category: "Precedence",
      name: "Corrupt cookie + Valid Bearer Header",
      headers: {
        Cookie: "jwt=this_is_a_corrupted_jwt_cookie",
        Authorization: `Bearer ${tokenA}`,
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-11",
      category: "Precedence",
      name: "User B in Cookie + User A in Header -> Authenticates User A",
      headers: {
        Cookie: `jwt=${tokenB}`,
        Authorization: `Bearer ${tokenA}`,
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail && data._id !== userBId,
    },
    {
      id: "TC-12",
      category: "Precedence",
      name: "Invalid Header Token + Valid Cookie -> HTTP 401 (Header precedence)",
      headers: {
        Cookie: `jwt=${tokenA}`,
        Authorization: `Bearer invalid_header_token`,
      },
      expectedStatus: 401,
      verify: (data) => data.success === false,
    },

    // -------------------------------------------------------------
    // Category 3: Empty Scheme Variations & Fallbacks
    // -------------------------------------------------------------
    {
      id: "TC-13",
      category: "Empty Scheme Fallback",
      name: "'Bearer ' with trailing space + Valid Cookie -> HTTP 200",
      headers: {
        Cookie: `jwt=${tokenA}`,
        Authorization: "Bearer ",
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-14",
      category: "Empty Scheme Fallback",
      name: "'Bearer ' with trailing space + No Cookie -> HTTP 401",
      headers: {
        Authorization: "Bearer ",
      },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-15",
      category: "Empty Scheme Fallback",
      name: "'Bearer' without space + Valid Cookie -> HTTP 200",
      headers: {
        Cookie: `jwt=${tokenA}`,
        Authorization: "Bearer",
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-16",
      category: "Empty Scheme Fallback",
      name: "'Bearer' without space + No Cookie -> HTTP 401",
      headers: {
        Authorization: "Bearer",
      },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-17",
      category: "Empty Scheme Fallback",
      name: "'Bearer     ' (multiple spaces only) + Valid Cookie -> HTTP 200",
      headers: {
        Cookie: `jwt=${tokenA}`,
        Authorization: "Bearer     ",
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-18",
      category: "Empty Scheme Fallback",
      name: "'Bearer     ' (multiple spaces only) + No Cookie -> HTTP 401",
      headers: {
        Authorization: "Bearer     ",
      },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-19",
      category: "Empty Scheme Fallback",
      name: "'Bearer\\t\\t' (tabs only) + Valid Cookie -> HTTP 200",
      headers: {
        Cookie: `jwt=${tokenA}`,
        Authorization: "Bearer\t\t",
      },
      expectedStatus: 200,
      verify: (data) => data.email === userAEmail,
    },
    {
      id: "TC-20",
      category: "Empty Scheme Fallback",
      name: "'Bearer\\t\\t' (tabs only) + No Cookie -> HTTP 401",
      headers: {
        Authorization: "Bearer\t\t",
      },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },

    // -------------------------------------------------------------
    // Category 4: Invalid, Malformed, and Missing Tokens
    // -------------------------------------------------------------
    {
      id: "TC-21",
      category: "Rejections",
      name: "Missing Token (No Header, No Cookie)",
      headers: {},
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-22",
      category: "Rejections",
      name: "Empty String Header Authorization: ''",
      headers: { Authorization: "" },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-23",
      category: "Rejections",
      name: "Whitespace-Only Header Authorization: '    '",
      headers: { Authorization: "    " },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("No token provided"),
    },
    {
      id: "TC-24",
      category: "Rejections",
      name: "Expired JWT Token in Header",
      headers: { Authorization: `Bearer ${expiredJwt}` },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("Invalid or expired token"),
    },
    {
      id: "TC-25",
      category: "Rejections",
      name: "Tampered Signature JWT Token in Header",
      headers: { Authorization: `Bearer ${tamperedJwt}` },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("Invalid or expired token"),
    },
    {
      id: "TC-26",
      category: "Rejections",
      name: "Malformed string 'Bearer not_a_real_jwt'",
      headers: { Authorization: "Bearer not_a_real_jwt" },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("Invalid or expired token"),
    },
    {
      id: "TC-27",
      category: "Rejections",
      name: "Valid JWT with Non-Existent User ID",
      headers: { Authorization: `Bearer ${nonexistentUserJwt}` },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("User not found"),
    },
    {
      id: "TC-28",
      category: "Rejections",
      name: "Expired JWT in Cookie (No Header)",
      headers: { Cookie: `jwt=${expiredJwt}` },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("Invalid or expired token"),
    },
    {
      id: "TC-29",
      category: "Rejections",
      name: "Malformed JWT in Cookie (No Header)",
      headers: { Cookie: "jwt=completely_bogus_jwt" },
      expectedStatus: 401,
      verify: (data) => data.success === false && data.message.includes("Invalid or expired token"),
    },

    // -------------------------------------------------------------
    // Category 5: Multi-Route Verification
    // -------------------------------------------------------------
    {
      id: "TC-30",
      category: "Multi-Route",
      name: "GET /api/message/user with lowercase 'bearer <token>'",
      endpoint: "/api/message/user",
      headers: { Authorization: `bearer ${tokenA}` },
      expectedStatus: 200,
      verify: (data) => Array.isArray(data.user),
    },
    {
      id: "TC-31",
      category: "Multi-Route",
      name: "GET /api/message/user with Expired Cookie + Valid Header",
      endpoint: "/api/message/user",
      headers: {
        Cookie: `jwt=${expiredJwt}`,
        Authorization: `BEARER ${tokenA}`,
      },
      expectedStatus: 200,
      verify: (data) => Array.isArray(data.user),
    },
    {
      id: "TC-32",
      category: "Multi-Route",
      name: "GET /api/message/user with Missing Token -> HTTP 401",
      endpoint: "/api/message/user",
      headers: {},
      expectedStatus: 401,
      verify: (data) => data.success === false,
    },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  console.log("\n======================== EXECUTING TEST SCENARIOS ========================\n");

  for (const tc of testCases) {
    const url = `${BASE_URL}${tc.endpoint || "/api/auth/check"}`;
    try {
      const res = await fetch(url, { headers: tc.headers });
      const status = res.status;
      const data = await res.json().catch(() => ({}));
      const statusOk = status === tc.expectedStatus;
      const verifyOk = !tc.verify || tc.verify(data);
      const testPassed = statusOk && verifyOk;

      if (testPassed) {
        passed++;
        console.log(`[PASS] ${tc.id} (${tc.category}): ${tc.name.padEnd(48)} => HTTP ${status}`);
      } else {
        failed++;
        console.error(`[FAIL] ${tc.id} (${tc.category}): ${tc.name.padEnd(48)} => HTTP ${status} (expected ${tc.expectedStatus})`);
        console.error(`       Response body:`, JSON.stringify(data));
      }

      results.push({
        id: tc.id,
        category: tc.category,
        name: tc.name,
        expectedStatus: tc.expectedStatus,
        actualStatus: status,
        passed: testPassed,
        body: data,
      });
    } catch (err) {
      failed++;
      console.error(`[ERR ] ${tc.id}: ${tc.name} encountered error:`, err.message);
      results.push({
        id: tc.id,
        category: tc.category,
        name: tc.name,
        expectedStatus: tc.expectedStatus,
        actualStatus: "ERROR",
        passed: false,
        error: err.message,
      });
    }
  }

  // -------------------------------------------------------------
  // Category 6: Concurrency / Burst Stress Testing
  // -------------------------------------------------------------
  console.log("\n======================== CONCURRENCY & BURST TESTING ========================\n");
  console.log("Dispatching 60 concurrent requests with randomized headers and cookies...");

  const burstScenarios = [
    { type: "valid_lowercase", headers: { Authorization: `bearer ${tokenA}` }, expect: 200 },
    { type: "valid_uppercase", headers: { Authorization: `BEARER ${tokenA}` }, expect: 200 },
    { type: "valid_tabs", headers: { Authorization: `Bearer\t${tokenA}` }, expect: 200 },
    { type: "valid_spaces", headers: { Authorization: `Bearer    ${tokenA}` }, expect: 200 },
    { type: "cookie_only", headers: { Cookie: `jwt=${tokenA}` }, expect: 200 },
    { type: "precedence_expired_cookie", headers: { Cookie: `jwt=${expiredJwt}`, Authorization: `Bearer ${tokenA}` }, expect: 200 },
    { type: "empty_bearer_with_cookie", headers: { Cookie: `jwt=${tokenA}`, Authorization: "Bearer " }, expect: 200 },
    { type: "missing", headers: {}, expect: 401 },
    { type: "empty_bearer_no_cookie", headers: { Authorization: "Bearer " }, expect: 401 },
    { type: "expired_token", headers: { Authorization: `Bearer ${expiredJwt}` }, expect: 401 },
    { type: "tampered_token", headers: { Authorization: `Bearer ${tamperedJwt}` }, expect: 401 },
    { type: "malformed_string", headers: { Authorization: "Bearer bad_token" }, expect: 401 },
  ];

  const burstPromises = [];
  for (let i = 0; i < 60; i++) {
    const s = burstScenarios[i % burstScenarios.length];
    burstPromises.push(
      fetch(`${BASE_URL}/api/auth/check`, { headers: s.headers })
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          return { reqIndex: i, type: s.type, status: r.status, expect: s.expect, ok: r.status === s.expect };
        })
        .catch((e) => ({ reqIndex: i, type: s.type, status: "ERR", expect: s.expect, ok: false, error: e.message }))
    );
  }

  const burstResults = await Promise.all(burstPromises);
  const burstFailed = burstResults.filter((r) => !r.ok);

  console.log(`Burst Results: ${burstResults.length - burstFailed.length} / ${burstResults.length} passed.`);
  if (burstFailed.length > 0) {
    console.error("Burst Failures:", burstFailed);
  }

  console.log("\n======================== FINAL SUMMARY ========================");
  console.log(`Unit/Scenario Tests: ${passed} PASSED, ${failed} FAILED out of ${testCases.length}`);
  console.log(`Concurrency Burst Tests: ${burstResults.length - burstFailed.length} PASSED, ${burstFailed.length} FAILED out of 60`);

  if (failed > 0) {
    console.log("\n--- DETAILED FAILURES ---");
    const failedTests = results.filter((r) => !r.passed);
    for (const f of failedTests) {
      console.log(`Test ID: ${f.id} (${f.category}) - ${f.name}`);
      console.log(`  Expected HTTP: ${f.expectedStatus}, Got: ${f.actualStatus}`);
      console.log(`  Body: ${JSON.stringify(f.body)}`);
      if (f.error) console.log(`  Error: ${f.error}`);
    }
  }
  console.log("===============================================================");

  if (failed > 0 || burstFailed.length > 0) {
    process.exit(1);
  } else {
    console.log("ALL EMPIRICAL TESTS PASSED SUCCESSFULLY.");
    process.exit(0);
  }
}

run().catch((e) => {
  console.error("Fatal error running test suite:", e);
  process.exit(1);
});
