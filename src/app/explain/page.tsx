'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import glossaryTermsData from '@/data/glossaryTerms.json';
import { HowToUseModal } from '@/components/HowToUseModal';
import { ArrowLeft } from 'lucide-react';

type TermExplanation = {
  term: string;
  normalExplanation: string;
  simplifiedExplanation: string;
  category: 'general' | 'property' | 'financial' | 'tax' | 'modeling' | 'structure' | 'stress' | 'warning' | 'portugal';
};

export default function ExplainPage() {
  const [showSimplified, setShowSimplified] = useState(false);
  
  // Type assertion to ensure the JSON data matches our TermExplanation type
  const terms: TermExplanation[] = glossaryTermsData as TermExplanation[];

  // Group terms by category
  const categories = {
    general: terms.filter(term => term.category === 'general'),
    property: terms.filter(term => term.category === 'property'),
    financial: terms.filter(term => term.category === 'financial'),
    tax: terms.filter(term => term.category === 'tax'),
    modeling: terms.filter(term => term.category === 'modeling'),
    structure: terms.filter(term => term.category === 'structure'),
    stress: terms.filter(term => term.category === 'stress'),
    warning: terms.filter(term => term.category === 'warning'),
    portugal: terms.filter(term => term.category === 'portugal'),
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="w-full px-4 py-3 md:p-6 lg:p-8 border-b sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="mr-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Financial Terms Explained</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Understanding the key concepts in the squid.la real estate model
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <HowToUseModal />
            <Link href="/" className="hidden sm:inline-block">
              <Button variant="outline" size="sm">Back to Model</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {showSimplified 
              ? "Showing simplified explanations anyone can understand" 
              : "Showing standard financial explanations"}
          </p>
          <Toggle
            pressed={showSimplified}
            onPressedChange={setShowSimplified}
            aria-label="Toggle simplified explanations"
            className="data-[state=on]:bg-blue-600"
          >
            {showSimplified ? "Like I'm 5 ✓" : "Like I'm 5"}
          </Toggle>
        </div>
        
        {/* General Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>General Terms</CardTitle>
            <CardDescription>Basic investment concepts and timeframes</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.general.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Property Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Property Terms</CardTitle>
            <CardDescription>Concepts related to real estate assets</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.property.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Financial Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Financial Terms</CardTitle>
            <CardDescription>Concepts related to loans, returns, and cash flow</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.financial.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Tax Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Tax Terms</CardTitle>
            <CardDescription>Concepts related to taxation in Portugal</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.tax.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modeling Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Modeling Terms</CardTitle>
            <CardDescription>Concepts related to financial modeling and scenarios</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.modeling.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Structure Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Structure Terms</CardTitle>
            <CardDescription>Concepts related to business and ownership structures</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.structure.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stress Test Terms */}
        <Card>
          <CardHeader className="py-4 px-4 md:py-6 md:px-6">
            <CardTitle>Stress Test Terms</CardTitle>
            <CardDescription>Concepts related to challenging scenario simulations</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.stress.map((item) => (
                <div key={item.term} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{item.term}</h3>
                  <p className="mt-2 text-sm md:text-base">
                    {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warning Terms */}
        {categories.warning.length > 0 && (
          <Card>
            <CardHeader className="py-4 px-4 md:py-6 md:px-6">
              <CardTitle>Warning Indicators</CardTitle>
              <CardDescription>Important alerts and monitoring indicators</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.warning.map((item) => (
                  <div key={item.term} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{item.term}</h3>
                    <p className="mt-2 text-sm md:text-base">
                      {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portugal-specific Terms */}
        {categories.portugal.length > 0 && (
          <Card>
            <CardHeader className="py-4 px-4 md:py-6 md:px-6">
              <CardTitle>Portugal-specific Terms</CardTitle>
              <CardDescription>Concepts specific to Portuguese real estate and taxation</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.portugal.map((item) => (
                  <div key={item.term} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{item.term}</h3>
                    <p className="mt-2 text-sm md:text-base">
                      {showSimplified ? item.simplifiedExplanation : item.normalExplanation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
} 