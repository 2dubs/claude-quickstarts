import { describe, expect, it } from "vitest";
import { encodeSSE, parseSSEChunk, type FinanceStreamEvent } from "./sse";

const chartEvent: FinanceStreamEvent = {
  type: "chart",
  chartData: {
    chartType: "line",
    config: {
      title: "Quarterly Revenue",
      description: "Revenue growth over time",
      xAxisKey: "period",
    },
    data: [
      { period: "Q1 2024", revenue: 1250000 },
      { period: "Q2 2024", revenue: 1450000 },
    ],
    chartConfig: { revenue: { label: "Revenue ($)" } },
  },
  toolUse: {
    type: "tool_use",
    id: "toolu_01",
    name: "generate_graph_data",
    input: {},
  },
};

describe("encodeSSE / parseSSEChunk", () => {
  it("round-trips a single event", () => {
    const event: FinanceStreamEvent = { type: "text", text: "Revenue grew" };
    expect(parseSSEChunk(encodeSSE(event))).toEqual([event]);
  });

  it("parses several events delivered in one chunk", () => {
    const chunk =
      encodeSSE({ type: "start" }) +
      encodeSSE({ type: "text", text: "Here is " }) +
      encodeSSE({ type: "text", text: "the chart." }) +
      encodeSSE(chartEvent) +
      encodeSSE({ type: "done" });

    expect(parseSSEChunk(chunk).map((e) => e.type)).toEqual([
      "start",
      "text",
      "text",
      "chart",
      "done",
    ]);
  });

  it("preserves chart payloads", () => {
    const [parsed] = parseSSEChunk(encodeSSE(chartEvent));
    expect(parsed).toEqual(chartEvent);
  });

  it("handles text containing newlines and unicode", () => {
    const event: FinanceStreamEvent = {
      type: "text",
      text: "Line one\nLine two — €1.2M",
    };
    expect(parseSSEChunk(encodeSSE(event))).toEqual([event]);
  });

  it("ignores comments and blank lines", () => {
    const chunk = `: keep-alive\n\n${encodeSSE({ type: "done" })}`;
    expect(parseSSEChunk(chunk)).toEqual([{ type: "done" }]);
  });
});
