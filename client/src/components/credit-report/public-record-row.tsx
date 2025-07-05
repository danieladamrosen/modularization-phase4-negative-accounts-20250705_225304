import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Zap, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import transUnionLogo from '../../assets/transunion-logo.png';
import equifaxLogo from '../../assets/equifax-logo.png';
import experianLogo from '../../assets/experian-logo.png';

interface PublicRecordRowProps {
  record: any;
  aiViolations?: string[];
  onDispute: (recordId: string, dispute: any) => void;
  onDisputeSaved: (recordId: string) => void;
  onDisputeReset: (recordId: string) => void;
  onHeaderReset: () => void;
  expandAll?: boolean;
  showAllDetails?: boolean;
  isFirstInConnectedSection?: boolean;
}

export function PublicRecordRow({
  record,
  aiViolations = [],
  onDispute,
  onDisputeSaved,
  onDisputeReset,
  onHeaderReset,
  expandAll,
  showAllDetails,
  isFirstInConnectedSection,
}: PublicRecordRowProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustomReasonField, setShowCustomReasonField] = useState(false);
  const [showCustomInstructionField, setShowCustomInstructionField] = useState(false);
  const [isTypingReason, setIsTypingReason] = useState(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [showGuideArrow, setShowGuideArrow] = useState(false);
  const [isDisputeSaved, setIsDisputeSaved] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState<boolean | null>(null); // null = follow global, true/false = explicit user choice
  
  // AI Violations and Dispute Suggestions State
  const [showViolations, setShowViolations] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);

  // Helper functions for AI violations
  const addViolationToDispute = (violation: string) => {
    setSelectedViolations(prev => [...prev, violation]);
    // Auto-generate dispute reason and instruction based on violation
    const disputeReason = violation;
    const disputeInstruction = "Remove this compliance violation from my credit report immediately";
    setCustomReason(disputeReason);
    setCustomInstruction(disputeInstruction);
    setSelectedReason(disputeReason);
    setSelectedInstruction(disputeInstruction);
  };

  const removeViolationFromDispute = (violation: string) => {
    setSelectedViolations(prev => prev.filter(v => v !== violation));
  };

  const addAllViolations = (e: React.MouseEvent) => {
    e.stopPropagation();
    aiViolations.forEach(violation => {
      if (!selectedViolations.includes(violation)) {
        addViolationToDispute(violation);
      }
    });
    setShowViolations(false);
  };

  function getBureauDataByKey(record: any, key: 'TU' | 'EQ' | 'EX') {
    const balance = record.BalanceAmount || 0;
    const status = record.AccountStatusCode || 'Negative';
    const filingDate = record.AccountOpenedDate || 'N/A';

    const hasData = balance > 0 || status !== 'Unknown';

    return {
      reporting: hasData,
      status,
      filingDate,
      amount: balance
    };
  }
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [transUnionStatus, setTransUnionStatus] = useState('');
  const [equifaxStatus, setEquifaxStatus] = useState('');
  const [experianStatus, setExperianStatus] = useState('');

  // Auto-show details when showAllDetails prop is true, reset when it's false
  useEffect(() => {
    if (showAllDetails) {
      // When showAllDetails is enabled, reset individual state to null (follow global)
      setShowAccountDetails(null);
    } else {
      // When showAllDetails is disabled, reset to false (collapsed state)
      setShowAccountDetails(false);
    }
  }, [showAllDetails]);

  // Allow individual override of showAllDetails
  // Show details logic: 
  // - If showAllDetails is true and user hasn't explicitly set individual state, show details
  // - If showAllDetails is true and user explicitly set false, hide details (individual override)
  // - If showAllDetails is false, follow individual state
  const shouldShowDetails = showAllDetails 
    ? (showAccountDetails === null ? true : showAccountDetails)
    : (showAccountDetails || false);

  const statusOptions = [
    'Positive',
    'Negative',
    'Repaired',
    'Deleted',
    'In Dispute',
    'Verified',
    'Updated',
    'Unspecified',
    'Ignore',
  ];

  // Format date to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Unknown') return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US');
    } catch {
      return dateString;
    }
  };

  // Format currency with commas
  const formatCurrency = (amount: string | number) => {
    if (!amount || amount === '0') return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0';
    return '$' + numAmount.toLocaleString('en-US');
  };

  // Add line break for very long court names only
  const formatCourtName = (courtName: string) => {
    if (!courtName || courtName.length <= 50) return courtName;
    
    // Break after "the" for better readability
    if (courtName.includes(' for the ') && courtName.length > 55) {
      const parts = courtName.split(' for the ');
      if (parts.length === 2 && parts[0].length > 20 && parts[1].length > 15) {
        return parts[0] + ' for the\n' + parts[1];
      }
    }
    
    return courtName;
  };



  const disputeReasons = [
    '',
    'I have never been associated with this record',
    'This record has incorrect information',
    'This record is too old to report',
    'This record has been resolved or satisfied',
    'I was not properly notified of this action',
    'This violates my consumer rights',
    'Identity theft - this is not my record',
    ''
  ];

  const disputeInstructions = [
    '',
    'Remove this record from my credit report immediately',
    'Update this record with correct information',
    'Verify the accuracy of this record',
    'Provide documentation supporting this record',
    'Remove this outdated record',
    'Investigate this unauthorized record',
    ''
  ];

  // Get the first field label and value based on record type
  const getFirstFieldData = () => {
    const recordType = (record['@publicRecordType'] || record.publicRecordType || '').toLowerCase();
    
    if (recordType.includes('tax lien')) {
      return {
        label: 'Lienholder:',
        value: record['@lienholder'] || record.lienholder || 'Internal Revenue Service'
      };
    } else if (recordType.includes('bankruptcy')) {
      return {
        label: 'Court',
        value: record['@courtName'] || record.courtName || 'U.S. Bankruptcy Court'
      };
    } else if (recordType.includes('judgment')) {
      return {
        label: 'Court',
        value: record['@courtName'] || record.courtName || 'Circuit Court'
      };
    } else {
      return {
        label: 'Court',
        value: record['@courtName'] || record.courtName || 'Court'
      };
    }
  };

  // Check if record has negative keywords
  const hasNegativeKeywords = () => {
    const recordType = (record['@publicRecordType'] || record.publicRecordType || '').toLowerCase();
    const negativeKeywords = ['bankruptcy', 'lien', 'judgment', 'foreclosure', 'garnishment', 'civil'];
    return negativeKeywords.some(keyword => recordType.includes(keyword));
  };

  const hasAnyNegative = hasNegativeKeywords();

  const checkFormCompletionAndShowArrow = (newReason?: string, newInstruction?: string) => {
    // Blue ball animation disabled - was causing unwanted visual distraction
    // This function now does nothing to eliminate the bouncing blue chevron
  };

  // Show collapsed state when dispute is saved
  if (isCollapsed && isDisputeSaved) {
    return (
      <Card
        className={`transition-all duration-700 shadow-sm border hover:shadow-md border-green-200 bg-green-50/50 ${
          isFirstInConnectedSection ? 'rounded-b-lg border-t-0' : 'rounded-lg'
        }`}
        style={{
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        }}
        data-record-id={record.id || 'unknown'}
      >
        <CardContent className="p-4">
          <div
            className="flex-between cursor-pointer hover:bg-green-100 -m-4 p-4 rounded-lg transition-colors"
            onClick={() => setIsCollapsed(false)}
          >
            <div className="flex items-center gap-3">
              <span className="text-green-600 text-2xl font-bold leading-none mr-2">
                ✓
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}
                </h3>
                <p className="text-sm text-green-600 font-medium">
                  Dispute Saved
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all duration-75 shadow-sm hover:shadow-md ${
        isFirstInConnectedSection ? 'connected-first-account' : 'rounded-lg'
      } border ${
        isDisputeSaved
          ? 'border-3 border-green-300 bg-green-50'
          : hasAnyNegative
            ? 'border-red-200 bg-red-50'
            : 'border-gray-200 bg-white'
      }`}
      style={{
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        ...(isFirstInConnectedSection && {
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          borderTop: 'none',
        }),
      }}
      data-record-id={record.id || 'unknown'}
      data-highlight-target={hasAnyNegative ? 'true' : 'false'}
    >
      <CardContent className={`px-6 ${hasAnyNegative ? 'pt-6 pb-6' : 'pt-1 pb-2'}`}>
        {/* Numbered guidance for negative records only */}
        {hasAnyNegative && (
          <div className="flex-between mb-4">
            <div className="flex items-center gap-3">
              {isDisputeSaved ? (
                <span className="text-green-600 text-lg font-bold">✓</span>
              ) : (
                <span className="circle-badge-blue">1</span>
              )}
              <span className="font-bold">
                {isDisputeSaved
                  ? 'Public record dispute saved'
                  : 'Review this negative item, then scroll down to steps 2 and 3'}
              </span>
            </div>
            {/* Up arrow for saved accounts aligned with completed text */}
            {isDisputeSaved && !isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="flex-center w-8 h-8 text-blue-600 hover:text-blue-800 transition-colors -mx-2"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Record Header */}
        <div className="mb-4">
          {/* Desktop: Show all three bureau headers */}
          <div className="hidden md:block relative">
            <div className="flex-between mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-cyan-700">TransUnion</h3>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-red-600">Equifax</h3>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-blue-800">Experian</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Show TransUnion header with Show All Info button */}
          <div className="block md:hidden mb-2">
            <div className="flex-between">
              <h3 className="font-bold text-cyan-700 text-left">TransUnion</h3>
              <Dialog open={showMobileModal} onOpenChange={setShowMobileModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center px-2 py-1 text-xs h-6 border border-gray-300"
                  >
                    Show All Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Complete Public Record Details</DialogTitle>
                    <DialogDescription className="text-sm text-gray-700">
                      Complete public record information across all three bureaus
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* TransUnion Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="bg-white border border-cyan-200 rounded-lg p-4 mb-4 -mx-1">
                        <div className="flex items-center justify-center mb-3">
                          <img 
                            src={transUnionLogo} 
                            alt="TransUnion" 
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm text-center text-xl leading-tight">
                          {(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">{getFirstFieldData().label}:</span>
                          <span className="text-gray-900 text-sm text-right whitespace-pre-line max-w-[200px]">
                            {formatCourtName(getFirstFieldData().value)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Status:</span>
                          <span className={`text-sm font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                            {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Amount:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Updated:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Date Filed:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                        </div>
                        {record['@caseNumber'] || record.caseNumber ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Case Number:</span>
                            <span className="text-gray-900 text-sm">{record['@caseNumber'] || record.caseNumber}</span>
                          </div>
                        ) : null}
                        {record['@courtAddress'] || record.courtAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Address:</span>
                            <span className="text-gray-900 text-sm">{record['@courtAddress'] || record.courtAddress}</span>
                          </div>
                        ) : null}
                        {(record['@courtCity'] || record.courtCity) && (record['@courtState'] || record.courtState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@courtCity'] || record.courtCity}, {record['@courtState'] || record.courtState} {record['@courtPostalCode'] || record.courtPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@courtPhone'] || record.courtPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@courtPhone'] || record.courtPhone}</span>
                          </div>
                        ) : null}
                        {record['@_JudgmentDate'] || record.judgmentDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judgment Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_JudgmentDate'] || record.judgmentDate)}</span>
                          </div>
                        ) : null}
                        {record['@_ReleasedDate'] || record.releasedDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Released Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_ReleasedDate'] || record.releasedDate)}</span>
                          </div>
                        ) : null}
                        {record['@_AssetAmount'] || record.assetAmount ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Asset Amount:</span>
                            <span className="text-gray-900 text-sm">{formatCurrency(record['@_AssetAmount'] || record.assetAmount)}</span>
                          </div>
                        ) : null}
                        {record['@plaintiff'] || record.plaintiff ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiff'] || record.plaintiff}</span>
                          </div>
                        ) : null}
                        {record['@plaintiffAddress'] || record.plaintiffAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff Address:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiffAddress'] || record.plaintiffAddress}</span>
                          </div>
                        ) : null}
                        {(record['@plaintiffCity'] || record.plaintiffCity) && (record['@plaintiffState'] || record.plaintiffState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@plaintiffCity'] || record.plaintiffCity}, {record['@plaintiffState'] || record.plaintiffState} {record['@plaintiffPostalCode'] || record.plaintiffPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@defendant'] || record.defendant ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Defendant:</span>
                            <span className="text-gray-900 text-sm">{record['@defendant'] || record.defendant}</span>
                          </div>
                        ) : null}
                        {record['@lienholder'] || record.lienholder ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholder'] || record.lienholder}</span>
                          </div>
                        ) : null}
                        {record['@lienholderAddress'] || record.lienholderAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder Address:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholderAddress'] || record.lienholderAddress}</span>
                          </div>
                        ) : null}
                        {(record['@lienholderCity'] || record.lienholderCity) && (record['@lienholderState'] || record.lienholderState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@lienholderCity'] || record.lienholderCity}, {record['@lienholderState'] || record.lienholderState} {record['@lienholderPostalCode'] || record.lienholderPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@attorneyName'] || record.attorneyName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyName'] || record.attorneyName}</span>
                          </div>
                        ) : null}
                        {record['@attorneyPhone'] || record.attorneyPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyPhone'] || record.attorneyPhone}</span>
                          </div>
                        ) : null}
                        {record['@trustee'] || record.trustee ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Trustee:</span>
                            <span className="text-gray-900 text-sm">{record['@trustee'] || record.trustee}</span>
                          </div>
                        ) : null}
                        {record['@judgeName'] || record.judgeName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judge:</span>
                            <span className="text-gray-900 text-sm">{record['@judgeName'] || record.judgeName}</span>
                          </div>
                        ) : null}
                        {record['@remarks'] || record.remarks ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Remarks:</span>
                            <span className="text-gray-900 text-sm">{record['@remarks'] || record.remarks}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Equifax Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="bg-white border border-red-200 rounded-lg p-4 mb-4 -mx-1">
                        <div className="flex items-center justify-center mb-3">
                          <img 
                            src={equifaxLogo} 
                            alt="Equifax" 
                            className="h-4 w-auto object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm text-center text-xl leading-tight">
                          {(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">{getFirstFieldData().label}:</span>
                          <span className="text-gray-900 text-sm text-right whitespace-pre-line max-w-[200px]">
                            {formatCourtName(getFirstFieldData().value)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Status:</span>
                          <span className={`text-sm font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                            {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Amount:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Updated:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Date Filed:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                        </div>
                        {record['@caseNumber'] || record.caseNumber ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Case Number:</span>
                            <span className="text-gray-900 text-sm">{record['@caseNumber'] || record.caseNumber}</span>
                          </div>
                        ) : null}
                        {record['@courtAddress'] || record.courtAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Address:</span>
                            <span className="text-gray-900 text-sm">{record['@courtAddress'] || record.courtAddress}</span>
                          </div>
                        ) : null}
                        {(record['@courtCity'] || record.courtCity) && (record['@courtState'] || record.courtState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@courtCity'] || record.courtCity}, {record['@courtState'] || record.courtState} {record['@courtPostalCode'] || record.courtPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@courtPhone'] || record.courtPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@courtPhone'] || record.courtPhone}</span>
                          </div>
                        ) : null}
                        {record['@_JudgmentDate'] || record.judgmentDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judgment Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_JudgmentDate'] || record.judgmentDate)}</span>
                          </div>
                        ) : null}
                        {record['@_ReleasedDate'] || record.releasedDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Released Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_ReleasedDate'] || record.releasedDate)}</span>
                          </div>
                        ) : null}
                        {record['@_AssetAmount'] || record.assetAmount ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Asset Amount:</span>
                            <span className="text-gray-900 text-sm">{formatCurrency(record['@_AssetAmount'] || record.assetAmount)}</span>
                          </div>
                        ) : null}
                        {record['@plaintiff'] || record.plaintiff ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiff'] || record.plaintiff}</span>
                          </div>
                        ) : null}
                        {record['@plaintiffAddress'] || record.plaintiffAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff Address:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiffAddress'] || record.plaintiffAddress}</span>
                          </div>
                        ) : null}
                        {(record['@plaintiffCity'] || record.plaintiffCity) && (record['@plaintiffState'] || record.plaintiffState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@plaintiffCity'] || record.plaintiffCity}, {record['@plaintiffState'] || record.plaintiffState} {record['@plaintiffPostalCode'] || record.plaintiffPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@defendant'] || record.defendant ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Defendant:</span>
                            <span className="text-gray-900 text-sm">{record['@defendant'] || record.defendant}</span>
                          </div>
                        ) : null}
                        {record['@lienholder'] || record.lienholder ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholder'] || record.lienholder}</span>
                          </div>
                        ) : null}
                        {record['@lienholderAddress'] || record.lienholderAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder Address:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholderAddress'] || record.lienholderAddress}</span>
                          </div>
                        ) : null}
                        {(record['@lienholderCity'] || record.lienholderCity) && (record['@lienholderState'] || record.lienholderState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@lienholderCity'] || record.lienholderCity}, {record['@lienholderState'] || record.lienholderState} {record['@lienholderPostalCode'] || record.lienholderPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@attorneyName'] || record.attorneyName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyName'] || record.attorneyName}</span>
                          </div>
                        ) : null}
                        {record['@attorneyPhone'] || record.attorneyPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyPhone'] || record.attorneyPhone}</span>
                          </div>
                        ) : null}
                        {record['@trustee'] || record.trustee ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Trustee:</span>
                            <span className="text-gray-900 text-sm">{record['@trustee'] || record.trustee}</span>
                          </div>
                        ) : null}
                        {record['@judgeName'] || record.judgeName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judge:</span>
                            <span className="text-gray-900 text-sm">{record['@judgeName'] || record.judgeName}</span>
                          </div>
                        ) : null}
                        {record['@remarks'] || record.remarks ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Remarks:</span>
                            <span className="text-gray-900 text-sm">{record['@remarks'] || record.remarks}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Experian Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 -mx-1">
                        <div className="flex items-center justify-center mb-3">
                          <img 
                            src={experianLogo} 
                            alt="Experian" 
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm text-center text-xl leading-tight">
                          {(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">{getFirstFieldData().label}:</span>
                          <span className="text-gray-900 text-sm text-right whitespace-pre-line max-w-[200px]">
                            {formatCourtName(getFirstFieldData().value)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Status:</span>
                          <span className={`text-sm font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                            {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Amount:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Updated:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Date Filed:</span>
                          <span className="text-gray-900 text-sm">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                        </div>
                        {record['@caseNumber'] || record.caseNumber ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Case Number:</span>
                            <span className="text-gray-900 text-sm">{record['@caseNumber'] || record.caseNumber}</span>
                          </div>
                        ) : null}
                        {record['@courtAddress'] || record.courtAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Address:</span>
                            <span className="text-gray-900 text-sm">{record['@courtAddress'] || record.courtAddress}</span>
                          </div>
                        ) : null}
                        {(record['@courtCity'] || record.courtCity) && (record['@courtState'] || record.courtState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@courtCity'] || record.courtCity}, {record['@courtState'] || record.courtState} {record['@courtPostalCode'] || record.courtPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@courtPhone'] || record.courtPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Court Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@courtPhone'] || record.courtPhone}</span>
                          </div>
                        ) : null}
                        {record['@_JudgmentDate'] || record.judgmentDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judgment Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_JudgmentDate'] || record.judgmentDate)}</span>
                          </div>
                        ) : null}
                        {record['@_ReleasedDate'] || record.releasedDate ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Released Date:</span>
                            <span className="text-gray-900 text-sm">{formatDate(record['@_ReleasedDate'] || record.releasedDate)}</span>
                          </div>
                        ) : null}
                        {record['@_AssetAmount'] || record.assetAmount ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Asset Amount:</span>
                            <span className="text-gray-900 text-sm">{formatCurrency(record['@_AssetAmount'] || record.assetAmount)}</span>
                          </div>
                        ) : null}
                        {record['@plaintiff'] || record.plaintiff ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiff'] || record.plaintiff}</span>
                          </div>
                        ) : null}
                        {record['@plaintiffAddress'] || record.plaintiffAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff Address:</span>
                            <span className="text-gray-900 text-sm">{record['@plaintiffAddress'] || record.plaintiffAddress}</span>
                          </div>
                        ) : null}
                        {(record['@plaintiffCity'] || record.plaintiffCity) && (record['@plaintiffState'] || record.plaintiffState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Plaintiff City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@plaintiffCity'] || record.plaintiffCity}, {record['@plaintiffState'] || record.plaintiffState} {record['@plaintiffPostalCode'] || record.plaintiffPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@defendant'] || record.defendant ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Defendant:</span>
                            <span className="text-gray-900 text-sm">{record['@defendant'] || record.defendant}</span>
                          </div>
                        ) : null}
                        {record['@lienholder'] || record.lienholder ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholder'] || record.lienholder}</span>
                          </div>
                        ) : null}
                        {record['@lienholderAddress'] || record.lienholderAddress ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder Address:</span>
                            <span className="text-gray-900 text-sm">{record['@lienholderAddress'] || record.lienholderAddress}</span>
                          </div>
                        ) : null}
                        {(record['@lienholderCity'] || record.lienholderCity) && (record['@lienholderState'] || record.lienholderState) ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Lienholder City, State:</span>
                            <span className="text-gray-900 text-sm">
                              {record['@lienholderCity'] || record.lienholderCity}, {record['@lienholderState'] || record.lienholderState} {record['@lienholderPostalCode'] || record.lienholderPostalCode}
                            </span>
                          </div>
                        ) : null}
                        {record['@attorneyName'] || record.attorneyName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyName'] || record.attorneyName}</span>
                          </div>
                        ) : null}
                        {record['@attorneyPhone'] || record.attorneyPhone ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Attorney Phone:</span>
                            <span className="text-gray-900 text-sm">{record['@attorneyPhone'] || record.attorneyPhone}</span>
                          </div>
                        ) : null}
                        {record['@trustee'] || record.trustee ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Trustee:</span>
                            <span className="text-gray-900 text-sm">{record['@trustee'] || record.trustee}</span>
                          </div>
                        ) : null}
                        {record['@judgeName'] || record.judgeName ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Judge:</span>
                            <span className="text-gray-900 text-sm">{record['@judgeName'] || record.judgeName}</span>
                          </div>
                        ) : null}
                        {record['@remarks'] || record.remarks ? (
                          <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="font-medium text-gray-700 text-sm">Remarks:</span>
                            <span className="text-gray-900 text-sm">{record['@remarks'] || record.remarks}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Bureau Comparison Grid - EXACT MATCH to negative accounts */}
        <div className="grid grid-cols-1 md:grid-cols-3 mb-4 gap-4">
          {/* TransUnion */}
          <div className="relative">
            <div
              className={`border rounded-lg p-4 ${
                isDisputeSaved
                  ? 'border-3 border-green-500 bg-green-50'
                  : 'border-3 border-red-500 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-black">{(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}</h4>
                <Select
                  value={transUnionStatus || (hasAnyNegative ? 'Negative' : 'Positive')}
                  onValueChange={setTransUnionStatus}
                >
                  <SelectTrigger
                    className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                      (transUnionStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative'
                        ? 'text-red-600 [&>svg]:text-red-600'
                        : 'text-green-700 [&>svg]:text-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {(transUnionStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {(transUnionStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Positive' && (
                        <span className="text-green-600 text-xs ml-1">✓</span>
                      )}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-xs">
                {/* Exactly 5 lines - match negative accounts height */}
                <div className="flex justify-between">
                  <span className="text-gray-700">{getFirstFieldData().label}</span>
                  <span className="font-medium text-right whitespace-pre-line max-w-[200px]">
                    {formatCourtName(getFirstFieldData().value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className={`font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                    {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-medium">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Updated:</span>
                  <span className="font-medium">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                </div>

                {/* Additional details - only when expanded */}
                {shouldShowDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date Filed:</span>
                      <span className="font-medium">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                    </div>
                    {record['@caseNumber'] || record.caseNumber ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Case Number:</span>
                        <span className="font-medium">{record['@caseNumber'] || record.caseNumber}</span>
                      </div>
                    ) : null}
                    {record['@courtAddress'] || record.courtAddress ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Address:</span>
                        <span className="font-medium">{record['@courtAddress'] || record.courtAddress}</span>
                      </div>
                    ) : null}
                    {record['@courtPhone'] || record.courtPhone ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Phone:</span>
                        <span className="font-medium">{record['@courtPhone'] || record.courtPhone}</span>
                      </div>
                    ) : null}
                    {record['@plaintiff'] || record.plaintiff ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Plaintiff:</span>
                        <span className="font-medium">{record['@plaintiff'] || record.plaintiff}</span>
                      </div>
                    ) : null}
                    {record['@attorneyName'] || record.attorneyName ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Attorney:</span>
                        <span className="font-medium">{record['@attorneyName'] || record.attorneyName}</span>
                      </div>
                    ) : null}
                    {record['@trustee'] || record.trustee ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Trustee:</span>
                        <span className="font-medium">{record['@trustee'] || record.trustee}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Equifax - EXACT copy of TransUnion structure */}
          <div className="relative">
            <div
              className={`border rounded-lg p-4 ${
                isDisputeSaved
                  ? 'border-3 border-green-500 bg-green-50'
                  : 'border-3 border-red-500 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-black">{(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}</h4>
                <Select
                  value={equifaxStatus || (hasAnyNegative ? 'Negative' : 'Positive')}
                  onValueChange={setEquifaxStatus}
                >
                  <SelectTrigger
                    className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                      (equifaxStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative'
                        ? 'text-red-600 [&>svg]:text-red-600'
                        : 'text-green-700 [&>svg]:text-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {(equifaxStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {(equifaxStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Positive' && (
                        <span className="text-green-600 text-xs ml-1">✓</span>
                      )}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-xs">
                {/* Exactly 5 lines - match negative accounts height */}
                <div className="flex justify-between">
                  <span className="text-gray-700">{getFirstFieldData().label}</span>
                  <span className="font-medium text-right whitespace-pre-line max-w-[200px]">
                    {formatCourtName(getFirstFieldData().value)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className={`font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                    {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-medium">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Updated:</span>
                  <span className="font-medium">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                </div>

                {/* Additional details - only when expanded */}
                {shouldShowDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date Filed:</span>
                      <span className="font-medium">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                    </div>
                    {record['@caseNumber'] || record.caseNumber ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Case Number:</span>
                        <span className="font-medium">{record['@caseNumber'] || record.caseNumber}</span>
                      </div>
                    ) : null}
                    {record['@courtAddress'] || record.courtAddress ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Address:</span>
                        <span className="font-medium">{record['@courtAddress'] || record.courtAddress}</span>
                      </div>
                    ) : null}
                    {record['@courtPhone'] || record.courtPhone ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Phone:</span>
                        <span className="font-medium">{record['@courtPhone'] || record.courtPhone}</span>
                      </div>
                    ) : null}
                    {record['@plaintiff'] || record.plaintiff ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Plaintiff:</span>
                        <span className="font-medium">{record['@plaintiff'] || record.plaintiff}</span>
                      </div>
                    ) : null}
                    {record['@attorneyName'] || record.attorneyName ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Attorney:</span>
                        <span className="font-medium">{record['@attorneyName'] || record.attorneyName}</span>
                      </div>
                    ) : null}
                    {record['@trustee'] || record.trustee ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Trustee:</span>
                        <span className="font-medium">{record['@trustee'] || record.trustee}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>  
          </div>

          {/* Experian - EXACT copy of TransUnion structure */}
          <div className="relative">
            <div
              className={`border rounded-lg p-4 ${
                isDisputeSaved
                  ? 'border-3 border-green-500 bg-green-50'
                  : 'border-3 border-red-500 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-black">{(record['@publicRecordType'] || record.publicRecordType || 'Public Record').toUpperCase()}</h4>
                <Select
                  value={experianStatus || (hasAnyNegative ? 'Negative' : 'Positive')}
                  onValueChange={setExperianStatus}
                >
                  <SelectTrigger
                    className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                      (experianStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative'
                        ? 'text-red-600 [&>svg]:text-red-600'
                        : 'text-green-700 [&>svg]:text-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {(experianStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Negative' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {(experianStatus || (hasAnyNegative ? 'Negative' : 'Positive')) === 'Positive' && (
                        <span className="text-green-600 text-xs ml-1">✓</span>
                      )}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-xs">
                {/* Exactly 5 lines - match negative accounts height */}
                <div className="flex justify-between">
                  <span className="text-gray-700">{getFirstFieldData().label}</span>
                  <span className="font-medium text-right whitespace-pre-line max-w-[200px]">
                    {formatCourtName(getFirstFieldData().value)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className={`font-medium ${record['@_StatusDescription']?.toLowerCase().includes('discharged') || record['@_StatusDescription']?.toLowerCase().includes('satisfied') || record['@_StatusDescription']?.toLowerCase().includes('released') ? 'text-green-600' : 'text-red-600'}`}>
                    {record['@_StatusDescription'] || record['@status'] || record.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-medium">{formatCurrency(record['@_LiabilityAmount'] || record['@amount'] || record.amount || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Updated:</span>
                  <span className="font-medium">{formatDate(record['@_StatusDate'] || record['@dateUpdated'] || record.dateUpdated || '2024-01-01')}</span>
                </div>

                {/* Additional details - only when expanded */}
                {shouldShowDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Date Filed:</span>
                      <span className="font-medium">{formatDate(record['@_FilingDate'] || record.dateFiled || record['@_Date'])}</span>
                    </div>
                    {record['@caseNumber'] || record.caseNumber ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Case Number:</span>
                        <span className="font-medium">{record['@caseNumber'] || record.caseNumber}</span>
                      </div>
                    ) : null}
                    {record['@courtAddress'] || record.courtAddress ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Address:</span>
                        <span className="font-medium">{record['@courtAddress'] || record.courtAddress}</span>
                      </div>
                    ) : null}
                    {record['@courtPhone'] || record.courtPhone ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Court Phone:</span>
                        <span className="font-medium">{record['@courtPhone'] || record.courtPhone}</span>
                      </div>
                    ) : null}
                    {record['@plaintiff'] || record.plaintiff ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Plaintiff:</span>
                        <span className="font-medium">{record['@plaintiff'] || record.plaintiff}</span>
                      </div>
                    ) : null}
                    {record['@attorneyName'] || record.attorneyName ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Attorney:</span>
                        <span className="font-medium">{record['@attorneyName'] || record.attorneyName}</span>
                      </div>
                    ) : null}
                    {record['@trustee'] || record.trustee ? (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Trustee:</span>
                        <span className="font-medium">{record['@trustee'] || record.trustee}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show All Info Toggle Button - Desktop Only */}
        <div className="hidden md:flex justify-center -mt-2 mb-0 relative w-full">
          <button
            onClick={() => setShowAccountDetails(!shouldShowDetails)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
          >
            <span>{shouldShowDetails ? 'Show Less' : 'Show More'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${shouldShowDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Light grey divider below More Details toggle for negative records */}
        {hasAnyNegative && <div className="border-t border-gray-200 mt-2 mb-3"></div>}

        {/* Dispute Section (only for negative records) - EXACT copy from account-row.tsx */}
        {/* AI Violations Section */}
        {hasAnyNegative && aiViolations && aiViolations.length > 0 && (
          <div className="mb-4" style={{ marginTop: '-2px' }}>
            <button
              onClick={() => {
                setShowViolations(!showViolations);
                if (!showViolations) {
                  setShowSuggestions(false); // Close AI suggestions when opening violations
                }
              }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-md transition-colors font-medium"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline font-medium">
                View {aiViolations.length} Compliance Violations
                {(() => {
                  const metro2Count = aiViolations.filter((v) => v.includes('Metro 2')).length;
                  const fcrCount = aiViolations.length - metro2Count;
                  if (metro2Count > 0 && fcrCount > 0) {
                    return ` (${metro2Count} Metro 2, ${fcrCount} FCRA)`;
                  } else if (metro2Count > 0) {
                    return ` (${metro2Count} Metro 2)`;
                  } else if (fcrCount > 0) {
                    return ` (${fcrCount} FCRA)`;
                  }
                  return '';
                })()}
              </span>
              <span className="md:hidden font-medium">
                View {aiViolations.length} Violations
                {(() => {
                  const metro2Count = aiViolations.filter((v) => v.includes('Metro 2')).length;
                  const fcrCount = aiViolations.length - metro2Count;
                  if (metro2Count > 0 && fcrCount > 0) {
                    return ` (${metro2Count}M2, ${fcrCount}FCRA)`;
                  } else if (metro2Count > 0) {
                    return ` (${metro2Count}M2)`;
                  } else if (fcrCount > 0) {
                    return ` (${fcrCount}FCRA)`;
                  }
                  return '';
                })()}
              </span>
              {showViolations ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Expanded Violations List */}
            {showViolations && (
              <div
                className="-mt-2 space-y-2 bg-blue-50 border border-blue-600 rounded-lg p-3"
                style={{ marginTop: '-6px' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => setShowViolations(!showViolations)}
                    className="text-left hover:bg-blue-100 rounded-md p-2 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900">Detected Violations</h4>
                  </button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addAllViolations(e);
                    }}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 text-sm font-black bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-blue-600 hover:border-blue-700 min-w-[140px] flex items-center whitespace-nowrap"
                  >
                    <Zap className="w-3 h-3 mr-1 flex-shrink-0" />
                    Use All {aiViolations.length}
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {aiViolations.map((violation, index) => (
                    <div key={index} className="p-3 bg-white rounded border border-gray-200">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                violation.includes('Metro 2')
                                  ? 'bg-blue-200 text-blue-800 border border-blue-300'
                                  : 'bg-red-200 text-red-800 border border-red-300'
                              }`}
                              style={{ fontSize: '10px' }}
                            >
                              {violation.includes('Metro 2') ? 'Metro 2' : 'FCRA'}
                            </span>
                            <span className="text-sm font-medium">{violation}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedViolations.includes(violation)) {
                              removeViolationFromDispute(violation);
                            } else {
                              addViolationToDispute(violation);
                            }
                          }}
                          className={
                            selectedViolations.includes(violation)
                              ? 'bg-blue-50 border-blue-300'
                              : 'border-gray-300'
                          }
                        >
                          {selectedViolations.includes(violation) ? 'Added' : 'Add to Dispute'}
                        </Button>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                              violation.includes('Metro 2')
                                ? 'bg-blue-200 text-blue-800 border border-blue-300'
                                : 'bg-red-200 text-red-800 border border-red-300'
                            }`}
                            style={{ fontSize: '10px' }}
                          >
                            {violation.includes('Metro 2') ? 'M-2' : 'FCRA'}
                          </span>
                          <span className="text-sm font-medium">{violation}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedViolations.includes(violation)) {
                              removeViolationFromDispute(violation);
                            } else {
                              addViolationToDispute(violation);
                            }
                          }}
                          className={`w-full border-2 font-black ${selectedViolations.includes(violation) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                        >
                          {selectedViolations.includes(violation) ? 'Added' : 'Add to Dispute'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Dispute Suggestions Section */}
        {hasAnyNegative && aiViolations && aiViolations.length > 0 && (
          <div className="mb-4" style={{ marginTop: '-2px' }}>
            <button
              onClick={() => {
                setShowSuggestions(!showSuggestions);
                if (!showSuggestions) {
                  setShowViolations(false); // Close violations when opening suggestions
                }
              }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-md transition-colors font-medium"
            >
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span>View AI Dispute Suggestions</span>
              {showSuggestions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showSuggestions && (
              <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">AI-Generated Dispute Strategies</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <h5 className="text-xs font-medium text-blue-700 mb-1">Strategy 1: Data Verification</h5>
                    <p className="text-sm text-gray-700">Challenge the accuracy and completeness of the public record data reporting.</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <h5 className="text-xs font-medium text-blue-700 mb-1">Strategy 2: Legal Standing</h5>
                    <p className="text-sm text-gray-700">Request proof of legal authority to report this public record information.</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <h5 className="text-xs font-medium text-blue-700 mb-1">Strategy 3: Compliance Review</h5>
                    <p className="text-sm text-gray-700">Demand compliance with Metro 2 and FCRA reporting standards for public records.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {hasAnyNegative && (
          <div className="pt-1 mt-1" data-record-id={`${record.id || 'unknown'}-dispute`}>
            <div
              className="flex items-center gap-3 mb-4"
              data-step="2"
              id={`dispute-step-${record.id || 'unknown'}`}
            >
              {isDisputeSaved ? (
                <span className="text-green-600 text-lg font-bold">✓</span>
              ) : (
                <span className="circle-badge-blue">2</span>
              )}
              <span className={`font-bold ${isDisputeSaved ? 'text-green-600' : ''}`}>
                {isDisputeSaved ? 'Dispute Saved' : 'Create Dispute'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Reason Selection */}
              <div>
                <div>
                  {!showCustomReasonField && (
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Dispute Reason</label>
                      {isTypingReason && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                          AI Writing...
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    {!isTypingReason && !showCustomReasonField ? (
                      <select
                        value={selectedReason || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isDisputeSaved) {
                            setIsDisputeSaved(false);
                          }
                          if (value === '__custom__') {
                            setShowCustomReasonField(true);
                            setSelectedReason('');
                            setCustomReason('');
                          } else if (value !== '') {
                            setCustomReason(value);
                            setSelectedReason(value);
                            setShowCustomReasonField(false);
                            setIsTypingReason(false);
                            setTimeout(() => checkFormCompletionAndShowArrow(value), 300);
                          }
                        }}
                        className="w-full border bg-white h-[40px] px-3 text-sm rounded-md focus:outline-none dispute-reason-field border-gray-300 focus:border-gray-400"
                      >
                        <option value="">Select dispute reason...</option>
                        {disputeReasons.slice(1, -1).map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                        <option value="__custom__">✏️ Write custom reason...</option>
                      </select>
                    ) : (
                      <div>
                        <div className="flex-between mb-2 min-h-[20px]">
                          <label className="text-sm font-medium">Dispute Reason</label>
                          <button
                            onClick={() => {
                              setCustomReason('');
                              setSelectedReason('');
                              setShowCustomReasonField(false);
                              setIsDisputeSaved(false);
                              setIsCollapsed(false);
                              onHeaderReset?.();
                              onDisputeReset?.(record.id || 'unknown');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Reset & choose different reason
                          </button>
                        </div>
                        {isTypingReason ? (
                          <div className="relative">
                            <div className="absolute -top-7 right-0 flex items-center gap-1 text-red-600 text-xs z-10">
                              <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
                              <span>AI typing</span>
                            </div>
                            <div
                              className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 text-sm"
                              style={{
                                minHeight: '40px',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.5',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                              }}
                            >
                              {customReason || 'AI is typing...'}
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={customReason || ''}
                            onChange={(e) => {
                              if (!isTypingReason) {
                                setCustomReason(e.target.value);
                                if (isDisputeSaved) {
                                  setIsDisputeSaved(false);
                                }
                              }
                            }}
                            placeholder="Enter your dispute reason..."
                            className="w-full border rounded-md p-3 text-sm focus:outline-none resize-none mobile-resizable dispute-reason-field border-gray-300 focus:border-gray-400"
                            rows={Math.max(1, Math.ceil((customReason || '').length / 80))}
                            style={{
                              minHeight: '40px',
                              height: 'auto',
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions Selection */}
              <div>
                <div>
                  {!showCustomInstructionField && (
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Dispute Instruction</label>
                      {isTypingInstruction && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                          AI Writing...
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    {!isTypingInstruction && !showCustomInstructionField ? (
                      <select
                        value={selectedInstruction || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isDisputeSaved) {
                            setIsDisputeSaved(false);
                            onHeaderReset?.();
                          }
                          if (value === '__custom__') {
                            setShowCustomInstructionField(true);
                            setSelectedInstruction('');
                            setCustomInstruction('');
                          } else if (value !== '') {
                            setCustomInstruction(value);
                            setSelectedInstruction(value);
                            setShowCustomInstructionField(false);
                            setIsTypingInstruction(false);
                            setTimeout(
                              () => checkFormCompletionAndShowArrow(undefined, value),
                              300
                            );
                          }
                        }}
                        className="w-full border bg-white h-[40px] px-3 text-sm rounded-md focus:outline-none dispute-instruction-field border-gray-300 focus:border-gray-400"
                      >
                        <option value="">Select dispute instruction...</option>
                        {disputeInstructions.slice(1, -1).map((instruction) => (
                          <option key={instruction} value={instruction}>
                            {instruction}
                          </option>
                        ))}
                        <option value="__custom__">✏️ Write custom instruction...</option>
                      </select>
                    ) : (
                      <div>
                        <div className="flex-between mb-2 min-h-[20px]">
                          <label className="text-sm font-medium">Dispute Instruction</label>
                          <button
                            onClick={() => {
                              setCustomInstruction('');
                              setSelectedInstruction('');
                              setShowCustomInstructionField(false);
                              setIsDisputeSaved(false);
                              setIsCollapsed(false);
                              onHeaderReset?.();
                              onDisputeReset?.(record.id || 'unknown');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Reset & choose different instruction
                          </button>
                        </div>
                        {isTypingInstruction ? (
                          <div className="relative">
                            <div className="absolute -top-7 right-0 flex items-center gap-1 text-red-600 text-xs z-10">
                              <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
                              <span>AI typing</span>
                            </div>
                            <div
                              className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 text-sm"
                              style={{
                                minHeight: '40px',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.5',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                              }}
                            >
                              {customInstruction || 'AI is typing...'}
                            </div>
                          </div>
                        ) : (
                          <textarea
                            value={customInstruction || ''}
                            onChange={(e) => {
                              if (!isTypingInstruction) {
                                setCustomInstruction(e.target.value);
                                if (isDisputeSaved) {
                                  setIsDisputeSaved(false);
                                }
                              }
                            }}
                            placeholder="Enter your dispute instruction..."
                            className="w-full border rounded-md p-3 text-sm focus:outline-none resize-none mobile-resizable dispute-instruction-field border-gray-300 focus:border-gray-400"
                            rows={Math.max(1, Math.ceil((customInstruction || '').length / 80))}
                            style={{
                              minHeight: '40px',
                              height: 'auto',
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Blue flying arrow guide - REMOVED: unwanted bouncing ball animation */}

              {/* Save Button */}
              <div className="flex gap-2 justify-between items-center pt-2">
                {hasAnyNegative && !isDisputeSaved && !showGuideArrow ? (
                  <div className="warning-container">
                    <AlertTriangle className="hidden md:block w-4 h-4 warning-icon" />
                    <span className="text-xs md:text-sm font-medium warning-text">
                      <span className="md:hidden">Complete<br />& Save</span>
                      <span className="hidden md:inline">Complete Reason & Instruction</span>
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
                <div className="flex items-center gap-2 relative overflow-visible">
                  {/* Flying Arrow Guide - REMOVED: unwanted blue ball animation */}
                  {isDisputeSaved ? (
                    <span className="text-green-600 text-lg font-bold mr-1">✓</span>
                  ) : (
                    <span className="circle-badge-blue mr-1">3</span>
                  )}
                  <Button
                    disabled={(() => {
                      const hasReason = showCustomReasonField ? customReason.trim() : selectedReason;
                      const hasInstruction = showCustomInstructionField ? customInstruction.trim() : selectedInstruction;
                      return !hasReason || !hasInstruction;
                    })()}
                    onClick={() => {
                      const finalReason = showCustomReasonField ? customReason.trim() : selectedReason?.trim();
                      const finalInstruction = showCustomInstructionField ? customInstruction.trim() : selectedInstruction?.trim();

                      if (!finalReason || !finalInstruction) {
                        return;
                      }

                      setIsDisputeSaved(true);

                      if (onDisputeSaved) {
                        const recordId = record.id || 'unknown';
                        onDisputeSaved(recordId, {
                          reason: finalReason,
                          instruction: finalInstruction,
                          violations: [],
                        });
                      }

                      setTimeout(() => {
                        setIsCollapsed(true);
                      }, 1000);
                    }}
                    className={`text-white rounded-md font-medium transition-colors duration-200 flex items-center justify-center px-4 py-2 w-[190px] h-10 ${
                      isDisputeSaved
                        ? 'bg-green-600 hover:bg-green-700'
                        : (() => {
                            const hasReason = showCustomReasonField ? customReason.trim() : selectedReason;
                            const hasInstruction = showCustomInstructionField ? customInstruction.trim() : selectedInstruction;
                            const isIncomplete = !hasReason || !hasInstruction;
                            return isIncomplete
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700';
                          })()
                    }`}
                  >
                    {isDisputeSaved ? (
                      <>
                        <span className="text-white text-sm mr-2">✓</span>
                        <span className="hidden md:inline">Dispute Saved</span>
                        <span className="md:hidden">Saved</span>
                      </>
                    ) : (
                      'Save Dispute and Continue'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}