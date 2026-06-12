import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Pricing' };

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: [
      '3 mock interviews / month',
      'Resume upload & AI analysis',
      'Rubric feedback on every answer',
      'Session summaries & improvement plans',
      'Basic progress dashboard',
    ],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    highlight: true,
    features: [
      'Unlimited mock interviews',
      'All round types incl. system design',
      'Adaptive follow-up questions',
      'Full analytics & weakness heatmap',
      'Resume rewrite suggestions',
      'Priority AI evaluation',
    ],
    cta: 'Go Pro',
  },
  {
    name: 'Pro+ Annual',
    price: '$96',
    period: 'per year',
    highlight: false,
    features: [
      'Everything in Pro',
      '2 months free vs monthly',
      'Exportable session reports',
      'Early access to new features',
    ],
    cta: 'Go Pro+',
  },
];

export default function PricingPage() {
  return (
    <div className="container py-16">
      <h1 className="text-center font-display text-6xl font-bold tracking-tight sm:text-7xl">
        Pricing
      </h1>
      <p className="mt-4 text-center text-muted-foreground">
        Start free. Upgrade when practice becomes a habit. 💛
      </p>
      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div key={plan.name} className="relative">
            {plan.highlight && (
              <>
                <div
                  className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-violet-400"
                  aria-hidden
                />
                <div
                  className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-amber-300"
                  aria-hidden
                />
              </>
            )}
            <Card className="relative h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.highlight && <Badge variant="warning">Most popular</Badge>}
                </div>
                <CardDescription>
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>{' '}
                  <span className="text-sm">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: plan.highlight ? 'default' : 'outline',
                    className: 'mt-6 w-full',
                  })}
                >
                  {plan.cta}
                </Link>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Billing integration ships with the payments milestone — plans above reflect launch pricing.
      </p>
    </div>
  );
}
