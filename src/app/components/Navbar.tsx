"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Agent AI</span>
            </div>
            <div className="ml-6 flex space-x-4 items-center">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/" 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Chat
              </Link>
              <Link
                href="/mcp"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/mcp" 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                MCP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 