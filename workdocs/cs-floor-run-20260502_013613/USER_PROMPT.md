# User Prompt

Implement the **Customer Service floor** for the Prometeo Company OS (panoptica project).

The full design spec is in `workdocs/customer_service/2026-05-02-cs-design.md`.

## Summary of what to build

A new floor (`customer_service`) in the Prometeo building that:

1. **Monitors `prometeo@tesseron.cl` every 30 minutes** via Gmail MCP
2. **Classifies each email** as: Bug, Consulta, Feature Request, or Spam
3. **Acts per category:**
   - Bug → create Linear ticket + reply to customer (ask for more info if needed)
   - Consulta → read Obsidian vault (`vault/customer_service/`) + reply with public info
   - Feature Request → send standard reply ("we'll evaluate with product team")
   - Spam → do nothing, log in workdoc
4. **Saves a workdoc per interaction** in `workdocs/customer_service/`
5. **Marks processed emails** with Gmail label `cs-procesado`
6. **Posts updates** to the Updates Board (alert for bugs, info for queries)
7. **Supports manual triggers** from floor chat, C-Level directives, and API

## Key infrastructure changes

- `floors.toml`: new `customer_service` floor with `every_30min` schedule, `inbox_email`, `gmail_label`, `linear_project`, `knowledge_vault` fields
- `scheduler.py`: add support for `every_30min` schedule type
- `vault/customer_service/`: create Obsidian vault with folder structure and placeholder notes
- Boss prompt at `backend/prompts/customer_service_boss.md`

## Context

- Branch: `prometeo`
- Repo: Tesseron-Chile/panoptica
- Design spec: `workdocs/customer_service/2026-05-02-cs-design.md`
- Existing infrastructure: agent_runner.py, Gmail MCP, Linear MCP, floors.toml schema, workdoc pipeline all exist and work
