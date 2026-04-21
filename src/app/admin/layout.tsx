import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-earth-900">
      <header className="border-b border-cream-300/[0.08]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-cream-500 text-xs uppercase tracking-wider hover:text-cream-300 transition-colors">
              ← Store
            </a>
            <span className="text-cream-600">|</span>
            <h1 className="font-display text-xl text-cream-100">Admin Dashboard</h1>
          </div>
          <a
            href="/api/admin/logout"
            className="text-xs uppercase tracking-wider text-cream-500 hover:text-cream-300 transition-colors"
          >
            Sign Out
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
