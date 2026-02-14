# Standards Registry & Ingestion API Contract

This document defines the first implementation contract for framework knowledge ingestion.

## Data model (Prisma)

Core entities:
- `StandardFramework` (e.g., GRI, ISSB, ESRS)
- `StandardVersion` (version tag, source URL, effective date, checksum, status)
- `StandardDisclosure` (disclosure IDs and requirement levels)
- `StandardDatapoint` (typed datapoint dictionary)
- `StandardValidationRule` (assertion rules + severity)
- `StandardCrosswalk` (framework interoperability mappings)
- `StandardsIngestionJob` (audit trail for each ingestion run)

## Admin endpoints

### `GET /api/v1/admin/standards/ingestions`
Returns the latest ingestion jobs with framework/version metadata.

### `POST /api/v1/admin/standards/ingestions`
Creates or updates a framework version and ingests disclosure/datapoint/validation rule payloads.

Request body (example):

```json
{
  "frameworkCode": "GRI",
  "versionTag": "2025-06-23",
  "sourceUrl": "https://www.globalreporting.org/taxonomy/gri_srs_2025-06-23.zip",
  "effectiveFrom": "2025-06-23T00:00:00.000Z",
  "notes": "GRI Sustainability Taxonomy package",
  "disclosures": [
    {
      "disclosureId": "2-1",
      "title": "Organizational details",
      "level": 2,
      "mandatoryFor": ["IN_ACCORDANCE"],
      "sectorSpecific": false
    }
  ],
  "datapoints": [
    {
      "code": "gri_TotalNumberOfEmployees",
      "label": "Total number of employees",
      "dataType": "decimalItemType",
      "unit": "Number",
      "dimensionType": "NONE"
    }
  ],
  "validationRules": [
    {
      "ruleCode": "GRI2_EXIST_2_1",
      "severity": "ERROR",
      "assertionType": "existenceAssertion",
      "expression": "exists(2-1)"
    }
  ]
}
```

## Security
- Admin-only via `withAdminAuth()` middleware.
- Each ingestion is captured with creator, status, checksum, and counts in `StandardsIngestionJob`.
