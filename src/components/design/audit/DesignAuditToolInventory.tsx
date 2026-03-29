import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ToolDataStatus } from '@/hooks/useProjectCrossToolAudit';

interface DesignAuditToolInventoryProps {
  toolsWithData: ToolDataStatus[];
}

export function DesignAuditToolInventory({ toolsWithData }: DesignAuditToolInventoryProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const toolsActive = toolsWithData.filter(t => t.hasData).length;
  const totalTools = toolsWithData.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-base flex items-center gap-2">
              Tool Inventory
              <Badge variant="secondary">{toolsActive}/{totalTools} active</Badge>
            </CardTitle>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {toolsWithData.map((tool) => (
                <div
                  key={tool.toolType}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    tool.hasData 
                      ? 'bg-card hover:shadow-md cursor-pointer' 
                      : 'bg-muted/30 border-dashed'
                  )}
                  onClick={() => tool.hasData && navigate(tool.path)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {tool.hasData ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-medium text-sm">{tool.toolName}</span>
                    </div>
                    {tool.hasData && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {tool.hasData ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Items:</span>
                          <Badge variant="secondary" className="h-5">{tool.itemCount}</Badge>
                        </div>
                        {tool.latestUpdate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Updated {formatDistanceToNow(new Date(tool.latestUpdate), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="italic">No data yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
