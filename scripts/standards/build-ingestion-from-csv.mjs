#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ALLOWED_FRAMEWORKS = new Set(['GRI', 'ISSB', 'ESRS', 'SASB', 'TCFD', 'RJC'])
const REQUIRED_FILES = ['framework.csv', 'disclosures.csv', 'datapoints.csv', 'validation-rules.csv']

function parseArgs(argv) {
  const args = { inputDir: '', output: '' }
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--input-dir') {
      args.inputDir = argv[i + 1] || ''
      i += 1
    } else if (arg === '--output') {
      args.output = argv[i + 1] || ''
      i += 1
    }
  }
  if (!args.inputDir || !args.output) {
    throw new Error('Usage: node scripts/standards/build-ingestion-from-csv.mjs --input-dir <dir> --output <file>')
  }
  return args
}

function parseCsv(content) {
  const rows = []
  let current = ''
  let row = []
  let inQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current.trim())
      current = ''
      if (row.some(cell => cell.length > 0)) rows.push(row)
      row = []
    } else {
      current += char
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim())
    if (row.some(cell => cell.length > 0)) rows.push(row)
  }

  if (rows.length === 0) return []

  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).map((cells, rowIdx) => {
    const obj = {}
    headers.forEach((header, colIdx) => {
      obj[header] = (cells[colIdx] || '').trim()
    })
    obj.__row = rowIdx + 2
    return obj
  })
}

function parseBoolean(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function parseOptionalNumber(value) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseList(value, delimiter = '|') {
  if (!value) return []
  return value
    .split(delimiter)
    .map(part => part.trim())
    .filter(Boolean)
}

function loadCsv(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  return parseCsv(raw)
}

function assertRequiredFiles(inputDir) {
  for (const name of REQUIRED_FILES) {
    const filePath = path.join(inputDir, name)
    try {
      readFileSync(filePath, 'utf8')
    } catch {
      throw new Error(`Missing required file: ${filePath}`)
    }
  }
}

function buildPayload(inputDir) {
  assertRequiredFiles(inputDir)

  const frameworkRows = loadCsv(path.join(inputDir, 'framework.csv'))
  if (!frameworkRows.length) throw new Error('framework.csv must contain exactly one data row')
  const framework = frameworkRows[0]

  if (!ALLOWED_FRAMEWORKS.has(framework.frameworkCode)) {
    throw new Error(`frameworkCode must be one of: ${Array.from(ALLOWED_FRAMEWORKS).join(', ')}`)
  }

  const disclosures = loadCsv(path.join(inputDir, 'disclosures.csv')).map(row => {
    if (!row.disclosureId || !row.title) {
      throw new Error(`disclosures.csv row ${row.__row} missing disclosureId or title`)
    }

    const level = parseOptionalNumber(row.level)

    return {
      disclosureId: row.disclosureId,
      title: row.title,
      level: level ?? 2,
      mandatoryFor: parseList(row.mandatoryFor),
      sectorSpecific: parseBoolean(row.sectorSpecific),
      parentDisclosureId: row.parentDisclosureId || undefined,
    }
  })

  const datapoints = loadCsv(path.join(inputDir, 'datapoints.csv')).map(row => {
    if (!row.code || !row.label || !row.dataType) {
      throw new Error(`datapoints.csv row ${row.__row} missing code, label, or dataType`)
    }

    return {
      code: row.code,
      label: row.label,
      dataType: row.dataType,
      unit: row.unit || undefined,
      allowedValues: parseList(row.allowedValues),
      disclosureId: row.disclosureId || undefined,
      dimensionType: row.dimensionType || 'NONE',
    }
  })

  const validationRules = loadCsv(path.join(inputDir, 'validation-rules.csv')).map(row => {
    if (!row.ruleCode || !row.severity || !row.assertionType || !row.expression) {
      throw new Error(`validation-rules.csv row ${row.__row} missing ruleCode, severity, assertionType, or expression`)
    }

    return {
      ruleCode: row.ruleCode,
      severity: row.severity,
      assertionType: row.assertionType,
      expression: row.expression,
      disclosureId: row.disclosureId || undefined,
    }
  })

  return {
    frameworkCode: framework.frameworkCode,
    versionTag: framework.versionTag,
    sourceUrl: framework.sourceUrl,
    effectiveFrom: framework.effectiveFrom || undefined,
    packageChecksum: framework.packageChecksum || undefined,
    notes: framework.notes || undefined,
    disclosures,
    datapoints,
    validationRules,
  }
}

function main() {
  const { inputDir, output } = parseArgs(process.argv)
  const payload = buildPayload(inputDir)
  writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  process.stdout.write(`Wrote ingestion payload to ${output}\n`)
}

main()
