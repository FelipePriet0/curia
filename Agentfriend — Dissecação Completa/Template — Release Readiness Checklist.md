# Template — Release Readiness Checklist (Per Increment)

Release Info
- Feature/Increment:
- Owner (A/R):
- Target Env: Dev / Staging / Prod
- Flags: [ ] New [ ] Update [ ] Kill-switch path documented

Risk Assessment
- Change type: Config / Code / Policy / Transport / Shell / MCP / Plugin / Telemetry
- Risk level: Low / Med / High — Justification:

Security & Permissions
- [ ] Permission rules versioned and reviewed (Security)
- [ ] Fail-closed for parse/validation/indeterminate policies
- [ ] FS protections: .git/**, secrets/**, symlinks, UNC/NTLM validated
- [ ] Shell policies: RO classifier, blocked IEX/encoded/download cradles/COM
- [ ] Sandbox policy respected (Windows native: deny shells unless explicitly allowed)

Privacy & Telemetry
- [ ] Minimal events; PII-minimization; IDs pseudonymized
- [ ] Corporate opt-out honored; sampling configured
- [ ] Dashboards updated (TTI, permission latency, retries/drops, 413/429/5xx)

Performance
- [ ] TTI p95 within budget (< 300–500 ms)
- [ ] Permission prompt p95 < 2 s; RW tool p95 < 5 s
- [ ] No startup regressions (checkpoints stable)

Transport & Bridge
- [ ] Flush-before-non-stream honored; batched POST window configured
- [ ] Replay buffer + jittered backoff enabled; drops < 1% p95 in staging
- [ ] Min-version enforcement; tokens short-lived; PII-min payloads

Recovery & Resilience
- [ ] Recovery table scenarios validated (413/429/5xx/timeout)
- [ ] Abortability: subprocess tree kill verified; timeouts enforced
- [ ] Model fallback path tested (if applicable)

Testing & Coverage
- [ ] Concurrency tests (RO parallel, RW serial) green
- [ ] FS path validation tests; PowerShell providers denied
- [ ] Compact/resize tests for large prompts/outputs

Observability & Alerts
- [ ] Dashboards live; alerts thresholds set (TTI, permission, drops)
- [ ] Logs without PII; decision logging enabled (allow/ask/deny)

Rollout & Rollback
- [ ] Canary plan (5%→50%→100%); rollback documented
- [ ] Change Advisory reviewed; stakeholder comms prepared

Approvals
- Product (Informed):
- Tech Lead (Accountable):
- Security (Accountable):
- SRE/Platform (Responsible):
- Legal/Compliance (Consulted/Informed):

Go/No-Go
- Decision:
- Notes:

