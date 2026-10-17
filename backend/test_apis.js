import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function runStep(name, testFn) {
  totalTests++;
  process.stdout.write(`  [TEST ${totalTests}] ${name} ... `);
  const start = performance.now();
  try {
    await testFn();
    const duration = (performance.now() - start).toFixed(1);
    passedTests++;
    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    failedTests++;
    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    failures.push({ name, error: err });
  }
}

// Helper to extract JWT cookie from response headers
function extractJwtCookie(headers) {
  const setCookie = headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/jwt=([^;]+)/);
    if (match) return `jwt=${match[1]}`;
  }
  return "";
}

async function runSuite() {
  console.log("==================================================");
  console.log("       OBJ CHAT BACKEND API TEST SUITE            ");
  console.log("==================================================");
  console.log(`Target Base URL: ${BASE_URL}\n`);

  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  const emailA = `usera_${timestamp}_${rand}@example.com`;
  const emailB = `userb_${timestamp}_${rand}@example.com`;
  const password = "Password123!";

  let tokenA = "";
  let tokenB = "";
  let cookieA = "";
  let cookieB = "";
  let userA_Id = "";
  let userB_Id = "";
  let sentMessageText = "";
  let sentMessageId = "";

  // =========================================================================
  // a. CORS Preflight
  // =========================================================================
  await runStep("a. CORS Preflight: OPTIONS /api/auth/login with Origin & Access-Control-Request-Method", async () => {
    const origin = "http://localhost:5173";
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    assert.strictEqual(res.status, 200, `Expected status 200 on OPTIONS preflight, got ${res.status}`);

    const allowOrigin = res.headers.get("access-control-allow-origin");
    assert.strictEqual(allowOrigin, origin, `Expected access-control-allow-origin to be "${origin}", got "${allowOrigin}"`);

    const allowCredentials = res.headers.get("access-control-allow-credentials");
    assert.strictEqual(allowCredentials, "true", `Expected access-control-allow-credentials to be "true", got "${allowCredentials}"`);

    const allowMethods = res.headers.get("access-control-allow-methods") || "";
    assert.ok(allowMethods.includes("POST"), `Expected access-control-allow-methods to include POST, got "${allowMethods}"`);
  });

  // =========================================================================
  // b. User Registration (User A and User B)
  // =========================================================================
  await runStep("b1. User Registration: Register User A with unique timestamped email", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, password, name: "User A" }),
    });

    assert.ok(res.status === 200 || res.status === 201, `Expected status 200/201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);

    const cookie = extractJwtCookie(res.headers);
    assert.ok(data.token || cookie, "Token must be present in response body or set-cookie");
    if (data.token) tokenA = data.token;
    if (cookie) cookieA = cookie;
  });

  await runStep("b2. User Registration: Register User B with unique timestamped email", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password, name: "User B" }),
    });

    assert.ok(res.status === 200 || res.status === 201, `Expected status 200/201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);

    const cookie = extractJwtCookie(res.headers);
    assert.ok(data.token || cookie, "Token must be present in response body or set-cookie");
    if (data.token) tokenB = data.token;
    if (cookie) cookieB = cookie;
  });

  // =========================================================================
  // c. User Login (User A and User B)
  // =========================================================================
  await runStep("c1. User Login: Login User A and capture Bearer token & cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, password }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(typeof data.token === "string" && data.token.length > 0, "Expected non-empty string token");
    tokenA = data.token;

    const cookie = extractJwtCookie(res.headers);
    assert.ok(cookie.startsWith("jwt="), "Expected set-cookie header with jwt cookie");
    cookieA = cookie;
  });

  await runStep("c2. User Login: Login User B and capture Bearer token & cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(typeof data.token === "string" && data.token.length > 0, "Expected non-empty string token");
    tokenB = data.token;

    const cookie = extractJwtCookie(res.headers);
    assert.ok(cookie.startsWith("jwt="), "Expected set-cookie header with jwt cookie");
    cookieB = cookie;
  });

  // =========================================================================
  // d. Dual-Token Authentication (/api/auth/check)
  // =========================================================================
  await runStep("d1. Dual-Token Auth: Authenticate via Cookie: jwt=<token>", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Cookie": cookieA },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const user = await res.json();
    assert.ok(user._id, "User object must contain _id");
    assert.strictEqual(user.email, emailA, `Expected email ${emailA}, got ${user.email}`);
    userA_Id = user._id;
  });

  await runStep("d2. Dual-Token Auth: Authenticate via Authorization: Bearer <token> (no cookie)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer ${tokenA}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const user = await res.json();
    assert.strictEqual(user._id, userA_Id, `Expected user ID ${userA_Id}, got ${user._id}`);
    assert.strictEqual(user.email, emailA, `Expected email ${emailA}, got ${user.email}`);
  });

  await runStep("d3. Dual-Token Auth: Authenticate via lowercase Authorization: bearer <token>", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `bearer ${tokenA}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const user = await res.json();
    assert.strictEqual(user._id, userA_Id, `Expected user ID ${userA_Id}, got ${user._id}`);
  });

  await runStep("d4. Dual-Token Auth: Capture User B identity via Bearer token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer ${tokenB}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const user = await res.json();
    assert.ok(user._id, "User B object must contain _id");
    assert.strictEqual(user.email, emailB, `Expected email ${emailB}, got ${user.email}`);
    userB_Id = user._id;
  });

  await runStep("d5. Dual-Token Auth: Invalid / expired token returns HTTP 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": "Bearer invalid.token.payload" },
    });

    assert.strictEqual(res.status, 401, `Expected status 401 for invalid token, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, false, `Expected success to be false, got ${data.success}`);
  });

  // =========================================================================
  // e. User List (GET /api/message/user)
  // =========================================================================
  await runStep("e. User List: GET /api/message/user with Bearer token contains User B", async () => {
    const res = await fetch(`${BASE_URL}/api/message/user`, {
      headers: { "Authorization": `Bearer ${tokenA}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(Array.isArray(data.user), "Expected data.user to be an array");

    const foundB = data.user.some((u) => u._id === userB_Id);
    assert.ok(foundB, `User list for User A must contain User B (${userB_Id})`);
  });

  // =========================================================================
  // f. Send Message (POST /api/message/send/${userB_Id})
  // =========================================================================
  await runStep("f. Send Message: User A sends message to User B", async () => {
    sentMessageText = `Automated test message from User A to User B [${timestamp}]`;
    const res = await fetch(`${BASE_URL}/api/message/send/${userB_Id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ message: sentMessageText }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(data.newMessage, "Expected newMessage object in response");
    assert.strictEqual(data.newMessage.senderId, userA_Id, "senderId must match userA_Id");
    assert.strictEqual(data.newMessage.receiverId, userB_Id, "receiverId must match userB_Id");
    assert.strictEqual(
      data.newMessage.message || data.newMessage.text,
      sentMessageText,
      "Message content must match sent text"
    );
    sentMessageId = data.newMessage._id;
  });

  // =========================================================================
  // g. Get Conversations (GET /api/message/${userA_Id})
  // =========================================================================
  await runStep("g. Get Conversations: User B queries conversation with User A (FIX: use userA_Id)", async () => {
    // Note: User B is querying conversation with User A -> URL must be /api/message/${userA_Id}
    const res = await fetch(`${BASE_URL}/api/message/${userA_Id}`, {
      headers: { "Authorization": `Bearer ${tokenB}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(Array.isArray(data.conversations), "Expected conversations array");
    assert.ok(data.conversations.length > 0, "Conversations array must not be empty");

    const foundMsg = data.conversations.find(
      (m) => m._id === sentMessageId || m.message === sentMessageText || m.text === sentMessageText
    );
    assert.ok(foundMsg, "Conversation must contain the sent test message");
  });

  // =========================================================================
  // h. Mark Seen (PUT /api/message/seen/${userA_Id})
  // =========================================================================
  await runStep("h. Mark Seen: User B marks messages from User A as seen", async () => {
    const res = await fetch(`${BASE_URL}/api/message/seen/${userA_Id}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${tokenB}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
  });

  // =========================================================================
  // i. Profile Update (PUT /api/auth/update-profile)
  // =========================================================================
  await runStep("i. Profile Update: User A updates profile with image URL & metadata", async () => {
    const updatedImage = "https://images.example.com/profiles/user_a.png";
    const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        pimage: updatedImage,
        name: "User A Updated",
        bio: "Updated bio for automated testing",
      }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);
    assert.ok(data.user, "Expected updated user object in response");
    assert.strictEqual(data.user.pimage, updatedImage, `Expected pimage to match ${updatedImage}`);
  });

  // =========================================================================
  // j. Delete Chat (DELETE /api/message/delete/${userB_Id})
  // =========================================================================
  await runStep("j. Delete Chat: User A deletes chat history with User B", async () => {
    const res = await fetch(`${BASE_URL}/api/message/delete/${userB_Id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenA}` },
    });

    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);

    // Verify conversation between User A and User B is now empty
    const verifyRes = await fetch(`${BASE_URL}/api/message/${userB_Id}`, {
      headers: { "Authorization": `Bearer ${tokenA}` },
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.conversations.length, 0, "Conversations must be empty after deletion");
  });

  // =========================================================================
  // k. Account Deletion (DELETE /api/auth/delete-account or /delete)
  // =========================================================================
  await runStep("k. Account Deletion: User B deletes account & verifies cookie clearance", async () => {
    // Attempt standard /api/auth/delete-account route, fallback to /api/auth/delete if mounted
    let res = await fetch(`${BASE_URL}/api/auth/delete-account`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tokenB}`,
        "Cookie": cookieB,
      },
    });

    if (res.status === 404) {
      res = await fetch(`${BASE_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokenB}`,
          "Cookie": cookieB,
        },
      });
    }

    assert.strictEqual(res.status, 200, `Expected status 200 on delete account, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true, `Expected success to be true, got ${data.success}`);

    // Verify set-cookie clears the JWT cookie
    const setCookie = res.headers.get("set-cookie") || "";
    const isCleared =
      setCookie.includes("jwt=;") ||
      setCookie.includes("Expires=Thu, 01 Jan 1970") ||
      setCookie.includes("Max-Age=0") ||
      /jwt=[^;]*expires/i.test(setCookie);
    assert.ok(isCleared, `Expected set-cookie to clear jwt cookie, got "${setCookie}"`);

    // Verify User B cannot authenticate any longer
    const checkRes = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Authorization": `Bearer ${tokenB}` },
    });
    assert.strictEqual(checkRes.status, 401, `Expected 401 when accessing auth check after deletion, got ${checkRes.status}`);
  });

  // =========================================================================
  // Summary & Process Exit
  // =========================================================================
  console.log("\n==================================================");
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log("==================================================");

  if (failedTests > 0) {
    console.error("\n\x1b[31m[FAILED] The following test steps failed:\x1b[0m");
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.name}`);
      console.error(`     Stack: ${f.error.stack || f.error.message}`);
    });
    process.exit(1);
  } else {
    console.log("\n\x1b[32m[SUCCESS] All API tests passed with strict assertions!\x1b[0m\n");
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("Unhandled fatal exception in test suite runner:", err);
  process.exit(1);
});
