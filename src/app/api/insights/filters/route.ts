import { NextRequest } from "next/server";
import { getCachedFiltersData, CACHE_HEADERS } from "@/lib/cache";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const result = await getCachedFiltersData();

    return Response.json(result, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[API] /insights/filters error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
