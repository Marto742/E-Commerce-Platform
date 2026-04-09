'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string
  slug: string
  description: string
  categorySlug: string
  basePrice: number
  comparePrice?: number
  isActive: boolean
  isFeatured: boolean
  variantSku?: string
  variantName?: string
  variantPrice?: number
  variantStock: number
  variantAttributes?: Record<string, string>
}

interface ParseError {
  row: number
  error: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: Array<{ row: number; slug: string; error: string }>
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

const REQUIRED_HEADERS = ['name', 'slug', 'category_slug', 'base_price']

function parseCSV(text: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return { rows: [], errors: [{ row: 0, error: 'File has no data rows' }] }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  for (const req of REQUIRED_HEADERS) {
    if (!headers.includes(req)) {
      return { rows: [], errors: [{ row: 0, error: `Missing required column: ${req}` }] }
    }
  }

  const col = (name: string) => headers.indexOf(name)

  const rows: ParsedRow[] = []
  const errors: ParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1
    // Simple CSV split — handles quoted fields
    const cells = splitCSVLine(lines[i])

    const get = (name: string) => cells[col(name)]?.trim() ?? ''

    const basePriceRaw = get('base_price')
    const basePrice = parseFloat(basePriceRaw)
    if (!get('name') || !get('slug') || !get('category_slug') || isNaN(basePrice)) {
      errors.push({
        row: rowNum,
        error: `Row ${rowNum}: missing required field (name, slug, category_slug, base_price)`,
      })
      continue
    }

    const comparePriceRaw = get('compare_price')
    const comparePrice =
      comparePriceRaw && !isNaN(parseFloat(comparePriceRaw))
        ? parseFloat(comparePriceRaw)
        : undefined

    const variantPriceRaw = get('variant_price')
    const variantPrice =
      variantPriceRaw && !isNaN(parseFloat(variantPriceRaw))
        ? parseFloat(variantPriceRaw)
        : undefined

    const variantStockRaw = get('variant_stock')
    const variantStock = variantStockRaw ? parseInt(variantStockRaw, 10) : 0

    let variantAttributes: Record<string, string> | undefined
    const attrRaw = get('variant_attributes')
    if (attrRaw) {
      try {
        variantAttributes = JSON.parse(attrRaw) as Record<string, string>
      } catch {
        variantAttributes = {}
      }
    }

    rows.push({
      name: get('name'),
      slug: get('slug'),
      description: get('description'),
      categorySlug: get('category_slug'),
      basePrice,
      comparePrice,
      isActive: get('is_active').toLowerCase() !== 'false',
      isFeatured: get('is_featured').toLowerCase() === 'true',
      variantSku: get('variant_sku') || undefined,
      variantName: get('variant_name') || undefined,
      variantPrice,
      variantStock: isNaN(variantStock) ? 0 : variantStock,
      variantAttributes,
    })
  }

  return { rows, errors }
}

function splitCSVLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

// ─── Sample CSV ───────────────────────────────────────────────────────────────

const SAMPLE_CSV = `name,slug,description,category_slug,base_price,compare_price,is_active,is_featured,variant_sku,variant_name,variant_price,variant_stock,variant_attributes
Classic T-Shirt,classic-t-shirt,Comfortable everyday tee,apparel,29.99,39.99,true,false,TSHIRT-SM,Small,29.99,50,"{""Size"":""S""}"
Classic T-Shirt,classic-t-shirt,Comfortable everyday tee,apparel,29.99,39.99,true,false,TSHIRT-MD,Medium,29.99,75,"{""Size"":""M""}"
Wireless Headphones,wireless-headphones-v2,Premium sound quality,electronics,149.99,,true,true,WH-BLACK,Black,149.99,20,"{""Color"":""Black""}"
`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'products-import-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

type Stage = 'upload' | 'preview' | 'result'

export default function ImportProductsPage() {
  const [stage, setStage] = useState<Stage>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setParseErrors([{ row: 0, error: 'Please upload a .csv file' }])
      setRows([])
      setStage('upload')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { rows: parsed, errors } = parseCSV(text)
      setRows(parsed)
      setParseErrors(errors)
      if (parsed.length > 0) setStage('preview')
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = (await res.json()) as { data: ImportResult }
      setResult(json.data)
      setStage('result')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStage('upload')
    setRows([])
    setParseErrors([])
    setResult(null)
    setImportError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Count unique products in preview
  const uniqueSlugs = new Set(rows.map((r) => r.slug))

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Products</h1>
          <p className="text-sm text-slate-500">
            Bulk import products and variants from a CSV file
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadSample}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download sample CSV
          </button>
          <Link
            href="/products"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to products
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'result'] as Stage[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300">/</span>}
            <span
              className={
                stage === s
                  ? 'font-semibold text-blue-600'
                  : stage === 'result' || (stage === 'preview' && s === 'upload')
                    ? 'text-slate-400'
                    : 'text-slate-400'
              }
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Stage: Upload ── */}
      {stage === 'upload' && (
        <div className="space-y-6">
          {/* CSV format guide */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-800">CSV Format</h2>
            <p className="mb-3 text-sm text-slate-600">
              One row per product-variant combination. Repeat the same slug to add multiple variants
              to the same product.
            </p>
            <div className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs font-mono text-slate-700">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {[
                      'name*',
                      'slug*',
                      'description',
                      'category_slug*',
                      'base_price*',
                      'compare_price',
                      'is_active',
                      'is_featured',
                      'variant_sku',
                      'variant_name',
                      'variant_price',
                      'variant_stock',
                      'variant_attributes',
                    ].map((h) => (
                      <th key={h} className="border-b border-slate-200 px-2 pb-1 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-500">
                    <td className="px-2 py-1">T-Shirt</td>
                    <td className="px-2 py-1">t-shirt</td>
                    <td className="px-2 py-1">A comfy tee</td>
                    <td className="px-2 py-1">apparel</td>
                    <td className="px-2 py-1">29.99</td>
                    <td className="px-2 py-1">39.99</td>
                    <td className="px-2 py-1">true</td>
                    <td className="px-2 py-1">false</td>
                    <td className="px-2 py-1">TSHIRT-SM</td>
                    <td className="px-2 py-1">Small</td>
                    <td className="px-2 py-1">29.99</td>
                    <td className="px-2 py-1">50</td>
                    <td className="px-2 py-1">
                      {'{'}&#34;Size&#34;:&#34;S&#34;{'}'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400">* Required columns</p>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-8 py-16 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
          >
            <svg
              className="mb-4 h-12 w-12 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mb-2 text-sm font-medium text-slate-700">Drop your CSV file here</p>
            <p className="mb-4 text-xs text-slate-400">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Choose file
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-semibold text-red-700">Parse errors:</p>
              <ul className="space-y-1 text-sm text-red-600">
                {parseErrors.map((e, i) => (
                  <li key={i}>{e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Stage: Preview ── */}
      {stage === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{uniqueSlugs.size} products</span> (
              {rows.length} rows) ready to import
            </p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Change file
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${uniqueSlugs.size} products`}
              </button>
            </div>
          </div>

          {importError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {importError}
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                {parseErrors.length} rows skipped due to parse errors:
              </p>
              <ul className="space-y-1 text-sm text-amber-700">
                {parseErrors.map((e, i) => (
                  <li key={i}>{e.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Slug</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Price</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Variant SKU</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Variant</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{row.slug}</td>
                      <td className="px-4 py-2.5 text-slate-700">{row.categorySlug}</td>
                      <td className="px-4 py-2.5 text-slate-900">
                        ${row.basePrice.toFixed(2)}
                        {row.comparePrice && (
                          <span className="ml-1 text-xs text-slate-400 line-through">
                            ${row.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                        {row.variantSku ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {row.variantName ?? '—'}
                        {row.variantPrice != null && (
                          <span className="ml-1 text-xs text-slate-400">
                            ${row.variantPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{row.variantStock}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {row.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {row.isFeatured && (
                            <span className="inline-flex w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage: Result ── */}
      {stage === 'result' && result && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-3xl font-bold text-emerald-700">{result.imported}</p>
              <p className="mt-1 text-sm font-medium text-emerald-600">Products imported</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <p className="text-3xl font-bold text-slate-700">{result.skipped}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Skipped</p>
            </div>
            <div
              className={`rounded-xl border p-5 text-center ${
                result.errors.length > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            >
              <p
                className={`text-3xl font-bold ${
                  result.errors.length > 0 ? 'text-red-700' : 'text-slate-700'
                }`}
              >
                {result.errors.length}
              </p>
              <p
                className={`mt-1 text-sm font-medium ${
                  result.errors.length > 0 ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                Errors
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <p className="text-sm font-semibold text-red-800">Import errors</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-4 py-2 font-medium text-slate-600">Row</th>
                    <th className="px-4 py-2 font-medium text-slate-600">Slug</th>
                    <th className="px-4 py-2 font-medium text-slate-600">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-slate-500">{e.row}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{e.slug}</td>
                      <td className="px-4 py-2 text-red-600">{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Import another file
            </button>
            <Link
              href="/products"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View products
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
