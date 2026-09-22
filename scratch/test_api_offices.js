const http = require('http');

function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function runTests() {
  console.log('=== TEST 1: Thanjavur / Papanasam (GPS Verified) ===');
  let res1 = await testEndpoint('http://localhost:8080/api/blocks/office?district=Thanjavur&block=Papanasam');
  console.log('Status:', res1.status);
  console.log('Body:', JSON.parse(res1.body));

  console.log('\n=== TEST 2: Cuddalore / Panruti (Address & Phone Verified) ===');
  let res2 = await testEndpoint('http://localhost:8080/api/blocks/office?district=Cuddalore&block=Panruti');
  console.log('Status:', res2.status);
  console.log('Body:', JSON.parse(res2.body));

  console.log('\n=== TEST 3: Tiruvallur / Poonamallee (Unverified Block) ===');
  let res3 = await testEndpoint('http://localhost:8080/api/blocks/office?district=Tiruvallur&block=Poonamallee');
  console.log('Status:', res3.status);
  console.log('Body:', res3.body);

  console.log('\n=== TEST 4: Schemes sourceUrl check ===');
  let res4 = await testEndpoint('http://localhost:8080/api/subsidies');
  console.log('Status:', res4.status);
  const schemes = JSON.parse(res4.body);
  console.log('Schemes count:', schemes.length);
  console.log('Sample scheme sourceUrl:', schemes.slice(0, 3).map(s => ({ name: s.name, sourceUrl: s.sourceUrl })));
}

runTests();
