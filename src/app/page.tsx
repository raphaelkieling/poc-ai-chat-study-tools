"use client";

import { useChat } from "@ai-sdk/react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartType,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

interface ChartData {
  labels?: string[];
  datasets?: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
  title?: string;
}

interface DynamicChartProps {
  data: ChartData;
  type?: "line" | "bar";
}

// Chart component to handle different chart types
const DynamicChart = ({ data, type = "line" }: DynamicChartProps) => {
  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets || [],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: !!data.title,
        text: data.title,
      },
    },
  };

  return type === "line" ? (
    <Line data={chartData} options={options} />
  ) : (
    <Bar data={chartData} options={options} />
  );
};

// Render tool results more efficiently
const ToolResult = ({ result }: { result: any }) => {
  if (result === undefined) return "Loading...";

  if (typeof result === "object") {
    return <ReactJson src={result} />;
  }

  if (typeof result === "boolean") {
    return String(result);
  }

  return result;
};

// Render message parts based on type
const MessagePart = ({
  part,
  messageId,
  index,
}: {
  part: any;
  messageId: string;
  index: number;
}) => {
  const key = `${messageId}-${index}`;

  switch (part.type) {
    case "text":
      return (
        <div key={key} className="my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
        </div>
      );

    case "tool-invocation":
      return (
        <div key={key}>
          {part.toolInvocation.toolName === "generateChart" && (
            <div className="w-full h-[400px] my-4">
              <DynamicChart
                data={part.toolInvocation.args.data}
                type={part.toolInvocation.args.type || "bar"}
              />
            </div>
          )}

          <details className="border border-zinc-300 dark:border-zinc-800 rounded p-4 my-2">
            <summary className="font-medium cursor-pointer flex items-center justify-between">
              <span>Tool: {part.toolInvocation.toolName}</span>
              {(part.toolInvocation as any).result === undefined && (
                <span className="text-sm text-zinc-500">Loading...</span>
              )}
            </summary>
            <div className="text-sm mt-4">
              <div className="mb-2">
                <span className="font-medium">Arguments:</span>
                <pre className="mt-1 bg-zinc-100 dark:bg-zinc-900 p-2 rounded">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-medium">Result:</span>
                <pre className="mt-1 bg-zinc-100 dark:bg-zinc-900 p-2 rounded">
                  <ToolResult result={(part.toolInvocation as any).result} />
                </pre>
              </div>
            </div>
          </details>
        </div>
      );

    default:
      return null;
  }
};

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col w-full max-w-3xl py-8 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? (
            <span>👤 User: </span>
          ) : (
            <span>🤖 AI: </span>
          )}

          {message.parts.map((part, i) => (
            <MessagePart
              key={`${message.id}-${i}`}
              part={part}
              messageId={message.id}
              index={i}
            />
          ))}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-3xl p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl bg-white"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
