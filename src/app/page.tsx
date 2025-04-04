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
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useEffect, useRef } from "react";

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
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load messages from localStorage when component mounts
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  return (
    <div className="flex flex-col w-full max-w-3xl py-8 mx-auto stretch">
      <div className="flex-1 overflow-y-auto mb-24">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                message.role === "user"
                  ? "bg-blue-400 text-white dark:bg-zinc-800 ml-4"
                  : "bg-gray-100 dark:bg-zinc-800 mr-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === "user" ? (
                  <span className="text-sm font-medium flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    You
                  </span>
                ) : (
                  <span className="text-sm font-medium flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                    Assistant
                  </span>
                )}
              </div>
              {message.parts.map((part, i) => (
                <MessagePart
                  key={`${message.id}-${i}`}
                  part={part}
                  messageId={message.id}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 w-full max-w-3xl mb-8"
      >
        <div className="relative flex items-center">
          <input
            className="w-full p-4 pr-24 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            value={input}
            placeholder="Type your message..."
            onChange={handleInputChange}
          />
          <div className="absolute right-3 flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-white bg-gray-400 rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
              title="Clear messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
            <button
              type="submit"
              className="p-2 text-white bg-zinc-700 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
