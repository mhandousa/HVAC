import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  ChevronRight, 
  PlayCircle, 
  Settings, 
  StopCircle, 
  Shield, 
  AlertTriangle,
  ClipboardList,
  Wrench,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { GeneratedSequence, SequenceStep, AlarmDefinition, SetpointEntry } from '@/lib/soo-templates';

interface SOOPreviewProps {
  sequence: GeneratedSequence;
  customSections?: Record<string, string>;
  onCustomSectionChange?: (sectionKey: string, content: string) => void;
  readOnly?: boolean;
}

export function SOOPreview({ 
  sequence, 
  customSections = {}, 
  onCustomSectionChange,
  readOnly = false 
}: SOOPreviewProps) {
  const [openSections, setOpenSections] = useState<string[]>([
    'description', 
    'startup', 
    'operation', 
    'shutdown', 
    'safety', 
    'alarms',
    'setpoints'
  ]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const startEditing = (sectionKey: string, currentContent: string) => {
    setEditingSection(sectionKey);
    setEditContent(customSections[sectionKey] || currentContent);
  };

  const saveEdit = () => {
    if (editingSection && onCustomSectionChange) {
      onCustomSectionChange(editingSection, editContent);
    }
    setEditingSection(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const renderSequenceSteps = (steps: SequenceStep[], sectionKey: string) => {
    const customContent = customSections[sectionKey];
    
    if (editingSection === sectionKey) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (customContent) {
      return (
        <div className="space-y-2">
          <div className="bg-muted/50 rounded-lg p-4">
            <Badge variant="outline" className="mb-2">Customized</Badge>
            <pre className="whitespace-pre-wrap text-sm">{customContent}</pre>
          </div>
          {!readOnly && (
            <Button size="sm" variant="ghost" onClick={() => startEditing(sectionKey, customContent)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                {step.stepNumber}
              </span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{step.description}</p>
                {step.condition && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Condition:</span> {step.condition}
                  </p>
                )}
                <p className="text-sm">{step.action}</p>
                {step.setpoint && (
                  <Badge variant="secondary" className="text-xs">
                    {step.setpoint}
                  </Badge>
                )}
                {step.notes && (
                  <p className="text-xs text-muted-foreground italic">Note: {step.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {!readOnly && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => startEditing(sectionKey, steps.map(s => `${s.stepNumber}. ${s.description}\n   ${s.action}`).join('\n\n'))}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Customize
          </Button>
        )}
      </div>
    );
  };

  const renderAlarms = (alarms: AlarmDefinition[]) => (
    <div className="space-y-2">
      {alarms.map((alarm, index) => (
        <div 
          key={index} 
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            alarm.severity === 'critical' 
              ? 'border-destructive/50 bg-destructive/5' 
              : alarm.severity === 'warning'
              ? 'border-yellow-500/50 bg-yellow-500/5'
              : 'border-muted'
          }`}
        >
          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
            alarm.severity === 'critical' 
              ? 'text-destructive' 
              : alarm.severity === 'warning'
              ? 'text-yellow-500'
              : 'text-muted-foreground'
          }`} />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{alarm.alarmName}</p>
              <Badge 
                variant={alarm.severity === 'critical' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {alarm.severity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Condition: {alarm.condition}</p>
            <p className="text-sm">Action: {alarm.action}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSetpoints = (setpoints: SetpointEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium">Parameter</th>
            <th className="text-center py-2 px-3 font-medium">Setpoint</th>
            <th className="text-center py-2 px-3 font-medium">Range</th>
            <th className="text-center py-2 px-3 font-medium">Units</th>
          </tr>
        </thead>
        <tbody>
          {setpoints.map((sp, index) => (
            <tr key={index} className="border-b last:border-0">
              <td className="py-2 px-3">{sp.parameter}</td>
              <td className="py-2 px-3 text-center font-mono">{sp.setpoint}</td>
              <td className="py-2 px-3 text-center text-muted-foreground">{sp.range || '-'}</td>
              <td className="py-2 px-3 text-center">{sp.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const SectionHeader = ({ 
    id, 
    icon: Icon, 
    title, 
    count 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    count?: number;
  }) => (
    <CollapsibleTrigger 
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-2">{count}</Badge>
        )}
      </div>
      {openSections.includes(id) ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      {/* System Description */}
      <Card>
        <Collapsible open={openSections.includes('description')}>
          <SectionHeader id="description" icon={ClipboardList} title="System Description" />
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed">{sequence.systemDescription}</p>
              
              {sequence.equipmentList.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Equipment List:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    {sequence.equipmentList.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sequence.servedZones.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Served Zones:</p>
                  <div className="flex flex-wrap gap-2">
                    {sequence.servedZones.map((zone, index) => (
                      <Badge key={index} variant="outline">{zone}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Startup Sequence */}
      <Card>
        <Collapsible open={openSections.includes('startup')}>
          <SectionHeader 
            id="startup" 
            icon={PlayCircle} 
            title="Startup Sequence" 
            count={sequence.startupSequence.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderSequenceSteps(sequence.startupSequence, 'startup')}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Normal Operation */}
      <Card>
        <Collapsible open={openSections.includes('operation')}>
          <SectionHeader 
            id="operation" 
            icon={Settings} 
            title="Normal Operation" 
            count={sequence.normalOperation.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderSequenceSteps(sequence.normalOperation, 'operation')}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Shutdown Sequence */}
      <Card>
        <Collapsible open={openSections.includes('shutdown')}>
          <SectionHeader 
            id="shutdown" 
            icon={StopCircle} 
            title="Shutdown Sequence" 
            count={sequence.shutdownSequence.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderSequenceSteps(sequence.shutdownSequence, 'shutdown')}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Safety Interlocks */}
      <Card>
        <Collapsible open={openSections.includes('safety')}>
          <SectionHeader 
            id="safety" 
            icon={Shield} 
            title="Safety Interlocks" 
            count={sequence.safetyInterlocks.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderSequenceSteps(sequence.safetyInterlocks, 'safety')}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Alarm Conditions */}
      <Card>
        <Collapsible open={openSections.includes('alarms')}>
          <SectionHeader 
            id="alarms" 
            icon={AlertTriangle} 
            title="Alarm Conditions" 
            count={sequence.alarmConditions.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderAlarms(sequence.alarmConditions)}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Setpoint Schedule */}
      <Card>
        <Collapsible open={openSections.includes('setpoints')}>
          <SectionHeader 
            id="setpoints" 
            icon={ClipboardList} 
            title="Setpoint Schedule" 
            count={sequence.setpointSchedule.length}
          />
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderSetpoints(sequence.setpointSchedule)}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Maintenance Notes */}
      {sequence.maintenanceNotes.length > 0 && (
        <Card>
          <Collapsible open={openSections.includes('maintenance')}>
            <SectionHeader 
              id="maintenance" 
              icon={Wrench} 
              title="Maintenance Notes" 
              count={sequence.maintenanceNotes.length}
            />
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ul className="list-disc list-inside text-sm space-y-2">
                  {sequence.maintenanceNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
