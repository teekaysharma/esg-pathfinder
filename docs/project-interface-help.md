# Project Interface Help Guide

This guide explains the end-to-end interface workflow for ESG Pathfinder so users can complete a project from setup through export.

## 1) Sign in and access your workspace

1. Open the app and sign in with your account.
2. Confirm you land on the dashboard with your accessible projects.
3. If your organization uses role-based controls, verify your expected permissions (admin, analyst, auditor, viewer).

## 2) Dashboard step: create or select a project

1. Use the dashboard project list to open an existing project, or create a new one.
2. Confirm core project metadata is complete (name, org, reporting period, owner).
3. Review high-level status widgets before entering the project workspace.

**Tip:** Use this step to set reporting boundaries early to reduce rework in downstream assessments.

## 3) Project workspace step: establish scope

Within the project page:

1. Open scope parsing / scope setup tools.
2. Enter business context, boundaries, and material entities.
3. Validate the parsed scope output and correct ambiguous items.
4. Save scope and confirm readiness dependencies are updated.

## 4) Framework assessment step (per standard)

Complete each enabled standard module in sequence:

- TCFD assessment
- CSRD assessment
- ISSB / IFRS assessment
- GRI assessment
- SASB assessment
- RJC assessment (if applicable)
- VSME assessment (for voluntary SME reporting)

For each module:

1. Populate governance/process inputs.
2. Enter required qualitative and quantitative datapoints.
3. Review generated gaps and remediation recommendations.
4. Save and re-open to confirm persistence.

## 5) Data points and compliance checks step

1. Open shared data-point collection for the project.
2. Add missing datapoints surfaced by framework assessments.
3. Run data-point validation where available.
4. Open compliance checks and resolve failed or warning checks.

## 6) Standards readiness step

1. Open project standards readiness summary.
2. Review coverage score per framework.
3. Prioritize missing requirements and suggested next actions.
4. Re-run assessments as needed until target readiness is reached.

## 7) Workflows and execution tracking step

1. Create/assign tasks for unresolved gaps.
2. Track owners, due dates, and completion status.
3. Link evidence artifacts to completed actions.
4. Ensure blockers are cleared before report generation.

## 8) Reports step: generate and review outputs

1. Navigate to report generation for the project.
2. Select target format and framework coverage.
3. Generate report and review output for completeness.
4. If required, download artifacts in supported formats.

## 9) Settings step: environment and controls

In settings pages:

1. Verify organization defaults and reporting configurations.
2. Review policy controls and integration options.
3. Confirm audit settings and retention expectations.

## 10) Admin step (admin users)

Admin users should complete:

1. User management and role assignments.
2. Audit log review for critical actions.
3. Standards ingestion operations for framework updates.

## 11) Standards ingestion step (licensed/protected sources)

For password-protected standards packages:

1. Populate CSV templates in `templates/standards-ingestion/`.
2. Build ingestion JSON:

```bash
npm run standards:build-ingestion -- \
  --input-dir templates/standards-ingestion \
  --output standards-ingestion.json
```

3. Submit payload to `POST /api/v1/admin/standards/ingestions`.
4. Verify ingestion job history in admin APIs.

## 12) Recommended operating rhythm

- **Weekly:** refresh assessments, resolve warnings, monitor readiness deltas.
- **Monthly:** review evidence quality, close stale workflow tasks.
- **Quarterly/reporting-cycle:** freeze scope, run final validations, generate reports, archive outputs.

## Troubleshooting checklist

- Authentication issues: clear session and re-login.
- Missing project data: confirm active project ID and role permissions.
- Readiness not improving: check unresolved datapoints/compliance checks.
- Ingestion errors: validate required CSV columns and enum values before posting.

## Related docs

- `README.md`
- `docs/standards-registry-contract.md`
- `templates/standards-ingestion/README.md`

## Maintainer note

The in-app help page (`/help/project-interface`) now consumes shared help content from:

- `src/lib/help-content.ts`

When updating workflow guidance, prefer updating shared content first, then validate both:

1. In-app page (`/help/project-interface`)
2. This document (`docs/project-interface-help.md`)
