import { NextRequest } from "next/server";
import { InsightQuerySchema } from "@/lib/schemas/insight";
import { getCachedAggregateData, CACHE_HEADERS } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    // Validate query parameters first
    const parsed = InsightQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await getCachedAggregateData(parsed.data);

    return Response.json(result, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[API] /insights/aggregate error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
