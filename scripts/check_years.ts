import fs from "fs";

const data = JSON.parse(fs.readFileSync("jsondata.json", "utf8"));
const years = [...new Set(data.map((d: any) => d.end_year).filter((y: any) => y !== "" && y !== null))].sort((a: any, b: any) => Number(a) - Number(b));
console.log("DISTINCT_YEARS:", years);

// Find any documents with strange end_year (e.g. > 2100 or < 2000)
const anomalousYears = data.filter((d: any) => {
  const y = Number(d.end_year);
  return y > 2100 || (y > 0 && y < 2000);
});
console.log("ANOMALOUS_YEAR_DOCS:", anomalousYears.map((d: any) => ({ end_year: d.end_year, title: d.title })));
