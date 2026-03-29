import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contractor, ContractorSpecialization, SPECIALIZATION_LABELS } from '@/types/contractor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const contractorFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().optional(),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  licenseNumber: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  isPreferred: z.boolean().optional(),
  notes: z.string().optional(),
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),
});

type ContractorFormData = z.infer<typeof contractorFormSchema>;

interface ContractorFormProps {
  contractor?: Contractor;
  onSubmit: (data: Omit<Contractor, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const ALL_SPECIALIZATIONS: ContractorSpecialization[] = [
  'silencer',
  'lining',
  'isolator',
  'panel',
  'general',
  'hvac',
];

export function ContractorForm({ contractor, onSubmit, onCancel }: ContractorFormProps) {
  const form = useForm<ContractorFormData>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues: contractor ? {
      name: contractor.name,
      companyName: contractor.companyName || '',
      contactPerson: contractor.contactPerson,
      phone: contractor.phone,
      email: contractor.email,
      alternatePhone: contractor.alternatePhone || '',
      address: contractor.address || '',
      city: contractor.city || '',
      licenseNumber: contractor.licenseNumber || '',
      rating: contractor.rating || 0,
      isPreferred: contractor.isPreferred || false,
      notes: contractor.notes || '',
      specializations: contractor.specializations,
    } : {
      name: '',
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      alternatePhone: '',
      address: '',
      city: '',
      licenseNumber: '',
      rating: 0,
      isPreferred: false,
      notes: '',
      specializations: [],
    },
  });

  const handleSubmit = (data: ContractorFormData) => {
    onSubmit({
      name: data.name,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      alternatePhone: data.alternatePhone,
      address: data.address,
      city: data.city,
      licenseNumber: data.licenseNumber,
      rating: data.rating,
      isPreferred: data.isPreferred,
      notes: data.notes,
      specializations: data.specializations as ContractorSpecialization[],
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Company name (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input placeholder="Primary contact" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+966-50-xxx-xxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alternatePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternate Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input placeholder="Trade license (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Business address (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specializations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specializations</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_SPECIALIZATIONS.map((spec) => {
                  const isSelected = field.value.includes(spec);
                  return (
                    <Badge
                      key={spec}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        isSelected && 'bg-primary'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          field.onChange(field.value.filter((s: string) => s !== spec));
                        } else {
                          field.onChange([...field.value, spec]);
                        }
                      }}
                    >
                      {SPECIALIZATION_LABELS[spec]}
                    </Badge>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          star <= (field.value || 0)
                            ? 'fill-chart-4 text-chart-4'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPreferred"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Contractor</FormLabel>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-sm">Mark as preferred</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this contractor..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {contractor ? 'Update Contractor' : 'Add Contractor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
