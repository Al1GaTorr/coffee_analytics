# Postmortem: Order Service Configuration Failure

## Summary

The simulated incident caused the coffee order processing flow to fail when the Order Service could not reach a required upstream dependency. Customers could browse coffee items but could not reliably process claimed orders.

## Root Cause

The Order Service had an incorrect upstream URL for a dependency such as Payment or Catalog. This produced 502-style failures during the process step.

## Timeline

| Time | Event |
| --- | --- |
| T+00 | Configuration issue introduced |
| T+01 | Prometheus detects elevated errors |
| T+03 | Logs confirm upstream dependency failure |
| T+06 | Environment variable corrected |
| T+08 | Order Service restarted |
| T+10 | Metrics normalize and order workflow succeeds |

## What Went Well

- Health endpoints made service status easy to verify.
- Metrics exposed latency, uptime, and error-rate signals.
- The order workflow preserved failed order state for debugging.

## What Went Wrong

- Configuration was not validated before deployment.
- In-memory demo repositories do not preserve state across restarts.

## Action Items

| Action | Owner | Priority |
| --- | --- | --- |
| Add deployment-time config validation | SRE | High |
| Add persistent PostgreSQL adapters | Backend | Medium |
| Add synthetic order workflow probe | SRE | High |
| Add rollback runbook | SRE | Medium |
