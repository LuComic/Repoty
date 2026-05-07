import { z } from "zod";

export const FileSummaryAISchema = z.object({
  purpose: z.string().max(240),
  domain: z.string().max(40),
  tags: z.array(z.string().max(32)).max(12),
  usedFor: z.array(z.string().max(120)).max(8),
  warnings: z.array(z.string().max(120)).max(5),
  summaryConfidence: z.number().min(0).max(1),
});

export const RouteSummaryAISchema = z.object({
  title: z.string().max(80),
  purpose: z.string().max(240),
  tags: z.array(z.string().max(32)).max(12),
  relatedRoutes: z.array(z.string().max(40)).max(8),
});

export type FileSummaryAI = z.infer<typeof FileSummaryAISchema>;
export type RouteSummaryAI = z.infer<typeof RouteSummaryAISchema>;
