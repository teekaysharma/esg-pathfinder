# Standards ingestion CSV templates

Fill these CSV files from your licensed framework source package, then build one JSON payload for `POST /api/v1/admin/standards/ingestions`.

## Files

- `framework.csv`: single row describing framework/version metadata.
- `disclosures.csv`: one row per disclosure requirement.
- `datapoints.csv`: one row per datacollection field mapped to disclosure(s).
- `validation-rules.csv`: one row per validation rule.

## Build JSON

```bash
node scripts/standards/build-ingestion-from-csv.mjs \
  --input-dir templates/standards-ingestion \
  --output standards-ingestion.json
```

Then POST the generated JSON to:

- `POST /api/v1/admin/standards/ingestions`

For full field definitions see `docs/standards-registry-contract.md`.


### Framework code notes
Use `frameworkCode` values supported by ingestion schema: `GRI`, `ISSB`, `ESRS`, `SASB`, `TCFD`, `RJC`, `VSME`.
