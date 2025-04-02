"use client";

import React, { useEffect, useState } from "react";

export default function MCP() {
  const [mcpServers, setMcpServers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New MCP server form state
  const [serverName, setServerName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([""]);
  const [envs, setEnvs] = useState<Array<{key: string, value: string}>>([{key: "", value: ""}]);

  useEffect(() => {
    fetchMcpServers();
  }, []);

  const fetchMcpServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp');
      if (!response.ok) {
        throw new Error('Failed to fetch MCP servers');
      }
      const data = await response.json();
      setMcpServers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (serverToDelete: string) => {
    if (!confirm(`Are you sure you want to delete the server "${serverToDelete}"?`)) {
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/mcp', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mcpServer: serverToDelete
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete MCP server');
      }

      setSuccessMessage(`MCP server "${serverToDelete}" deleted successfully!`);
      fetchMcpServers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const handleAddArg = () => {
    setArgs([...args, ""]);
  };

  const handleArgChange = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const handleRemoveArg = (index: number) => {
    const newArgs = [...args];
    newArgs.splice(index, 1);
    setArgs(newArgs);
  };

  const handleAddEnv = () => {
    setEnvs([...envs, {key: "", value: ""}]);
  };

  const handleEnvChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvs = [...envs];
    newEnvs[index][field] = value;
    setEnvs(newEnvs);
  };

  const handleRemoveEnv = (index: number) => {
    const newEnvs = [...envs];
    newEnvs.splice(index, 1);
    setEnvs(newEnvs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    // Validate inputs
    if (!serverName.trim()) {
      setError("Server name is required");
      return;
    }
    
    if (!command.trim()) {
      setError("Command is required");
      return;
    }
    
    // Filter out empty args and env entries
    const filteredArgs = args.filter(arg => arg.trim() !== "");
    const filteredEnvs = envs
      .filter(env => env.key.trim() !== "")
      .reduce((acc, {key, value}) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mcpServer: serverName,
          config: {
            command,
            args: filteredArgs,
            env: filteredEnvs
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add MCP server');
      }

      // Clear form
      setServerName("");
      setCommand("");
      setArgs([""]);
      setEnvs([{key: "", value: ""}]);
      setSuccessMessage(`MCP server "${serverName}" added successfully!`);
      
      // Refresh the server list
      fetchMcpServers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900 p-3 rounded mb-4 text-green-800 dark:text-green-200">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 p-3 rounded mb-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      
      <div className="border border-zinc-300 dark:border-zinc-800 rounded p-4 mb-6">
        <h2 className="text-xl font-medium mb-2">MCP Servers</h2>
        {loading ? (
          <p>Loading servers...</p>
        ) : Object.keys(mcpServers).length === 0 ? (
          <p className="text-zinc-500">No MCP servers configured. Add one below.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(mcpServers).map(([serverName, config]) => (
              <div key={serverName} className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{serverName}</h3>
                  <button
                    onClick={() => handleDeleteServer(serverName)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    title="Delete server"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">
                  <p>Command: {(config as any).command}</p>
                  <details className="mt-1">
                    <summary className="cursor-pointer">Configuration Details</summary>
                    <pre className="text-xs mt-2 p-2 bg-zinc-200 dark:bg-zinc-800 rounded overflow-auto">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border border-zinc-300 dark:border-zinc-800 rounded p-4 mb-6">
        <h2 className="text-xl font-medium mb-4">Add New MCP Server</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Server Name
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="mt-1 block w-full rounded border border-zinc-300 dark:border-zinc-700 
                           shadow-sm p-2 bg-white dark:bg-zinc-800"
                  placeholder="e.g., my-server"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Command
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="mt-1 block w-full rounded border border-zinc-300 dark:border-zinc-700 
                           shadow-sm p-2 bg-white dark:bg-zinc-800"
                  placeholder="e.g., node, python, npx"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Arguments
              </label>
              {args.map((arg, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={arg}
                    onChange={(e) => handleArgChange(index, e.target.value)}
                    className="flex-grow rounded-l border border-zinc-300 dark:border-zinc-700 
                             shadow-sm p-2 bg-white dark:bg-zinc-800"
                    placeholder="e.g., --port=3000"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveArg(index)}
                    className="px-3 bg-red-500 text-white rounded-r hover:bg-red-600"
                  >
                    -
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddArg}
                className="mt-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                + Add Argument
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Environment Variables
              </label>
              {envs.map((env, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={env.key}
                    onChange={(e) => handleEnvChange(index, 'key', e.target.value)}
                    className="w-1/3 rounded-l border border-zinc-300 dark:border-zinc-700 
                             shadow-sm p-2 bg-white dark:bg-zinc-800"
                    placeholder="KEY"
                  />
                  <input
                    type="text"
                    value={env.value}
                    onChange={(e) => handleEnvChange(index, 'value', e.target.value)}
                    className="flex-grow border-y border-r border-zinc-300 dark:border-zinc-700 
                             shadow-sm p-2 bg-white dark:bg-zinc-800"
                    placeholder="value"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(index)}
                    className="px-3 bg-red-500 text-white rounded-r hover:bg-red-600"
                  >
                    -
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddEnv}
                className="mt-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                + Add Environment Variable
              </button>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add MCP Server
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 