const https = require("https");

const testUrls = [
  "https://tntagrisnet.tn.gov.in",
  "https://www.tnagrisnet.tn.gov.in",
  "https://pmkisan.gov.in",
  "https://agrimachinery.nic.in",
  "https://pmksy.gov.in",
  "https://nfsm.gov.in",
  "https://soilhealth.dac.gov.in",
  "https://rkvy.nic.in",
  "https://jaivikkheti.in",
  "https://nbm.nic.in"
];

let pending = testUrls.length;

testUrls.forEach(url => {
  try {
    const req = https.get(url, { timeout: 8000, rejectUnauthorized: false }, res => {
      console.log(`[STATUS] ${url} -> HTTP ${res.statusCode}`);
      if (--pending === 0) process.exit(0);
    });
    req.on("error", err => {
      console.log(`[FAILED] ${url} -> ERROR: ${err.code || err.message}`);
      if (--pending === 0) process.exit(0);
    });
    req.on("timeout", () => {
      req.destroy();
      console.log(`[TIMEOUT] ${url} -> Timed out`);
      if (--pending === 0) process.exit(0);
    });
  } catch (e) {
    console.log(`[EXCEPTION] ${url} -> EXCEPTION: ${e.message}`);
    if (--pending === 0) process.exit(0);
  }
});
