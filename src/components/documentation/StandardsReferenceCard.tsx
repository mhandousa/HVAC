import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StandardsReferenceCardProps {
  id: string;
  name: string;
  fullName: string;
  organization: string;
  version: string;
  description: string;
  keyTopics: string[];
  externalLink?: string;
}

export function StandardsReferenceCard({
  name,
  fullName,
  organization,
  version,
  description,
  keyTopics,
  externalLink,
}: StandardsReferenceCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {version}
                  </Badge>
                </div>
                <CardDescription className="text-sm font-medium">
                  {fullName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{organization}</Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">{description}</p>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Topics:</h4>
              <div className="flex flex-wrap gap-1.5">
                {keyTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-normal">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            
            {externalLink && (
              <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                <a href={externalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Official Documentation
                </a>
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
