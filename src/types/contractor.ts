export interface Contractor {
  id: string;
  name: string;
  companyName?: string;
  specializations: ContractorSpecialization[];
  contactPerson: string;
  phone: string;
  email: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  licenseNumber?: string;
  rating?: number;
  isPreferred?: boolean;
  notes?: string;
  createdAt: Date;
}

export type ContractorSpecialization = 
  | 'silencer'
  | 'lining'
  | 'isolator'
  | 'panel'
  | 'general'
  | 'hvac';

export interface PhaseContractorAssignment {
  phaseId: string;
  contractorId: string;
  status: AssignmentStatus;
  assignedDate: Date;
  acceptedDate?: Date;
  startedDate?: Date;
  completedDate?: Date;
  notes?: string;
  quotedCost?: number;    // Contractor's original quote
  agreedCost?: number;    // Negotiated price
  actualCost?: number;    // Final real cost
  reviewId?: string;      // Link to review after completion
}

export type AssignmentStatus = 
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'declined';

// Cost tracking per assignment
export interface AssignmentCostData {
  quotedCost: number;
  agreedCost: number;
  actualCost?: number;
  variance?: number;
  variancePercent?: number;
}

// Individual job review
export interface ContractorReview {
  id: string;
  contractorId: string;
  phaseId: string;
  projectName: string;
  rating: number;               // 1-5 stars overall
  qualityRating?: number;       // 1-5 for work quality
  timelinessRating?: number;    // 1-5 for on-time delivery
  communicationRating?: number; // 1-5 for responsiveness
  costRating?: number;          // 1-5 for cost accuracy
  reviewText?: string;
  createdAt: Date;
  createdBy?: string;
}

// Historical job record
export interface ContractorJobHistory {
  id: string;
  contractorId: string;
  projectName: string;
  phaseId: string;
  phaseName: string;
  startDate: Date;
  completedDate?: Date;
  scheduledDays: number;
  actualDays?: number;
  quotedCost: number;
  actualCost?: number;
  status: 'completed' | 'in_progress' | 'cancelled';
  review?: ContractorReview;
}

// Contractor performance metrics (calculated)
export interface ContractorPerformanceMetrics {
  totalJobs: number;
  completedJobs: number;
  onTimeJobs: number;
  onTimeRate: number;
  averageRating: number;
  totalQuotedCost: number;
  totalActualCost: number;
  costVariance: number;
  costVariancePercent: number;
  averageJobDuration: number;
  qualityAvg: number;
  timelinessAvg: number;
  communicationAvg: number;
  costAccuracyAvg: number;
}

// Cost summary for budget tracking
export interface CostSummary {
  totalQuoted: number;
  totalAgreed: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  byPhase: {
    phaseId: string;
    phaseName: string;
    contractorName?: string;
    quotedCost: number;
    agreedCost: number;
    actualCost?: number;
    variance?: number;
  }[];
  byContractor: {
    contractorId: string;
    contractorName: string;
    phaseCount: number;
    totalAgreed: number;
    totalActual: number;
    variance: number;
  }[];
}

export const SPECIALIZATION_LABELS: Record<ContractorSpecialization, string> = {
  silencer: 'Silencers',
  lining: 'Duct Lining',
  isolator: 'Vibration Isolation',
  panel: 'Acoustic Panels',
  general: 'General',
  hvac: 'HVAC',
};

export const ASSIGNMENT_STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground' },
  assigned: { label: 'Assigned', color: 'bg-yellow-500/20 text-yellow-600' },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-primary/20 text-primary' },
  completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-600' },
  declined: { label: 'Declined', color: 'bg-destructive/20 text-destructive' },
};
