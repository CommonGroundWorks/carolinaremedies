import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Leaf, Shield, Heart, Award, Users, Truck } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Quality Assured',
      description: 'All products are third-party lab tested for purity, potency, and safety'
    },
    {
      icon: Leaf,
      title: 'Natural & Organic',
      description: 'We source from organic, sustainable farms using natural cultivation methods'
    },
    {
      icon: Heart,
      title: 'Customer Focused',
      description: 'Your wellness journey is our priority with personalized support and guidance'
    },
    {
      icon: Award,
      title: 'Industry Leading',
      description: 'Years of expertise in hemp and wellness products with proven results'
    }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: 'Hemp industry veteran with 10+ years experience in product development and regulatory compliance.'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Chief Science Officer',
      bio: 'PhD in Botanical Sciences specializing in hemp cultivation and cannabinoid research.'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Head of Quality',
      bio: 'Former FDA inspector ensuring our products meet the highest safety and quality standards.'
    }
  ]

  const steps = [
    { icon: Leaf, label: 'Organic Sourcing', desc: 'Premium hemp from certified organic farms' },
    { icon: Shield, label: 'Lab Testing', desc: 'Third-party testing for purity and potency' },
    { icon: Award, label: 'Quality Control', desc: 'Rigorous quality checks throughout production' },
    { icon: Truck, label: 'Safe Delivery', desc: 'Secure packaging and reliable shipping' },
  ]

  return (
    <div >
      {/* Hero Section */}
      <section className="py-20 lg:py-28 bg-earth-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p
            className="text-xs tracking-[0.3em] uppercase font-mono mb-4 text-secondary-400"

          >
            Our Story
          </p>
          <h1
            className="font-display text-4xl md:text-6xl font-light mb-6 text-cream-100"

          >
            About NCRemedies
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-10 text-cream-500" >
            We&apos;re dedicated to providing premium hemp and wellness products that support your natural health journey.
            Our commitment to quality, transparency, and customer care sets us apart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">Shop Products</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      <hr className="atelier-divider max-w-7xl mx-auto" />

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-xs tracking-[0.3em] uppercase font-mono mb-3 text-secondary-400"

              >
                Our Mission
              </p>
              <h2
                className="font-display text-3xl font-light mb-6 text-cream-100"

              >
                Nature provides the best solutions for wellness
              </h2>
              <p className="leading-relaxed mb-5 text-cream-500" >
                At NCRemedies, our mission is to make premium hemp products accessible to everyone seeking natural
                alternatives for their health and wellness needs.
              </p>
              <p className="leading-relaxed mb-6 text-cream-500" >
                We work directly with certified organic farms and use state-of-the-art extraction methods to ensure
                every product meets our rigorous standards for purity, potency, and effectiveness.
              </p>
              <div className="flex items-center gap-3">
                <Leaf className="h-4 w-4 text-primary-400"  />
                <span className="text-xs tracking-[0.15em] uppercase font-mono text-primary-400" >
                  100% Natural &bull; Lab Tested &bull; Third-Party Verified
                </span>
              </div>
            </div>
            <div
              className="p-10 border border-cream-300/10 bg-cream-300/[0.02]"
            >
              <div className="grid grid-cols-2 gap-8 text-center">
                {[
                  { value: '5000+', label: 'Happy Customers' },
                  { value: '100%', label: 'Lab Tested' },
                  { value: '50+', label: 'Premium Products' },
                  { value: '5★', label: 'Average Rating' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-mono text-2xl mb-1 text-secondary-400" >{stat.value}</div>
                    <div className="text-xs tracking-wide uppercase text-cream-600" >{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="atelier-divider max-w-7xl mx-auto" />

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.3em] uppercase font-mono mb-3 text-secondary-400"

            >
              Principles
            </p>
            <h2 className="font-display text-3xl font-light mb-4 text-cream-100" >
              Our Core Values
            </h2>
            <p className="max-w-xl mx-auto text-cream-500" >
              These principles guide everything we do, from product sourcing to customer service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="atelier-card p-6 text-center transition-all duration-300"
                style={{ ['--tw-translate-y' as string]: '0' }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 mb-4 border border-primary-500/20 bg-primary-500/[0.06]"
                >
                  <value.icon className="h-5 w-5 text-primary-400"  />
                </div>
                <h3 className="text-sm font-medium mb-2 text-cream-200" >{value.title}</h3>
                <p className="text-sm leading-relaxed text-cream-600" >{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="atelier-divider max-w-7xl mx-auto" />

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.3em] uppercase font-mono mb-3 text-secondary-400"

            >
              The Team
            </p>
            <h2 className="font-display text-3xl font-light mb-4 text-cream-100" >
              Meet Our Team
            </h2>
            <p className="max-w-xl mx-auto text-cream-500" >
              Our experienced team combines scientific expertise with a passion for natural wellness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <div key={index} className="atelier-card p-6 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-cream-300/10 bg-earth-800"
                >
                  <Users className="h-6 w-6 text-cream-600"  />
                </div>
                <h3 className="text-sm font-medium mb-1 text-cream-200" >{member.name}</h3>
                <p className="text-xs font-mono tracking-wide mb-3 text-secondary-400" >{member.role}</p>
                <p className="text-sm leading-relaxed text-cream-600" >{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="atelier-divider max-w-7xl mx-auto" />

      {/* Quality Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs tracking-[0.3em] uppercase font-mono mb-3 text-secondary-400"

            >
              Process
            </p>
            <h2 className="font-display text-3xl font-light mb-4 text-cream-100" >
              Our Quality Process
            </h2>
            <p className="max-w-xl mx-auto text-cream-500" >
              From seed to shelf, we maintain the highest standards at every step
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border border-cream-300/10 bg-cream-300/[0.02]"
                >
                  <step.icon className="h-5 w-5 text-primary-400"  />
                </div>
                <div className="text-xs font-mono tracking-wider mb-1 text-cream-600" >
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-sm font-medium mb-2 text-cream-200" >{step.label}</h3>
                <p className="text-sm text-cream-600" >{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="atelier-divider max-w-7xl mx-auto" />

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-light mb-4 text-cream-100" >
            Ready to Start Your Wellness Journey?
          </h2>
          <p className="mb-10 text-cream-500" >
            Discover our premium hemp products and experience the NCRemedies difference today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg">Browse Products</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">Get In Touch</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export const metadata = {
  title: 'About Us - NCRemedies',
  description: 'Learn about NCRemedies mission to provide premium hemp and wellness products. Discover our commitment to quality, organic sourcing, and customer care.',
  keywords: 'about NCRemedies, hemp company, organic hemp products, wellness, quality assurance',
  openGraph: {
    title: 'About NCRemedies - Premium Hemp & Wellness',
    description: 'Discover our story, mission, and commitment to providing the highest quality hemp and wellness products.',
    type: 'website'
  }
}