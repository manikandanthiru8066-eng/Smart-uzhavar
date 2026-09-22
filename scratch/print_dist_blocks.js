const fs = require("fs");
const hierData = JSON.parse(fs.readFileSync("database/tn_taluk_block_hierarchy.json", "utf8"));
["Erode", "Cuddalore", "Tiruvannamalai", "Thanjavur", "Namakkal", "Kanyakumari"].forEach(dist => {
  const d = hierData.districts.find(x => x.district.toLowerCase() === dist.toLowerCase());
  if (!d) return;
  const blocks = new Set();
  d.taluks.forEach(t => t.blocks.forEach(b => blocks.add(b.block)));
  console.log(dist, Array.from(blocks));
});
