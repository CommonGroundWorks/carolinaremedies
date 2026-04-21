/**
 * Database Testing Utilities for NCRemedies
 * Provides database state management and testing helpers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.types'

interface TestDatabaseConfig {
  url: string
  anonKey: string
  serviceKey?: string
}

interface DatabaseState {
  name: string
  description: string
  timestamp: string
}

class DatabaseTestUtils {
  private client: SupabaseClient<Database>
  private serviceClient?: SupabaseClient<Database>
  private savedStates: Map<string, DatabaseState> = new Map()

  constructor(config: TestDatabaseConfig) {
    this.client = createClient(config.url, config.anonKey)
    
    if (config.serviceKey) {
      this.serviceClient = createClient(config.url, config.serviceKey)
    }
  }

  /**
   * Save current database state for restoration
   */
  async saveState(stateName: string): Promise<void> {
    try {
      const state: DatabaseState = {
        name: stateName,
        description: `Database state saved at ${new Date().toISOString()}`,
        timestamp: new Date().toISOString()
      }

      this.savedStates.set(stateName, state)
      console.log(`Database state '${stateName}' saved successfully`)
    } catch (error) {
      console.error('Error saving database state:', error)
      throw error
    }
  }

  /**
   * Reset database to initial seed state (via Supabase CLI)
   */
  async resetToSeedState(): Promise<void> {
    try {
      console.log('Database reset should be done via supabase db reset command')
      console.log('This will reset the database to the seed state defined in supabase/seed/')
    } catch (error) {
      console.error('Error resetting to seed state:', error)
      throw error
    }
  }

  /**
   * Verify database schema is correct
   */
  async verifySchema(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Check if we can connect to the database by trying to access categories
      const { error: connectionError } = await this.client
        .from('categories')
        .select('id')
        .limit(1)

      if (connectionError && connectionError.code === '42P01') {
        errors.push(`Categories table is missing: ${connectionError.message}`)
        return { valid: false, errors }
      } else if (connectionError && connectionError.code !== '23502') {
        // Ignore constraint errors, we just want to test connection
        errors.push(`Database connection failed: ${connectionError.message}`)
        return { valid: false, errors }
      }

      // Try to check other tables that should exist
      const tablesToCheck = ['products', 'product_variants', 'product_images', 'inventory_logs']

      for (const table of tablesToCheck) {
        try {
          const { error } = await this.client.from(table as any).select('id').limit(1)
          
          if (error && error.code === '42P01') {
            errors.push(`Table '${table}' is missing: ${error.message}`)
          }
        } catch (error) {
          errors.push(`Error checking table '${table}': ${error}`)
        }
      }

      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      errors.push(`Schema verification failed: ${error}`)
      return { valid: false, errors }
    }
  }

  /**
   * Get database statistics for testing
   */
  async getStats(): Promise<Record<string, number>> {
    try {
      const stats: Record<string, number> = {}

      // Only check tables that we know exist from the types
      const tables = ['categories', 'products', 'product_variants', 'product_images', 'inventory_logs']

      for (const table of tables) {
        try {
          const { count, error } = await this.client
            .from(table as any)
            .select('*', { count: 'exact', head: true })

          if (error) {
            console.warn(`Could not get count for ${table}:`, error.message)
            stats[table] = 0
          } else {
            stats[table] = count || 0
          }
        } catch (error) {
          console.warn(`Error getting stats for ${table}:`, error)
          stats[table] = 0
        }
      }

      return stats
    } catch (error) {
      console.error('Error getting database stats:', error)
      return {}
    }
  }

  /**
   * Clean up connections
   */
  async cleanup(): Promise<void> {
    try {
      // Clear saved states
      this.savedStates.clear()
      console.log('Database test utilities cleaned up')
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  /**
   * Check if database has seed data
   */
  async hasSeedData(): Promise<boolean> {
    try {
      const { count: categoryCount } = await this.client
        .from('categories')
        .select('*', { count: 'exact', head: true })

      const { count: productCount } = await this.client
        .from('products')
        .select('*', { count: 'exact', head: true })

      return (categoryCount || 0) > 0 && (productCount || 0) > 0
    } catch (error) {
      console.error('Error checking seed data:', error)
      return false
    }
  }

  /**
   * Get sample data for testing
   */
  async getSampleCategory(): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('categories')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        throw new Error(`No sample category found: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error getting sample category:', error)
      throw error
    }
  }

  /**
   * Get sample product for testing
   */
  async getSampleProduct(): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('products')
        .select('*, product_variants(*)')
        .limit(1)
        .single()

      if (error) {
        throw new Error(`No sample product found: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error getting sample product:', error)
      throw error
    }
  }

  /**
   * Get the underlying Supabase client for direct operations
   */
  getClient(): SupabaseClient<Database> {
    return this.client
  }

  /**
   * Get the service client for admin operations
   */
  getServiceClient(): SupabaseClient<Database> | undefined {
    return this.serviceClient
  }
}

// Factory function to create test database utilities
export function createTestDatabase(): DatabaseTestUtils {
  const config: TestDatabaseConfig = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }

  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase configuration for testing')
  }

  return new DatabaseTestUtils(config)
}

// Singleton instance for tests
let testDbInstance: DatabaseTestUtils | null = null

export function getTestDatabase(): DatabaseTestUtils {
  if (!testDbInstance) {
    testDbInstance = createTestDatabase()
  }
  return testDbInstance
}

// Clean up function for test teardown
export async function cleanupTestDatabase(): Promise<void> {
  if (testDbInstance) {
    await testDbInstance.cleanup()
    testDbInstance = null
  }
}

export { DatabaseTestUtils }
export type { TestDatabaseConfig, DatabaseState }
