const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  const timestamp = Date.now();
  const username = `testfarmer_${timestamp}`;
  const password = `TestPass@${timestamp}`;
  const email = `farmer_${timestamp}@example.com`;
  const phoneNumber = `${Math.floor(6000000000 + Math.random() * 3999999999)}`;

  const fullName = `MultiCrop Farmer ${timestamp}`;

  console.log('=== Step 1: Registering Farmer ===');
  const signupRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username,
    password,
    fullName,
    email,
    phoneNumber,
    districtName: 'Thanjavur',
    cropGrown: 'Paddy',
    landSizeHectares: 1.0
  });

  console.log('Signup status:', signupRes.status);
  if (signupRes.status !== 200) {
    console.error('Signup failed:', signupRes);
    process.exit(1);
  }

  const token = signupRes.data.token;
  console.log('Token acquired successfully.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('\n=== Step 2: Fetching Initial Profile ===');
  const getProfile1 = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/profile',
    method: 'GET',
    headers: authHeaders
  });

  console.log('Initial Profile:', JSON.stringify(getProfile1.data, null, 2));

  console.log('\n=== Step 3: Updating Profile with 2 Crops ("Add Crops") ===');
  const updatePayload = {
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    crops: [
      {
        cropGrown: 'Paddy',
        districtName: 'Thanjavur',
        block: 'Thanjavur South',
        landSizeAcres: 2.5,
        irrigationType: 'Canal',
        cropDurationMonths: 4,
        season: 'Kharif'
      },
      {
        cropGrown: 'Sugarcane',
        districtName: 'Erode',
        block: 'Erode Central',
        landSizeAcres: 1.5,
        irrigationType: 'Drip/Sprinkler',
        cropDurationMonths: 12,
        season: 'Zaid'
      }
    ]
  };

  const updateRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/profile',
    method: 'PUT',
    headers: authHeaders
  }, updatePayload);

  console.log('Update Status:', updateRes.status);
  console.log('Updated Profile Response:', JSON.stringify(updateRes.data, null, 2));

  console.log('\n=== Step 4: Verification ===');
  const getProfile2 = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/profile',
    method: 'GET',
    headers: authHeaders
  });

  const p = getProfile2.data;
  console.log('Verified Profile Details:');
  console.log('  Username:', p.username);
  console.log('  FullName:', p.fullName);
  console.log('  Email:', p.email);
  console.log('  Phone:', p.phoneNumber);
  console.log('  Crops Count:', p.crops ? p.crops.length : 0);

  if (p.username === username && p.fullName === fullName && p.email === email && p.phoneNumber === phoneNumber) {
    console.log('  [PASS] Farmer registered personal details (name, email, phone, username) remained intact!');
  } else {
    console.error('  [FAIL] Registered details changed unexpectedly!');
  }

  if (p.crops && p.crops.length === 2) {
    console.log('  [PASS] 2 crops registered successfully!');
    console.log('  Crop 1:', p.crops[0].cropGrown, '| District:', p.crops[0].districtName, '| Block:', p.crops[0].block, '| Acres:', p.crops[0].landSizeAcres, '| Irrigation:', p.crops[0].irrigationType, '| Season:', p.crops[0].season);
    console.log('  Crop 2:', p.crops[1].cropGrown, '| District:', p.crops[1].districtName, '| Block:', p.crops[1].block, '| Acres:', p.crops[1].landSizeAcres, '| Irrigation:', p.crops[1].irrigationType, '| Season:', p.crops[1].season);
  } else {
    console.error('  [FAIL] Expected 2 crops, got:', p.crops);
  }

  console.log('\n=== Step 5: Recommendation Matching Check ===');
  const subRecs = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/subsidies/recommended',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`  Subsidy Recommendations count: ${Array.isArray(subRecs.data) ? subRecs.data.length : 0}`);

  const insRecs = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/insurance/recommended',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`  Insurance Recommendations count: ${Array.isArray(insRecs.data) ? insRecs.data.length : 0}`);

  if (Array.isArray(subRecs.data) && subRecs.data.length > 0 && Array.isArray(insRecs.data) && insRecs.data.length > 0) {
    console.log('  [PASS] Multi-crop recommendations working seamlessly!');
  } else {
    console.error('  [FAIL] Recommendations failed to return data.');
  }
}

runTest().catch(console.error);

