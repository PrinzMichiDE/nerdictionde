'use client';

import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface QAVoteButtonsProps {
  score: number;
  userVote: 1 | -1 | 0 | null;
  onVote: (value: 1 | -1 | 0) => Promise<void>;
  disabled?: boolean;
  ariaLabelUpvote: string;
  ariaLabelDownvote: string;
  className?: string;
}

export function QAVoteButtons({
  score,
  userVote,
  onVote,
  disabled = false,
  ariaLabelUpvote,
  ariaLabelDownvote,
  className,
}: QAVoteButtonsProps) {
  const isUpvoted = userVote === 1;
  const isDownvoted = userVote === -1;

  return (
    <div className={`flex flex-col items-center gap-1 ${className || ''}`} role="group" aria-label="Bewertung">
      <Button
        variant={isUpvoted ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onVote(isUpvoted ? 0 : 1)}
        disabled={disabled}
        aria-label={ariaLabelUpvote}
        aria-pressed={isUpvoted}
        className="h-8 w-8 p-0"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className={`text-sm font-medium ${isUpvoted ? 'text-primary' : isDownvoted ? 'text-destructive' : ''}`}>
        {score}
      </span>
      <Button
        variant={isDownvoted ? 'destructive' : 'ghost'}
        size="icon"
        onClick={() => onVote(isDownvoted ? 0 : -1)}
        disabled={disabled}
        aria-label={ariaLabelDownvote}
        aria-pressed={isDownvoted}
        className="h-8 w-8 p-0"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}