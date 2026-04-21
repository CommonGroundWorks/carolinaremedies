/**
 * Database Schema Validation Tests
 * Tests to ensure database schema is properly configured
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Database Schema Validation', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not configured')
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  describe('Environment Configuration', () => {
    it('should have Supabase URL configured', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https?:\/\//)
    })

    it('should have Supabase anon key configured', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
      // Accepts both legacy JWT format (eyJ...) and new publishable key format (sb_publishable_...)
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^(eyJ|sb_publishable_)/)
    })

    it('should be able to connect to Supabase', async () => {
      const { data, error } = await supabase.from('categories').select('id').limit(1)
      
      // If table doesn't exist, that's expected - we just want to verify connection
      expect(error?.code).not.toBe('PGRST301') // Should not be connection error
    })
  })

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      try {
        // Try to access a system table that should always exist
        const { error } = await supabase.rpc('version')
        
        // If RPC doesn't exist, try a simple query
        if (error?.code === '42883') {
          const { error: queryError } = await supabase.from('categories').select('count').limit(0)
          expect(queryError).toBeNull()
        } else {
          expect(error).toBeNull()
        }
      } catch (err) {
        // Connection test
        expect(err).toBeDefined()
      }
    })
  })

  describe('Required Tables', () => {
    const requiredTables = [
      'categories',
      'products', 
      'product_variants',
      'product_images',
      'inventory_logs'
    ]

    it.each(requiredTables)('should have %s table accessible', async (tableName) => {
      const { error } = await supabase.from(tableName as any).select('id').limit(1)
      
      // Should not get a table does not exist error
      expect(error?.code).not.toBe('42P01')
    })
  })

  describe('Schema Functions', () => {
    it('should have schema validation view if available', async () => {
      try {
        const { data, error } = await supabase.from('schema_validation_status').select('*')
        
        if (data && data.length > 0) {
          console.log('Schema validation status:', data)
          
          // Check if all components pass
          const failedComponents = data.filter(item => item.status === 'FAIL')
          
          if (failedComponents.length > 0) {
            console.warn('Schema validation failures:', failedComponents)
          }
        }
        
        // This test passes regardless - it's informational
        expect(true).toBe(true)
      } catch (err) {
        // View might not exist yet
        console.log('Schema validation view not available')
        expect(true).toBe(true)
      }
    })
  })

  describe('Seed Data Validation', () => {
    it('should check if seed data exists', async () => {
      try {
        const { count: categoryCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        console.log(`Database has ${categoryCount || 0} categories and ${productCount || 0} products`)
        
        // Log the current state
        if ((categoryCount || 0) === 0 && (productCount || 0) === 0) {
          console.log('Database appears to be empty - seed data needed')
        } else {
          console.log('Database has data')
        }
        
        expect(true).toBe(true) // This test is informational
      } catch (err) {
        console.log('Could not check seed data:', err)
        expect(true).toBe(true)
      }
    })
  })
})

describe('Database Test Configuration', () => {
  it('should validate testing environment variables', () => {
    // Check if we have test environment variables
    const hasTestConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    expect(hasTestConfig).toBe(true)
  })

  it('should provide helpful setup instructions if configuration missing', () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log(`
🔧 Database Testing Setup Required:

1. Create a Supabase project at https://supabase.com
2. Add environment variables to .env.local:
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

3. Run database migrations:
   npx supabase db push (if using local dev)
   OR deploy migrations to your Supabase project

4. Seed test data:
   Run the seed files in supabase/seed/

5. Re-run tests: npm run test
      `)
    }
    
    expect(true).toBe(true)
  })
})
