import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product/product-detail'
import { ProductService } from '@/lib/services/product.service'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  // Fetch product by slug
  const product = await ProductService.getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <div >
      {/* Breadcrumb Navigation */}
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-4 flex items-center gap-2 text-xs tracking-wide font-mono bg-earth-900">
        <a href="/" className="transition-colors text-cream-600" >
          Home
        </a>
        <span className="opacity-40">/</span>
        <a href="/products" className="transition-colors text-cream-600" >
          Products
        </a>
        <span className="opacity-40">/</span>
        <span >{product.name}</span>
      </nav>

      {/* Product Detail Component */}
      <div className="max-w-7xl mx-auto text-cream-600 text-cream-300">
        <ProductDetail product={product} />
      </div>

      {/* Product Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "category": product.category?.name,
            "brand": {
              "@type": "Brand",
              "name": "NCRemedies"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://ncremedies.com/products/${slug}`,
              "priceCurrency": "USD",
              "price": product.base_price,
              "availability": product.variants?.some(v => v.inventory_quantity > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "NCRemedies"
              }
            },
            "image": product.images?.[0]?.url ? [product.images[0].url] : [],
            "aggregateRating": product.images?.length > 0 && {
              "@type": "AggregateRating",
              "ratingValue": 4.5, // TODO: Add rating system
              "reviewCount": 0 // TODO: Add review system
            }
          })
        }}
      />
    </div>
  )
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await ProductService.getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found - NCRemedies',
      description: 'The product you are looking for could not be found.'
    }
  }

  return {
    title: `${product.name} - NCRemedies`,
    description: product.description || `Buy ${product.name} from NCRemedies. Premium hemp and wellness products.`,
    keywords: [
      product.name,
      product.category?.name,
      'hemp',
      'wellness',
      'NCRemedies'
    ].join(', '),
    openGraph: {
      title: `${product.name} - NCRemedies`,
      description: product.description || `Buy ${product.name} from NCRemedies`,
      type: 'website',
      url: `/products/${slug}`,
      images: product.images?.[0]?.url ? [
        {
          url: product.images[0].url,
          width: 800,
          height: 600,
          alt: product.name
        }
      ] : [],
      siteName: 'NCRemedies'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - NCRemedies`,
      description: product.description || `Buy ${product.name} from NCRemedies`,
      images: product.images?.[0]?.url ? [product.images[0].url] : []
    }
  }
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const products = await ProductService.getAllProducts({ limit: 100 })

    return products.map((product) => ({
      slug: product.slug || product.id.toString()
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}