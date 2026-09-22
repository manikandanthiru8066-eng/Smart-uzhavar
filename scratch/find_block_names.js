const fs = require("fs");
const hierData = JSON.parse(fs.readFileSync("database/tn_taluk_block_hierarchy.json", "utf8"));

const allBlocks = [];
for (const d of hierData.districts) {
  for (const t of d.taluks) {
    for (const b of t.blocks) {
      allBlocks.push({ district: d.district, taluk: t.taluk, block: b.block, code: b.lgd_block_code });
    }
  }
}

const targets = [
  "Kumaratchi", "Vridhachalam", "Kilpennathur", "Chetpet",
  "Elachipalayam", "Kabilarmalai", "Tiruchengode", "Anthiyur",
  "Sathyamangalam", "Orathanadu", "Thiruvidaimarudur", "Sethubavachatram"
];

for (const tgt of targets) {
  const prefix = tgt.slice(0, 4).toLowerCase();
  const matches = allBlocks.filter(b => b.block.toLowerCase().includes(prefix));
  console.log(`Target: ${tgt} -> matches:`, matches.map(m => `${m.district}: ${m.block}`));
}
