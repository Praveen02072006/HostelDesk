export {};

async function runTest() {
  try {
    console.log("1. Logging in as praveen.raj@saveetha.ac.in...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'praveen.raj@saveetha.ac.in',
        password: 'Student@123'
      })
    });

    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const { accessToken, user } = loginData.data;
    console.log("Login user object:", user);
    console.log("Access token length:", accessToken.length);

    console.log("\n2. Querying profile with the received token...");
    const profileRes = await fetch('http://localhost:5000/api/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profileData: any = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(`Profile query failed: ${JSON.stringify(profileData)}`);
    }

    console.log("Profile query response (profile data):", profileData.data.profile);

  } catch (error: any) {
    console.error("Test failed:", error.message);
  }
}

runTest();
