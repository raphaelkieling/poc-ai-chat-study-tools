import { openai } from "@ai-sdk/openai";
import { StreamData, streamText, tool, experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
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
        transport: new Experimental_StdioMCPTransport({
          command: config.command,
          args: config.args,
          env: config.env,
        }),
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
      isGreaterThan: tool({
        description: "Check if a is greater than b",
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }, { toolCallId }) => {
          data.appendMessageAnnotation({
            type: "tool-status",
            toolCallId,
            status: "in-progress",
          });

          await new Promise((resolve) => setTimeout(resolve, 3000));

          data.appendMessageAnnotation({
            type: "tool-status",
            toolCallId,
            status: "success",
          });

          return a > b;
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
