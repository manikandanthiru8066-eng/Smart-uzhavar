const BASE_URL = 'http://localhost:8080';
const INSURANCE_URL = 'http://localhost:8081';

async function getCounts() {
  console.log('Fetching live database counts...\n');

  try {
    // Districts
    const distRes = await fetch(`${BASE_URL}/api/districts`);
    const dists = await distRes.json();
    console.log(`Districts: ${Array.isArray(dists) ? dists.length : 'N/A'}`);

    // Taluks & Blocks sample count via districts
    let totalTaluks = 0;
    let totalBlocks = 0;
    if (Array.isArray(dists)) {
      for (const d of dists) {
        const tRes = await fetch(`${BASE_URL}/api/districts/${d.id}/taluks`);
        const taluks = await tRes.json();
        if (Array.isArray(taluks)) {
          totalTaluks += taluks.length;
          for (const t of taluks) {
            const bRes = await fetch(`${BASE_URL}/api/taluks/${t.id}/blocks`);
            const blocks = await bRes.json();
            if (Array.isArray(blocks)) {
              totalBlocks += blocks.length;
            }
          }
        }
      }
    }
    console.log(`Taluks: ${totalTaluks}`);
    console.log(`Blocks: ${totalBlocks}`);

    // District Crop Stats (sample Thanjavur)
    const statsRes = await fetch(`${BASE_URL}/api/districts/name/Thanjavur/crop-stats`);
    const stats = await statsRes.json();
    console.log(`Crop Stat Records (Thanjavur sample): ${Array.isArray(stats) ? stats.length : 'N/A'}`);

    // Subsidy Schemes
    const subRes = await fetch(`${BASE_URL}/api/subsidies`);
    const subs = await subRes.json();
    console.log(`Subsidy Schemes: ${Array.isArray(subs) ? subs.length : 'N/A'}`);

    // Insurance Schemes
    const insRes = await fetch(`${INSURANCE_URL}/api/insurance/schemes`);
    const inss = await insRes.json();
    console.log(`Insurance Schemes: ${Array.isArray(inss) ? inss.length : 'N/A'}`);

  } catch (err) {
    console.error('Error fetching counts:', err.message);
  }
}

getCounts();
