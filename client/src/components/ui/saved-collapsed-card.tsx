import { Card, CardHeader } from '@/components/ui/card';
import { CheckIcon } from 'lucide-react';

interface SavedCollapsedCardProps {
  sectionName: string;
  successMessage: string;
  summaryText: string;
  onExpand: () => void;
}

export function SavedCollapsedCard({
  sectionName,
  successMessage,
  summaryText,
  onExpand,
}: SavedCollapsedCardProps) {
  return (
    <Card className="bg-green-50 border border-green-500 rounded-lg transition-all duration-300 hover:shadow-lg">
      <CardHeader
        className="cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-lg"
        onClick={onExpand}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            {/* Green badge with white checkmark */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600">
              <CheckIcon className="w-4 h-4 text-white" />
            </div>
            
            {/* Header text and summary */}
            <div>
              <h3 className="text-lg font-bold text-green-700">
                {successMessage}
              </h3>
              <p className="text-sm text-green-700">
                {summaryText}
              </p>
            </div>
          </div>
          
          {/* Expand indicator */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-green-600">
              3 Bureaus
            </span>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}