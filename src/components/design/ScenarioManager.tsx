import { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Check, X, GitBranch, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSandbox, type Scenario } from '@/contexts/SandboxContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ScenarioManagerProps {
  className?: string;
  compact?: boolean;
  onPromoteToAlternative?: (scenario: Scenario) => void;
}

export function ScenarioManager({ className, compact = false, onPromoteToAlternative }: ScenarioManagerProps) {
  const { 
    state, 
    createScenario, 
    deleteScenario, 
    setActiveScenario,
    renameScenario,
  } = useSandbox();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      createScenario(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleStartEdit = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setEditName(scenario.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      renameScenario(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (!state.isActive) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          {state.scenarios.map((scenario) => (
            <Button
              key={scenario.id}
              variant={state.activeScenarioId === scenario.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveScenario(scenario.id)}
              className="h-7 px-2 text-xs"
            >
              {scenario.isBaseline ? 'Base' : scenario.name}
            </Button>
          ))}
        </div>
        {state.scenarios.length < 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createScenario(`Scenario ${state.scenarios.length}`)}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Scenarios
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {state.scenarios.length}/5
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {state.scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  'group flex items-center justify-between p-2 rounded-md border transition-colors cursor-pointer',
                  state.activeScenarioId === scenario.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50 border-transparent'
                )}
                onClick={() => setActiveScenario(scenario.id)}
              >
                <div className="flex-1 min-w-0">
                  {editingId === scenario.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(scenario.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(scenario.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {scenario.name}
                        </span>
                        {scenario.isBaseline && (
                          <Badge variant="secondary" className="text-xs">
                            Base
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(scenario.createdAt, 'MMM d, h:mm a')}
                        {Object.keys(scenario.modifications).length > 0 && (
                          <span className="ml-2">
                            • {Object.keys(scenario.modifications).length} changes
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!scenario.isBaseline && editingId !== scenario.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPromoteToAlternative && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPromoteToAlternative(scenario);
                            }}
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save as Alternative</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(scenario);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rename</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScenario(scenario.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}

            {/* Create new scenario */}
            {isCreating ? (
              <div className="flex items-center gap-2 p-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Scenario name..."
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : state.scenarios.length < 5 ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Scenario
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Maximum scenarios reached
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
