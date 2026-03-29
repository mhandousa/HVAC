import { useState, useMemo, useCallback } from 'react';
import { ZoneAcousticData, useZoneAcousticAnalysis } from './useZoneAcousticAnalysis';
import {
  OptimizationConstraints,
  PerformanceRequirements,
  TreatmentPackage,
  TieredPackages,
  generateTieredPackages,
  DEFAULT_CONSTRAINTS,
  DEFAULT_REQUIREMENTS,
} from '@/lib/treatment-package-optimizer';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  currentStep: WizardStep;
  selectedZoneIds: string[];
  constraints: OptimizationConstraints;
  requirements: PerformanceRequirements;
  packages: TieredPackages | null;
  selectedPackageId: string | null;
  isGenerating: boolean;
}

export function useTreatmentWizard(projectId: string | undefined) {
  // Fetch zone acoustic data
  const { zones: allZones, floorSummary } = useZoneAcousticAnalysis(projectId);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<OptimizationConstraints>(DEFAULT_CONSTRAINTS);
  const [requirements, setRequirements] = useState<PerformanceRequirements>(DEFAULT_REQUIREMENTS);
  const [packages, setPackages] = useState<TieredPackages | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter zones that need treatment
  const treatableZones = useMemo(() => {
    return allZones.filter(z => z.status === 'exceeds' || z.status === 'marginal');
  }, [allZones]);

  // Get selected zones data
  const selectedZones = useMemo(() => {
    return allZones.filter(z => selectedZoneIds.includes(z.zoneId));
  }, [allZones, selectedZoneIds]);

  // Summary of selection
  const selectionSummary = useMemo(() => {
    const critical = selectedZones.filter(z => z.ncDelta > 10).length;
    const high = selectedZones.filter(z => z.ncDelta > 5 && z.ncDelta <= 10).length;
    const medium = selectedZones.filter(z => z.ncDelta > 0 && z.ncDelta <= 5).length;
    const totalNCReduction = selectedZones.reduce((sum, z) => sum + z.ncDelta, 0);
    const avgNCReduction = selectedZones.length > 0 ? Math.round(totalNCReduction / selectedZones.length) : 0;

    return {
      zonesSelected: selectedZones.length,
      critical,
      high,
      medium,
      totalNCReduction,
      avgNCReduction,
    };
  }, [selectedZones]);

  // Zone toggle
  const toggleZone = useCallback((zoneId: string) => {
    setSelectedZoneIds(prev => 
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }, []);

  // Select all exceeding zones
  const selectAllExceeding = useCallback(() => {
    const exceedingIds = allZones
      .filter(z => z.status === 'exceeds')
      .map(z => z.zoneId);
    setSelectedZoneIds(prev => {
      const newIds = new Set([...prev, ...exceedingIds]);
      return Array.from(newIds);
    });
  }, [allZones]);

  // Select all marginal zones
  const selectAllMarginal = useCallback(() => {
    const marginalIds = allZones
      .filter(z => z.status === 'marginal')
      .map(z => z.zoneId);
    setSelectedZoneIds(prev => {
      const newIds = new Set([...prev, ...marginalIds]);
      return Array.from(newIds);
    });
  }, [allZones]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedZoneIds([]);
  }, []);

  // Generate packages
  const generatePackages = useCallback(async () => {
    if (selectedZones.length === 0) return;

    setIsGenerating(true);
    
    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const generated = generateTieredPackages(selectedZones, constraints, requirements);
    setPackages(generated);
    
    // Auto-select balanced package
    setSelectedPackageId(generated.balanced.id);
    
    setIsGenerating(false);
    setCurrentStep(4);
  }, [selectedZones, constraints, requirements]);

  // Select a package
  const selectPackage = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
  }, []);

  // Get selected package
  const selectedPackage = useMemo(() => {
    if (!packages || !selectedPackageId) return null;
    if (packages.budget.id === selectedPackageId) return packages.budget;
    if (packages.balanced.id === selectedPackageId) return packages.balanced;
    if (packages.premium.id === selectedPackageId) return packages.premium;
    return null;
  }, [packages, selectedPackageId]);

  // Navigation
  const canProceedToStep = useCallback((step: WizardStep): boolean => {
    switch (step) {
      case 2:
        return selectedZoneIds.length > 0;
      case 3:
        return true; // Can always proceed from budget
      case 4:
        return true; // Can always proceed from requirements
      case 5:
        return selectedPackage !== null;
      default:
        return true;
    }
  }, [selectedZoneIds.length, selectedPackage]);

  const goToStep = useCallback((step: WizardStep) => {
    if (step === 4 && currentStep === 3) {
      // Auto-generate when moving to step 4
      generatePackages();
    } else {
      setCurrentStep(step);
    }
  }, [currentStep, generatePackages]);

  const goNext = useCallback(() => {
    if (currentStep < 5 && canProceedToStep((currentStep + 1) as WizardStep)) {
      goToStep((currentStep + 1) as WizardStep);
    }
  }, [currentStep, canProceedToStep, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  }, [currentStep]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setSelectedZoneIds([]);
    setConstraints(DEFAULT_CONSTRAINTS);
    setRequirements(DEFAULT_REQUIREMENTS);
    setPackages(null);
    setSelectedPackageId(null);
    setIsGenerating(false);
  }, []);

  return {
    // Data
    allZones,
    treatableZones,
    selectedZones,
    floorSummary,
    selectionSummary,

    // State
    currentStep,
    selectedZoneIds,
    constraints,
    requirements,
    packages,
    selectedPackage,
    selectedPackageId,
    isGenerating,

    // Actions
    toggleZone,
    selectAllExceeding,
    selectAllMarginal,
    clearSelection,
    setConstraints,
    setRequirements,
    generatePackages,
    selectPackage,

    // Navigation
    canProceedToStep,
    goToStep,
    goNext,
    goBack,
    resetWizard,
  };
}
