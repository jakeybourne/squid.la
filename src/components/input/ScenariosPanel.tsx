'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, Card } from '@/components/ui/card';
import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Download, Upload, Trash2 } from 'lucide-react';
import { GlobalSettings } from '@/types';
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ScenariosPanel() {
  const { scenarios, settings } = useAppStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleExportSettings = () => {
    // Create a JSON string from the current settings
    const jsonString = JSON.stringify(settings, null, 2);
    
    // Create a Blob with the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `squid-egg-settings-${new Date().toISOString().slice(0, 10)}.json`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast("Settings Exported", {
      description: "Your settings have been exported as a JSON file.",
    });
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedSettings = JSON.parse(content) as GlobalSettings;
        
        // Validate the imported settings (basic validation)
        if (
          typeof importedSettings !== 'object' ||
          !('seedEquity' in importedSettings) ||
          !('purchaseYears' in importedSettings)
        ) {
          throw new Error("Invalid settings format");
        }
        
        // Update settings in the store
        useAppStore.getState().updateSettings(importedSettings);
        
        // Run calculation with new settings
        useAppStore.getState().runCalculation();
        
        toast.success("Settings Imported", {
          description: "Your settings have been successfully imported.",
        });
        
        setIsImportDialogOpen(false);
      } catch (error) {
        console.error("Error importing settings:", error);
        toast.error("Import Failed", {
          description: "Failed to import settings. The file may be invalid.",
        });
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleDeleteScenario = (scenarioName: string) => {
    useAppStore.getState().deleteScenario(scenarioName);
    toast("Scenario Deleted", {
      description: `"${scenarioName}" has been deleted.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* <div className="flex gap-2">
          <Input
            placeholder="Scenario name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
          />
          <Button onClick={handleSaveScenario}>
            Save
          </Button>
        </div> */}
        
        <div className="flex gap-2 ">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportSettings}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Settings</DialogTitle>
                <DialogDescription>
                  This will overwrite your current settings. Make sure to save your current settings first if needed.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Button className="w-full" onClick={handleImportClick}>
                  Select JSON File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImportSettings} 
                  accept=".json" 
                  className="hidden"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {scenarios.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium">Saved Scenarios</h3>
            <div className="space-y-1">
              {scenarios.map((scenario) => (
                <div key={scenario.name} className="flex justify-between items-center py-2 px-2 border rounded-md">
                  <span>{scenario.name}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => useAppStore.getState().loadScenario(scenario.name)}>
                      Load
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => useAppStore.getState().compareWithScenario(scenario.name)}>
                      Compare
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteScenario(scenario.name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 