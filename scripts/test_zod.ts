import { InsightQuerySchema } from "../src/lib/schemas/insight";

console.log("limit: 'not_a_number' ->", InsightQuerySchema.safeParse({ limit: "not_a_number" }));
console.log("intensity_min: 'abc' ->", InsightQuerySchema.safeParse({ intensity_min: "abc" }));
console.log("end_year: 'invalid_year' ->", InsightQuerySchema.safeParse({ end_year: "invalid_year" }));
