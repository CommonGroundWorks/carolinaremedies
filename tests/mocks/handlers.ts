import { http, HttpResponse } from 'msw'
import { 
  createMockProduct, 
  createMockOrder, 
  createMockInventoryAlert,
  createMockUser 
} from '../utils/test-utils'

const mockProducts = [
  createMockProduct({
    id: '1',
    name: 'Blue Dream',
    slug: 'blue-dream',
    category: 'flower',
    price: 45.00,
    thc_percentage: 18.5,
    cbd_percentage: 0.8,
    strain_type: 'hybrid',
  }),
  createMockProduct({
    id: '2',
    name: 'CBD Tincture',
    slug: 'cbd-tincture',
    category: 'tinctures',
    price: 29.99,
    thc_percentage: 0.3,
    cbd_percentage: 25.0,
  }),
  createMockProduct({
    id: '3',
    name: 'Gummy Bears',
    slug: 'gummy-bears',
    category: 'edibles',
    price: 15.99,
    thc_percentage: 10.0,
    cbd_percentage: 0.0,
  }),
]

export const handlers = [
  // Products API
  http.get('/api/products', () => {
    return HttpResponse.json({
      data: mockProducts,
      count: mockProducts.length,
    })
  }),

  http.get('/api/products/:slug', ({ params }) => {
    const product = mockProducts.find(p => p.slug === params.slug)
    if (product) {
      return HttpResponse.json({ data: product })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Search API
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category')
    
    let filtered = mockProducts
    
    if (query) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (category) {
      filtered = filtered.filter(p => p.category === category)
    }

    return HttpResponse.json({
      data: filtered,
      count: filtered.length,
    })
  }),

  // Orders API
  http.post('/api/orders', async ({ request }) => {
    const orderData = await request.json()
    const newOrder = createMockOrder({
      id: Math.random().toString(36).substr(2, 9),
      ...orderData,
    })
    return HttpResponse.json({ data: newOrder })
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const order = createMockOrder({ id: params.id as string })
    return HttpResponse.json({ data: order })
  }),

  // Inventory API
  http.get('/api/inventory/alerts', () => {
    const alerts = [
      createMockInventoryAlert({
        id: '1',
        product_id: '1',
        product_name: 'Blue Dream',
        current_stock: 3,
        severity: 'critical',
      }),
      createMockInventoryAlert({
        id: '2',
        product_id: '2',
        product_name: 'CBD Tincture',
        current_stock: 8,
        severity: 'low',
      }),
    ]
    return HttpResponse.json({ data: alerts })
  }),

  http.post('/api/inventory/update', async ({ request }) => {
    const updateData = await request.json()
    return HttpResponse.json({ 
      success: true,
      data: updateData,
    })
  }),

  // User authentication
  http.post('/api/auth/login', async ({ request }) => {
    const credentials = await request.json()
    const user = createMockUser({
      email: credentials.email,
    })
    return HttpResponse.json({
      user,
      token: 'mock-jwt-token',
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json()
    const user = createMockUser({
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
    })
    return HttpResponse.json({
      user,
      token: 'mock-jwt-token',
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Age verification
  http.post('/api/auth/verify-age', async ({ request }) => {
    const { birthDate } = await request.json()
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear()
    
    return HttpResponse.json({
      verified: age >= 21,
      age,
    })
  }),
]