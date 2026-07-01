const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING API TESTS ===\n");
  
  const emailA = `usera_${Date.now()}@example.com`;
  const emailB = `userb_${Date.now()}@example.com`;
  let cookieA = "";
  let cookieB = "";
  let userA_Id = "";
  let userB_Id = "";

  // Helper to extract JWT cookie
  function getCookie(headers) {
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/jwt=([^;]+)/);
      if (match) return `jwt=${match[1]}`;
    }
    return "";
  }

  // 1. Register User A
  console.log("1. Registering User A...");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, password: "Password123!", name: "User A" })
    });
    const data = await res.json();
    console.log("Register User A Response:", JSON.stringify(data, null, 2));
    cookieA = getCookie(res.headers);
  } catch (err) {
    console.error("Register User A failed:", err.message);
  }

  // 2. Register User B
  console.log("\n2. Registering User B...");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password: "Password123!", name: "User B" })
    });
    const data = await res.json();
    console.log("Register User B Response:", JSON.stringify(data, null, 2));
    cookieB = getCookie(res.headers);
  } catch (err) {
    console.error("Register User B failed:", err.message);
  }

  // 3. Login User A to get correct token/session info
  console.log("\n3. Logging in User A...");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, password: "Password123!" })
    });
    const data = await res.json();
    console.log("Login User A Response:", JSON.stringify(data, null, 2));
    cookieA = getCookie(res.headers);
    
    // Check Auth of User A to get User A's ID
    const checkRes = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Cookie": cookieA }
    });
    const checkData = await checkRes.json();
    userA_Id = checkData._id;
    console.log("User A Check Auth ID:", userA_Id);
  } catch (err) {
    console.error("Login User A failed:", err.message);
  }

  // 4. Login User B to get correct token/session info
  console.log("\n4. Logging in User B...");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password: "Password123!" })
    });
    const data = await res.json();
    console.log("Login User B Response:", JSON.stringify(data, null, 2));
    cookieB = getCookie(res.headers);
    
    // Check Auth of User B to get User B's ID
    const checkRes = await fetch(`${BASE_URL}/api/auth/check`, {
      headers: { "Cookie": cookieB }
    });
    const checkData = await checkRes.json();
    userB_Id = checkData._id;
    console.log("User B Check Auth ID:", userB_Id);
  } catch (err) {
    console.error("Login User B failed:", err.message);
  }

  // Helper to fetch and print details
  async function testEndpoint(name, url, options) {
    console.log(`\n--- Test: ${name} ---`);
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      try {
        const json = JSON.parse(text);
        console.log("JSON Response:", JSON.stringify(json, null, 2));
      } catch (e) {
        console.log("Raw Response (Non-JSON):", text.substring(0, 1000));
      }
    } catch (err) {
      console.error(`${name} request failed:`, err.message);
    }
  }

  // 5. Get Users List for User A (getUser API)
  await testEndpoint(
    "Get Users List (User A)",
    `${BASE_URL}/api/message/user`,
    { headers: { "Cookie": cookieA } }
  );

  // 6. Send Message from User A to User B (sendMessage API)
  await testEndpoint(
    "Send Message (User A -> User B)",
    `${BASE_URL}/api/message/send/${userB_Id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieA
      },
      body: JSON.stringify({ message: "Hello User B! This is a test message." })
    }
  );

  // 7. Get Conversations for User B (getConversations API)
  await testEndpoint(
    "Get Conversations (User B)",
    `${BASE_URL}/api/message/${userB_Id}`,
    { headers: { "Cookie": cookieB } }
  );


  // 8. Mark Message as Seen (seenMessage API)
  await testEndpoint(
    "Mark Seen (with User B)",
    `${BASE_URL}/api/message/seen/${userB_Id}`,
    {
      method: "PUT",
      headers: { "Cookie": cookieA }
    }
  );

  // 9. Delete message / chat (deleteMessage API)
  await testEndpoint(
    "Delete Message / Chat (with User B)",
    `${BASE_URL}/api/message/delete/${userB_Id}`,
    {
      method: "DELETE",
      headers: { "Cookie": cookieA }
    }
  );

  console.log("\n=== API TESTS FINISHED ===");
}

runTests();
