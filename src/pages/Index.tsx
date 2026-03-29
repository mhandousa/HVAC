import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Thermometer,
  Wind,
  Activity,
  Calculator,
  Box,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      description: 'Connect BACnet/Modbus devices and monitor live sensor data with configurable dashboards.',
    },
    {
      icon: Box,
      title: 'BIM & Digital Twin',
      description: 'Import IFC files and visualize your buildings in interactive 3D with equipment overlays.',
    },
    {
      icon: Calculator,
      title: 'Design Tools',
      description: 'Load calculations, duct sizing, and psychrometric analysis following ASHRAE standards.',
    },
    {
      icon: Wrench,
      title: 'Field Service',
      description: 'Work order management, technician dispatch, and mobile-friendly field access.',
    },
    {
      icon: Wind,
      title: 'AI Analytics',
      description: 'Fault detection, predictive maintenance, and energy optimization powered by AI.',
    },
    {
      icon: Thermometer,
      title: 'Equipment Management',
      description: 'Complete asset inventory with specifications, documents, and maintenance history.',
    },
  ];

  const benefits = [
    'Reduce energy consumption by 15-25%',
    'Predict equipment failures before they happen',
    'Streamline design workflows with automation',
    'Improve first-time fix rates for service calls',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center shadow-glow">
              <Thermometer className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">HVACPro AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Complete HVAC Lifecycle{' '}
              <span className="text-gradient">Management Platform</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Design, monitor, and optimize your HVAC systems with AI-powered analytics. 
              From BIM integration to real-time IoT monitoring and predictive maintenance.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              A comprehensive platform that covers the entire HVAC lifecycle from design to operations.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Built for HVAC Professionals
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're a design engineer, facility manager, or service contractor, 
                HVACPro AI provides the tools you need to work smarter and deliver better results.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 gap-2" asChild>
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center">
                <div className="text-center p-8">
                  <Activity className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">Platform Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl gradient-primary p-8 lg:p-12 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your HVAC Operations?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join industry leaders who trust HVACPro AI for their HVAC lifecycle management.
            </p>
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link to="/auth">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              <span className="font-semibold">HVACPro AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 HVACPro AI. Professional HVAC Management Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
