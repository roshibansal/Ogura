import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SellerStartButton } from "@/components/seller/SellerStartButton";
import { DemoStartLink } from "@/components/seller/DemoStageControl";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Store,
  BarChart3,
  Truck,
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Reach Beyond Your Followers",
    description: "Be found by shoppers who came to Ogura looking for original design, not by people who already follow you.",
  },
  {
    icon: BarChart3,
    title: "Seller Dashboard",
    description: "Manage products, track orders, and monitor sales with our intuitive dashboard.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Tools",
    description: "Leverage AI for product photography, descriptions, and customer matching.",
  },
  {
    icon: Truck,
    title: "Logistics Support",
    description: "We handle shipping, returns, and customer support so you can focus on design.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Get paid reliably with our transparent commission structure and weekly payouts.",
  },
  {
    icon: Store,
    title: "Brand Storefront",
    description: "Get your own branded page on Ogura to showcase your collections.",
  },
];


const SellerLanding = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <TrendingUp className="h-4 w-4" />
              Join India's Fastest Growing Fashion Platform
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Grow Your Fashion Brand
              <br />
              <span className="text-primary">with Ogura</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Put your studio's work in front of customers in cities your Instagram never reaches.
              Zero upfront costs. Every brand reviewed for original design before it goes live.
            </p>
            <div className="flex flex-col items-center justify-center gap-3">
              <SellerStartButton />
              <p className="text-xs text-muted-foreground">
                One account for applying and for running your store. Already applied? The same
                button takes you to your dashboard.
              </p>
              <DemoStartLink />
            </div>
          </div>
        </div>
      </section>

      {/* Commission */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Transparent Commission</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Simple, fair pricing with no hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <p className="text-4xl font-bold text-primary mb-2">15%</p>
                <p className="font-medium text-foreground">Standard</p>
                <p className="text-sm text-muted-foreground mt-1">For new sellers</p>
              </CardContent>
            </Card>
            <Card className="text-center border-primary/50 shadow-md">
              <CardContent className="pt-8 pb-6">
                <p className="text-4xl font-bold text-primary mb-2">12%</p>
                <p className="font-medium text-foreground">Growth</p>
                <p className="text-sm text-muted-foreground mt-1">₹1L+ monthly sales</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <p className="text-4xl font-bold text-primary mb-2">10%</p>
                <p className="font-medium text-foreground">Premium</p>
                <p className="text-sm text-muted-foreground mt-1">₹5L+ monthly sales</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Why Sell on Ogura?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Everything you need to grow your fashion business online.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <Card key={b.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What is true today. No invented testimonials — we are in pilot. */}
      <section className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Where we are today</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We are early, and we would rather tell you exactly what that means than
              promise you a number we have not earned yet.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            {[
              { n: "21", k: "fashion brands onboarded and live on Ogura" },
              { n: "5", k: "small-batch production houses and fabric suppliers" },
              { n: "48h", k: "from approved application to your first listing" },
            ].map((s2) => (
              <Card key={s2.k}>
                <CardContent className="pt-6">
                  <p className="text-4xl font-bold text-primary">{s2.n}</p>
                  <p className="text-sm text-muted-foreground mt-2">{s2.k}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
            We are running a pilot to prove one thing: that a brand on Ogura keeps more of
            the customers it earns than it does selling alone. Until that is proven, we are
            onboarding carefully rather than quickly.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start Selling?</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Join the 21 brands already live on Ogura.
        </p>
        <div className="flex justify-center">
          <SellerStartButton label="Apply with Google" />
        </div>
      </section>
    </div>
  );
};

export default SellerLanding;
