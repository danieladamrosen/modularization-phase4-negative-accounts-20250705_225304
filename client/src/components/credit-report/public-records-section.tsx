import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PublicRecordRow } from './public-record-row';

interface PublicRecordsSectionProps {
  publicRecords: any[];
  hasPublicRecords: boolean;
  savedDisputes: { [key: string]: boolean | { reason: string; instruction: string; violations?: string[]; } };
  handleDisputeSaved: (disputeData: any) => void;
  handleDisputeReset: (disputeType: string) => void;
  expandAll: boolean;
}

export function PublicRecordsSection({
  publicRecords,
  hasPublicRecords,
  savedDisputes,
  handleDisputeSaved,
  handleDisputeReset,
  expandAll
}: PublicRecordsSectionProps) {
  const [showPublicRecords, setShowPublicRecords] = useState(false);

  if (!hasPublicRecords) {
    return null;
  }

  return (
    <div className="mb-4">
      <Card
        className={`${showPublicRecords ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
      >
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setShowPublicRecords(!showPublicRecords)}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gauge-red flex items-center justify-center text-white text-sm font-bold">
                {publicRecords.length}
              </div>
              <div>
                <h3 className="text-lg font-bold">Public Records</h3>
                <p className="text-sm text-gray-600">
                  Court records, liens, and judgments on your credit report
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm ${
                savedDisputes['public-records'] ? 'text-green-600' : 'text-gray-600'
              }`}>{publicRecords.length} records</span>
              {showPublicRecords ? <ChevronUp /> : <ChevronDown />}
            </div>
          </div>
        </CardHeader>
        {showPublicRecords && (
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-6">
                {publicRecords.map((record: any, index: number) => (
                    <PublicRecordRow
                      key={`public-record-${record['@CreditLiabilityID'] || record['@_SubscriberCode'] || index}`}
                      record={record}
                      onDispute={() => {}}
                      onDisputeSaved={handleDisputeSaved}
                      onDisputeReset={handleDisputeReset}
                      onHeaderReset={() => {}}
                      expandAll={expandAll}
                    />
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}