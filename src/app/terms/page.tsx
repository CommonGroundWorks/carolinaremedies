import { Card } from '@/components/ui/card'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-16" bg-earth-900 text-cream-400 >
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl lg:text-4xl font-light mb-4 text-cream-100" >Terms of Service</h1>
          <p className="text-xs font-mono tracking-wide text-cream-600" >Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="atelier-card p-8 lg:p-12">
          <div className="prose prose-lg max-w-none space-y-8">
            <div className="p-4 mb-8">
              <p className="text-sm font-medium m-0">
                <strong>Disclaimer:</strong> This website is an open-source educational template and demonstration project.
                No real products are sold, and all data is generated for demonstration purposes only. By using this software or template,
                you acknowledge that the creator holds no liability for how you deploy or utilize this code.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Acceptance of Terms</h2>
              <p className=" leading-relaxed">
                By accessing and using this demonstrational website ("the Website"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Age Requirements</h2>
              <p className=" leading-relaxed mb-4">
                You must be at least 18 years of age (or 21 years of age in some jurisdictions) to use our services and purchase hemp products. By using our website, you represent that you meet the age requirements in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Product Information and Availability</h2>
              <p className=" leading-relaxed mb-4">
                All hemp products sold on NCRemedies comply with federal laws and contain less than 0.3% THC. Product availability may vary by location due to state and local regulations.
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>Products have not been evaluated by the FDA</li>
                <li>Products are not intended to diagnose, treat, cure, or prevent any disease</li>
                <li>Consult your physician before use if pregnant, nursing, or have medical conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Orders and Payment</h2>
              <p className=" leading-relaxed mb-4">
                We accept Cash on Delivery (COD) as our primary payment method. Additional payment methods may be available.
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>All orders are subject to acceptance and availability</li>
                <li>Prices are subject to change without notice</li>
                <li>We reserve the right to limit quantities</li>
                <li>Payment is due upon delivery for COD orders</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Shipping and Returns</h2>
              <p className=" leading-relaxed mb-4">
                Shipping restrictions apply based on state and local laws. Please review our shipping policy for specific restrictions in your area.
              </p>
              <p className=" leading-relaxed">
                Due to the nature of hemp products, returns are limited. Please see our return policy for full details.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Prohibited Uses</h2>
              <p className=" leading-relaxed mb-4">You may not use our website for:</p>
              <ul className="list-disc list-inside  space-y-2">
                <li>Any unlawful purpose or to solicit unlawful acts</li>
                <li>Violating any international, federal, provincial, or state regulations or laws</li>
                <li>Infringing intellectual property rights</li>
                <li>Harassment, abuse, or harm of others</li>
                <li>Transmitting viruses or malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Limitation of Liability</h2>
              <p className=" leading-relaxed">
                NCRemedies shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products. Our total liability shall not exceed the amount paid for the specific product or service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-display font-light mb-4">Contact Information</h2>
              <div className="p-6">
                <p className=" mb-2"><strong>NCRemedies</strong></p>
                <p className=" mb-2">Email: support@ncremedies.com</p>
                <p className=" mb-2">Phone: 1-800-NCREMEDIES</p>
                <p className="">Address: 123 Hemp Street, Wellness City, State 12345</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Terms of Service - NCRemedies',
  description: 'Read NCRemedies terms of service for hemp products, including age requirements, shipping restrictions, and legal compliance.',
  keywords: 'terms of service, hemp products, legal agreement, age requirements'
}