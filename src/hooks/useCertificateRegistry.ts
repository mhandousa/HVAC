import { useState, useCallback, useEffect } from 'react';
import {
  CertificateRegistryEntry,
  getCertificateRegistry,
  saveCertificateToRegistry,
  deleteCertificateFromRegistry,
  searchCertificates,
  downloadRegistryAsCSV,
} from '@/lib/certificate-registry';

export function useCertificateRegistry() {
  const [entries, setEntries] = useState<CertificateRegistryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load entries on mount
  useEffect(() => {
    const loadEntries = () => {
      setIsLoading(true);
      const registry = getCertificateRegistry();
      setEntries(registry);
      setIsLoading(false);
    };
    loadEntries();
  }, []);

  // Filter entries based on search
  const filteredEntries = searchQuery
    ? searchCertificates(searchQuery)
    : entries;

  const addEntry = useCallback((entry: CertificateRegistryEntry) => {
    saveCertificateToRegistry(entry);
    setEntries(getCertificateRegistry());
  }, []);

  const removeEntry = useCallback((certificateNumber: string) => {
    deleteCertificateFromRegistry(certificateNumber);
    setEntries(getCertificateRegistry());
  }, []);

  const refreshEntries = useCallback(() => {
    setEntries(getCertificateRegistry());
  }, []);

  const exportToCSV = useCallback(() => {
    downloadRegistryAsCSV();
  }, []);

  // Summary stats
  const stats = {
    total: entries.length,
    design: entries.filter(e => e.certificateType === 'design').length,
    preliminary: entries.filter(e => e.certificateType === 'preliminary').length,
    final: entries.filter(e => e.certificateType === 'final').length,
    totalZonesCertified: entries.reduce((sum, e) => sum + e.zonesIncluded.length, 0),
  };

  return {
    entries: filteredEntries,
    allEntries: entries,
    searchQuery,
    setSearchQuery,
    isLoading,
    addEntry,
    removeEntry,
    refreshEntries,
    exportToCSV,
    stats,
  };
}
