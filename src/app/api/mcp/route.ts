import { mcpServers } from "../../../config.json";
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  return new Response(JSON.stringify(mcpServers));
}

export async function POST(req: Request) {
  try {
    const { mcpServer, config } = await req.json();
    
    // Validate the input
    if (!mcpServer || typeof mcpServer !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid server name" }), { status: 400 });
    }
    
    if (!config || !config.command || !Array.isArray(config.args) || typeof config.env !== 'object') {
      return new Response(JSON.stringify({ error: "Invalid server configuration" }), { status: 400 });
    }
    
    // Create updated config
    const updatedConfig = {
      ...mcpServers,
      [mcpServer]: config
    };
    
    // Path to config.json file
    const configPath = path.join(process.cwd(), 'src', 'config.json');
    
    // Read existing config file
    const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Update mcpServers in the config file
    configFile.mcpServers = updatedConfig;
    
    // Write updated config back to file
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2), 'utf8');
    
    return new Response(JSON.stringify({ success: true, mcpServer }));
  } catch (error) {
    console.error('Error adding MCP server:', error);
    return new Response(JSON.stringify({ error: "Failed to add MCP server" }), { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { mcpServer } = await req.json();
  const configPath = path.join(process.cwd(), 'src', 'config.json');
  const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  delete configFile.mcpServers[mcpServer];
  fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2), 'utf8');
  return new Response(JSON.stringify({ success: true, mcpServer }));
}
