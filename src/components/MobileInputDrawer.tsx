'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, X } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import InputPanel from './InputPanel';

export default function MobileInputDrawer({ onCalculate }: { onCalculate?: () => void }) {
  return (
    <Sheet>
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <SheetTrigger asChild>
          <button 
            className="w-full bg-background border-t border-x rounded-t-lg py-3 px-6 text-sm font-medium flex justify-center items-center gap-2 hover:bg-muted transition-colors shadow-md"
          >
            <span>Inputs</span>
            <ChevronUp className="h-4 w-4" />
          </button>
        </SheetTrigger>
      </div>
      <SheetContent 
        side="bottom" 
        className="flex flex-col w-full p-0 max-h-[85vh] [&>button]:hidden"
      >
        <div className="flex items-center justify-between p-4 px-6 border-b">
          <div className="flex items-center">
            <div className="bg-muted w-10 h-1 rounded-full mx-auto mb-4 absolute left-1/2 -translate-x-1/2 -top-2"></div>
            <SheetTitle className="text-lg font-medium ml-1">Model Settings</SheetTitle>
          </div>
          <SheetClose className="rounded-full hover:bg-muted p-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
        
        <SheetDescription className="px-6 pt-2 pb-2 text-sm">
          Change dials. See what happens.
        </SheetDescription>
        
        <div className="flex-1 overflow-y-auto px-6 py-2 pb-20">
          <InputPanel onCalculate={onCalculate} inDrawer={true} />
        </div>
        
        <div className="sticky bottom-0 mt-auto border-t bg-background p-4 flex justify-end gap-2">
          <SheetClose asChild>
            <Button variant="secondary">Done</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
} 