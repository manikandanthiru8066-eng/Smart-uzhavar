const BASE_URL = 'http://localhost:8080';
const INSURANCE_URL = 'http://localhost:8081';

const testFarmer = {
  username: 'rich_recs_' + Date.now(),
  password: 'Password123!',
  fullName: 'Richer Recommendations Tester',
  email: 'rich_' + Date.now() + '@example.com',
  phoneNumber: String(Math.floor(6000000000 + Math.random() * 3999999999)),
};

let token = '';
let crop1Id = null;
let crop2Id = null;

async function apiRequest(url, method = 'GET', body = null, authToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('   RICHER RECOMMENDATIONS & MATCH REASONS E2E TEST  ');
  console.log('====================================================\n');

  let results = {
    step1_signup: false,
    step2_crop1Added: false,
    step3_crop2Added: false,
    step4_subsidyMatchReasons: false,
    step5_insuranceMatchReasons: false,
  };

  try {
    // ---------------------------------------------------------
    // STEP 1: Signup & Token Acquisition
    // ---------------------------------------------------------
    console.log('▶ [STEP 1] Signup new farmer account...');
    const signupRes = await apiRequest(`${BASE_URL}/api/auth/signup`, 'POST', testFarmer);
    if (signupRes.status !== 200 || !signupRes.data.token) {
      throw new Error('Signup failed: ' + JSON.stringify(signupRes.data));
    }
    token = signupRes.data.token;
    results.step1_signup = true;
    console.log('  ✔ Signup successful. JWT Token acquired.');

    // ---------------------------------------------------------
    // STEP 2: Add Crop Profile 1 (Paddy, Thanjavur, Kharif, Canal)
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 2] Adding Crop Profile 1 (Paddy, Thanjavur, Kharif, Canal)...');
    const crop1Payload = {
      cropGrown: 'Paddy',
      districtName: 'Thanjavur',
      block: 'Thiruvaiyaru',
      landSizeAcres: 2.5,
      irrigationType: 'Canal',
      cropDurationMonths: 4,
      season: 'Kharif',
    };
    const c1Res = await apiRequest(`${BASE_URL}/api/profile/crops`, 'POST', crop1Payload, token);
    crop1Id = c1Res.data.crops[0].id;
    results.step2_crop1Added = true;
    console.log(`  ✔ Crop Profile 1 created with ID: ${crop1Id}`);

    // ---------------------------------------------------------
    // STEP 3: Add Crop Profile 2 (Cotton, Erode, Rabi, Borewell)
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 3] Adding Crop Profile 2 (Cotton, Erode, Rabi, Borewell)...');
    const crop2Payload = {
      cropGrown: 'Cotton',
      districtName: 'Erode',
      block: 'Erode Central',
      landSizeAcres: 4.5,
      irrigationType: 'Borewell',
      cropDurationMonths: 6,
      season: 'Rabi',
    };
    const c2Res = await apiRequest(`${BASE_URL}/api/profile/crops`, 'POST', crop2Payload, token);
    crop2Id = c2Res.data.crops.find((c) => c.cropGrown === 'Cotton').id;
    results.step3_crop2Added = true;
    console.log(`  ✔ Crop Profile 2 created with ID: ${crop2Id}`);

    // ---------------------------------------------------------
    // STEP 4: Test Subsidy Weighted Scoring & matchReasons
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 4] Testing Subsidy recommendations for Crop Profile 1 (Paddy)...');
    const sub1Res = await apiRequest(`${BASE_URL}/api/subsidies/recommended?cropProfileId=${crop1Id}`, 'GET', null, token);
    const subRecs = sub1Res.data;

    console.log(`  Received ${subRecs.length} recommended subsidy schemes.`);
    if (subRecs.length > 0) {
      const topScheme = subRecs[0];
      console.log('  Top Scheme Match:', {
        name: topScheme.name,
        matchScore: topScheme.matchScore,
        matchReasons: topScheme.matchReasons,
      });

      const isSorted = subRecs.every((s, i) => i === 0 || subRecs[i - 1].matchScore >= s.matchScore);
      const hasReasons = Array.isArray(topScheme.matchReasons) && topScheme.matchReasons.length > 0;

      if (isSorted && hasReasons) {
        results.step4_subsidyMatchReasons = true;
        console.log('  ✔ [PASS] Subsidy match scores sorted descending & matchReasons correctly returned!');
      }
    }

    // ---------------------------------------------------------
    // STEP 5: Test Insurance Weighted Scoring & matchReasons
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 5] Testing Insurance recommendations for Crop Profile 2 (Cotton)...');
    const ins2Res = await apiRequest(`${INSURANCE_URL}/api/insurance/recommended?cropProfileId=${crop2Id}`, 'GET', null, token);
    const insRecs = ins2Res.data;

    console.log(`  Received ${insRecs.length} recommended insurance schemes.`);
    if (insRecs.length > 0) {
      const topIns = insRecs[0];
      console.log('  Top Insurance Match:', {
        name: topIns.name,
        matchScore: topIns.matchScore,
        matchReasons: topIns.matchReasons,
      });

      const isSorted = insRecs.every((s, i) => i === 0 || insRecs[i - 1].matchScore >= s.matchScore);
      const hasReasons = Array.isArray(topIns.matchReasons) && topIns.matchReasons.length > 0;

      if (isSorted && hasReasons) {
        results.step5_insuranceMatchReasons = true;
        console.log('  ✔ [PASS] Insurance match scores sorted descending & matchReasons correctly returned!');
      }
    }
  } catch (err) {
    console.error('❌ Test Error:', err.message);
  }

  console.log('\n====================================================');
  console.log('             FINAL VERIFICATION REPORT              ');
  console.log('====================================================');
  console.log(` 1. Account Signup                     : ${results.step1_signup ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 2. Crop Profile 1 (Paddy) Added       : ${results.step2_crop1Added ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 3. Crop Profile 2 (Cotton) Added      : ${results.step3_crop2Added ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 4. Subsidy Match Reasons & Ranking     : ${results.step4_subsidyMatchReasons ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 5. Insurance Match Reasons & Ranking   : ${results.step5_insuranceMatchReasons ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log('====================================================');
}

runE2ETests();
