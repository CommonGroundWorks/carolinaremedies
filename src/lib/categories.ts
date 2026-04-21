/**
 * Extensible Product Category System for NCRemedies
 * Supports hierarchical categories, dynamic addition, and metadata
 */

import { t } from './i18n'

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  metadata?: {
    icon?: string
    color?: string
    image?: string
    seo_title?: string
    seo_description?: string
    featured?: boolean
    [key: string]: any
  }
  created_at?: Date
  updated_at?: Date
}

export interface CategoryHierarchy extends ProductCategory {
  children: CategoryHierarchy[]
  parent?: ProductCategory
  level: number
  path: string[] // Array of slugs from root to this category
}

// Default categories for NCRemedies - easily extendable
export const defaultCategories: ProductCategory[] = [
  {
    id: '1',
    name: 'Flower',
    slug: 'flower',
    description: 'Hand-selected premium flower products with detailed lab testing',
    sort_order: 1,
    is_active: true,
    metadata: {
      icon: 'Flower',
      color: '#22c55e',
      featured: true,
      seo_title: 'Premium Flower Products | NCRemedies',
      seo_description: 'Discover our collection of premium flower products, all lab-tested and compliant.'
    }
  },
  {
    id: '2',
    name: t('products.categories.edibles'),
    slug: 'edibles',
    description: 'Carefully crafted edible products for wellness',
    sort_order: 2,
    is_active: true,
    metadata: {
      icon: 'Cookie',
      color: '#f59e0b',
      featured: true,
      seo_title: 'Wellness Edibles | NCRemedies',
      seo_description: 'Premium edible products crafted for your wellness journey.'
    }
  },
  {
    id: '3',
    name: 'Concentrates',
    slug: 'concentrates',
    description: 'High-purity extracts including shatter, wax, and live rosin',
    sort_order: 3,
    is_active: true,
    metadata: {
      icon: 'Droplets',
      color: '#f59e0b',
      featured: true,
      seo_title: 'Concentrates | NCRemedies',
      seo_description: 'Premium cannabis concentrates and extracts.'
    }
  },
  {
    id: '3b',
    name: 'Pre-Rolls',
    slug: 'pre-rolls',
    description: 'Expertly rolled joints ready to enjoy',
    sort_order: 4,
    is_active: true,
    metadata: {
      icon: 'Cigarette',
      color: '#84cc16',
      featured: true,
      seo_title: 'Pre-Rolls | NCRemedies',
      seo_description: 'Premium pre-rolled joints for your convenience.'
    }
  },
  {
    id: '4',
    name: t('products.categories.accessories'),
    slug: 'accessories',
    description: 'Quality accessories to enhance your wellness experience',
    sort_order: 5,
    is_active: true,
    metadata: {
      icon: 'Package',
      color: '#64748b',
      featured: false,
      seo_title: 'Wellness Accessories | NCRemedies',
      seo_description: 'Quality accessories to complement your wellness routine.'
    }
  },
  {
    id: '5',
    name: 'Topicals',
    slug: 'topicals',
    description: 'Therapeutic creams, balms, and lotions for targeted relief',
    sort_order: 6,
    is_active: true,
    metadata: {
      icon: 'Hand',
      color: '#a78bfa',
      featured: true,
      seo_title: 'Topicals & Balms | NCRemedies',
      seo_description: 'Premium cannabis-infused topicals for targeted pain relief and skin care.'
    }
  },
  {
    id: '6',
    name: 'Tinctures',
    slug: 'tinctures',
    description: 'Precisely dosed sublingual oils for fast-acting relief',
    sort_order: 7,
    is_active: true,
    metadata: {
      icon: 'Pipette',
      color: '#2dd4bf',
      featured: true,
      seo_title: 'Tinctures & Oils | NCRemedies',
      seo_description: 'Premium cannabis tinctures and sublingual oils for precise dosing.'
    }
  },
]

/**
 * Category Management Service
 * Handles all category operations with extensibility in mind
 */
export class CategoryService {
  private categories: ProductCategory[] = [...defaultCategories]

  /**
   * Get all active categories sorted by sort_order
   */
  getActiveCategories(): ProductCategory[] {
    return this.categories
      .filter(cat => cat.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  /**
   * Get featured categories for homepage display
   */
  getFeaturedCategories(): ProductCategory[] {
    return this.getActiveCategories().filter(cat => cat.metadata?.featured)
  }

  /**
   * Get category by slug
   */
  getCategoryBySlug(slug: string): ProductCategory | undefined {
    return this.categories.find(cat => cat.slug === slug && cat.is_active)
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): ProductCategory | undefined {
    return this.categories.find(cat => cat.id === id)
  }

  /**
   * Get hierarchical category tree
   */
  getCategoryTree(): CategoryHierarchy[] {
    const buildTree = (parentId?: string, level = 0, path: string[] = []): CategoryHierarchy[] => {
      return this.getActiveCategories()
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id, level + 1, [...path, cat.slug]),
          level,
          path: [...path, cat.slug]
        }))
    }

    return buildTree()
  }

  /**
   * Add new category (for admin use)
   */
  addCategory(category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): ProductCategory {
    const newCategory: ProductCategory = {
      ...category,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    }

    this.categories.push(newCategory)
    return newCategory
  }

  /**
   * Update existing category
   */
  updateCategory(id: string, updates: Partial<ProductCategory>): ProductCategory | null {
    const index = this.categories.findIndex(cat => cat.id === id)
    if (index === -1) return null

    this.categories[index] = {
      ...this.categories[index],
      ...updates,
      updated_at: new Date()
    }

    return this.categories[index]
  }

  /**
   * Delete category (soft delete by setting inactive)
   */
  deleteCategory(id: string): boolean {
    const category = this.getCategoryById(id)
    if (!category) return false

    // Check if category has children - prevent deletion if it does
    const hasChildren = this.categories.some(cat => cat.parent_id === id)
    if (hasChildren) {
      throw new Error('Cannot delete category with child categories')
    }

    this.updateCategory(id, { is_active: false })
    return true
  }

  /**
   * Get all categories for admin management (including inactive)
   */
  getAllCategoriesForAdmin(): ProductCategory[] {
    return this.categories.sort((a, b) => a.sort_order - b.sort_order)
  }

  /**
   * Reorder categories by providing array of category IDs
   */
  reorderCategories(categoryIds: string[]): void {
    categoryIds.forEach((id, index) => {
      this.updateCategory(id, { sort_order: index + 1 })
    })
  }

  /**
   * Search categories by name, description, or slug
   */
  searchCategories(query: string): ProductCategory[] {
    const searchTerm = query.toLowerCase()
    return this.getActiveCategories().filter(cat => 
      cat.name.toLowerCase().includes(searchTerm) ||
      cat.description?.toLowerCase().includes(searchTerm) ||
      cat.slug.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Get category breadcrumbs for navigation
   */
  getCategoryBreadcrumbs(categorySlug: string): ProductCategory[] {
    const category = this.getCategoryBySlug(categorySlug)
    if (!category) return []

    const breadcrumbs: ProductCategory[] = [category]
    let currentCategory = category

    // Build breadcrumb chain by following parent relationships
    while (currentCategory.parent_id) {
      const parent = this.getCategoryById(currentCategory.parent_id)
      if (parent) {
        breadcrumbs.unshift(parent)
        currentCategory = parent
      } else {
        break
      }
    }

    return breadcrumbs
  }

  /**
   * Get child categories for a given parent
   */
  getChildCategories(parentId: string): ProductCategory[] {
    return this.getActiveCategories().filter(cat => cat.parent_id === parentId)
  }

  /**
   * Check if category has products (would need to be implemented with actual product data)
   */
  categoryHasProducts(categoryId: string): boolean {
    // TODO: Implement with actual product service
    // For now, assume all categories can have products
    return true
  }

  /**
   * Get category statistics (would be enhanced with actual data)
   */
  getCategoryStats(categoryId: string): {
    productCount: number
    subcategoryCount: number
    isPopular: boolean
  } {
    const subcategoryCount = this.getChildCategories(categoryId).length
    
    return {
      productCount: 0, // TODO: Get from product service
      subcategoryCount,
      isPopular: false // TODO: Calculate based on sales/views
    }
  }

  /**
   * Generate unique ID for new categories
   */
  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Create singleton instance for app-wide use
export const categoryService = new CategoryService()

// Utility functions for easy component access
export const getActiveCategories = () => categoryService.getActiveCategories()
export const getFeaturedCategories = () => categoryService.getFeaturedCategories()
export const getCategoryBySlug = (slug: string) => categoryService.getCategoryBySlug(slug)
export const getCategoryTree = () => categoryService.getCategoryTree()
export const getCategoryBreadcrumbs = (slug: string) => categoryService.getCategoryBreadcrumbs(slug)

/**
 * Category validation for admin forms
 */
export const validateCategory = (category: Partial<ProductCategory>): string[] => {
  const errors: string[] = []

  if (!category.name?.trim()) {
    errors.push('Category name is required')
  }

  if (!category.slug?.trim()) {
    errors.push('Category slug is required')
  } else if (!/^[a-z0-9-]+$/.test(category.slug)) {
    errors.push('Category slug must contain only lowercase letters, numbers, and hyphens')
  }

  if (typeof category.sort_order !== 'number' || category.sort_order < 0) {
    errors.push('Sort order must be a positive number')
  }

  // Check for duplicate slugs
  const existingCategory = categoryService.getCategoryBySlug(category.slug!)
  if (existingCategory && existingCategory.id !== category.id) {
    errors.push('Category slug must be unique')
  }

  return errors
}

// Category metadata helpers
export const getCategoryIcon = (category: ProductCategory): string => {
  return category.metadata?.icon || 'Package'
}

export const getCategoryColor = (category: ProductCategory): string => {
  return category.metadata?.color || '#64748b'
}

export const isFeaturedCategory = (category: ProductCategory): boolean => {
  return category.metadata?.featured === true
}

/**
 * Generate category URL for SEO-friendly links
 */
export const getCategoryUrl = (category: ProductCategory): string => {
  const breadcrumbs = categoryService.getCategoryBreadcrumbs(category.slug)
  const pathSegments = breadcrumbs.map(cat => cat.slug)
  return `/products/${pathSegments.join('/')}`
}

/**
 * Generate SEO metadata for category pages
 */
export const getCategorySEO = (category: ProductCategory) => {
  return {
    title: category.metadata?.seo_title || `${category.name} | NCRemedies`,
    description: category.metadata?.seo_description || category.description || `Shop ${category.name} products at NCRemedies`,
    keywords: `${category.name}, wellness, hemp, NCRemedies`,
    canonical: getCategoryUrl(category)
  }
}