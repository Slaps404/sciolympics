# Supabase MCP + skills in Cursor

Supabase’s dashboard instructions target **Claude Code CLI**. In **Cursor**, use the equivalents below.

## 1. MCP server (project config)

Already configured in [`.cursor/mcp.json`](../.cursor/mcp.json) (scoped to project `tenvdkinyvhdlitkwzru`).

Legacy duplicate at repo root: [`.mcp.json`](../.mcp.json) — Cursor reads **`.cursor/mcp.json`** first.

**Claude Code equivalent (do not run in Cursor-only workflow):**

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=tenvdkinyvhdlitkwzru"
```

## 2. Authenticate (Cursor)

**Not** `claude /mcp` — that is Claude Code only.

1. Open **Cursor Settings → Tools & MCP** (or **Features → MCP**)
2. Find the **supabase** server
3. Click **Authenticate** / **Connect** — browser opens for Supabase login
4. Pick the org that owns project `tenvdkinyvhdlitkwzru`
5. **Restart Cursor** if tools do not appear

**Verify:** Ask the agent: “List tables in the database using Supabase MCP.”

### CI / no browser (optional)

Create a [Personal Access Token](https://supabase.com/dashboard/account/tokens) and add headers in `.cursor/mcp.json` (do not commit the token):

```json
"headers": {
  "Authorization": "Bearer YOUR_PAT"
}
```

Prefer OAuth in the IDE for local dev.

## 3. Agent skills (optional)

Installed into [`.agents/skills/`](../.agents/skills/) via:

```bash
npx skills add supabase/agent-skills -y
```

Skills: `supabase`, `supabase-postgres-best-practices`. Cursor picks them up from `.agents/skills` after restart.

Re-run from repo root to update:

```bash
npx skills add supabase/agent-skills -y
```

## Security (short)

- Use MCP against **dev** data, not production
- Keep **manual approval** on MCP tool calls in Cursor
- Optional: add `&read_only=true` to the MCP URL for safer queries
