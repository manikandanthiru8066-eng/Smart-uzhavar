const http = require('http');

function postJson(url, body, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runRealtimeTest() {
  console.log('================================================================');
  console.log('  TESTING REAL-TIME MACHINERY BOOKING & BLOCK NOTIFICATIONS     ');
  console.log('================================================================\n');

  const ts = Date.now().toString().slice(-5);

  // 1. Authenticate Account A (Kavitha)
  console.log('Step 1: Register Account A (kavitha)...');
  const userA = 'kavitha_' + ts;
  const authA = await postJson('http://localhost:8080/api/auth/signup', {
    username: userA,
    password: 'Password123',
    fullName: 'Kavitha S.',
    phoneNumber: '9876' + Math.floor(100000 + Math.random() * 900000),
    districtName: 'Thanjavur',
    talukName: 'Thiruvaiyaru',
    block: 'Thiruvaiyaru',
    cropGrown: 'Paddy',
    season: 'Kharif',
    landSizeAcres: 3.5,
  });

  const tokenA = authA.data?.token || authA.data?.accessToken;
  console.log(`Account A registered & token obtained: username=${authA.data?.username}, token=${tokenA ? 'VALID' : 'MISSING'}`);

  // 2. Authenticate Account B (Manikandan)
  console.log('\nStep 2: Register Account B (manikandan)...');
  const userB = 'mani_' + ts;
  const authB = await postJson('http://localhost:8080/api/auth/signup', {
    username: userB,
    password: 'Password123',
    fullName: 'Manikandan T.',
    phoneNumber: '9875' + Math.floor(100000 + Math.random() * 900000),
    districtName: 'Thanjavur',
    talukName: 'Thiruvaiyaru',
    block: 'Thiruvaiyaru',
    cropGrown: 'Paddy',
    season: 'Kharif',
    landSizeAcres: 2.0,
  });

  const tokenB = authB.data?.token || authB.data?.accessToken;
  console.log(`Account B registered & token obtained: username=${authB.data?.username}, token=${tokenB ? 'VALID' : 'MISSING'}`);

  // 3. Account A books a Tractor in Thiruvaiyaru block
  console.log('\nStep 3: Account A creates machinery booking request in Thiruvaiyaru block...');
  const bookingReq = await postJson('http://localhost:8081/api/machinery/request', {
    machineType: 'Tractor',
    requiredDate: '2026-08-28',
    village: 'Kondiyur',
    acres: 3.5,
    district: 'Thanjavur',
    block: 'Thiruvaiyaru',
  }, tokenA);

  console.log('Booking response status:', bookingReq.status);
  console.log('Created booking:', bookingReq.data);

  // 4. Account B polls GET /api/machinery/nearby-activity?block=Thiruvaiyaru
  console.log('\nStep 4: Account B polls nearby activity in Thiruvaiyaru block...');
  const pollB = await getJson('http://localhost:8081/api/machinery/nearby-activity?block=Thiruvaiyaru', tokenB);
  console.log('Account B received activities count:', pollB.data.length);
  console.log('Account B sees:', pollB.data);

  // Verify Account B sees Account A's booking
  const foundAInB = pollB.data.find(item => item.id === bookingReq.data.id);
  if (foundAInB) {
    console.log(`\n✔ SUCCESS: Account B detected Account A's booking!`);
    console.log(`  Toast Notification Triggered: "${foundAInB.farmerName} just booked a ${foundAInB.machineType} in ${foundAInB.block} — pool together?"`);
  } else {
    console.error(`\n❌ FAILURE: Account B did not see Account A's booking.`);
    process.exit(1);
  }

  // 5. Account A polls GET /api/machinery/nearby-activity?block=Thiruvaiyaru (Self-exclusion test)
  console.log('\nStep 5: Account A polls nearby activity in Thiruvaiyaru block (Self-exclusion test)...');
  const pollA = await getJson('http://localhost:8081/api/machinery/nearby-activity?block=Thiruvaiyaru', tokenA);
  const foundAInA = pollA.data.find(item => item.id === bookingReq.data.id);

  if (!foundAInA) {
    console.log(`✔ SUCCESS: Account A's own booking is properly EXCLUDED from Account A's notifications!`);
  } else {
    console.error(`❌ FAILURE: Account A's own booking appeared in Account A's notifications.`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('  ✔ ALL REAL-TIME BLOCK MACHINERY POOLING TESTS PASSED (100%)!  ');
  console.log('================================================================\n');
}

runRealtimeTest().catch(console.error);
