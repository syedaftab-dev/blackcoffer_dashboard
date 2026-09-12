import http from "http";

const BASE_URL = "http://localhost:3000";

interface RequestResult {
  status: number;
  data: any;
  durationMs: number;
}

function request(path: string): Promise<RequestResult> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const durationMs = Date.now() - start;
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode || 200, data, durationMs });
        } catch {
          resolve({ status: res.statusCode || 200, data: body, durationMs });
        }
      });
    }).on("error", reject);
  });
}

async function runApiTests() {
  console.log("=== RUNNING API TEST SUITE ===\n");
  let allPassed = true;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      allPassed = false;
    }
  }

  // 1. Test /api/insights/filters with no query params
  console.log("1. Testing /api/insights/filters (no params):");
  const filtersRes = await request("/api/insights/filters");
  assert(filtersRes.status === 200, "status is 200");
  assert(Array.isArray(filtersRes.data.end_years), "end_years is array");
  assert(Array.isArray(filtersRes.data.topics), "topics is array");
  assert(Array.isArray(filtersRes.data.sectors), "sectors is array");
  assert(Array.isArray(filtersRes.data.regions), "regions is array");
  assert(Array.isArray(filtersRes.data.pestles), "pestles is array");
  assert(Array.isArray(filtersRes.data.sources), "sources is array");
  assert(Array.isArray(filtersRes.data.countries), "countries is array");
  assert(filtersRes.data.topics.length > 50, `Found ${filtersRes.data.topics.length} topics (>50)`);
  assert(filtersRes.data.sources.length > 200, `Found ${filtersRes.data.sources.length} sources (>200)`);

  // 2. Test /api/insights with no query params (returns full default dataset)
  console.log("\n2. Testing /api/insights (default dataset, no params):");
  const defaultInsights = await request("/api/insights");
  assert(defaultInsights.status === 200, "status is 200");
  assert(defaultInsights.data.count === 1000, `Total count is 1000 (got ${defaultInsights.data.count})`);
  assert(Array.isArray(defaultInsights.data.data), "data is array");
  assert(defaultInsights.data.data.length === 1000, `Full dataset returned (got ${defaultInsights.data.data.length} records)`);

  const limitedInsights = await request("/api/insights?limit=50");
  assert(limitedInsights.status === 200, "status is 200 with limit=50");
  assert(limitedInsights.data.data.length === 50, "data is capped at 50 records when limit=50");

  // 3. Test /api/insights/aggregate with no query params
  console.log("\n3. Testing /api/insights/aggregate (no params):");
  const defaultAgg = await request("/api/insights/aggregate");
  assert(defaultAgg.status === 200, "status is 200");
  assert(defaultAgg.data.totalCount === 1000, `Agg totalCount is 1000 (got ${defaultAgg.data.totalCount})`);
  assert(Array.isArray(defaultAgg.data.intensityByYear), "intensityByYear is array");
  assert(Array.isArray(defaultAgg.data.sectorCounts), "sectorCounts is array");
  assert(Array.isArray(defaultAgg.data.regionYearIntensity), "regionYearIntensity is array");
  assert(Array.isArray(defaultAgg.data.countryLikelihood), "countryLikelihood is array");

  // 4. Test Single Filter: sector=Energy
  console.log("\n4. Testing single filter: sector=Energy:");
  const energyInsights = await request("/api/insights?sector=Energy&limit=1000");
  assert(energyInsights.status === 200, "status is 200");
  const energyCount = energyInsights.data.count;
  console.log(`    Energy count: ${energyCount} out of 1000 records`);
  assert(energyCount > 0 && energyCount < 1000, `Energy count is filtered (>0 and <1000)`);
  const allEnergy = energyInsights.data.data.every((d: any) => d.sector.toLowerCase() === "energy");
  assert(allEnergy, "All returned records have sector == Energy");

  const energyAgg = await request("/api/insights/aggregate?sector=Energy");
  assert(energyAgg.data.totalCount === energyCount, `Aggregate count (${energyAgg.data.totalCount}) matches fetch count (${energyCount})`);

  // 5. Test Multiple Filters (AND combination): sector=Energy & region=Northern America & pestle=Industries
  console.log("\n5. Testing multiple filters (AND combination): sector=Energy & region=Northern America & pestle=Industries:");
  const multiFilter = await request("/api/insights?sector=Energy&region=Northern%20America&pestle=Industries&limit=1000");
  assert(multiFilter.status === 200, "status is 200");
  const multiCount = multiFilter.data.count;
  console.log(`    Multi-filter count: ${multiCount}`);
  assert(multiCount <= energyCount, `Multi-filter count (${multiCount}) <= single energy count (${energyCount})`);
  const allMatchAnd = multiFilter.data.data.every((d: any) => 
    d.sector.toLowerCase() === "energy" &&
    d.region.toLowerCase() === "northern america" &&
    d.pestle.toLowerCase() === "industries"
  );
  assert(allMatchAnd, "Every single returned record satisfies ALL 3 filter criteria simultaneously (AND logic)");

  // 6. Test Filter returning ZERO results cleanly:
  console.log("\n6. Testing zero results filter combination:");
  const zeroResults = await request("/api/insights?topic=nonexistent_xyz_99999");
  assert(zeroResults.status === 200, "status is 200 (not 500 or error)");
  assert(zeroResults.data.count === 0, "count is 0");
  assert(Array.isArray(zeroResults.data.data) && zeroResults.data.data.length === 0, "data is empty array []");

  const zeroAgg = await request("/api/insights/aggregate?topic=nonexistent_xyz_99999");
  assert(zeroAgg.status === 200, "aggregate status is 200 (not 500 or error)");
  assert(zeroAgg.data.totalCount === 0, "aggregate totalCount is 0");
  assert(zeroAgg.data.sectorCounts.length === 0, "sectorCounts is empty array");

  // 7. Test Invalid / Malformed Query Params: Zod rejection with 400
  console.log("\n7. Testing invalid/malformed query params (Zod validation rejection):");
  const invalidLimit = await request("/api/insights?limit=not_a_number");
  assert(invalidLimit.status === 400, `Invalid limit returns 400 (got ${invalidLimit.status})`);
  assert(invalidLimit.data.error === "Invalid query parameters", "Error message confirms Zod rejection");
  assert(Boolean(invalidLimit.data.details), "Zod error details included");

  const invalidIntensity = await request("/api/insights?intensity_min=abc");
  assert(invalidIntensity.status === 400, `Invalid intensity_min returns 400 (got ${invalidIntensity.status})`);

  const invalidAgg = await request("/api/insights/aggregate?end_year=invalid_year");
  assert(invalidAgg.status === 400, `Invalid aggregate param returns 400 (got ${invalidAgg.status})`);

  // 8. Test Caching: hit timing on second request & cache key differentiation
  console.log("\n8. Testing cache hits and key differentiation:");
  // First request (MISS / populate)
  const reqKey1 = `/api/insights/aggregate?sector=Retail&cacheBust=${Date.now()}`;
  const firstCall = await request(reqKey1);
  assert(firstCall.status === 200, "First call 200 OK");

  // Second identical request (HIT)
  const secondCall = await request(reqKey1);
  assert(secondCall.status === 200, "Second call 200 OK");
  console.log(`    Call 1 duration: ${firstCall.durationMs}ms, Call 2 (cached) duration: ${secondCall.durationMs}ms`);
  assert(secondCall.durationMs <= firstCall.durationMs + 10, "Second call responded rapidly via cache");

  // Third request with DIFFERENT filter params (must NOT return cached Retail data)
  const reqKey2 = `/api/insights/aggregate?sector=Manufacturing&cacheBust=${Date.now()}`;
  const diffFilterCall = await request(reqKey2);
  assert(diffFilterCall.status === 200, "Different filter call 200 OK");
  assert(diffFilterCall.data.totalCount !== firstCall.data.totalCount, 
    `Cache respects different keys: Retail count (${firstCall.data.totalCount}) != Manufacturing count (${diffFilterCall.data.totalCount})`
  );

  console.log("\n==========================================");
  if (allPassed) {
    console.log("🎉 ALL API ENDPOINT TESTS PASSED!");
  } else {
    console.error("❌ SOME API TESTS FAILED. CHECK LOGS ABOVE.");
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
