const fs = require("fs");
const officeData = JSON.parse(fs.readFileSync("database/tn_block_office_locations.json", "utf8"));
const hierData = JSON.parse(fs.readFileSync("database/tn_taluk_block_hierarchy.json", "utf8"));

const hierBlockNames = new Set();
for (const d of hierData.districts) {
  for (const t of d.taluks) {
    for (const b of t.blocks) {
      if (b.block) {
        hierBlockNames.add(b.block.toLowerCase().replace(/[^a-z0-9]/g, ''));
      }
    }
  }
}

let matched = 0;
let unmatched = [];
let verifiedMatched = 0;
let verifiedUnmatched = [];

for (const d of officeData.districts) {
  for (const b of d.blocks) {
    const bName = b.block.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hierBlockNames.has(bName)) {
      matched++;
      if (b.officeName) verifiedMatched++;
    } else {
      unmatched.push(`${d.district} -> ${b.block}`);
      if (b.officeName) verifiedUnmatched.push(`${d.district} -> ${b.block}`);
    }
  }
}

console.log(`Total office blocks: 388, Matched with DB hierarchy: ${matched}, Unmatched: ${unmatched.length}`);
console.log(`Verified office blocks (55): Matched: ${verifiedMatched}, Unmatched: ${verifiedUnmatched.length}`);
if (verifiedUnmatched.length > 0) console.log("Verified unmatched:", verifiedUnmatched);
