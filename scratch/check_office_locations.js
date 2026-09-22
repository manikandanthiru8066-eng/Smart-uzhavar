const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'database', 'tn_block_office_locations.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let totalDistricts = data.districts.length;
let totalBlocks = 0;
let withCoords = 0;
let nullCoords = 0;
let outOfBoundsCoords = [];
let validCoords = [];

let withAddress = 0;
let nullOrEmptyAddress = 0;
let withOfficeName = 0;
let nullOrEmptyOfficeName = 0;
let withPhone = 0;
let emptyPhone = 0;

let unverifiedNotes = [];
let verifiedNotes = [];
let entriesWithRealDetails = [];
let entriesWithNoDetails = [];

// Bounds: Lat 8.0 to 13.5, Lng 76.5 to 80.5
for (const dist of data.districts) {
  for (const b of dist.blocks) {
    totalBlocks++;
    const hasLat = b.latitude !== null && b.latitude !== undefined;
    const hasLng = b.longitude !== null && b.longitude !== undefined;

    if (hasLat && hasLng) {
      withCoords++;
      const lat = Number(b.latitude);
      const lng = Number(b.longitude);
      if (isNaN(lat) || isNaN(lng) || lat < 8.0 || lat > 13.5 || lng < 76.5 || lng > 80.5) {
        outOfBoundsCoords.push({ district: b.district, block: b.block, lat, lng });
      } else {
        validCoords.push({ district: b.district, block: b.block, lat, lng });
      }
    } else {
      nullCoords++;
    }

    if (b.address && b.address.trim().length > 0) {
      withAddress++;
    } else {
      nullOrEmptyAddress++;
    }

    if (b.officeName && b.officeName.trim().length > 0) {
      withOfficeName++;
    } else {
      nullOrEmptyOfficeName++;
    }

    if (b.phone && b.phone.trim().length > 0) {
      withPhone++;
    } else {
      emptyPhone++;
    }

    const note = b.verificationNote || '';
    if (note.includes('not independently verified') || note.includes('No address, phone, or coordinates were guessed')) {
      unverifiedNotes.push({ district: b.district, block: b.block, note });
    } else {
      verifiedNotes.push({ district: b.district, block: b.block, note, source: b.source, officeName: b.officeName, address: b.address, phone: b.phone });
    }

    if ((b.officeName && b.officeName.trim()) || (b.address && b.address.trim())) {
      entriesWithRealDetails.push({
        district: b.district,
        block: b.block,
        officeName: b.officeName,
        address: b.address,
        phone: b.phone,
        hasCoords: hasLat && hasLng,
        coords: hasLat && hasLng ? `${b.latitude}, ${b.longitude}` : null,
        source: b.source,
        note: b.verificationNote
      });
    } else {
      entriesWithNoDetails.push({ district: b.district, block: b.block });
    }
  }
}

console.log('=== DATA QUALITY SUMMARY ===');
console.log('Total Districts:', totalDistricts);
console.log('Total Block Entries:', totalBlocks);
console.log('Blocks with Lat/Lng:', withCoords);
console.log('Blocks with NULL/Missing Lat/Lng:', nullCoords);
console.log('Blocks with Out-of-Bounds Coordinates:', outOfBoundsCoords.length);
if (outOfBoundsCoords.length > 0) {
  console.log('Out of bounds entries:', JSON.stringify(outOfBoundsCoords, null, 2));
}
console.log('Valid coordinates found:', validCoords.length);
console.log('Entries with coordinates:', JSON.stringify(validCoords, null, 2));

console.log('\n=== OFFICE NAME & ADDRESS METRICS ===');
console.log('Entries with Office Name:', withOfficeName);
console.log('Entries with Null/Empty Office Name:', nullOrEmptyOfficeName);
console.log('Entries with Address:', withAddress);
console.log('Entries with Null/Empty Address:', nullOrEmptyAddress);
console.log('Entries with Phone Number:', withPhone);

console.log('\n=== VERIFICATION NOTES AUDIT ===');
console.log('Entries marked NOT independently verified / no data guessed:', unverifiedNotes.length);
console.log('Entries with confirmed live sources / notes:', verifiedNotes.length);
console.log('\nBreakdown of Verified Entries by District:');
const verifiedByDist = {};
for (const v of verifiedNotes) {
  verifiedByDist[v.district] = (verifiedByDist[v.district] || 0) + 1;
}
console.log(JSON.stringify(verifiedByDist, null, 2));

console.log('\nSample of verified entries:');
console.log(JSON.stringify(verifiedNotes.slice(0, 5), null, 2));
