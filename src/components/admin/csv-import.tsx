'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database.types'

interface CsvImportProps {
  categories: Category[]
  onImported: () => void
}

interface CsvRow {
  name: string
  slug: string
  sku: string
  description: string
  base_price: string
  category: string
  stock_quantity: string
  status: string
  lab_results_url: string
}

export function CsvImport({ categories, onImported }: CsvImportProps) {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): CsvRow[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
    return lines.slice(1).map((line) => {
      // Handle quoted fields with commas
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      return row as unknown as CsvRow
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('No valid rows found. Ensure the CSV has a header row and at least one data row.')
        return
      }
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    let success = 0
    let failed = 0

    // Build category lookup
    const catMap = new Map(categories.map((c) => [c.slug, c.id]))
    const catNameMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))

    for (const row of rows) {
      try {
        const categoryId = catMap.get(row.category) ?? catNameMap.get(row.category?.toLowerCase())
        if (!categoryId) {
          failed++
          continue
        }

        const price = parseFloat(row.base_price)
        const stock = parseInt(row.stock_quantity ?? '0', 10)
        if (isNaN(price) || price <= 0) { failed++; continue }

        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        const { data: product, error: insertErr } = await supabase
          .from('products')
          .insert({
            name: row.name,
            slug,
            sku: row.sku || slug.toUpperCase().slice(0, 16),
            description: row.description || null,
            base_price: price,
            category_id: categoryId,
            status: row.status === 'active' ? 'active' : 'draft',
            lab_results_url: row.lab_results_url || null,
          })
          .select('id')
          .single()

        if (insertErr) { failed++; continue }

        await supabase.from('product_variants').insert({
          product_id: product.id,
          name: 'Default',
          sku: row.sku || slug.toUpperCase().slice(0, 16),
          price,
          inventory_quantity: isNaN(stock) ? 0 : stock,
          position: 0,
        })

        success++
      } catch {
        failed++
      }
    }

    setResult({ success, failed })
    setRows([])
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
    if (success > 0) onImported()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-xl text-cream-100 mb-2">Import Products from CSV</h2>
      <p className="text-cream-500 text-sm mb-6">
        Upload a CSV with columns: <span className="text-cream-400 font-mono text-xs">name, slug, sku, description, base_price, category, stock_quantity, status, lab_results_url</span>
      </p>

      {error && (
        <div className="mb-4 p-3 text-sm bg-red-900/30 border border-red-700/50 text-red-300 rounded">{error}</div>
      )}

      {result && (
        <div className="mb-4 p-3 text-sm bg-green-900/30 border border-green-700/50 text-green-300 rounded">
          Imported {result.success} products.{result.failed > 0 && ` ${result.failed} rows failed.`}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-cream-400 file:mr-4 file:py-2 file:px-4 file:text-xs file:uppercase file:tracking-wider file:bg-cream-300/5 file:border file:border-cream-300/[0.12] file:text-cream-400 file:cursor-pointer"
      />

      {rows.length > 0 && (
        <div className="mt-6">
          <p className="text-cream-400 text-sm mb-3">{rows.length} rows ready to import</p>
          <div className="max-h-48 overflow-y-auto border border-cream-300/[0.08] rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-cream-500 border-b border-cream-300/[0.08]">
                  <th className="p-2">Name</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="text-cream-300 border-b border-cream-300/[0.04]">
                    <td className="p-2">{row.name}</td>
                    <td className="p-2 font-mono">{row.base_price}</td>
                    <td className="p-2">{row.category}</td>
                    <td className="p-2">{row.stock_quantity}</td>
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr><td colSpan={4} className="p-2 text-cream-500">…and {rows.length - 20} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-4 px-6 py-2.5 text-xs uppercase tracking-widest bg-primary-600 text-cream-100 hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing…' : `Import ${rows.length} Products`}
          </button>
        </div>
      )}
    </div>
  )
}
