import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScheduleHeader } from '@/hooks/useEquipmentSchedule';

interface ScheduleHeaderEditorProps {
  header: ScheduleHeader;
  onHeaderChange: (header: ScheduleHeader) => void;
  projectName: string;
}

export function ScheduleHeaderEditor({ 
  header, 
  onHeaderChange, 
  projectName 
}: ScheduleHeaderEditorProps) {
  const updateField = (field: keyof ScheduleHeader, value: string | boolean) => {
    onHeaderChange({ ...header, [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Schedule Header</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Schedule Title</Label>
          <Input
            id="title"
            value={header.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="MECHANICAL EQUIPMENT SCHEDULE"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input
              id="projectNumber"
              value={header.projectNumber || ''}
              onChange={(e) => updateField('projectNumber', e.target.value)}
              placeholder="PRJ-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revision">Revision</Label>
            <Input
              id="revision"
              value={header.revision || ''}
              onChange={(e) => updateField('revision', e.target.value)}
              placeholder="A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={header.date || ''}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Input
              id="preparedBy"
              value={header.preparedBy || ''}
              onChange={(e) => updateField('preparedBy', e.target.value)}
              placeholder="Engineer name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkedBy">Checked By</Label>
          <Input
            id="checkedBy"
            value={header.checkedBy || ''}
            onChange={(e) => updateField('checkedBy', e.target.value)}
            placeholder="Reviewer name"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="includeLogo">Include Company Logo</Label>
            <p className="text-xs text-muted-foreground">
              Add organization logo to PDF header
            </p>
          </div>
          <Switch
            id="includeLogo"
            checked={header.includeLogo || false}
            onCheckedChange={(checked) => updateField('includeLogo', checked)}
          />
        </div>

        <div className="pt-2 p-3 bg-muted/50 rounded-md">
          <p className="text-sm font-medium">Project: {projectName}</p>
        </div>
      </CardContent>
    </Card>
  );
}
