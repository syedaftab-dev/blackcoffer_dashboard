import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/db/connection";
import Insight from "@/lib/db/models/Insight";
import {
  InsightQuery,
  buildMatchQuery,
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

function cleanNumeric(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function loadRootJsonData(): CleanInsight[] {
  if (memoryData) return memoryData;

  // Try root folder first as specified by user, then data/
  const rootPath = path.resolve(process.cwd(), "jsondata.json");
  const fallbackPath = path.resolve(process.cwd(), "data", "jsondata.json");
  const filePath = fs.existsSync(rootPath) ? rootPath : fallbackPath;

  if (!fs.existsSync(filePath)) {
    console.warn(`[dataService] Warning: ${filePath} not found`);
    return [];
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    memoryData = raw.map((item: Record<string, unknown>, idx: number) => ({
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
    console.log(`[dataService] Loaded ${memoryData?.length} records from ${filePath}`);
    return memoryData || [];
  } catch (err) {
    console.error("[dataService] Error loading JSON:", err);
    return [];
  }
}

function filterMemoryData(data: CleanInsight[], query: InsightQuery): CleanInsight[] {
  return data.filter((item) => {
    for (const field of FILTER_FIELDS) {
      const paramVal = query[field];
      if (!paramVal || paramVal.trim() === "") continue;

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

export async function fetchInsights(query: InsightQuery): Promise<{ data: InsightResponse[]; count: number }> {
  const limit = query.limit !== undefined ? query.limit : 1000;
  const page = query.page !== undefined ? query.page : 1;
  const skip = (page - 1) * limit;

  // If MongoDB URI is configured, try MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const match = buildMatchQuery(query);
      const totalCount = await Insight.countDocuments(match);
      const docs = await Insight.find(match).skip(skip).limit(limit).lean();
      return { data: docs as unknown as InsightResponse[], count: totalCount };
    } catch (err) {
      console.warn("[dataService] MongoDB query failed, falling back to root jsondata.json:", err);
    }
  }

  // Fallback to in-memory root jsondata.json
  const all = loadRootJsonData();
  const filtered = filterMemoryData(all, query);
  const totalCount = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  return { data: paginated, count: totalCount };
}

export async function fetchFiltersData(): Promise<FiltersResponse> {
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const [topics, sectors, regions, pestles, sources, countries, endYears] =
        await Promise.all([
          Insight.distinct("topic").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("sector").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("region").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("pestle").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("source").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("country").then((v) => v.filter((x: string) => x !== "").sort()),
          Insight.distinct("end_year").then((v) =>
            v.filter((x: number | null) => x !== null && x !== undefined).sort((a: number, b: number) => a - b)
          ),
        ]);

      return { topics, sectors, regions, pestles, sources, countries, end_years: endYears };
    } catch (err) {
      console.warn("[dataService] MongoDB filters failed, falling back to root jsondata.json:", err);
    }
  }

  const all = loadRootJsonData();
  const topics = [...new Set(all.map((d) => d.topic).filter(Boolean))].sort();
  const sectors = [...new Set(all.map((d) => d.sector).filter(Boolean))].sort();
  const regions = [...new Set(all.map((d) => d.region).filter(Boolean))].sort();
  const pestles = [...new Set(all.map((d) => d.pestle).filter(Boolean))].sort();
  const sources = [...new Set(all.map((d) => d.source).filter(Boolean))].sort();
  const countries = [...new Set(all.map((d) => d.country).filter(Boolean))].sort();
  const endYears = [...new Set(all.map((d) => d.end_year).filter((y): y is number => y !== null))].sort((a, b) => a - b);

  return { topics, sectors, regions, pestles, sources, countries, end_years: endYears };
}

export async function fetchAggregateData(query: InsightQuery): Promise<AggregateResponse> {
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const match = buildMatchQuery(query);
      const baseMatch = Object.keys(match).length > 0 ? [{ $match: match }] : [];

      const [totalCount, intensityByYear, topicCounts, regionYearIntensity, countryLikelihood, sectorCounts] =
        await Promise.all([
          Insight.countDocuments(match),
          Insight.aggregate([
            ...baseMatch,
            { $match: { end_year: { $ne: null, $exists: true, $lte: 2060 }, intensity: { $ne: null, $exists: true } } },
            {
              $group: {
                _id: "$end_year",
                avgIntensity: { $avg: "$intensity" },
                avgLikelihood: { $avg: "$likelihood" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                year: "$_id",
                avgIntensity: { $round: ["$avgIntensity", 2] },
                avgLikelihood: { $round: [{ $ifNull: ["$avgLikelihood", 0] }, 2] },
                count: 1,
              },
            },
          ]),
          Insight.aggregate([
            ...baseMatch,
            { $match: { topic: { $ne: "" } } },
            { $group: { _id: "$topic", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 25 },
            { $project: { _id: 0, topic: "$_id", count: 1 } },
          ]),
          Insight.aggregate([
            ...baseMatch,
            {
              $match: {
                region: { $ne: "" },
                end_year: { $ne: null, $exists: true, $lte: 2060 },
                intensity: { $ne: null, $exists: true },
              },
            },
            {
              $group: {
                _id: { region: "$region", year: "$end_year" },
                avgIntensity: { $avg: "$intensity" },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1 } },
            {
              $project: {
                _id: 0,
                region: "$_id.region",
                year: "$_id.year",
                avgIntensity: { $round: ["$avgIntensity", 2] },
                count: 1,
              },
            },
          ]),
          Insight.aggregate([
            ...baseMatch,
            {
              $match: {
                country: { $ne: "" },
                likelihood: { $ne: null, $exists: true },
              },
            },
            {
              $group: {
                _id: "$country",
                avgLikelihood: { $avg: "$likelihood" },
                count: { $sum: 1 },
              },
            },
            { $sort: { avgLikelihood: -1 } },
            { $limit: 20 },
            {
              $project: {
                _id: 0,
                country: "$_id",
                avgLikelihood: { $round: ["$avgLikelihood", 2] },
                count: 1,
              },
            },
          ]),
          Insight.aggregate([
            ...baseMatch,
            { $match: { sector: { $ne: "" } } },
            { $group: { _id: "$sector", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
            { $project: { _id: 0, sector: "$_id", count: 1 } },
          ]),
        ]);

      return {
        totalCount,
        intensityByYear,
        topicCounts,
        regionYearIntensity,
        countryLikelihood,
        sectorCounts,
      };
    } catch (err) {
      console.warn("[dataService] MongoDB aggregation failed, falling back to root jsondata.json:", err);
    }
  }

  // Fallback to in-memory root jsondata.json
  const all = loadRootJsonData();
  const filtered = filterMemoryData(all, query);
  const totalCount = filtered.length;

  // 1. Intensity by year
  const yearMap = new Map<number, { sumInt: number; sumLike: number; countLike: number; count: number }>();
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
  const ryMap = new Map<string, { region: string; year: number; sumInt: number; count: number }>();
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
