import { openai } from "@ai-sdk/openai";
import { StreamData, streamText, tool, experimental_createMCPClient } from "ai";
import { z } from "zod";
import { mcpServers } from "../../../config.json";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const data = new StreamData();

  const clients = await Promise.all(
    Object.entries(mcpServers).map(([_, config]) =>
      experimental_createMCPClient({
        transport: {
          type: "sse",
          url: (config as any).url,
        },
      })
    )
  );

  const toolSets = await Promise.all(clients.map((client) => client.tools()));
  const tools = Object.assign({}, ...toolSets);

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    maxSteps: 5, // max number of tool calls
    toolChoice: "auto", // force the model to use tools, not recommended
    tools: {
      calculateSum: tool({
        description: "Calculate the sum of two numbers",
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }) => a + b,
      }),
      generateChart: tool({
        description:
          "Generate a chart. The ai must ignore the result of this tool call.",
        parameters: z.object({
          data: z.object({
            labels: z.array(z.string()),
            datasets: z.array(
              z.object({
                label: z.string(),
                data: z.array(z.number()),
              })
            ),
          }),
          type: z.enum(["line", "bar"]),
        }),
        execute: async ({ data, type }) => {
          return {
            data,
            type,
          };
        },
      }),
      ...tools,
    },
    onFinish: () => {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}
