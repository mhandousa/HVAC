import { Link } from 'react-router-dom'
import { Wind, Calculator, Database, ChartBar as FileBarChart, Shield, Zap, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const features = [
  {
    icon: Calculator,
    title: 'Load Calculations',
    description: 'Perform accurate HVAC heating and cooling load calculations with real-time results and ASHRAE-compliant methodology.',
  },
  {
    icon: Database,
    title: 'Equipment Library',
    description: 'Browse a comprehensive catalog of HVAC equipment from major manufacturers with detailed specifications.',
  },
  {
    icon: FileBarChart,
    title: 'Project Reports',
    description: 'Generate detailed project reports with load summaries, equipment selections, and export to multiple formats.',
  },
  {
    icon: Shield,
    title: 'Code Compliance',
    description: 'Built-in compliance checks for ASHRAE 90.1, local building codes, and energy efficiency standards.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    description: 'Get intelligent equipment recommendations and optimization suggestions powered by machine learning.',
  },
  {
    icon: Wind,
    title: 'Duct & Pipe Sizing',
    description: 'Automated ductwork and piping system design with pressure drop calculations and material takeoffs.',
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For individual engineers getting started',
    features: ['5 projects', 'Basic load calculations', 'Equipment catalog access', 'CSV export'],
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For growing engineering firms',
    features: ['Unlimited projects', 'Advanced calculations', 'Full equipment library', 'PDF reports', 'Code compliance checks', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: ['Everything in Pro', 'Custom integrations', 'SSO authentication', 'Dedicated support', 'Custom training', 'API access'],
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
              <Wind className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-zinc-100">
              HVACPro <span className="text-sky-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-4 py-1.5 text-sm text-sky-400">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered HVAC Design Platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
            Design Better HVAC Systems,{' '}
            <span className="bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">
              Faster
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Professional-grade HVAC load calculations, equipment selection, and project management.
            Built for mechanical engineers who demand precision and efficiency.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">View Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-100">Everything you need for HVAC design</h2>
            <p className="mt-3 text-zinc-400">Comprehensive tools that streamline your engineering workflow</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/60"
              >
                <div className="mb-4 inline-flex rounded-lg bg-sky-500/10 p-2.5 text-sky-400 transition-colors group-hover:bg-sky-500/15">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-100">Simple, transparent pricing</h2>
            <p className="mt-3 text-zinc-400">Choose the plan that fits your team</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.highlighted
                    ? 'border-sky-500/40 bg-sky-500/5 ring-1 ring-sky-500/20'
                    : 'border-zinc-800/80 bg-zinc-900/40'
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-4 inline-block rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
                  {plan.period && <span className="text-sm text-zinc-500">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-sky-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-zinc-100">Ready to transform your HVAC design workflow?</h2>
          <p className="mt-4 text-zinc-400">
            Join thousands of mechanical engineers already using HVACPro AI to deliver projects faster.
          </p>
          <Link to="/register" className="mt-8 inline-block">
            <Button size="lg">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-500" />
            <span className="text-sm font-semibold text-zinc-400">HVACPro AI</span>
          </div>
          <p className="text-xs text-zinc-600">2025 HVACPro AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
