import { useState, useCallback, useMemo } from 'react';
import { 
  ContractorReview, 
  ContractorJobHistory, 
  ContractorPerformanceMetrics,
  ContractorSpecialization,
} from '@/types/contractor';

// Sample historical data for demo
const SAMPLE_REVIEWS: ContractorReview[] = [
  {
    id: 'review-1',
    contractorId: 'contractor-1',
    phaseId: 'phase-demo-1',
    projectName: 'Al Faisaliah Tower HVAC',
    rating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    communicationRating: 5,
    costRating: 5,
    reviewText: 'Excellent work on the silencer installation. Completed ahead of schedule with great attention to detail.',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'review-2',
    contractorId: 'contractor-1',
    phaseId: 'phase-demo-2',
    projectName: 'Kingdom Centre Retrofit',
    rating: 4,
    qualityRating: 5,
    timelinessRating: 4,
    communicationRating: 4,
    costRating: 4,
    reviewText: 'Very professional work. Minor delay due to material procurement but kept us informed throughout.',
    createdAt: new Date('2024-12-20'),
  },
  {
    id: 'review-3',
    contractorId: 'contractor-2',
    phaseId: 'phase-demo-3',
    projectName: 'Riyadh Metro Station 5',
    rating: 4,
    qualityRating: 4,
    timelinessRating: 4,
    communicationRating: 5,
    costRating: 4,
    reviewText: 'Good quality acoustic panel installation. Responsive to change requests.',
    createdAt: new Date('2025-01-05'),
  },
];

const SAMPLE_JOB_HISTORY: ContractorJobHistory[] = [
  {
    id: 'job-1',
    contractorId: 'contractor-1',
    projectName: 'Al Faisaliah Tower HVAC',
    phaseId: 'phase-demo-1',
    phaseName: 'Silencer Installation - Floors 1-10',
    startDate: new Date('2025-01-01'),
    completedDate: new Date('2025-01-12'),
    scheduledDays: 14,
    actualDays: 12,
    quotedCost: 45000,
    actualCost: 43500,
    status: 'completed',
  },
  {
    id: 'job-2',
    contractorId: 'contractor-1',
    projectName: 'Kingdom Centre Retrofit',
    phaseId: 'phase-demo-2',
    phaseName: 'HVAC Silencer Phase A',
    startDate: new Date('2024-12-01'),
    completedDate: new Date('2024-12-18'),
    scheduledDays: 15,
    actualDays: 17,
    quotedCost: 52000,
    actualCost: 54000,
    status: 'completed',
  },
  {
    id: 'job-3',
    contractorId: 'contractor-2',
    projectName: 'Riyadh Metro Station 5',
    phaseId: 'phase-demo-3',
    phaseName: 'Acoustic Panel Installation',
    startDate: new Date('2024-12-15'),
    completedDate: new Date('2024-12-28'),
    scheduledDays: 14,
    actualDays: 13,
    quotedCost: 38000,
    actualCost: 37500,
    status: 'completed',
  },
  {
    id: 'job-4',
    contractorId: 'contractor-3',
    projectName: 'KAPSARC Building B',
    phaseId: 'phase-demo-4',
    phaseName: 'Vibration Isolator Installation',
    startDate: new Date('2025-01-10'),
    scheduledDays: 10,
    quotedCost: 28000,
    status: 'in_progress',
  },
];

export function useContractorPerformance() {
  const [reviews, setReviews] = useState<ContractorReview[]>(SAMPLE_REVIEWS);
  const [jobHistory, setJobHistory] = useState<ContractorJobHistory[]>(SAMPLE_JOB_HISTORY);

  // Add a new review
  const addReview = useCallback((review: Omit<ContractorReview, 'id' | 'createdAt'>) => {
    const newReview: ContractorReview = {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date(),
    };
    setReviews(prev => [newReview, ...prev]);
    return newReview;
  }, []);

  // Update an existing review
  const updateReview = useCallback((id: string, updates: Partial<ContractorReview>) => {
    setReviews(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }, []);

  // Delete a review
  const deleteReview = useCallback((id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  // Add job to history
  const addJobHistory = useCallback((job: Omit<ContractorJobHistory, 'id'>) => {
    const newJob: ContractorJobHistory = {
      ...job,
      id: `job-${Date.now()}`,
    };
    setJobHistory(prev => [newJob, ...prev]);
    return newJob;
  }, []);

  // Update job history
  const updateJobHistory = useCallback((id: string, updates: Partial<ContractorJobHistory>) => {
    setJobHistory(prev =>
      prev.map(j => j.id === id ? { ...j, ...updates } : j)
    );
  }, []);

  // Get reviews for a specific contractor
  const getContractorReviews = useCallback((contractorId: string): ContractorReview[] => {
    return reviews.filter(r => r.contractorId === contractorId);
  }, [reviews]);

  // Get job history for a specific contractor
  const getContractorJobHistory = useCallback((contractorId: string): ContractorJobHistory[] => {
    return jobHistory.filter(j => j.contractorId === contractorId);
  }, [jobHistory]);

  // Calculate performance metrics for a contractor
  const getContractorMetrics = useCallback((contractorId: string): ContractorPerformanceMetrics => {
    const jobs = jobHistory.filter(j => j.contractorId === contractorId);
    const contractorReviews = reviews.filter(r => r.contractorId === contractorId);
    
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const onTimeJobs = completedJobs.filter(j => 
      j.actualDays !== undefined && j.actualDays <= j.scheduledDays
    );
    
    const totalQuoted = completedJobs.reduce((sum, j) => sum + j.quotedCost, 0);
    const totalActual = completedJobs.reduce((sum, j) => sum + (j.actualCost || 0), 0);
    const totalDays = completedJobs.reduce((sum, j) => sum + (j.actualDays || j.scheduledDays), 0);
    
    const avgRating = contractorReviews.length 
      ? contractorReviews.reduce((sum, r) => sum + r.rating, 0) / contractorReviews.length 
      : 0;

    const qualityAvg = contractorReviews.filter(r => r.qualityRating).length
      ? contractorReviews.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / contractorReviews.filter(r => r.qualityRating).length
      : 0;

    const timelinessAvg = contractorReviews.filter(r => r.timelinessRating).length
      ? contractorReviews.reduce((sum, r) => sum + (r.timelinessRating || 0), 0) / contractorReviews.filter(r => r.timelinessRating).length
      : 0;

    const communicationAvg = contractorReviews.filter(r => r.communicationRating).length
      ? contractorReviews.reduce((sum, r) => sum + (r.communicationRating || 0), 0) / contractorReviews.filter(r => r.communicationRating).length
      : 0;

    const costAccuracyAvg = contractorReviews.filter(r => r.costRating).length
      ? contractorReviews.reduce((sum, r) => sum + (r.costRating || 0), 0) / contractorReviews.filter(r => r.costRating).length
      : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      onTimeJobs: onTimeJobs.length,
      onTimeRate: completedJobs.length ? (onTimeJobs.length / completedJobs.length) * 100 : 0,
      averageRating: avgRating,
      totalQuotedCost: totalQuoted,
      totalActualCost: totalActual,
      costVariance: totalActual - totalQuoted,
      costVariancePercent: totalQuoted ? ((totalActual - totalQuoted) / totalQuoted) * 100 : 0,
      averageJobDuration: completedJobs.length ? totalDays / completedJobs.length : 0,
      qualityAvg,
      timelinessAvg,
      communicationAvg,
      costAccuracyAvg,
    };
  }, [jobHistory, reviews]);

  // Get top performers by rating
  const getTopPerformers = useCallback((contractorIds: string[], limit: number = 5) => {
    const metricsMap = contractorIds.map(id => ({
      contractorId: id,
      metrics: getContractorMetrics(id),
    }));
    
    return metricsMap
      .filter(m => m.metrics.totalJobs > 0)
      .sort((a, b) => b.metrics.averageRating - a.metrics.averageRating)
      .slice(0, limit);
  }, [getContractorMetrics]);

  // Get contractors with best cost accuracy
  const getCostLeaders = useCallback((contractorIds: string[], limit: number = 5) => {
    const metricsMap = contractorIds.map(id => ({
      contractorId: id,
      metrics: getContractorMetrics(id),
    }));
    
    return metricsMap
      .filter(m => m.metrics.completedJobs > 0)
      .sort((a, b) => Math.abs(a.metrics.costVariancePercent) - Math.abs(b.metrics.costVariancePercent))
      .slice(0, limit);
  }, [getContractorMetrics]);

  return {
    reviews,
    jobHistory,
    addReview,
    updateReview,
    deleteReview,
    addJobHistory,
    updateJobHistory,
    getContractorReviews,
    getContractorJobHistory,
    getContractorMetrics,
    getTopPerformers,
    getCostLeaders,
  };
}
