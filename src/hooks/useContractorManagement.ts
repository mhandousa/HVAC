import { useState, useCallback } from 'react';
import { 
  Contractor, 
  ContractorSpecialization, 
  PhaseContractorAssignment, 
  AssignmentStatus 
} from '@/types/contractor';

// Sample contractors for demo purposes
const SAMPLE_CONTRACTORS: Contractor[] = [
  {
    id: 'contractor-1',
    name: 'Ahmed Al-Rashid',
    companyName: 'AC Solutions HVAC',
    specializations: ['silencer', 'hvac'],
    contactPerson: 'Ahmed Al-Rashid',
    phone: '+966-50-123-4567',
    email: 'ahmed@acsolutions.sa',
    city: 'Riyadh',
    rating: 5,
    isPreferred: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'contractor-2',
    name: 'Mohammed Hassan',
    companyName: 'Sound Pro Technical',
    specializations: ['lining', 'panel'],
    contactPerson: 'Mohammed Hassan',
    phone: '+966-55-987-6543',
    email: 'mohammed@soundpro.sa',
    city: 'Jeddah',
    rating: 4,
    isPreferred: false,
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 'contractor-3',
    name: 'Khalid Al-Farsi',
    companyName: 'Vibra Tech Services',
    specializations: ['isolator', 'general'],
    contactPerson: 'Khalid Al-Farsi',
    phone: '+966-54-456-7890',
    email: 'khalid@vibratech.sa',
    city: 'Dammam',
    rating: 4,
    isPreferred: true,
    createdAt: new Date('2024-02-10'),
  },
];

export function useContractorManagement() {
  const [contractors, setContractors] = useState<Contractor[]>(SAMPLE_CONTRACTORS);
  const [assignments, setAssignments] = useState<Map<string, PhaseContractorAssignment>>(new Map());

  // Add a new contractor
  const addContractor = useCallback((contractorData: Omit<Contractor, 'id' | 'createdAt'>) => {
    const newContractor: Contractor = {
      ...contractorData,
      id: `contractor-${Date.now()}`,
      createdAt: new Date(),
    };
    setContractors(prev => [...prev, newContractor]);
    return newContractor;
  }, []);

  // Update existing contractor
  const updateContractor = useCallback((id: string, updates: Partial<Contractor>) => {
    setContractors(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  // Delete contractor
  const deleteContractor = useCallback((id: string) => {
    setContractors(prev => prev.filter(c => c.id !== id));
    // Also remove any assignments for this contractor
    setAssignments(prev => {
      const next = new Map(prev);
      for (const [phaseId, assignment] of next.entries()) {
        if (assignment.contractorId === id) {
          next.delete(phaseId);
        }
      }
      return next;
    });
  }, []);

  // Assign contractor to phase
  const assignContractorToPhase = useCallback((phaseId: string, contractorId: string, agreedCost?: number) => {
    const assignment: PhaseContractorAssignment = {
      phaseId,
      contractorId,
      status: 'assigned',
      assignedDate: new Date(),
      agreedCost,
    };
    setAssignments(prev => {
      const next = new Map(prev);
      next.set(phaseId, assignment);
      return next;
    });
    return assignment;
  }, []);

  // Update assignment status
  const updateAssignmentStatus = useCallback((phaseId: string, status: AssignmentStatus, notes?: string) => {
    setAssignments(prev => {
      const next = new Map(prev);
      const current = next.get(phaseId);
      if (current) {
        const updated = { ...current, status, notes: notes || current.notes };
        
        // Add date stamps based on status
        if (status === 'accepted') {
          updated.acceptedDate = new Date();
        } else if (status === 'in_progress') {
          updated.startedDate = new Date();
        } else if (status === 'completed') {
          updated.completedDate = new Date();
        }
        
        next.set(phaseId, updated);
      }
      return next;
    });
  }, []);

  // Unassign contractor from phase
  const unassignContractorFromPhase = useCallback((phaseId: string) => {
    setAssignments(prev => {
      const next = new Map(prev);
      next.delete(phaseId);
      return next;
    });
  }, []);

  // Get contractor for a specific phase
  const getPhaseContractor = useCallback((phaseId: string): Contractor | undefined => {
    const assignment = assignments.get(phaseId);
    if (!assignment) return undefined;
    return contractors.find(c => c.id === assignment.contractorId);
  }, [assignments, contractors]);

  // Get assignment for a specific phase
  const getPhaseAssignment = useCallback((phaseId: string): PhaseContractorAssignment | undefined => {
    return assignments.get(phaseId);
  }, [assignments]);

  // Get contractors by specialization
  const getContractorsBySpecialization = useCallback((spec: ContractorSpecialization): Contractor[] => {
    return contractors.filter(c => c.specializations.includes(spec));
  }, [contractors]);

  // Get assignment statistics
  const getAssignmentStats = useCallback(() => {
    const stats = {
      total: 0,
      assigned: 0,
      accepted: 0,
      inProgress: 0,
      completed: 0,
      declined: 0,
      pending: 0,
    };
    
    for (const assignment of assignments.values()) {
      stats.total++;
      switch (assignment.status) {
        case 'assigned':
          stats.assigned++;
          break;
        case 'accepted':
          stats.accepted++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'declined':
          stats.declined++;
          break;
        default:
          stats.pending++;
      }
    }
    
    return stats;
  }, [assignments]);

  return {
    contractors,
    assignments,
    addContractor,
    updateContractor,
    deleteContractor,
    assignContractorToPhase,
    updateAssignmentStatus,
    unassignContractorFromPhase,
    getPhaseContractor,
    getPhaseAssignment,
    getContractorsBySpecialization,
    getAssignmentStats,
  };
}
