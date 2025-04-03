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
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load messages from localStorage when component mounts
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const handleClear = () => {
    console.log("Clearing messages");
    setMessages([]);
    localStorage.removeItem('chatMessages');
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
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-500 text-white ml-4"
                  : "bg-gray-100 dark:bg-zinc-800 mr-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "user" ? (
                  <span className="text-sm">👤 You</span>
                ) : (
                  <span className="text-sm">🤖 AI</span>
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

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-3xl mb-8">
        <div className="relative flex items-center">
          <input
            className="w-full p-4 pr-24 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={input}
            placeholder="Type your message..."
            onChange={handleInputChange}
          />
          <div className="absolute right-3 flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
            <button
              type="submit"
              className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
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
