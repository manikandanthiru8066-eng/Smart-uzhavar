const BASE_URL = 'http://localhost:8080';
const INSURANCE_URL = 'http://localhost:8081';

const testFarmer = {
  username: 'hierarchy_' + Date.now(),
  password: 'Password123!',
  fullName: 'Taluk Block Hierarchy Tester',
  email: 'hierarchy_' + Date.now() + '@example.com',
  phoneNumber: String(Math.floor(6000000000 + Math.random() * 3999999999)),
};

let token = '';

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
  console.log('  TALUK/BLOCK HIERARCHY & CROP STATS E2E TEST       ');
  console.log('====================================================\n');

  let results = {
    step1_taluksApi: false,
    step2_blocksApi: false,
    step3_cropStatsApi: false,
    step4_signup: false,
    step5_profileCascadingSave: false,
    step6_recommendationsIntact: false,
  };

  try {
    // ---------------------------------------------------------
    // STEP 1: Test GET /api/districts/name/Thanjavur/taluks
    // ---------------------------------------------------------
    console.log('▶ [STEP 1] Fetching Taluks for district "Thanjavur"...');
    const taluksRes = await apiRequest(`${BASE_URL}/api/districts/name/Thanjavur/taluks`);
    if (taluksRes.status === 200 && Array.isArray(taluksRes.data) && taluksRes.data.length > 0) {
      const thiruvaiyaruTaluk = taluksRes.data.find(t => t.name === 'Thiruvaiyaru');
      if (thiruvaiyaruTaluk) {
        results.step1_taluksApi = true;
        console.log(`  ✔ [PASS] Found ${taluksRes.data.length} Taluks. "Thiruvaiyaru" Taluk ID: ${thiruvaiyaruTaluk.id}`);

        // ---------------------------------------------------------
        // STEP 2: Test GET /api/taluks/{talukId}/blocks
        // ---------------------------------------------------------
        console.log(`\n▶ [STEP 2] Fetching Blocks for Taluk ID ${thiruvaiyaruTaluk.id} ("Thiruvaiyaru")...`);
        const blocksRes = await apiRequest(`${BASE_URL}/api/taluks/${thiruvaiyaruTaluk.id}/blocks`);
        if (blocksRes.status === 200 && Array.isArray(blocksRes.data) && blocksRes.data.length > 0) {
          results.step2_blocksApi = true;
          console.log(`  ✔ [PASS] Found ${blocksRes.data.length} Blocks:`, blocksRes.data.map(b => b.name).join(', '));
        }
      }
    }

    // ---------------------------------------------------------
    // STEP 3: Test GET /api/districts/name/Thanjavur/crop-stats
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 3] Fetching Crop Statistics for district "Thanjavur"...');
    const statsRes = await apiRequest(`${BASE_URL}/api/districts/name/Thanjavur/crop-stats`);
    if (statsRes.status === 200 && Array.isArray(statsRes.data) && statsRes.data.length > 0) {
      results.step3_cropStatsApi = true;
      console.log(`  ✔ [PASS] Found ${statsRes.data.length} Crop Yield Stat records:`);
      statsRes.data.forEach(s => {
        console.log(`     - ${s.crop} (${s.season}): Yield ${s.yieldKgPerHa} kg/ha | Area ${s.areaHectares} Ha`);
      });
    }

    // ---------------------------------------------------------
    // STEP 4: Signup & Acquire Token
    // ---------------------------------------------------------
    console.log('\n▶ [STEP 4] Signup new farmer account...');
    const signupRes = await apiRequest(`${BASE_URL}/api/auth/signup`, 'POST', testFarmer);
    if (signupRes.status === 200 && signupRes.data.token) {
      token = signupRes.data.token;
      results.step4_signup = true;
      console.log('  ✔ Signup successful. JWT Token acquired.');
    }

    // ---------------------------------------------------------
    // STEP 5: Create Crop Profile with Cascading Taluk & Block
    // ---------------------------------------------------------
    if (token) {
      console.log('\n▶ [STEP 5] Saving Crop Profile with real Taluk & Block dropdown selections...');
      const cropPayload = {
        cropGrown: 'Paddy',
        districtName: 'Thanjavur',
        talukName: 'Thiruvaiyaru',
        block: 'Thiruvaiyaru',
        landSizeAcres: 3.5,
        irrigationType: 'Canal',
        cropDurationMonths: 4,
        season: 'Kharif',
      };
      const profileRes = await apiRequest(`${BASE_URL}/api/profile/crops`, 'POST', cropPayload, token);
      if (profileRes.status === 200 && Array.isArray(profileRes.data.crops) && profileRes.data.crops.length > 0) {
        const savedCrop = profileRes.data.crops[0];
        if (savedCrop.districtName === 'Thanjavur' && savedCrop.block === 'Thiruvaiyaru') {
          results.step5_profileCascadingSave = true;
          console.log('  ✔ [PASS] Profile saved with District: Thanjavur, Taluk: Thiruvaiyaru, Block: Thiruvaiyaru!');
        }
      }

      // ---------------------------------------------------------
      // STEP 6: Verify Subsidy & Insurance Recommendations Intact
      // ---------------------------------------------------------
      console.log('\n▶ [STEP 6] Testing Subsidy & Insurance Recommendations...');
      const subRes = await apiRequest(`${BASE_URL}/api/subsidies/recommended`, 'GET', null, token);
      const insRes = await apiRequest(`${INSURANCE_URL}/api/insurance/recommended`, 'GET', null, token);

      if (subRes.status === 200 && insRes.status === 200) {
        results.step6_recommendationsIntact = true;
        console.log(`  ✔ [PASS] Received ${subRes.data.length} Subsidies & ${insRes.data.length} Insurance recommendations without breaking!`);
      }
    }
  } catch (err) {
    console.error('❌ Test Error:', err.message);
  }

  console.log('\n====================================================');
  console.log('             FINAL VERIFICATION REPORT              ');
  console.log('====================================================');
  console.log(` 1. GET /api/districts/{id}/taluks API : ${results.step1_taluksApi ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 2. GET /api/taluks/{id}/blocks API   : ${results.step2_blocksApi ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 3. GET /api/districts/{id}/crop-stats : ${results.step3_cropStatsApi ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 4. Farmer Signup                      : ${results.step4_signup ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 5. Cascading Profile Save & Persist   : ${results.step5_profileCascadingSave ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log(` 6. Recommendations System Intact      : ${results.step6_recommendationsIntact ? 'PASS ✔' : 'FAIL ❌'}`);
  console.log('====================================================');
}

runE2ETests();
