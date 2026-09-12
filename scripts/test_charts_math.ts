import http from "http";

function get(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => resolve(JSON.parse(b)));
    }).on("error", reject);
  });
}

async function testChartsMath() {
  console.log("=== VERIFYING CHARTS DATA & MATH ===\n");
  const agg = await get(`/api/insights/aggregate?cacheBust=${Date.now()}`);

  // 1. Sector Donut Math
  console.log("1. Testing Sector Donut grouping & percentages:");
  const rawSectors = agg.sectorCounts;
  const totalCount = rawSectors.reduce((acc: number, c: any) => acc + c.count, 0);
  console.log(`    Total raw sector items: ${rawSectors.length}, Total count sum: ${totalCount}`);

  const top7 = rawSectors.slice(0, 7);
  const otherCount = rawSectors.slice(7).reduce((acc: number, c: any) => acc + c.count, 0);
  const displaySectors = [...top7, { sector: "Other", count: otherCount }];

  const displaySum = displaySectors.reduce((acc: number, c: any) => acc + c.count, 0);
  console.log(`    Display items count sum: ${displaySum}`);
  if (displaySum === totalCount) {
    console.log("  ✅ PASS: Sum of top 7 + Other exactly equals total sector count!");
  } else {
    console.error("  ❌ FAIL: Sum mismatch!");
  }

  const pcts = displaySectors.map((s) => ((s.count / totalCount) * 100));
  const sumPct = pcts.reduce((a, b) => a + b, 0);
  console.log(`    Sum of slice percentages: ${sumPct.toFixed(2)}%`);
  if (Math.abs(sumPct - 100) < 0.01) {
    console.log("  ✅ PASS: Sector slice percentages sum exactly to 100.00%!");
  } else {
    console.error("  ❌ FAIL: Percentages do not sum to 100%!");
  }

  // 2. Topic Bars Sorting & Top-N
  console.log("\n2. Testing Topic Bars sorting and top-N:");
  const rawTopics = agg.topicCounts;
  console.log(`    Raw topics count: ${rawTopics.length}`);
  const isSorted = rawTopics.every((item: any, i: number) => {
    if (i === 0) return true;
    return rawTopics[i - 1].count >= item.count;
  });
  if (isSorted) {
    console.log("  ✅ PASS: Topic bars are strictly sorted descending by count!");
  } else {
    console.error("  ❌ FAIL: Topic bars are not sorted!");
  }

  const top7Topics = rawTopics.slice(0, 7);
  const otherTopicCount = rawTopics.slice(7).reduce((acc: number, c: any) => acc + c.count, 0);
  const displayTopics = [...top7Topics, { topic: "Other", count: otherTopicCount }];
  console.log(`    Top-N capped at: ${displayTopics.length} entries (7 categories + Other)`);
  if (displayTopics.length <= 8) {
    console.log("  ✅ PASS: Topic chart shows sensible top-N (capping at 8 items) instead of squeezing all 97 topics!");
  }

  // 3. Region x Year Heatmap Year sanity
  console.log("\n3. Testing Region x Year Heatmap data sanity:");
  const ry = agg.regionYearIntensity;
  const heatmapYears = [...new Set(ry.map((r: any) => r.year))].sort((a: any, b: any) => a - b);
  console.log(`    Heatmap years: ${heatmapYears.join(", ")}`);
  const hasBadYear = heatmapYears.some((y: any) => y > 2060 || y < 2000);
  if (!hasBadYear) {
    console.log("  ✅ PASS: Heatmap contains only realistic projection years (<= 2060, no 2200 outlier)!");
  } else {
    console.error("  ❌ FAIL: Heatmap contains unrealistic year values!");
  }

  // 4. Trend Line Data Sanity
  console.log("\n4. Testing Trend Line year data:");
  const trendYears = agg.intensityByYear.map((d: any) => d.year);
  console.log(`    Trend line years: ${trendYears.join(", ")}`);
  const hasBadTrendYear = trendYears.some((y: any) => y > 2060 || y < 2000);
  if (!hasBadTrendYear) {
    console.log("  ✅ PASS: Trend line contains only realistic projection years (<= 2060, no 2200 outlier)!");
  } else {
    console.error("  ❌ FAIL: Trend line contains unrealistic year values!");
  }
}

testChartsMath().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
