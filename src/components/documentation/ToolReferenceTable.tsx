import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { ToolDocumentation } from "@/lib/design-tool-standards-data";

interface ToolReferenceTableProps {
  tools: ToolDocumentation[];
  showCategory?: boolean;
}

export function ToolReferenceTable({ tools, showCategory = false }: ToolReferenceTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Tool</TableHead>
            {showCategory && <TableHead className="font-semibold">Category</TableHead>}
            <TableHead className="font-semibold">Standards</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Key Outputs</TableHead>
            <TableHead className="font-semibold text-center">Stage</TableHead>
            <TableHead className="font-semibold w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <TableRow key={tool.id} className="hover:bg-muted/30">
              <TableCell>
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {tool.description}
                  </p>
                </div>
              </TableCell>
              {showCategory && (
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {tool.category}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {tool.standards.slice(0, 2).map((std, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {std}
                    </Badge>
                  ))}
                  {tool.standards.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{tool.standards.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {tool.keyOutputs.slice(0, 2).map((output, idx) => (
                    <li key={idx}>• {output}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="font-mono">
                  {tool.workflowStage}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={tool.path}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
