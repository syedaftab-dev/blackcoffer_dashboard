import http from "http";

const BASE_URL = "http://localhost:3000";

function request(path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 200, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode || 200, data: body });
        }
      });
    }).on("error", reject);
  });
}

async function runFilterTests() {
  console.log("=== TESTING ALL 7 FILTERS & SPARSE FIELDS ===\n");
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) console.log(`  ✅ PASS: ${msg}`);
    else {
      console.error(`  ❌ FAIL: ${msg}`);
      passed = false;
    }
  }

  // 1. End Year (sparse: ~26% filled)
  console.log("1. Testing end_year (sparse field):");
  const yearRes = await request("/api/insights?end_year=2025");
  assert(yearRes.status === 200, "end_year=2025 returns 200");
  assert(yearRes.data.count > 0, `end_year=2025 returned ${yearRes.data.count} records`);
  assert(yearRes.data.data.every((d: any) => d.end_year === 2025), "All records have end_year === 2025");

  // 2. Topic
  console.log("\n2. Testing topic filter:");
  const topicRes = await request("/api/insights?topic=oil");
  assert(topicRes.status === 200, "topic=oil returns 200");
  assert(topicRes.data.count > 0, `topic=oil returned ${topicRes.data.count} records`);
  assert(topicRes.data.data.every((d: any) => d.topic.toLowerCase() === "oil"), "All records have topic === oil");

  // 3. Sector
  console.log("\n3. Testing sector filter:");
  const sectorRes = await request("/api/insights?sector=Energy");
  assert(sectorRes.status === 200, "sector=Energy returns 200");
  assert(sectorRes.data.count === 525, `sector=Energy returned exactly 525 records`);
  assert(sectorRes.data.data.every((d: any) => d.sector.toLowerCase() === "energy"), "All records have sector === Energy");

  // 4. Region (sparse: ~55% filled)
  console.log("\n4. Testing region filter (sparse field):");
  const regionRes = await request("/api/insights?region=Northern%20America");
  assert(regionRes.status === 200, "region=Northern America returns 200");
  assert(regionRes.data.count > 0, `region=Northern America returned ${regionRes.data.count} records`);
  assert(regionRes.data.data.every((d: any) => d.region.toLowerCase() === "northern america"), "All records have region === Northern America");

  // 5. Pestle
  console.log("\n5. Testing pestle filter:");
  const pestleRes = await request("/api/insights?pestle=Economic");
  assert(pestleRes.status === 200, "pestle=Economic returns 200");
  assert(pestleRes.data.count > 0, `pestle=Economic returned ${pestleRes.data.count} records`);
  assert(pestleRes.data.data.every((d: any) => d.pestle.toLowerCase() === "economic"), "All records have pestle === Economic");

  // 6. Source
  console.log("\n6. Testing source filter:");
  const sourceRes = await request("/api/insights?source=EIA");
  assert(sourceRes.status === 200, "source=EIA returns 200");
  assert(sourceRes.data.count > 0, `source=EIA returned ${sourceRes.data.count} records`);
  assert(sourceRes.data.data.every((d: any) => d.source.toLowerCase() === "eia"), "All records have source === EIA");

  // 7. Country (sparse: ~35% filled)
  console.log("\n7. Testing country filter (sparse field):");
  const countryRes = await request("/api/insights?country=United%20States%20of%20America");
  assert(countryRes.status === 200, "country=United States of America returns 200");
  assert(countryRes.data.count > 0, `country=USA returned ${countryRes.data.count} records`);
  assert(countryRes.data.data.every((d: any) => d.country.toLowerCase() === "united states of america"), "All records have country === USA");

  // 8. Test Multiple comma-separated values (OR within dimension)
  console.log("\n8. Testing multi-select within dimension (comma-separated):");
  const multiSector = await request("/api/insights?sector=Retail,Manufacturing");
  assert(multiSector.status === 200, "multi-sector returns 200");
  const retailCount = (await request("/api/insights?sector=Retail")).data.count;
  const mfgCount = (await request("/api/insights?sector=Manufacturing")).data.count;
  console.log(`    Retail (${retailCount}) + Manufacturing (${mfgCount}) = ${retailCount + mfgCount}, Multi returned: ${multiSector.data.count}`);
  assert(multiSector.data.count === retailCount + mfgCount, "Multi-value filter correctly aggregates OR union within dimension");

  console.log("\n==========================================");
  if (passed) {
    console.log("🎉 ALL 7 FILTER & SPARSE FIELD TESTS PASSED!");
  } else {
    console.error("❌ FILTER TESTS FAILED.");
    process.exit(1);
  }
}

runFilterTests().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
