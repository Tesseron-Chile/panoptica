# Run B-1: Primer Piso Real (Dev Software)

Scope from design doc (section "Fase B"):
- floors.toml ya tiene dev_software con missions y schedule — no changes needed
- Manual trigger endpoint so we can test without waiting for 9am cron
- Dev Software boss prompt: specific to Prometeo repos
- Self-reporting agent: posts FloorUpdate via API when task completes
- Workdoc watcher: detects new workdocs, triggers boss review session
- End-to-end test: trigger → agent runs → workdoc written → floor update posted
- Adjust based on real behavior

Branch: ralph/run-b1 → prometeo
