import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface AiScanSectionProps {
  isAiScanning: boolean;
  showAiSummary: boolean;
  aiScanDismissed: boolean;
  aiSummaryData: {
    totalViolations: number;
    affectedAccounts: number;
  };
  onAiScan: () => void;
  onDismissAiSummary: () => void;
}

export function AiScanSection({
  isAiScanning,
  showAiSummary,
  aiScanDismissed,
  aiSummaryData,
  onAiScan,
  onDismissAiSummary
}: AiScanSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-center">
        {!showAiSummary && !isAiScanning && !aiScanDismissed && (
          <Button
            onClick={onAiScan}
            className="bg-blue-700 hover:bg-blue-800 border-2 border-blue-700 hover:border-blue-800 text-white font-semibold text-base px-6 py-3 rounded-lg shadow-lg transition-colors duration-300 w-[280px] h-[48px] flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 animate-bolt-pulse" />
            AI Metro 2 / Compliance Scan
          </Button>
        )}

        {!showAiSummary && !isAiScanning && aiScanDismissed && (
          <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg px-4 py-2 max-w-md">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span className="text-sm font-medium">AI scan completed</span>
              <span className="text-xs text-green-600">• View dispute suggestions below</span>
            </div>
          </div>
        )}

        {isAiScanning && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold text-blue-600">
                AI is scanning your credit report...
              </span>
            </div>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Examining all accounts, inquiries, and public records for compliance violations
              and generating dispute suggestions
            </p>
          </div>
        )}

        {showAiSummary && (
          <Card className="w-full max-w-2xl border-2 border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <h3 className="text-xl font-bold text-blue-800 flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" />
                AI Metro 2 / Compliance Scan Complete
              </h3>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {aiSummaryData.totalViolations}
                  </div>
                  <div className="text-sm text-gray-600">Total Violations Found</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {aiSummaryData.affectedAccounts}
                  </div>
                  <div className="text-sm text-gray-600">Accounts Affected</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Metro 2, FCRA, and FDCPA violations detected. View accounts below for AI dispute
                suggestions.
              </p>
              <Button
                onClick={onDismissAiSummary}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
              >
                Got it, hide this
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}