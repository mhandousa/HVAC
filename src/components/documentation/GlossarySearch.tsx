import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { glossaryData, type GlossaryTerm } from "@/lib/design-tool-standards-data";

export function GlossarySearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTerms = useMemo(() => {
    if (!searchTerm.trim()) {
      return glossaryData;
    }
    const lower = searchTerm.toLowerCase();
    return glossaryData.filter(
      (term) =>
        term.term.toLowerCase().includes(lower) ||
        term.abbreviation?.toLowerCase().includes(lower) ||
        term.definition.toLowerCase().includes(lower)
    );
  }, [searchTerm]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach((term) => {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const letters = Object.keys(groupedTerms).sort();

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search terms, abbreviations, or definitions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTerms.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No terms found matching "{searchTerm}"
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {letters.map((letter) => (
            <div key={letter}>
              <h3 className="text-2xl font-bold text-primary mb-4 border-b pb-2">
                {letter}
              </h3>
              <div className="grid gap-3">
                {groupedTerms[letter].map((term, idx) => (
                  <GlossaryTermCard key={idx} term={term} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center pt-4">
        Showing {filteredTerms.length} of {glossaryData.length} terms
      </div>
    </div>
  );
}

function GlossaryTermCard({ term }: { term: GlossaryTerm }) {
  return (
    <Card className="border-border/50">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{term.term}</h4>
              {term.abbreviation && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {term.abbreviation}
                </Badge>
              )}
              {term.standard && (
                <Badge variant="outline" className="text-xs">
                  {term.standard}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{term.definition}</p>
            {term.relatedTerms && term.relatedTerms.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Related:</span>
                {term.relatedTerms.map((related, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs font-normal">
                    {related}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
