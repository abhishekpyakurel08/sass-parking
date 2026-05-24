# ParkSaaS Pro — Logs Directory

This directory is auto-created at runtime by the Winston logger.

## Log Files

| File                | Level   | Purpose                          |
|---------------------|---------|----------------------------------|
| `error.log`         | error   | Application errors & exceptions  |
| `access.log`        | info    | All HTTP access logs             |
| `security.log`      | warn    | Auth failures, cross-tenant hits |
| `transactions.log`  | info    | Check-in / check-out events      |

Log rotation: 10 MB max per file, 5–10 backups kept.
