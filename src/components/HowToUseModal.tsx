import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircleIcon } from "lucide-react";

export function HowToUseModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="size-9 md:size-auto md:px-4 md:py-2 flex items-center justify-center"
        >
          <span className="hidden md:inline">How To Use</span>
          <HelpCircleIcon className="h-4 w-4 md:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">How To Use This Model</DialogTitle>
          <DialogDescription>
            A casual guide to get you set up and running with squid.la
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border rounded-md px-4 my-3">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                  <span className="font-medium">Getting Started</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="mb-4">Hey there! Here&apos;s how to get started with this model in a few easy steps:</p>
                
                <div className="space-y-4 pl-11">
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">Think about your plan</h4>
                    <p>Before diving in, have a rough idea of:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>How much money you&apos;re starting with</li>
                      <li>How many properties you might want to buy</li>
                      <li>What timeframe you&apos;re looking at (5 years? 20 years?)</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">Play with the model settings</h4>
                    <p>Start with the &quot;Model Settings&quot; panel - this is where you set your:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Seed equity (your starting cash)</li>
                      <li>Annual injections (extra money you&apos;ll add each year)</li>
                      <li>Retirement year (when you want to stop actively managing)</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">Don&apos;t worry about getting it perfect</h4>
                    <p>The beauty of this model is you can change things as you go and see how they affect your future. Nothing&apos;s set in stone!</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border rounded-md px-4 my-3">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                  <span className="font-medium">Setting Up Your Model</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="mb-4">The model is organized into panels that control different aspects of your investment:</p>
                
                <div className="space-y-4 pl-11">
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">🏠 Property Settings</h4>
                    <p>This is where the fun happens! You can:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Set when you&apos;ll buy properties (year 0? year 3?)</li>
                      <li>Decide how much each property costs</li>
                      <li>Estimate your rental yield (how much rent you&apos;ll get compared to property value)</li>
                      <li>Set your expectations for property value growth</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">💸 Financing Terms</h4>
                    <p>Most people use mortgages - here&apos;s where you set that up:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>LTV (what % of each property you&apos;ll finance)</li>
                      <li>Interest rate on your loans</li>
                      <li>Loan term in years</li>
                      <li>Any extra payments you plan to make</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">📊 Tax Settings</h4>
                    <p>Nobody likes them, but taxes matter a lot! You can set:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Corporate tax rate if you&apos;re using a company structure</li>
                      <li>Dividend tax rates for taking money out</li>
                      <li>Portuguese property taxes (IMI/AIMI)</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border rounded-md px-4 my-3">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                  <span className="font-medium">Reading Results</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="mb-4">Once you&apos;ve set everything up, here&apos;s how to make sense of what the model is telling you:</p>
                
                <div className="space-y-4 pl-11">
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">📈 Charts</h4>
                    <p>The charts show how your investment evolves over time:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Net Worth Growth</strong> - How much wealthier you&apos;re getting year by year</li>
                      <li><strong>Cash Flow</strong> - Money coming in vs going out each year</li>
                      <li><strong>Loan Balance</strong> - How your debt changes over time</li>
                      <li><strong>Property Value</strong> - What your portfolio might be worth</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">🔍 Key Metrics</h4>
                    <p>Keep an eye on these important numbers:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Return on Equity (ROE)</strong> - How efficiently your money is working</li>
                      <li><strong>Cash-on-Cash Return</strong> - Annual cash flow relative to your investment</li>
                      <li><strong>Total Return</strong> - Combination of cash flow and property appreciation</li>
                      <li><strong>Final Net Worth</strong> - What you end up with at your target date</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">⚠️ Warning Indicators</h4>
                    <p>Watch out for these red flags in the results:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li><strong>Negative Cash</strong> - If your cash balance goes negative, you&apos;re in trouble</li>
                      <li><strong>High LTV</strong> - If your loan-to-value stays too high for too long</li>
                      <li><strong>Cash Flow Drops</strong> - Periods where your cash flow suddenly decreases</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border rounded-md px-4 my-3">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
                  <span className="font-medium">Running Scenarios</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="mb-4">This is where the real fun begins - testing different scenarios to see what works best:</p>
                
                <div className="space-y-4 pl-11">
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">🔀 Try Different Approaches</h4>
                    <p>Some ideas to test:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>What if you buy fewer, more expensive properties?</li>
                      <li>What if you buy more, less expensive properties?</li>
                      <li>What if you use less leverage (smaller mortgages)?</li>
                      <li>What if you pay down mortgages faster?</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-secondary/5">
                    <h4 className="font-medium mb-2">🔮 Stress Testing</h4>
                    <p>Don&apos;t skip this part! Test how your plan would survive:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>A 30% drop in property values</li>
                      <li>Interest rates going up 3%</li>
                      <li>Periods of low rental occupancy (75% or less)</li>
                      <li>Tax law changes</li>
                    </ul>
                    <p className="mt-2 text-sm italic">The model that survives stress tests is the one you can sleep well with at night!</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Remember, this model is a tool to help you think through possibilities - not a crystal ball. 
            The real estate market has many variables, so use these projections as a guide, not a guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 