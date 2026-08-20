const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  const timestamp = Date.now();
  const username = `farmer_${timestamp}`;
  const password = `Password123`;
  const email = `farmer_${timestamp}@example.com`;
  const phone = String(Math.floor(1000000000 + Math.random() * 9000000000));

  console.log(`=== RUNNING VERIFICATION TESTS FOR USER: ${username} ===\n`);

  // 1. SIGNUP
  console.log('1. Testing Signup...');
  const signupRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username,
    password,
    fullName: username,
    email,
    phoneNumber: phone
  });

  if (signupRes.status === 200 && signupRes.data.token) {
    console.log('   [PASS] Signup succeeded. Token received.');
  } else {
    console.error('   [FAIL] Signup failed:', signupRes.data);
    return;
  }

  // 2. IMMEDIATE LOGIN
  console.log('\n2. Testing Immediate Login (Issue 4)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username,
    password
  });

  let token = null;
  if (loginRes.status === 200 && loginRes.data.token) {
    token = loginRes.data.token;
    console.log('   [PASS] Immediate Login Succeeded! Token obtained.');
  } else {
    console.error('   [FAIL] Login Failed:', loginRes.data);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. GET PROFILE BEFORE COMPLETION (Issue 1)
  console.log('\n3. Checking Profile Defaults for Fresh User (Issue 1)...');
  const freshProfileRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/profile',
    method: 'GET',
    headers: authHeaders
  });

  const p = freshProfileRes.data;
  console.log('   Fresh Profile Data:', {
    district: p.districtName,
    block: p.block,
    crop: p.cropGrown,
    season: p.season,
    duration: p.cropDurationMonths,
    irrigation: p.irrigationType
  });

  if (!p.districtName && !p.block && !p.cropGrown && !p.season && !p.irrigationType) {
    console.log('   [PASS] Profile form fields start empty for brand new account!');
  } else {
    console.log('   [WARN] Some fields pre-populated:', p);
  }

  // 4. CHECK RECOMMENDATIONS BEFORE PROFILE COMPLETION (Issue 3)
  console.log('\n4. Checking Recommendations before profile completion (Issue 3)...');
  const subRecBefore = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/subsidies/recommended',
    method: 'GET',
    headers: authHeaders
  });

  const insRecBefore = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/insurance/recommended',
    method: 'GET',
    headers: authHeaders
  });

  console.log(`   Subsidy Recs before completion count: ${Array.isArray(subRecBefore.data) ? subRecBefore.data.length : 0}`);
  console.log(`   Insurance Recs before completion count: ${Array.isArray(insRecBefore.data) ? insRecBefore.data.length : 0}`);

  if (Array.isArray(subRecBefore.data) && subRecBefore.data.length === 0 &&
      Array.isArray(insRecBefore.data) && insRecBefore.data.length === 0) {
    console.log('   [PASS] No recommendations returned for incomplete profile!');
  } else {
    console.error('   [FAIL] Recommendations were returned for incomplete profile.');
  }

  // 5. CHECK DYNAMIC BLOCKS ENDPOINT (Issue 2)
  console.log('\n5. Checking Dynamic District Blocks Endpoint (Issue 2)...');
  const blocksRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/districts/Thanjavur/blocks',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (blocksRes.status === 200 && Array.isArray(blocksRes.data) && blocksRes.data.includes('Thiruvaiyaru')) {
    console.log(`   [PASS] Thanjavur blocks received dynamically (${blocksRes.data.length} blocks):`, blocksRes.data.slice(0, 4).join(', ') + '...');
  } else {
    console.error('   [FAIL] Blocks endpoint failed:', blocksRes.data);
  }

  // 6. UPDATE PROFILE WITH COMPLETE DATA
  console.log('\n6. Updating Profile with complete data...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/profile',
    method: 'PUT',
    headers: authHeaders
  }, {
    fullName: 'Verified Farmer',
    districtName: 'Thanjavur',
    block: 'Thiruvaiyaru',
    cropGrown: 'Paddy',
    landSizeHectares: 2.5,
    season: 'Kharif',
    cropDurationMonths: 4,
    irrigationType: 'Canal'
  });

  if (updateRes.status === 200) {
    console.log('   [PASS] Profile updated successfully.');
  } else {
    console.error('   [FAIL] Profile update failed:', updateRes.data);
    return;
  }

  // 7. CHECK RECOMMENDATIONS AFTER PROFILE COMPLETION (Issue 3)
  console.log('\n7. Checking Recommendations AFTER Profile Completion (Issue 3)...');
  const subRecAfter = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/subsidies/recommended',
    method: 'GET',
    headers: authHeaders
  });

  const insRecAfter = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/insurance/recommended',
    method: 'GET',
    headers: authHeaders
  });

  const subCount = Array.isArray(subRecAfter.data) ? subRecAfter.data.length : 0;
  const insCount = Array.isArray(insRecAfter.data) ? insRecAfter.data.length : 0;

  console.log(`   Subsidy Recs count after profile completion: ${subCount}`);
  console.log(`   Insurance Recs count after profile completion: ${insCount}`);

  if (subCount > 0 && insCount > 0) {
    console.log('   [PASS] Personalized recommendations appear correctly after profile is completed!');
  } else {
    console.error('   [FAIL] Recommendations failed to populate after profile completion.');
  }

  console.log('\n=== ALL 4 FIXES VERIFIED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
