import { t } from "@/lib/i18n";
import { getFeaturedCategories } from "@/lib/categories";
import { ProductGrid } from "@/components/product/product-grid";
import Link from "next/link";
import { ArrowRight, FlaskConical, Leaf, Truck, Award } from "lucide-react";

export default function HomePage() {
  const featuredCategories = getFeaturedCategories();

  return (
    <div className="min-h-screen bg-earth-900 text-earth-200 selection:bg-secondary-400/20">

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden border-b border-earth-800"
        aria-label="Hero — The Art of Botanical Wellness"
      >
        {/* Ambient botanical light */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 60% 30%, rgba(80,142,68,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 20% 80%, rgba(201,168,76,0.04) 0%, transparent 55%)
            `,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-20 w-full">
          {/* Specimen label — small editorial eyebrow */}
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-block w-6 h-px bg-secondary-400" aria-hidden="true" />
            <span className="text-xs tracking-[0.2em] uppercase font-medium text-secondary-400 font-sans">
              North Carolina&nbsp;·&nbsp;Est.&nbsp;2024
            </span>
          </div>

          {/* Display heading */}
          <h1 className="font-display font-light leading-[0.92] text-balance mb-10 text-display-hero text-cream-100 -tracking-[0.02em]">
            The Art of<br />
            <em className="not-italic font-light text-primary-400">Botanical</em>
            <br />Wellness.
          </h1>

          {/* Ruled divider */}
          <div aria-hidden="true" className="w-24 mb-10 h-px bg-cream-300/[0.15]" />

          {/* Subheading */}
          <p className="text-lg font-light leading-relaxed mb-14 max-w-xl text-cream-300">
            Premium, lab-certified hemp cultivated in the hills of
            North Carolina — curated for the discerning wellness practitioner.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-medium uppercase
                transition-colors duration-300 transition-opacity duration-300
                bg-primary-500 text-cream-100 tracking-[0.08em]
                hover:bg-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            >
              Shop the Collection
              <ArrowRight
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium uppercase
                transition-opacity duration-200
                text-cream-300 border border-cream-300/[0.15] tracking-[0.08em]
                hover:opacity-100 opacity-80
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            >
              Our Story
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs tracking-widest uppercase text-cream-500"
          aria-hidden="true"
        >
          <span>Scroll</span>
          <div className="w-px h-10 bg-cream-300/20" />
        </div>
      </section>

      {/* ── COLLECTION CATEGORIES ──────────────────────────── */}
      <section className="py-28 border-b border-earth-800" aria-labelledby="collection-heading">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Section header */}
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-4 text-secondary-400 font-sans">
                The Collection
              </p>
              <h2
                id="collection-heading"
                className="font-display font-light leading-tight text-display-md text-cream-100 -tracking-[0.02em]"
              >
                Curated by&nbsp;<em className="italic">category</em>
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden md:flex items-center gap-2 text-sm transition-opacity duration-200 opacity-60 hover:opacity-100 text-cream-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
              aria-label="View all products"
            >
              View all <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Category vitrine grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cream-300/[0.08]">
            {featuredCategories.map((category, i) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative flex flex-col justify-between p-8 transition-opacity duration-300 bg-earth-900 hover:opacity-100 opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-inset"
                aria-label={`Browse ${category.name} — ${category.description}`}
              >
                {/* Index number */}
                <div className="text-xs font-mono mb-8 transition-opacity duration-300 group-hover:opacity-100 opacity-30 text-secondary-400">
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Category name */}
                <div>
                  <h3 className="font-display font-light mb-3 transition-colors duration-300 text-2xl text-cream-200 -tracking-[0.01em]">
                    {category.name}
                  </h3>
                  <p className="text-sm font-light leading-relaxed line-clamp-2 mb-8 text-cream-500">
                    {category.description}
                  </p>

                  <span className="inline-flex items-center gap-2 text-xs tracking-widest uppercase transition-all duration-300 group-hover:gap-3 text-primary-400">
                    Explore <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>

                {/* Hover accent line */}
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full bg-secondary-400"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────── */}
      <section className="py-28 border-b border-earth-800" aria-labelledby="featured-heading">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Section header */}
          <div className="mb-16">
            <p className="text-xs tracking-[0.2em] uppercase mb-4 text-secondary-400 font-sans">
              Featured Specimens
            </p>
            <h2
              id="featured-heading"
              className="font-display font-light text-display-md text-cream-100 -tracking-[0.02em]"
            >
              Selected for <em className="italic">excellence</em>
            </h2>
          </div>

          <ProductGrid
            filters={{ is_featured: true }}
            limit={8}
            headingLevel="h3"
            heading=" "
          />

          <div className="mt-16 flex justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-3 px-10 py-4 text-sm font-medium uppercase
                transition-opacity duration-200 opacity-80 hover:opacity-100
                text-cream-200 border border-cream-300/[0.15] tracking-[0.1em]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400"
            >
              View Entire Collection
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── ATELIER COMMITMENTS ───────────────────────────── */}
      <section className="py-28 border-b border-earth-800" aria-label="Our commitments">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-cream-300/[0.06]">
            {[
              {
                icon: FlaskConical,
                label: 'Lab Certified',
                copy: 'Every batch independently tested for potency, pesticides, and heavy metals.',
              },
              {
                icon: Leaf,
                label: 'Farm-to-Shelf',
                copy: 'Cultivated from seed in the Blue Ridge foothills, harvested at peak maturity.',
              },
              {
                icon: Award,
                label: 'Small Batch',
                copy: 'Limited runs ensure uncompromising quality and freshness in every order.',
              },
              {
                icon: Truck,
                label: 'Discreet Delivery',
                copy: 'Odor-sealed packaging, plain outer box, real-time tracking on every shipment.',
              },
            ].map(({ icon: Icon, label, copy }) => (
              <div key={label} className="p-10 flex flex-col gap-6 bg-earth-900">
                <div className="w-10 h-10 flex items-center justify-center text-primary-400">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-light text-xl mb-3 text-cream-100">{label}</h3>
                  <p className="text-sm leading-relaxed text-cream-500">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE NOTICE ─────────────────────────────── */}
      <section className="py-12" aria-label="Legal compliance notice">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs leading-relaxed text-cream-600">{t('compliance.disclaimers.fda')}</p>
            <p className="text-xs leading-relaxed text-cream-600">{t('compliance.disclaimers.thc')}</p>
          </div>
        </div>
      </section>

    </div>
  );
}
