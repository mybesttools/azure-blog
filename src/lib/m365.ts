import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Entra ID accounts are managed through the mcp-m365-mgmt service
// (https://mcpm365-web.azurewebsites.net), which does the actual Microsoft
// Graph calls. M365_MCP_SECRET should be a client secret created on that
// service's /admin page and scoped to only the tools used here:
// get_user_info and set_user_password.
async function callTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { M365_MCP_URL, M365_MCP_SECRET } = process.env;
  if (!M365_MCP_URL || !M365_MCP_SECRET) {
    throw new Error('M365_MCP_URL/M365_MCP_SECRET are not configured');
  }

  const client = new Client({ name: 'azure-blog', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(M365_MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${M365_MCP_SECRET}` } },
  });

  await client.connect(transport);
  try {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) {
      throw new Error(`[m365] ${name} failed: ${JSON.stringify(result.content)}`);
    }
    if (result.structuredContent) {
      // FastMCP wraps non-object return values as { result: ... }.
      const structured = result.structuredContent as Record<string, unknown>;
      return ('result' in structured ? structured.result : structured) as T;
    }
    const text = (result.content as { type: string; text?: string }[]).find((c) => c.type === 'text')?.text;
    return JSON.parse(text ?? 'null') as T;
  } finally {
    await client.close();
  }
}

export interface EntraUser {
  id: string;
  displayName: string | null;
  userPrincipalName: string;
  mail: string | null;
  accountEnabled: boolean | null;
}

// Returns null if no such user exists (or the lookup failed for any other
// reason Graph reports, e.g. a malformed name).
export async function getEntraUser(userPrincipalName: string): Promise<EntraUser | null> {
  const result = await callTool<EntraUser & { error?: string; status_code?: number }>('get_user_info', {
    user_id: userPrincipalName,
  });
  if (result.error) {
    if (result.status_code !== 404) {
      console.error('[m365] get_user_info error:', result.status_code, result.error);
    }
    return null;
  }
  return result;
}

// Returns null on success, or Graph's error message (e.g. the password doesn't
// meet the tenant's complexity requirements).
export async function setEntraUserPassword(userId: string, password: string): Promise<string | null> {
  const result = await callTool<{ success?: boolean; error?: string; status_code?: number }>('set_user_password', {
    user_id: userId,
    password,
    force_change_password_next_sign_in: false,
  });
  if (result.success) {
    return null;
  }
  console.error('[m365] set_user_password error:', result.status_code, result.error);
  try {
    return JSON.parse(result.error ?? '').error?.message ?? 'Unknown error';
  } catch {
    return result.error ?? 'Unknown error';
  }
}
