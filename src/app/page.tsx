'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import InputPanel from '@/components/InputPanel';
import OutputPanel from '@/components/OutputPanel';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HowToUseModal } from '@/components/HowToUseModal';
import MobileInputDrawer from '@/components/MobileInputDrawer';
import { InfoIcon, Github } from 'lucide-react';

export default function Home() {
  const { runCalculation } = useAppStore();
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Run initial calculation on load
  useEffect(() => {
    try {
      runCalculation();
      setModelError(null);
    } catch (error) {
      if (error instanceof Error) {
        setModelError(error.message);
      } else {
        setModelError('An unknown error occurred in the model');
      }
    }
  }, [runCalculation]);

  const handleCalculate = () => {
    try {
      runCalculation();
      setModelError(null);
    } catch (error) {
      if (error instanceof Error) {
        setModelError(error.message);
      } else {
        setModelError('An unknown error occurred in the model');
      }
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center pb-20 lg:pb-8 bg-background relative">
      {/* Header section */}
      <div className="w-full px-4 py-3 md:p-6 lg:p-8 border-b sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-row justify-between items-center gap-3 max-w-7xl mx-auto">
          {/* Logo section */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image 
                src="/logo.svg" 
                alt="squid.la Logo" 
                width={130} 
                height={40} 
                className="cursor-pointer"
              />
            </Link>
          </div>
          
          {/* Actions section */}
          <div className="flex items-center gap-2">
            <HowToUseModal />
            <Link href="/explain">
              <Button 
                variant="outline" 
                size="sm" 
                className="size-9 md:size-auto md:px-4 md:py-2 flex items-center justify-center"
              >
                <span className="hidden md:inline">Financial Terms Explained</span>
                <InfoIcon className="h-4 w-4 md:hidden" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-4">
        {modelError && (
          <Card className="w-full mb-6 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/50">
            <CardContent className="p-4">
              <p className="text-red-800 dark:text-red-200">
                {modelError}
              </p>
              <p className="text-red-800 dark:text-red-200 mt-1 text-sm">
                Please adjust your model parameters and try again.
              </p>
            </CardContent>
          </Card>
        )}
        
        <div className="w-full flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 w-full hidden lg:block">
            <InputPanel onCalculate={handleCalculate} />
          </div>
          <div className="lg:w-2/3 w-full">
            <OutputPanel />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full border-t mt-auto py-4 px-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-left">
            <p>© {new Date().getFullYear()} squid.la. All rights reserved.</p>
            <p className="mt-1">Built by Jake Bourne. Commercial use prohibited without permission.</p>
          </div>
          <div className="flex items-center gap-2 order-1 md:order-2 mb-2 md:mb-0">
            <Link 
              href="https://github.com/jakeybourne/squid.la" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="hidden md:inline">GitHub</span>
            </Link>
          </div>
        </div>
      </footer>
      
      {/* The MobileInputDrawer is now positioned at the bottom of the viewport */}
      <div className="lg:hidden">
        <MobileInputDrawer onCalculate={handleCalculate} />
      </div>
    </main>
  );
}
