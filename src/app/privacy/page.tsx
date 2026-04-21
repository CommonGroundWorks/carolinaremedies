import { Card } from '@/components/ui/card'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-16" bg-earth-900 text-cream-400 >
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl lg:text-4xl font-light mb-4 text-cream-100" >
            Privacy Policy
          </h1>
          <p className="text-xs font-mono tracking-wide text-cream-600" >
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="atelier-card p-8 lg:p-12">
          <div className="prose prose-lg max-w-none space-y-8">
            <div className="p-4 mb-8">
              <p className="text-sm font-medium m-0">
                <strong>Disclaimer:</strong> This website is an open-source educational template. Any data entered into this system
                is used solely for demonstration purposes and is not processed for real transactions.
              </p>
            </div>
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Introduction</h2>
              <p className=" leading-relaxed">
                This project ("we," "our," or "us") respects your privacy. As an educational demonstration, this Privacy Policy outlines how a production instance of such a template might collect, use, disclose, and safeguard information.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Information We Collect</h2>

              <h3 className="text-base font-medium mb-3">Personal Information</h3>
              <p className=" leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside  space-y-2 mb-6">
                <li>Create an account</li>
                <li>Make a purchase</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact customer support</li>
                <li>Participate in surveys or promotions</li>
              </ul>

              <p className=" leading-relaxed mb-4">
                This information may include:
              </p>
              <ul className="list-disc list-inside  space-y-2 mb-6">
                <li>Name and contact information (email, phone, address)</li>
                <li>Account credentials (username, password)</li>
                <li>Payment information (processed securely by third-party providers)</li>
                <li>Purchase history and preferences</li>
                <li>Age verification information (for legal compliance)</li>
              </ul>

              <h3 className="text-base font-medium mb-3">Automatically Collected Information</h3>
              <p className=" leading-relaxed mb-4">
                We automatically collect certain information when you visit our website:
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>IP address and location information</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referring website information</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">How We Use Your Information</h2>
              <p className=" leading-relaxed mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Personalize your shopping experience</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations and age verification requirements</li>
                <li>Prevent fraud and ensure security</li>
                <li>Analyze website usage and performance</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Information Sharing and Disclosure</h2>
              <p className=" leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className="text-base font-medium mb-3">Service Providers</h3>
              <p className=" leading-relaxed mb-4">
                We work with trusted third-party service providers who assist us with:
              </p>
              <ul className="list-disc list-inside  space-y-2 mb-6">
                <li>Payment processing</li>
                <li>Shipping and delivery</li>
                <li>Email marketing</li>
                <li>Website analytics</li>
                <li>Customer support</li>
              </ul>

              <h3 className="text-base font-medium mb-3">Legal Requirements</h3>
              <p className=" leading-relaxed mb-4">
                We may disclose your information when required by law or to:
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>Comply with legal processes or government requests</li>
                <li>Protect our rights, property, or safety</li>
                <li>Protect the rights, property, or safety of our users</li>
                <li>Prevent or investigate fraud or security issues</li>
              </ul>
            </section>

            {/* Hemp Industry Specific */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Hemp Industry Compliance</h2>
              <p className=" leading-relaxed mb-4">
                As a hemp and wellness retailer, we have additional privacy considerations:
              </p>

              <h3 className="text-base font-medium mb-3">Age Verification</h3>
              <p className=" leading-relaxed mb-4">
                We are required by law to verify that customers are of legal age to purchase hemp products. We collect and store age verification information securely and only use it for compliance purposes.
              </p>

              <h3 className="text-base font-medium mb-3">State Compliance</h3>
              <p className=" leading-relaxed mb-4">
                We may use your location information to ensure compliance with state and local hemp regulations, including shipping restrictions and product availability.
              </p>

              <h3 className="text-base font-medium mb-3">Medical Information</h3>
              <p className=" leading-relaxed">
                We do not collect medical information. Our products are not intended to diagnose, treat, cure, or prevent any disease. Any health-related information you provide is voluntary and used only to improve your shopping experience.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Data Security</h2>
              <p className=" leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside  space-y-2">
                <li>SSL encryption for data transmission</li>
                <li>Secure server infrastructure</li>
                <li>Access controls and authentication</li>
                <li>Regular security audits</li>
                <li>Employee training on data protection</li>
                <li>Secure payment processing (PCI DSS compliant)</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Your Privacy Rights</h2>
              <p className=" leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside  space-y-2 mb-6">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of your personal information</li>
                <li>Portability of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Restriction of processing</li>
              </ul>

              <p className=" leading-relaxed">
                To exercise these rights, please contact us at privacy@ncremedies.com or use the contact information provided below.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Cookies and Tracking Technologies</h2>
              <p className=" leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside  space-y-2 mb-6">
                <li>Remember your preferences and settings</li>
                <li>Maintain your shopping cart</li>
                <li>Analyze website performance</li>
                <li>Provide personalized content</li>
                <li>Enable social media features</li>
              </ul>

              <p className=" leading-relaxed">
                You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
              </p>
            </section>

            {/* Third Party Links */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Third-Party Links</h2>
              <p className=" leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policies of any third-party websites you visit.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Children's Privacy</h2>
              <p className=" leading-relaxed">
                Our services are not intended for individuals under the age of 18 (or 21 in some jurisdictions). We do not knowingly collect personal information from minors. If we become aware that we have collected information from a minor, we will delete it immediately.
              </p>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">International Users</h2>
              <p className=" leading-relaxed">
                If you are accessing our website from outside the United States, please be aware that your information may be transferred to and processed in the United States, where our servers are located and our central database is operated.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Changes to This Privacy Policy</h2>
              <p className=" leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated effective date. We encourage you to review this policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-lg font-display font-light mb-4">Contact Us</h2>
              <p className=" leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-6">
                <p className=" mb-2"><strong>NCRemedies</strong></p>
                <p className=" mb-2">Email: privacy@ncremedies.com</p>
                <p className=" mb-2">Phone: 1-800-NCREMEDIES</p>
                <p className="">
                  Mailing Address: 123 Hemp Street, Wellness City, State 12345
                </p>
              </div>
            </section>

            {/* Effective Date */}
            <section className="atelier-divider pt-8">
              <p className="text-xs font-mono">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Privacy Policy - NCRemedies',
  description: 'Learn how NCRemedies collects, uses, and protects your personal information. Our comprehensive privacy policy covers hemp industry compliance and your data rights.',
  keywords: 'privacy policy, data protection, hemp industry, personal information, GDPR, CCPA',
  openGraph: {
    title: 'Privacy Policy - NCRemedies',
    description: 'Learn how NCRemedies protects your privacy and personal information.',
    type: 'website'
  }
}