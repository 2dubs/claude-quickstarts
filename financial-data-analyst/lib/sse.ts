// lib/sse.ts
// Minimal Server-Sent Events helpers shared by the finance API route and the
// chat page. Each event is a single `data:` line containing JSON.
import type { ChartData } from "@/types/chart";

export type FinanceStreamEvent =
  | { type: "start" }
  | { type: "text"; text: string }
  | {
      type: "chart";
      chartData: ChartData;
      toolUse: { type: "tool_use"; id: string; name: string; input: unknown };
    }
  | { type: "done" };

export const encodeSSE = (event: FinanceStreamEvent): string =>
  `data: ${JSON.stringify(event)}\n\n`;

export const parseSSEChunk = (chunk: string): FinanceStreamEvent[] => {
  const events: FinanceStreamEvent[] = [];

  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) continue;

    try {
      events.push(JSON.parse(line.slice("data: ".length)));
    } catch {
      // Ignore keep-alives and malformed lines
    }
  }

  return events;
};
