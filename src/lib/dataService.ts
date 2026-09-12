import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/db/connection";
import Insight from "@/lib/db/models/Insight";
import {
  InsightQuery,
  type AggregateResponse,
  type FiltersResponse,
  type InsightResponse,
  FILTER_FIELDS,
} from "@/lib/schemas/insight";

interface CleanInsight {
  _id: string;
  end_year: number | null;
  intensity: number | null;
  sector: string;
  topic: string;
  insight: string;
  url: string;
  region: string;
  start_year: number | null;
  impact: number | null;
  added: string;
  published: string;
  country: string;
  relevance: number | null;
  pestle: string;
  source: string;
  title: string;
  likelihood: number | null;
}

let memoryData: CleanInsight[] | null = null;
let lastDbFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

function cleanNumeric(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function loadRootJsonData(): CleanInsight[] {
  if (memoryData && memoryData.length === 1000) return memoryData;

  const rootPath = path.resolve(process.cwd(), "jsondata.json");
  const fallbackPath = path.resolve(process.cwd(), "data", "jsondata.json");
  const filePath = fs.existsSync(rootPath) ? rootPath : fallbackPath;

  if (!fs.existsSync(filePath)) {
    console.warn(`[dataService] Warning: ${filePath} not found`);
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const cleaned = raw.map((item: Record<string, unknown>, idx: number) => ({
      _id: String(item._id || `insight-${idx}`),
      end_year: cleanNumeric(item.end_year),
      intensity: cleanNumeric(item.intensity),
      sector: String(item.sector || "").trim(),
      topic: String(item.topic || "").trim(),
      insight: String(item.insight || "").trim(),
      url: String(item.url || "").trim(),
      region: String(item.region || "").trim(),
      start_year: cleanNumeric(item.start_year),
      impact: cleanNumeric(item.impact),
      added: String(item.added || "").trim(),
      published: String(item.published || "").trim(),
      country: String(item.country || "").trim(),
      relevance: cleanNumeric(item.relevance),
      pestle: String(item.pestle || "").trim(),
      source: String(item.source || "").trim(),
      title: String(item.title || "").trim(),
      likelihood: cleanNumeric(item.likelihood),
    }));
    return cleaned;
  } catch (err) {
    console.error("[dataService] Error loading JSON:", err);
    return [];
  }
}

/**
 * Fast dataset provider:
 * Pulls directly from MongoDB Atlas and caches in server memory for 10 minutes.
 * Allows instant sub-millisecond filtering across all dimensions.
 */
export async function getCleanDataset(): Promise<CleanInsight[]> {
  if (memoryData && memoryData.length === 1000 && Date.now() - lastDbFetchTime < CACHE_TTL_MS) {
    return memoryData;
  }

  // 1. Try loading from MongoDB Atlas first
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = await Insight.find().lean();
      if (docs && docs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memoryData = docs.map((item: any, idx: number) => ({
          _id: String(item._id || `insight-${idx}`),
          end_year: cleanNumeric(item.end_year),
          intensity: cleanNumeric(item.intensity),
          sector: String(item.sector || "").trim(),
          topic: String(item.topic || "").trim(),
          insight: String(item.insight || "").trim(),
          url: String(item.url || "").trim(),
          region: String(item.region || "").trim(),
          start_year: cleanNumeric(item.start_year),
          impact: cleanNumeric(item.impact),
          added: String(item.added || "").trim(),
          published: String(item.published || "").trim(),
          country: String(item.country || "").trim(),
          relevance: cleanNumeric(item.relevance),
          pestle: String(item.pestle || "").trim(),
          source: String(item.source || "").trim(),
          title: String(item.title || "").trim(),
          likelihood: cleanNumeric(item.likelihood),
        }));
        lastDbFetchTime = Date.now();
        console.log(`[dataService] Cached ${memoryData.length} records from MongoDB Atlas`);
        return memoryData;
      }
    } catch (err) {
      console.warn("[dataService] MongoDB Atlas load failed, falling back to bundled JSON:", err);
    }
  }

  // 2. Fallback to local JSON
  memoryData = loadRootJsonData();
  lastDbFetchTime = Date.now();
  return memoryData;
}

export function filterMemoryData(data: CleanInsight[], query: InsightQuery): CleanInsight[] {
  return data.filter((item) => {
    for (const field of FILTER_FIELDS) {
      const paramVal = query[field];
      if (!paramVal || typeof paramVal !== "string" || paramVal.trim() === "") continue;

      const filterValues = paramVal.split(",").map((v) => v.trim().toLowerCase());
      if (field === "end_year") {
        if (item.end_year === null) return false;
        if (!filterValues.includes(String(item.end_year).toLowerCase())) return false;
      } else {
        const itemVal = (item[field] || "").toLowerCase();
        if (!filterValues.includes(itemVal)) return false;
      }
    }

    if (query.search && query.search.trim() !== "") {
      const q = query.search.trim().toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.insight.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.pestle.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    return true;
  });
}

export async function fetchInsights(
  query: InsightQuery
): Promise<{ data: InsightResponse[]; count: number }> {
  const limit = query.limit !== undefined ? query.limit : 100;
  const page = query.page !== undefined ? query.page : 1;
  const skip = (page - 1) * limit;

  const all = await getCleanDataset();
  const filtered = filterMemoryData(all, query);
  const totalCount = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  return { data: paginated as unknown as InsightResponse[], count: totalCount };
}

export async function fetchFiltersData(): Promise<FiltersResponse> {
  const all = await getCleanDataset();
  const topics = [...new Set(all.map((d) => d.topic).filter(Boolean))].sort();
  const sectors = [...new Set(all.map((d) => d.sector).filter(Boolean))].sort();
  const regions = [...new Set(all.map((d) => d.region).filter(Boolean))].sort();
  const pestles = [...new Set(all.map((d) => d.pestle).filter(Boolean))].sort();
  const sources = [...new Set(all.map((d) => d.source).filter(Boolean))].sort();
  const countries = [...new Set(all.map((d) => d.country).filter(Boolean))].sort();
  const endYears = [
    ...new Set(all.map((d) => d.end_year).filter((y): y is number => y !== null)),
  ].sort((a, b) => a - b);

  return { topics, sectors, regions, pestles, sources, countries, end_years: endYears };
}

export async function fetchAggregateData(query: InsightQuery): Promise<AggregateResponse> {
  const all = await getCleanDataset();
  const filtered = filterMemoryData(all, query);
  const totalCount = filtered.length;

  // 1. Intensity by year
  const yearMap = new Map<
    number,
    { sumInt: number; sumLike: number; countLike: number; count: number }
  >();
  filtered.forEach((d) => {
    if (d.end_year !== null && d.end_year <= 2060 && d.intensity !== null) {
      const cur = yearMap.get(d.end_year) || { sumInt: 0, sumLike: 0, countLike: 0, count: 0 };
      cur.sumInt += d.intensity;
      cur.count += 1;
      if (d.likelihood !== null) {
        cur.sumLike += d.likelihood;
        cur.countLike += 1;
      }
      yearMap.set(d.end_year, cur);
    }
  });
  const intensityByYear = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({
      year,
      avgIntensity: Number((v.sumInt / v.count).toFixed(2)),
      avgLikelihood: v.countLike > 0 ? Number((v.sumLike / v.countLike).toFixed(2)) : 0,
      count: v.count,
    }));

  // 2. Topic counts
  const topicMap = new Map<string, number>();
  filtered.forEach((d) => {
    if (d.topic) {
      topicMap.set(d.topic, (topicMap.get(d.topic) || 0) + 1);
    }
  });
  const topicCounts = Array.from(topicMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 25)
    .map(([topic, count]) => ({ topic, count }));

  // 3. Region x Year Intensity
  const ryMap = new Map<
    string,
    { region: string; year: number; sumInt: number; count: number }
  >();
  filtered.forEach((d) => {
    if (d.region && d.end_year !== null && d.end_year <= 2060 && d.intensity !== null) {
      const key = `${d.region}-${d.end_year}`;
      const cur = ryMap.get(key) || { region: d.region, year: d.end_year, sumInt: 0, count: 0 };
      cur.sumInt += d.intensity;
      cur.count += 1;
      ryMap.set(key, cur);
    }
  });
  const regionYearIntensity = Array.from(ryMap.values())
    .sort((a, b) => a.year - b.year)
    .map((v) => ({
      region: v.region,
      year: v.year,
      avgIntensity: Number((v.sumInt / v.count).toFixed(2)),
      count: v.count,
    }));

  // 4. Country Likelihood
  const countryMap = new Map<string, { sumLike: number; count: number }>();
  filtered.forEach((d) => {
    if (d.country && d.likelihood !== null) {
      const cur = countryMap.get(d.country) || { sumLike: 0, count: 0 };
      cur.sumLike += d.likelihood;
      cur.count += 1;
      countryMap.set(d.country, cur);
    }
  });
  const countryLikelihood = Array.from(countryMap.entries())
    .map(([country, v]) => ({
      country,
      avgLikelihood: Number((v.sumLike / v.count).toFixed(2)),
      count: v.count,
    }))
    .sort((a, b) => b.avgLikelihood - a.avgLikelihood)
    .slice(0, 20);

  // 5. Sector counts
  const sectorMap = new Map<string, number>();
  filtered.forEach((d) => {
    if (d.sector) {
      sectorMap.set(d.sector, (sectorMap.get(d.sector) || 0) + 1);
    }
  });
  const sectorCounts = Array.from(sectorMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([sector, count]) => ({ sector, count }));

  return {
    totalCount,
    intensityByYear,
    topicCounts,
    regionYearIntensity,
    countryLikelihood,
    sectorCounts,
  };
}
