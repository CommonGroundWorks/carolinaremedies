// ─── Standalone database types ───

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  level: number
  sort_order: number
  icon: string | null
  image_url: string | null
  color_hex: string | null
  is_featured: boolean
  meta_title: string | null
  meta_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category_id: string
  subcategory: string | null
  description: string | null
  short_description: string | null
  brand: string | null
  genetics: string | null
  strain_type: string
  thc_percentage: number | null
  cbd_percentage: number | null
  total_cannabinoids: number | null
  terpene_profile: Record<string, unknown> | null
  base_price: number
  currency: string
  status: string
  is_featured: boolean
  is_new_arrival: boolean
  is_bestseller: boolean
  is_lab_tested: boolean
  is_organic: boolean
  lab_results_url: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  farm_bill_compliant: boolean
  age_restricted: boolean
  license_number: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  discontinued_at: string | null
  created_by: string | null
  updated_by: string | null
  images?: ProductImage[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  weight_value: number | null
  weight_unit: string
  price: number
  cost: number | null
  compare_at_price: number | null
  sku: string | null
  barcode: string | null
  inventory_quantity: number
  inventory_policy: string
  low_stock_threshold: number
  requires_shipping: boolean
  weight_grams: number | null
  is_active: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  filename: string
  original_filename: string | null
  url: string
  alt_text: string | null
  width: number | null
  height: number | null
  file_size: number | null
  mime_type: string | null
  image_type: string
  position: number
  is_primary: boolean
  created_at: string
}

export interface ProductEffect {
  id: string
  name: string
  description: string | null
  category: string | null
  icon: string | null
  color_hex: string | null
}

export interface ProductEffectRelation {
  effect_id: string
  intensity: number
  effect: ProductEffect
}

export interface LabReport {
  id: string
  lab_name: string
  test_date: string
  overall_passed: boolean
  report_url: string | null
}

export interface ProductWithRelations extends Product {
  category: Category
  variants: ProductVariant[]
  images: ProductImage[]
  effects?: ProductEffectRelation[]
  lab_reports?: LabReport[]
  compliance_records?: unknown[]
}

export interface ProductFilters {
  is_featured?: boolean
  is_new_arrival?: boolean
  is_bestseller?: boolean
  is_lab_tested?: boolean
  is_organic?: boolean
  strain_type?: string[]
  price_range?: { min: number; max: number }
  thc_range?: { min: number; max: number }
  cbd_range?: { min: number; max: number }
}

export type ProductSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'thc_asc'
  | 'thc_desc'
  | 'cbd_asc'
  | 'cbd_desc'
  | 'created_desc'
  | 'created_asc'
  | 'featured'
  | 'bestseller'

export interface Order {
  id: string
  user_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  status: string
  total_amount: number
  subtotal: number | null
  tax_amount: number | null
  shipping_amount: number | null
  discount_amount: number | null
  payment_method: string
  order_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string | null
  product_name: string
  variant_name: string
  price: number
  quantity: number
  created_at: string
}

export interface SiteSettings {
  id: string
  shopping_enabled: boolean
  updated_at: string | null
}