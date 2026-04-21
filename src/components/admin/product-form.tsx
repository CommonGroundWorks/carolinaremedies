'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import type { ProductWithRelations, Category } from '@/types/database.types'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and dashes only'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  base_price: z.coerce.number().positive('Price must be positive'),
  category_id: z.string().uuid('Select a category'),
  status: z.enum(['active', 'draft']),
  stock_quantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
  lab_results_url: z.string().url().optional().or(z.literal('')),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product: ProductWithRelations | null
  categories: Category[]
  onSaved: () => void
  onCancel: () => void
}

export function ProductForm({ product, categories, onSaved, onCancel }: ProductFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const defaultStock = product?.variants?.[0]?.inventory_quantity ?? 0

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      base_price: product?.base_price ? Number(product.base_price) : 0,
      category_id: product?.category_id ?? '',
      status: (product?.status as 'active' | 'draft') ?? 'draft',
      stock_quantity: defaultStock,
      lab_results_url: product?.lab_results_url ?? '',
    },
  })

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    if (!product) {
      setValue('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    setError('')

    try {
      if (product) {
        // Update existing
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: data.name,
            slug: data.slug,
            sku: data.sku,
            description: data.description || null,
            base_price: data.base_price,
            category_id: data.category_id,
            status: data.status,
            lab_results_url: data.lab_results_url || null,
          })
          .eq('id', product.id)

        if (updateError) throw updateError

        // Update default variant stock
        if (product.variants?.[0]) {
          await supabase
            .from('product_variants')
            .update({ inventory_quantity: data.stock_quantity })
            .eq('id', product.variants[0].id)
        }
      } else {
        // Insert new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: data.name,
            slug: data.slug,
            sku: data.sku,
            description: data.description || null,
            base_price: data.base_price,
            category_id: data.category_id,
            status: data.status,
            lab_results_url: data.lab_results_url || null,
          })
          .select('id')
          .single()

        if (insertError) throw insertError

        // Create default variant
        await supabase.from('product_variants').insert({
          product_id: newProduct.id,
          name: 'Default',
          sku: data.sku,
          price: data.base_price,
          inventory_quantity: data.stock_quantity,
          position: 0,
        })
      }

      onSaved()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save product'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'w-full px-3 py-2 bg-cream-300/5 border border-cream-300/[0.12] text-cream-200 text-sm focus:outline-none focus:border-primary-500'
  const labelClass = 'block text-xs uppercase tracking-wider text-cream-500 mb-1'
  const errorClass = 'text-xs text-red-400 mt-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <h2 className="font-display text-xl text-cream-100 mb-6">
        {product ? 'Edit Product' : 'New Product'}
      </h2>

      {error && (
        <div className="p-3 text-sm bg-red-900/30 border border-red-700/50 text-red-300 rounded">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input {...register('name', { onChange: handleNameChange })} className={fieldClass} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input {...register('slug')} className={fieldClass} />
          {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>SKU</label>
          <input {...register('sku')} className={fieldClass} />
          {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select {...register('category_id')} className={fieldClass}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className={errorClass}>{errors.category_id.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea {...register('description')} rows={4} className={fieldClass} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Price ($)</label>
          <input type="number" step="0.01" {...register('base_price')} className={fieldClass} />
          {errors.base_price && <p className={errorClass}>{errors.base_price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Stock Quantity</label>
          <input type="number" {...register('stock_quantity')} className={fieldClass} />
          {errors.stock_quantity && <p className={errorClass}>{errors.stock_quantity.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select {...register('status')} className={fieldClass}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Lab Results URL</label>
        <input type="url" {...register('lab_results_url')} className={fieldClass} placeholder="https://…" />
        {errors.lab_results_url && <p className={errorClass}>{errors.lab_results_url.message}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-xs uppercase tracking-widest bg-primary-600 text-cream-100 hover:bg-primary-700 transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2.5 text-xs uppercase tracking-widest border border-cream-300/[0.12] text-cream-400 hover:text-cream-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
