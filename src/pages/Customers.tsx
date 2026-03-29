import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, type Customer } from '@/hooks/useCustomers';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building2,
  FileText,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { ExpiringContractsAlert } from '@/components/contracts/ExpiringContractsAlert';

type CustomerType = 'residential' | 'commercial' | 'industrial' | 'government';

const customerTypeColors: Record<CustomerType, string> = {
  residential: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  commercial: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  industrial: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  government: 'bg-green-500/10 text-green-500 border-green-500/20',
};

interface CustomerFormData {
  customer_number: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  city: string;
  customer_type: CustomerType;
  has_service_contract: boolean;
}

const defaultFormData: CustomerFormData = {
  customer_number: '',
  company_name: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  city: '',
  customer_type: 'commercial',
  has_service_contract: false,
};

export default function Customers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  if (!authLoading && !user) {
    navigate('/auth');
  }

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || customer.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const generateCustomerNumber = () => {
    const prefix = 'CUS';
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  };

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setFormData({
      ...defaultFormData,
      customer_number: generateCustomerNumber(),
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_number: customer.customer_number,
      company_name: customer.company_name || '',
      contact_name: customer.contact_name,
      contact_phone: customer.contact_phone,
      contact_email: customer.contact_email || '',
      address: customer.address,
      city: customer.city || '',
      customer_type: (customer.customer_type as CustomerType) || 'commercial',
      has_service_contract: customer.has_service_contract || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.contact_name || !formData.contact_phone || !formData.address) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingCustomer) {
      updateCustomer.mutate(
        {
          id: editingCustomer.id,
          ...formData,
        },
        {
          onSuccess: () => setIsDialogOpen(false),
        }
      );
    } else {
      createCustomer.mutate(formData, {
        onSuccess: () => setIsDialogOpen(false),
      });
    }
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Delete customer "${customer.company_name || customer.contact_name}"?`)) {
      deleteCustomer.mutate(customer.id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database and service contracts</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>

        {/* Expiring Contracts Alert */}
        <ExpiringContractsAlert />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{customers?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commercial</p>
                  <p className="text-2xl font-bold">
                    {customers?.filter((c) => c.customer_type === 'commercial').length || 0}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Contracts</p>
                  <p className="text-2xl font-bold">
                    {customers?.filter((c) => c.has_service_contract).length || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Industrial</p>
                  <p className="text-2xl font-bold">
                    {customers?.filter((c) => c.customer_type === 'industrial').length || 0}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-orange-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              {filteredCustomers?.length || 0} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers && filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.company_name || customer.contact_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.customer_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {customer.contact_phone}
                          </div>
                          {customer.contact_email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {customer.contact_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={customerTypeColors[customer.customer_type as CustomerType] || ''}
                        >
                          {customer.customer_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{customer.city || '-'}</p>
                      </TableCell>
                      <TableCell>
                        {customer.has_service_contract ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No contract</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingCustomer(customer)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(customer)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">No customers found</p>
                <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                  Add your first customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Create a new customer record'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Number</Label>
                  <Input
                    value={formData.customer_number}
                    onChange={(e) => setFormData({ ...formData, customer_number: e.target.value })}
                    disabled={!!editingCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value: CustomerType) =>
                      setFormData({ ...formData, customer_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Optional for residential"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_contract"
                  checked={formData.has_service_contract}
                  onChange={(e) =>
                    setFormData({ ...formData, has_service_contract: e.target.checked })
                  }
                  className="rounded border-border"
                />
                <Label htmlFor="has_contract">Has service contract</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createCustomer.isPending || updateCustomer.isPending}
              >
                {createCustomer.isPending || updateCustomer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Detail Sheet */}
        <CustomerDetail
          open={!!viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          customer={viewingCustomer}
          onEdit={() => {
            if (viewingCustomer) {
              openEditDialog(viewingCustomer);
              setViewingCustomer(null);
            }
          }}
        />
      </div>
    </DashboardLayout>
  );
}
