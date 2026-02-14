# GRI Implementation Notes (Aligned to 2021 Universal Standards + 2025 Taxonomy)

This project now supports explicit GRI reporting-path validation for project assessments:

- `IN_ACCORDANCE`
- `WITH_REFERENCE`

## API: `POST /api/v1/projects/{id}/gri/assessment`

Additional request fields supported:

- `reportingPath`: `IN_ACCORDANCE | WITH_REFERENCE`
- `contentIndexUrl`: URL/string location for GRI Content Index (required)
- `statementOfUse`: reporting statement text (required)
- `notifyGRI`: required `true` when `WITH_REFERENCE`
- `disclosures`: submitted disclosure IDs (e.g., `2-1`, `2-2`, ... `3-3`)
- `omissions`: array of `{ disclosureId, reason, explanation? }`
- `sectorStandardsApplied`: applied sector standards
- `excludedLikelyMaterialTopics`: array of `{ topic, rationale }`

Validation behavior:

- For `IN_ACCORDANCE`, checks required Universal/Material disclosures (`2-1..2-30`, `3-1..3-3`) are included.
- For `WITH_REFERENCE`, enforces `notifyGRI=true`.
- For omission reasons `LEGAL_PROHIBITION` or `CONFIDENTIALITY`, explanation is required.

The assessment response includes taxonomy mapping metadata and a generated content-index model.
