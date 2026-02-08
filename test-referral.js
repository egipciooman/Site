
async function testReferral() {
  const API_URL = 'http://localhost:5000/api';
  console.log("--- Starting Referral Test ---");

  try {
    // 1. Create a Referrer (User A)
    const userAResponse = await fetch(`${API_URL}/game/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Referrer_' + Math.floor(Math.random() * 1000) })
    });
    
    if (!userAResponse.ok) {
      const text = await userAResponse.text();
      console.log("Failed to create user A:", text);
      return;
    }
    
    const userA = await userAResponse.json();
    console.log(`User A (Referrer) created: ${userA.username}, ID: ${userA.id}, RefCode: ${userA.referralCode}`);

    // 2. Create a Referred User (User B) using User A's ID
    const userBResponse = await fetch(`${API_URL}/game/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'Friend_' + Math.floor(Math.random() * 1000),
        referralCode: String(userA.id)
      })
    });
    
    if (!userBResponse.ok) {
      const text = await userBResponse.text();
      console.log("Failed to create user B:", text);
      return;
    }
    
    const userB = await userBResponse.json();
    console.log(`User B (Friend) created: ${userB.username}, ID: ${userB.id}, ReferredBy: ${userB.referredBy}`);

    if (userB.referredBy === userA.id) {
      console.log("✅ SUCCESS: User B is correctly linked to User A's ID!");
    } else {
      console.log("❌ FAILED: User B is NOT linked to User A.");
    }
  } catch (err) {
    console.error("Test error:", err.message);
  }

  console.log("--- Test Finished ---");
}

testReferral();
