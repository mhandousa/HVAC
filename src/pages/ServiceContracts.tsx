import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ServiceContractList } from '@/components/contracts/ServiceContractList';
import { ServiceContractDetail } from '@/components/contracts/ServiceContractDetail';
import { ServiceContractForm } from '@/components/contracts/ServiceContractForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Search, Loader2, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useServiceContracts } from '@/hooks/useServiceContracts';
import { ExpiringContractsAlert } from '@/components/contracts/ExpiringContractsAlert';

export default function ServiceContracts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data: contracts = [], isLoading } = useServiceContracts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customer?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customer?.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group by status for tabs
  const activeContracts = filteredContracts.filter(c => c.status === 'active');
  const pendingContracts = filteredContracts.filter(c => c.status === 'pending');
  const expiredContracts = filteredContracts.filter(c => c.status === 'expired');
  const cancelledContracts = filteredContracts.filter(c => c.status === 'cancelled');

  const handleViewContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setIsDetailOpen(true);
  };

  const handleEditContract = (contractId: string) => {
    setEditingContract(contractId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContract(null);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedContractId(null);
  };

  const handleCreateNew = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {t('contracts.title', 'Service Contracts')}
            </h1>
            <p className="text-muted-foreground">
              {t('contracts.description', 'Manage maintenance and service contracts')}
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contracts.new', 'New Contract')}
          </Button>
        </div>

        {/* Expiring Contracts Alert */}
        <ExpiringContractsAlert onRenew={handleViewContract} />

        {/* Filters */}
        <div className={`flex gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('contracts.search', 'Search contracts...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('contracts.filterStatus', 'Status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('contracts.statusAll', 'All Status')}</SelectItem>
              <SelectItem value="active">{t('contracts.statusActive', 'Active')}</SelectItem>
              <SelectItem value="pending">{t('contracts.statusPending', 'Pending')}</SelectItem>
              <SelectItem value="expired">{t('contracts.statusExpired', 'Expired')}</SelectItem>
              <SelectItem value="cancelled">{t('contracts.statusCancelled', 'Cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contract Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('contracts.active', 'Active')} ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('contracts.pending', 'Pending')} ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('contracts.expired', 'Expired')} ({expiredContracts.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {t('contracts.cancelled', 'Cancelled')} ({cancelledContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <ServiceContractList 
              contracts={activeContracts} 
              isLoading={isLoading}
              onView={handleViewContract}
              onEdit={handleEditContract}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            <ServiceContractList 
              contracts={pendingContracts} 
              isLoading={isLoading}
              onView={handleViewContract}
              onEdit={handleEditContract}
            />
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            <ServiceContractList 
              contracts={expiredContracts} 
              isLoading={isLoading}
              onView={handleViewContract}
              onEdit={handleEditContract}
            />
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            <ServiceContractList 
              contracts={cancelledContracts} 
              isLoading={isLoading}
              onView={handleViewContract}
              onEdit={handleEditContract}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Contract Detail Sheet */}
      <ServiceContractDetail
        open={isDetailOpen}
        onClose={handleCloseDetail}
        contractId={selectedContractId}
        onEdit={() => {
          if (selectedContractId) {
            handleCloseDetail();
            handleEditContract(selectedContractId);
          }
        }}
      />

      {/* Contract Form Dialog */}
      <ServiceContractForm
        open={isFormOpen}
        onClose={handleCloseForm}
        contractId={editingContract}
      />
    </DashboardLayout>
  );
}
