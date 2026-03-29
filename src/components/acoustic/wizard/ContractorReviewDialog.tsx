import React, { useState } from 'react';
import { Contractor, ContractorReview } from '@/types/contractor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractorReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractor: Contractor;
  phaseName: string;
  projectName: string;
  phaseId: string;
  onSubmit: (review: Omit<ContractorReview, 'id' | 'createdAt'>) => void;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isActive = (hoverValue ?? value) >= starValue;
          
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverValue(starValue)}
              onMouseLeave={() => setHoverValue(null)}
              onClick={() => onChange(starValue)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive
                    ? 'fill-chart-4 text-chart-4'
                    : 'text-muted-foreground/30 hover:text-chart-4/50'
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ContractorReviewDialog({
  open,
  onOpenChange,
  contractor,
  phaseName,
  projectName,
  phaseId,
  onSubmit,
}: ContractorReviewDialogProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [costRating, setCostRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    if (overallRating === 0) return;

    onSubmit({
      contractorId: contractor.id,
      phaseId,
      projectName,
      rating: overallRating,
      qualityRating: qualityRating || undefined,
      timelinessRating: timelinessRating || undefined,
      communicationRating: communicationRating || undefined,
      costRating: costRating || undefined,
      reviewText: reviewText || undefined,
    });

    // Reset form
    setOverallRating(0);
    setQualityRating(0);
    setTimelinessRating(0);
    setCommunicationRating(0);
    setCostRating(0);
    setReviewText('');
    onOpenChange(false);
  };

  const isValid = overallRating > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Review Contractor
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            <p className="font-medium">{contractor.name}</p>
            <p>{phaseName}</p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Rating - Required */}
          <div className="p-3 rounded-lg bg-muted/50">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall Rating *"
            />
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Detailed Ratings (Optional)
            </p>
            <StarRating
              value={qualityRating}
              onChange={setQualityRating}
              label="Work Quality"
            />
            <StarRating
              value={timelinessRating}
              onChange={setTimelinessRating}
              label="Timeliness"
            />
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
            />
            <StarRating
              value={costRating}
              onChange={setCostRating}
              label="Cost Accuracy"
            />
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="review">Written Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience working with this contractor..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
