'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStorefront } from '@/components/layout/storefront-provider'
import {
  STOREFRONT_SETTINGS_ID,
  normalizeSiteSettings,
} from '@/lib/site-settings'
import { supabase } from '@/lib/supabase'
import { ProductForm } from '@/components/admin/product-form'
import { CsvImport } from '@/components/admin/csv-import'
import type { ProductWithRelations, Category } from '@/types/database.types'

type Tab = 'products' | 'add' | 'import' | 'settings'

export default function AdminPage() {
  const { shoppingEnabled, settings, setSettings } = useStorefront()
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('products')
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [storefrontShoppingEnabled, setStorefrontShoppingEnabled] = useState(shoppingEnabled)
  const [savingStorefront, setSavingStorefront] = useState(false)
  const [storefrontError, setStorefrontError] = useState<string | null>(null)
  const [storefrontNotice, setStorefrontNotice] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*), images:product_images(*)')
      .order('created_at', { ascending: false })
    setProducts((data ?? []) as unknown as ProductWithRelations[])
    setLoading(false)
  }, [])

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setCategories((data ?? []) as Category[])
  }, [])

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  useEffect(() => {
    setStorefrontShoppingEnabled(shoppingEnabled)
  }, [shoppingEnabled])

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    setDeleteConfirm(null)
    loadProducts()
  }

  const handleEdit = (product: ProductWithRelations) => {
    setEditingProduct(product)
    setTab('add')
  }

  const handleSaved = () => {
    setEditingProduct(null)
    setTab('products')
    loadProducts()
  }

  const handleImported = () => {
    setTab('products')
    loadProducts()
  }

  const handleStorefrontSave = async () => {
    setSavingStorefront(true)
    setStorefrontError(null)
    setStorefrontNotice(null)

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        id: STOREFRONT_SETTINGS_ID,
        shopping_enabled: storefrontShoppingEnabled,
      })
      .select('*')
      .maybeSingle()

    if (error) {
      setStorefrontError(error.message)
      setSavingStorefront(false)
      return
    }

    const nextSettings = normalizeSiteSettings(
      data ?? {
        id: STOREFRONT_SETTINGS_ID,
        shopping_enabled: storefrontShoppingEnabled,
      }
    )

    setSettings(nextSettings)
    setStorefrontNotice(
      nextSettings.shopping_enabled
        ? 'Shopping is enabled across the storefront.'
        : 'Catalog mode is enabled. Add-to-cart and checkout are hidden.'
    )
    setSavingStorefront(false)
  }

  return (
    <div>
      {/* Tabs */}
      <nav className="flex gap-4 mb-8 border-b border-cream-300/[0.08] pb-4">
        {([
          { key: 'products', label: 'Products' },
          { key: 'add', label: editingProduct ? 'Edit Product' : 'Add Product' },
          { key: 'import', label: 'Import CSV' },
          { key: 'settings', label: 'Settings', badge: !shoppingEnabled ? 'Catalog' : null },
        ] as { key: Tab; label: string; badge?: string | null }[]).map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key !== 'add') setEditingProduct(null) }}
            className={`flex items-center gap-1.5 text-xs uppercase tracking-wider pb-2 transition-colors ${
              tab === key
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-cream-500 hover:text-cream-300'
            }`}
          >
            {label}
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Products list */}
      {tab === 'products' && (
        <div>
          {loading ? (
            <p className="text-cream-500 text-sm">Loading…</p>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="font-display text-2xl text-cream-200 mb-2">No products yet</h2>
              <p className="text-cream-500 text-sm mb-6">Get started by adding your first product or importing from CSV.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setTab('add')}
                  className="px-4 py-2 text-xs uppercase tracking-wider bg-primary-600 text-cream-100 hover:bg-primary-700 transition-colors"
                >
                  Create First Product
                </button>
                <button
                  onClick={() => setTab('import')}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-cream-300/[0.12] text-cream-400 hover:text-cream-200 transition-colors"
                >
                  Import CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-cream-500 border-b border-cream-300/[0.08]">
                    <th className="pb-3 pr-4 w-10"></th>
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Stock</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const totalStock = product.variants?.reduce((s, v) => s + v.inventory_quantity, 0) ?? 0
                    return (
                      <tr key={product.id} className="border-b border-cream-300/[0.04] text-cream-300">
                        <td className="py-2 pr-4">
                          {product.images?.[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt_text ?? product.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholders/product-default.svg' }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-cream-300/10 flex items-center justify-center">
                              <span className="text-cream-600 text-xs">—</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-cream-200">{product.name}</div>
                          <div className="text-xs text-cream-500">{product.sku}</div>
                        </td>
                        <td className="py-3 pr-4">{product.category?.name ?? '—'}</td>
                        <td className="py-3 pr-4 font-mono text-xs">${Number(product.base_price).toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <span className={totalStock <= 5 ? 'text-red-400' : 'text-green-400'}>
                            {totalStock}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded ${product.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-cream-300/5 text-cream-500'}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-xs text-primary-400 hover:text-primary-300"
                            >
                              Edit
                            </button>
                            {deleteConfirm === product.id ? (
                              <>
                                <button onClick={() => handleDelete(product.id)} className="text-xs text-red-400 hover:text-red-300">
                                  Confirm
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-xs text-cream-500">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeleteConfirm(product.id)} className="text-xs text-red-400/60 hover:text-red-400">
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit product */}
      {tab === 'add' && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSaved={handleSaved}
          onCancel={() => { setEditingProduct(null); setTab('products') }}
        />
      )}

      {/* Import CSV */}
      {tab === 'import' && (
        <CsvImport categories={categories} onImported={handleImported} />
      )}

      {/* Basic storefront settings */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="font-display text-xl text-cream-100 mb-2">Storefront Settings</h2>
            <p className="text-cream-500 text-sm">
              Keep the public site in simple catalog mode until you are ready to
              accept orders.
            </p>
          </div>

          {storefrontError && (
            <div className="p-3 text-sm bg-red-900/30 border border-red-700/50 text-red-300 rounded">
              {storefrontError}
            </div>
          )}

          {storefrontNotice && (
            <div className="p-3 text-sm bg-green-900/30 border border-green-700/50 text-green-300 rounded">
              {storefrontNotice}
            </div>
          )}

          <div className="p-6 border border-cream-300/[0.08] bg-cream-300/[0.03] space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cream-500 mb-2">
                  Current Mode
                </p>
                <p className="font-display text-2xl text-cream-100">
                  {storefrontShoppingEnabled ? 'Shopping Enabled' : 'Catalog Only'}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded uppercase tracking-[0.16em] ${
                  storefrontShoppingEnabled
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'bg-cream-300/5 text-cream-400 border border-cream-300/[0.12]'
                }`}
              >
                {storefrontShoppingEnabled ? 'Cart Live' : 'Catalog'}
              </span>
            </div>

            <label className="flex items-start gap-3 text-sm text-cream-300">
              <input
                type="checkbox"
                checked={storefrontShoppingEnabled}
                onChange={(event) => setStorefrontShoppingEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 accent-primary-500"
              />
              <span>
                Enable shopping cart and checkout for the public storefront.
              </span>
            </label>

            <p className="text-xs leading-relaxed text-cream-600">
              When this is off, the site behaves like a simple catalog. Customers can
              browse products, while admins can still add products and update inventory.
            </p>

            {settings.updated_at && (
              <p className="text-xs text-cream-600">
                Last updated:{' '}
                <span className="font-mono text-cream-500">
                  {new Date(settings.updated_at).toLocaleString()}
                </span>
              </p>
            )}

            <button
              onClick={handleStorefrontSave}
              disabled={savingStorefront}
              className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary-600 text-cream-100 hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingStorefront ? 'Saving…' : 'Save Setting'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
