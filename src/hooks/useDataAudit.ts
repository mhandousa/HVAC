import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface EquipmentMismatch {
  id: string;
  tag: string;
  name: string;
  current_project_id: string | null;
  current_project_name: string | null;
  derived_project_id: string | null;
  derived_project_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
}

export interface OrphanedEquipment {
  id: string;
  tag: string;
  name: string;
  status: string;
}

export interface ContractEquipmentIssue {
  contract_id: string;
  contract_number: string;
  contract_project_id: string | null;
  contract_project_name: string | null;
  equipment_id: string;
  equipment_tag: string;
  equipment_project_id: string | null;
  equipment_project_name: string | null;
}

export interface ContractCustomerIssue {
  contract_id: string;
  contract_number: string;
  contract_name: string;
  project_id: string;
  project_name: string;
  customer_id: string;
  customer_name: string;
}

export interface OrphanedRecord {
  type: 'zone' | 'floor' | 'building';
  id: string;
  name: string;
  parent_id: string | null;
}

export interface AuditSummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  healthScore: number;
}

export interface AuditResults {
  equipmentMismatches: EquipmentMismatch[];
  orphanedEquipment: OrphanedEquipment[];
  contractEquipmentIssues: ContractEquipmentIssue[];
  contractCustomerIssues: ContractCustomerIssue[];
  orphanedRecords: OrphanedRecord[];
  summary: AuditSummary;
}

export function useDataAudit() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['data-audit', organization?.id],
    queryFn: async (): Promise<AuditResults> => {
      if (!organization?.id) {
        return {
          equipmentMismatches: [],
          orphanedEquipment: [],
          contractEquipmentIssues: [],
          contractCustomerIssues: [],
          orphanedRecords: [],
          summary: { totalIssues: 0, criticalCount: 0, warningCount: 0, infoCount: 0, healthScore: 100 },
        };
      }

      // Fetch all equipment with zone relationships
      const { data: equipment } = await supabase
        .from('equipment')
        .select(`
          id, tag, name, status, project_id, zone_id,
          project:projects(id, name),
          zone:zones(
            id, name,
            floor:floors(
              id, name,
              building:buildings(
                id, name,
                project:projects(id, name)
              )
            )
          )
        `)
        .eq('organization_id', organization.id);

      // Fetch orphaned equipment (no zone AND no project)
      const orphanedEquipment: OrphanedEquipment[] = (equipment || [])
        .filter(e => !e.zone_id && !e.project_id)
        .map(e => ({
          id: e.id,
          tag: e.tag,
          name: e.name,
          status: e.status,
        }));

      // Find equipment with project mismatches
      const equipmentMismatches: EquipmentMismatch[] = [];
      for (const eq of equipment || []) {
        if (eq.zone_id && eq.zone) {
          const zone = eq.zone as any;
          const derivedProject = zone?.floor?.building?.project;
          if (derivedProject && eq.project_id !== derivedProject.id) {
            equipmentMismatches.push({
              id: eq.id,
              tag: eq.tag,
              name: eq.name,
              current_project_id: eq.project_id,
              current_project_name: (eq.project as any)?.name || null,
              derived_project_id: derivedProject.id,
              derived_project_name: derivedProject.name,
              zone_id: eq.zone_id,
              zone_name: zone.name,
            });
          }
        }
      }

      // Fetch contracts with equipment
      const { data: contractEquipment } = await supabase
        .from('contract_equipment')
        .select(`
          contract_id,
          equipment_id,
          contract:service_contracts(id, contract_number, project_id, project:projects(id, name)),
          equipment:equipment(id, tag, project_id, project:projects(id, name))
        `);

      // Find contract-equipment project mismatches
      const contractEquipmentIssues: ContractEquipmentIssue[] = [];
      for (const ce of contractEquipment || []) {
        const contract = ce.contract as any;
        const eq = ce.equipment as any;
        if (contract?.project_id && eq?.project_id && contract.project_id !== eq.project_id) {
          contractEquipmentIssues.push({
            contract_id: contract.id,
            contract_number: contract.contract_number,
            contract_project_id: contract.project_id,
            contract_project_name: contract.project?.name || null,
            equipment_id: eq.id,
            equipment_tag: eq.tag,
            equipment_project_id: eq.project_id,
            equipment_project_name: eq.project?.name || null,
          });
        }
      }

      // Fetch contracts with project but customer not linked
      const { data: contracts } = await supabase
        .from('service_contracts')
        .select(`
          id, contract_number, contract_name, project_id, customer_id,
          project:projects(id, name),
          customer:customers(id, contact_name, company_name)
        `)
        .not('project_id', 'is', null)
        .eq('organization_id', organization.id);

      const { data: projectCustomers } = await supabase
        .from('project_customers')
        .select('project_id, customer_id');

      const projectCustomerSet = new Set(
        (projectCustomers || []).map(pc => `${pc.project_id}:${pc.customer_id}`)
      );

      const contractCustomerIssues: ContractCustomerIssue[] = [];
      for (const contract of contracts || []) {
        if (contract.project_id && contract.customer_id) {
          const key = `${contract.project_id}:${contract.customer_id}`;
          if (!projectCustomerSet.has(key)) {
            const customer = contract.customer as any;
            const project = contract.project as any;
            contractCustomerIssues.push({
              contract_id: contract.id,
              contract_number: contract.contract_number,
              contract_name: contract.contract_name,
              project_id: contract.project_id,
              project_name: project?.name || '',
              customer_id: contract.customer_id,
              customer_name: customer?.company_name || customer?.contact_name || '',
            });
          }
        }
      }

      // Find orphaned hierarchy records
      const orphanedRecords: OrphanedRecord[] = [];

      // Check for zones with invalid floor references
      const { data: zones } = await supabase
        .from('zones')
        .select('id, name, floor_id');
      const { data: floors } = await supabase
        .from('floors')
        .select('id, name, building_id');
      const { data: buildings } = await supabase
        .from('buildings')
        .select('id, name, project_id');
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', organization.id);

      const floorIds = new Set((floors || []).map(f => f.id));
      const buildingIds = new Set((buildings || []).map(b => b.id));
      const projectIds = new Set((projects || []).map(p => p.id));

      for (const zone of zones || []) {
        if (zone.floor_id && !floorIds.has(zone.floor_id)) {
          orphanedRecords.push({
            type: 'zone',
            id: zone.id,
            name: zone.name,
            parent_id: zone.floor_id,
          });
        }
      }

      for (const floor of floors || []) {
        if (floor.building_id && !buildingIds.has(floor.building_id)) {
          orphanedRecords.push({
            type: 'floor',
            id: floor.id,
            name: floor.name,
            parent_id: floor.building_id,
          });
        }
      }

      for (const building of buildings || []) {
        if (building.project_id && !projectIds.has(building.project_id)) {
          orphanedRecords.push({
            type: 'building',
            id: building.id,
            name: building.name,
            parent_id: building.project_id,
          });
        }
      }

      // Calculate summary
      const criticalCount = equipmentMismatches.length + contractEquipmentIssues.length;
      const warningCount = contractCustomerIssues.length + orphanedRecords.length;
      const infoCount = orphanedEquipment.length;
      const totalIssues = criticalCount + warningCount + infoCount;

      // Calculate health score (0-100)
      const totalRecords = (equipment?.length || 0) + (contracts?.length || 0);
      const healthScore = totalRecords > 0 
        ? Math.max(0, Math.round(100 - (totalIssues / totalRecords) * 100))
        : 100;

      return {
        equipmentMismatches,
        orphanedEquipment,
        contractEquipmentIssues,
        contractCustomerIssues,
        orphanedRecords,
        summary: {
          totalIssues,
          criticalCount,
          warningCount,
          infoCount,
          healthScore,
        },
      };
    },
    enabled: !!organization?.id,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useFixEquipmentProjectMismatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentId, correctProjectId }: { equipmentId: string; correctProjectId: string }) => {
      const { error } = await supabase
        .from('equipment')
        .update({ project_id: correctProjectId })
        .eq('id', equipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-audit'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment project updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update equipment project');
    },
  });
}

export function useFixAllEquipmentMismatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mismatches: EquipmentMismatch[]) => {
      for (const mismatch of mismatches) {
        if (mismatch.derived_project_id) {
          const { error } = await supabase
            .from('equipment')
            .update({ project_id: mismatch.derived_project_id })
            .eq('id', mismatch.id);

          if (error) throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-audit'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success(`Fixed ${variables.length} equipment project assignments`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fix equipment projects');
    },
  });
}

export function useLinkContractCustomerToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, customerId }: { projectId: string; customerId: string }) => {
      const { error } = await supabase
        .from('project_customers')
        .insert({ project_id: projectId, customer_id: customerId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-audit'] });
      queryClient.invalidateQueries({ queryKey: ['project-customers'] });
      toast.success('Customer linked to project');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link customer to project');
    },
  });
}

export function useFixAllContractCustomerLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issues: ContractCustomerIssue[]) => {
      for (const issue of issues) {
        const { error } = await supabase
          .from('project_customers')
          .insert({ project_id: issue.project_id, customer_id: issue.customer_id });

        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-audit'] });
      queryClient.invalidateQueries({ queryKey: ['project-customers'] });
      toast.success(`Linked ${variables.length} customers to their projects`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link customers to projects');
    },
  });
}
