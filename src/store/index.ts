import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GlobalSettings, ModelResult, Scenario, ScenarioRange } from '../types';
import { getDefaultSettings, runModel } from '../lib/model';

interface AppState {
  settings: GlobalSettings;
  results: ScenarioRange | null;
  scenarios: Scenario[];
  activeScenario: string | null;
  compareScenario: string | null;
  
  // Actions
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  runCalculation: () => void;
  saveScenario: (name: string) => void;
  loadScenario: (name: string) => void;
  compareWithScenario: (name: string | null) => void;
  deleteScenario: (name: string) => void;
}

// Helper function to create a modified settings object with min/max values
const createVariantSettings = (
  settings: GlobalSettings,
  useMin: boolean
): GlobalSettings => {
  const newSettings = { ...settings };
  
  // Apply min/max values to range fields
  if (newSettings.priceGrowth && 
      (useMin ? newSettings.priceGrowth.min !== undefined : newSettings.priceGrowth.max !== undefined)) {
    newSettings.priceGrowth = { 
      value: useMin ? newSettings.priceGrowth.min! : newSettings.priceGrowth.max!,
      min: newSettings.priceGrowth.min,
      max: newSettings.priceGrowth.max
    };
  }
  
  if (newSettings.grossYield && 
      (useMin ? newSettings.grossYield.min !== undefined : newSettings.grossYield.max !== undefined)) {
    newSettings.grossYield = {
      value: useMin ? newSettings.grossYield.min! : newSettings.grossYield.max!,
      min: newSettings.grossYield.min,
      max: newSettings.grossYield.max
    };
  }
  
  if (newSettings.rentGrowth && 
      (useMin ? newSettings.rentGrowth.min !== undefined : newSettings.rentGrowth.max !== undefined)) {
    newSettings.rentGrowth = {
      value: useMin ? newSettings.rentGrowth.min! : newSettings.rentGrowth.max!,
      min: newSettings.rentGrowth.min,
      max: newSettings.rentGrowth.max
    };
  }
  
  if (newSettings.opexFactor && 
      (useMin ? newSettings.opexFactor.min !== undefined : newSettings.opexFactor.max !== undefined)) {
    newSettings.opexFactor = {
      value: useMin ? newSettings.opexFactor.min! : newSettings.opexFactor.max!,
      min: newSettings.opexFactor.min,
      max: newSettings.opexFactor.max
    };
  }
  
  if (newSettings.loanRate && 
      (useMin ? newSettings.loanRate.min !== undefined : newSettings.loanRate.max !== undefined)) {
    newSettings.loanRate = {
      value: useMin ? newSettings.loanRate.min! : newSettings.loanRate.max!,
      min: newSettings.loanRate.min,
      max: newSettings.loanRate.max
    };
  }
  
  return newSettings;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: getDefaultSettings(),
      results: null,
      scenarios: [],
      activeScenario: null,
      compareScenario: null,
      
      updateSettings: (partialSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...partialSettings }
        }));
      },
      
      runCalculation: () => {
        // Allow errors to propagate up to be caught by UI components
        try {
          // Run base scenario with current settings
          const baseResult = runModel(get().settings);
          
          // Create min and max scenarios
          let minResult: ModelResult | undefined;
          let maxResult: ModelResult | undefined;
          
          // Check if we should run min/max scenarios (ranges are enabled)
          const settings = get().settings;
          const hasRanges = 
            (settings.priceGrowth.min !== undefined && settings.priceGrowth.max !== undefined) ||
            (settings.grossYield.min !== undefined && settings.grossYield.max !== undefined) ||
            (settings.rentGrowth.min !== undefined && settings.rentGrowth.max !== undefined) || 
            (settings.opexFactor.min !== undefined && settings.opexFactor.max !== undefined) ||
            (settings.loanRate.min !== undefined && settings.loanRate.max !== undefined);
          
          if (hasRanges) {
            try {
              // Try to run the pessimistic scenario
              const minSettings = createVariantSettings(get().settings, true);
              minResult = runModel(minSettings);
            } catch (error) {
              console.warn('Min scenario calculation failed:', error);
            }
            
            try {
              // Try to run the optimistic scenario
              const maxSettings = createVariantSettings(get().settings, false);
              maxResult = runModel(maxSettings);
            } catch (error) {
              console.warn('Max scenario calculation failed:', error);
            }
          }
          
          // Create result range object
          const results: ScenarioRange = {
            base: baseResult,
            min: minResult,
            max: maxResult
          };
          
          set({ results });
        } catch (error) {
          // If base scenario fails, throw the error to be handled by UI
          throw error;
        }
      },
      
      saveScenario: (name) => {
        const scenario: Scenario = {
          name,
          timestamp: Date.now(),
          settings: get().settings,
          results: get().results || undefined
        };
        
        set((state) => {
          // Replace if exists, otherwise add new
          const exists = state.scenarios.findIndex(s => s.name === name);
          const newScenarios = [...state.scenarios];
          
          if (exists >= 0) {
            newScenarios[exists] = scenario;
          } else {
            newScenarios.push(scenario);
          }
          
          return {
            scenarios: newScenarios,
            activeScenario: name
          };
        });
      },
      
      loadScenario: (name) => {
        const scenario = get().scenarios.find(s => s.name === name);
        if (scenario) {
          set({
            settings: scenario.settings,
            results: scenario.results || null,
            activeScenario: name
          });
        }
      },
      
      compareWithScenario: (name) => {
        set({ compareScenario: name });
      },
      
      deleteScenario: (name) => {
        set((state) => ({
          scenarios: state.scenarios.filter(s => s.name !== name),
          activeScenario: state.activeScenario === name ? null : state.activeScenario,
          compareScenario: state.compareScenario === name ? null : state.compareScenario
        }));
      }
    }),
    {
      name: 'real-estate-model-storage'
    }
  )
); 