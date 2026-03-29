// Certificate Registry - Tracks all generated NC Compliance Certificates

export interface CertificateRegistryEntry {
  id: string;
  certificateNumber: string;
  certificateType: 'design' | 'preliminary' | 'final';
  projectName: string;
  buildingName?: string;
  floorName?: string;
  issueDate: string;
  generatedAt: string;
  zonesIncluded: {
    zoneId: string;
    zoneName: string;
    targetNC: number;
    estimatedNC: number | null;
  }[];
  signatories: {
    hvacEngineer?: { name: string; title: string; company?: string };
    acousticalEngineer?: { name: string; title: string; company?: string; license?: string };
  };
  referenceStandard: string;
  companyLogoUsed: boolean;
}

const REGISTRY_STORAGE_KEY = 'nc-certificate-registry';

export function getCertificateRegistry(): CertificateRegistryEntry[] {
  try {
    const stored = localStorage.getItem(REGISTRY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCertificateToRegistry(entry: CertificateRegistryEntry): void {
  const registry = getCertificateRegistry();
  // Prevent duplicates by certificate number
  const existingIndex = registry.findIndex(e => e.certificateNumber === entry.certificateNumber);
  if (existingIndex >= 0) {
    registry[existingIndex] = entry;
  } else {
    registry.unshift(entry); // Add to beginning (most recent first)
  }
  localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
}

export function deleteCertificateFromRegistry(certificateNumber: string): void {
  const registry = getCertificateRegistry();
  const filtered = registry.filter(e => e.certificateNumber !== certificateNumber);
  localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(filtered));
}

export function getCertificateByNumber(certificateNumber: string): CertificateRegistryEntry | undefined {
  const registry = getCertificateRegistry();
  return registry.find(e => e.certificateNumber === certificateNumber);
}

export function searchCertificates(query: string): CertificateRegistryEntry[] {
  const registry = getCertificateRegistry();
  const lowerQuery = query.toLowerCase();
  return registry.filter(entry => 
    entry.certificateNumber.toLowerCase().includes(lowerQuery) ||
    entry.projectName.toLowerCase().includes(lowerQuery) ||
    entry.floorName?.toLowerCase().includes(lowerQuery) ||
    entry.buildingName?.toLowerCase().includes(lowerQuery)
  );
}

export function exportRegistryAsCSV(): string {
  const registry = getCertificateRegistry();
  const headers = [
    'Certificate Number',
    'Type',
    'Project',
    'Building',
    'Floor',
    'Issue Date',
    'Generated At',
    'Zones Count',
    'Reference Standard',
    'HVAC Engineer',
    'Acoustical Engineer',
  ];
  
  const rows = registry.map(entry => [
    entry.certificateNumber,
    entry.certificateType,
    entry.projectName,
    entry.buildingName || '',
    entry.floorName || '',
    entry.issueDate,
    entry.generatedAt,
    entry.zonesIncluded.length.toString(),
    entry.referenceStandard,
    entry.signatories.hvacEngineer?.name || '',
    entry.signatories.acousticalEngineer?.name || '',
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
}

export function downloadRegistryAsCSV(): void {
  const csv = exportRegistryAsCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nc-certificate-registry-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
