import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInsight extends Document {
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

const InsightSchema = new Schema<IInsight>(
  {
    end_year: { type: Number, default: null },
    intensity: { type: Number, default: null },
    sector: { type: String, default: "" },
    topic: { type: String, default: "" },
    insight: { type: String, default: "" },
    url: { type: String, default: "" },
    region: { type: String, default: "" },
    start_year: { type: Number, default: null },
    impact: { type: Number, default: null },
    added: { type: String, default: "" },
    published: { type: String, default: "" },
    country: { type: String, default: "" },
    relevance: { type: Number, default: null },
    pestle: { type: String, default: "" },
    source: { type: String, default: "" },
    title: { type: String, default: "" },
    likelihood: { type: Number, default: null },
  },
  {
    collection: "insights",
    timestamps: false,
  }
);

// Indexes on filterable fields
InsightSchema.index({ topic: 1 });
InsightSchema.index({ sector: 1 });
InsightSchema.index({ region: 1 });
InsightSchema.index({ pestle: 1 });
InsightSchema.index({ source: 1 });
InsightSchema.index({ country: 1 });
InsightSchema.index({ end_year: 1 });
// Compound index for common aggregation queries
InsightSchema.index({ region: 1, end_year: 1 });
InsightSchema.index({ sector: 1, end_year: 1 });

const Insight: Model<IInsight> =
  mongoose.models.Insight || mongoose.model<IInsight>("Insight", InsightSchema);

export default Insight;
