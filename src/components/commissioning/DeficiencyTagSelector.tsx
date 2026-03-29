import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DEFICIENCY_CATEGORIES,
  SEVERITY_LEVELS,
  DeficiencySeverity,
  getSeverityInfo,
} from "@/lib/deficiency-types";
import { Plus, X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeficiencyTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  severity: DeficiencySeverity | null;
  onSeverityChange: (severity: DeficiencySeverity | null) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  compact?: boolean;
}

export function DeficiencyTagSelector({
  selectedTags,
  onTagsChange,
  severity,
  onSeverityChange,
  description,
  onDescriptionChange,
  compact = false,
}: DeficiencyTagSelectorProps) {
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onTagsChange([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const getSeverityIcon = (sev: DeficiencySeverity) => {
    switch (sev) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "major":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Severity Selection */}
        <div className="flex gap-2">
          {SEVERITY_LEVELS.map((sev) => (
            <Button
              key={sev.id}
              type="button"
              variant={severity === sev.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSeverityChange(severity === sev.id ? null : sev.id)}
              className={cn(
                "gap-1",
                severity === sev.id && sev.id === "critical" && "bg-red-600 hover:bg-red-700",
                severity === sev.id && sev.id === "major" && "bg-yellow-600 hover:bg-yellow-700",
                severity === sev.id && sev.id === "minor" && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {getSeverityIcon(sev.id)}
              {sev.label}
            </Button>
          ))}
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap gap-1">
          {DEFICIENCY_CATEGORIES.flatMap((cat) =>
            cat.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.label}
              </Badge>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Severity Selection */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Severity Level</Label>
        <div className="flex gap-2">
          {SEVERITY_LEVELS.map((sev) => {
            const isSelected = severity === sev.id;
            return (
              <Button
                key={sev.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSeverityChange(isSelected ? null : sev.id)}
                className={cn(
                  "gap-1 flex-1",
                  isSelected && sev.id === "critical" && "bg-red-600 hover:bg-red-700",
                  isSelected && sev.id === "major" && "bg-yellow-600 hover:bg-yellow-700",
                  isSelected && sev.id === "minor" && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {getSeverityIcon(sev.id)}
                {sev.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Selected Tags</Label>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagId) => {
              const severityInfo = severity ? getSeverityInfo(severity) : null;
              return (
                <Badge
                  key={tagId}
                  variant="secondary"
                  className={cn(
                    "gap-1",
                    severityInfo?.bgColor,
                    severityInfo?.color
                  )}
                >
                  {tagId}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleTag(tagId)}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Tag Categories */}
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-4">
          {DEFICIENCY_CATEGORIES.map((category) => (
            <div key={category.id}>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {category.label}
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {category.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Custom Tag */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Add Custom Tag</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter custom tag..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
          />
          <Button type="button" size="icon" variant="outline" onClick={addCustomTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Description</Label>
        <Textarea
          placeholder="Describe the deficiency in detail..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
