import { existsSync, readFileSync } from 'fs'
import { basename, extname, resolve } from 'path'
import { createAdminClient } from '../src/lib/supabase'
import { defaultCategories } from '../src/lib/categories'

type SeedRow = Record<string, string>

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function parseCsv(text: string): SeedRow[] {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }

      if (current.length > 0 || row.length > 0) {
        row.push(current.trim())
        rows.push(row)
        row = []
        current = ''
      }
      continue
    }

    current += character
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim())
    rows.push(row)
  }

  if (rows.length < 2) {
    return []
  }

  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map((values) => {
    const record: SeedRow = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record
  })
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toOptionalNumber(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toRequiredNumber(value: string, field: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a valid number`)
  }
  return parsed
}

function toBoolean(value: string): boolean {
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase())
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function detectContentType(fileName: string): string {
  switch (extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}

async function ensureBucket(bucketName: string) {
  const supabase = createAdminClient()
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    throw error
  }

  if (!buckets.some((bucket) => bucket.name === bucketName)) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    })

    if (createError) {
      throw createError
    }
  }
}

async function ensureCategories() {
  const supabase = createAdminClient()
  const rows = defaultCategories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    level: 0,
    sort_order: category.sort_order,
    icon: category.metadata?.icon ?? null,
    color_hex: category.metadata?.color ?? null,
    is_featured: category.metadata?.featured ?? false,
    meta_title: category.metadata?.seo_title ?? null,
    meta_description: category.metadata?.seo_description ?? null,
    is_active: category.is_active,
  }))

  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'slug' })

  if (error) {
    throw error
  }

  const { data, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, slug')

  if (fetchError) {
    throw fetchError
  }

  return new Map(
    (data ?? []).flatMap((category) => {
      const keys = [category.slug, category.name.toLowerCase()]
      return keys.map((key) => [key, category.id] as const)
    })
  )
}

async function upsertVariant(productId: string, row: SeedRow, sku: string, basePrice: number) {
  const supabase = createAdminClient()
  const variantName = row.variant_name || 'Default'
  const variantPrice = toOptionalNumber(row.variant_price) ?? basePrice
  const inventoryQuantity = Number.parseInt(row.stock_quantity || '0', 10)

  const { data: existingVariant, error: existingError } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)
    .eq('sku', sku)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  const payload = {
    product_id: productId,
    name: variantName,
    sku,
    price: variantPrice,
    inventory_quantity: Number.isFinite(inventoryQuantity) ? inventoryQuantity : 0,
    weight_value: toOptionalNumber(row.weight_value),
    weight_unit: row.weight_unit || 'g',
    position: 0,
    is_active: row.status !== 'archived',
  }

  if (existingVariant) {
    const { error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', existingVariant.id)

    if (error) {
      throw error
    }
    return
  }

  const { error } = await supabase
    .from('product_variants')
    .insert(payload)

  if (error) {
    throw error
  }
}

async function upsertImage(productId: string, slug: string, row: SeedRow, bucketName: string, imageDir: string | null) {
  if (!imageDir || !row.image_file) {
    return
  }

  const supabase = createAdminClient()
  const imagePath = resolve(imageDir, row.image_file)
  if (!existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`)
  }

  const fileName = basename(imagePath)
  const storagePath = `${slug}/${fileName}`
  const contentType = detectContentType(fileName)
  const fileBuffer = readFileSync(imagePath)

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, { upsert: true, contentType })

  if (uploadError) {
    throw uploadError
  }

  const publicUrl = supabase.storage.from(bucketName).getPublicUrl(storagePath).data.publicUrl

  const { data: existingImage, error: imageError } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('filename', fileName)
    .maybeSingle()

  if (imageError) {
    throw imageError
  }

  const payload = {
    product_id: productId,
    filename: fileName,
    original_filename: fileName,
    url: publicUrl,
    alt_text: toNullableText(row.image_alt_text) ?? row.name,
    mime_type: contentType,
    position: 0,
    is_primary: true,
  }

  if (existingImage) {
    const { error } = await supabase
      .from('product_images')
      .update(payload)
      .eq('id', existingImage.id)

    if (error) {
      throw error
    }
    return
  }

  const { error } = await supabase
    .from('product_images')
    .insert(payload)

  if (error) {
    throw error
  }
}

async function main() {
  const csvPath = resolve(process.cwd(), requireEnv('LOCAL_SEED_PRODUCTS_CSV'))
  const imageDir = process.env.LOCAL_SEED_IMAGE_DIR
    ? resolve(process.cwd(), process.env.LOCAL_SEED_IMAGE_DIR)
    : null
  const bucketName = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || 'product-images'

  if (!existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`)
  }

  const categoryMap = await ensureCategories()
  await ensureBucket(bucketName)

  const csvText = readFileSync(csvPath, 'utf8')
  const rows = parseCsv(csvText)
  if (rows.length === 0) {
    throw new Error('No seed rows found in CSV')
  }

  const supabase = createAdminClient()
  let success = 0
  let failed = 0

  for (const row of rows) {
    try {
      const name = row.name?.trim()
      const categoryKey = (row.category || '').trim().toLowerCase()

      if (!name) {
        throw new Error('name is required')
      }

      const categoryId = categoryMap.get(categoryKey)
      if (!categoryId) {
        throw new Error(`Unknown category: ${row.category}`)
      }

      const slug = row.slug?.trim() || slugify(name)
      const sku = row.sku?.trim() || slug.toUpperCase().replace(/-/g, '_').slice(0, 40)
      const basePrice = toRequiredNumber(row.base_price, 'base_price')
      const status = row.status === 'active' ? 'active' : 'draft'

      const productPayload = {
        name,
        slug,
        sku,
        category_id: categoryId,
        description: toNullableText(row.description),
        short_description: toNullableText(row.short_description),
        brand: toNullableText(row.brand),
        genetics: toNullableText(row.genetics),
        strain_type: row.strain_type || 'hybrid',
        thc_percentage: toOptionalNumber(row.thc_percentage),
        cbd_percentage: toOptionalNumber(row.cbd_percentage),
        base_price: basePrice,
        status,
        is_featured: toBoolean(row.is_featured || ''),
        is_new_arrival: toBoolean(row.is_new_arrival || ''),
        is_bestseller: toBoolean(row.is_bestseller || ''),
        is_lab_tested: toBoolean(row.is_lab_tested || ''),
        is_organic: toBoolean(row.is_organic || ''),
        lab_results_url: toNullableText(row.lab_results_url),
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .upsert(productPayload, { onConflict: 'sku' })
        .select('id')
        .single()

      if (productError || !product) {
        throw productError ?? new Error('Failed to upsert product')
      }

      await upsertVariant(product.id, row, sku, basePrice)
      await upsertImage(product.id, slug, row, bucketName, imageDir)
      success += 1
    } catch (error) {
      failed += 1
      console.error(`Seed row failed for ${row.name || row.slug || 'unknown row'}:`, error)
    }
  }

  console.log(`Seed complete. Success: ${success}. Failed: ${failed}.`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})