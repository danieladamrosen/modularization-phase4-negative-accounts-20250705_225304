import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SavedCollapsedCard } from '@/components/ui/saved-collapsed-card';
import { Inquiries } from './inquiries-working';

interface HardInquiriesSectionProps {
  creditData: any;
  savedDisputes: { [key: string]: boolean | { reason: string; instruction: string; violations?: string[] } };
  onDisputeSaved: (disputeData: any) => void;
  onDisputeReset: (disputeData: any) => void;
  onInquirySaved: (id: string, bureau: 'TU' | 'EQ' | 'EX', isRecent: boolean) => void;
  onInquiryReset: (id: string) => void;
  
  // Hard Inquiries collapsed state
  hardCollapsed: boolean;
  setHardCollapsed: (collapsed: boolean) => void;
  showHardInquiries: boolean;
  setShowHardInquiries: (show: boolean) => void;
  
  // Recent Inquiries state
  recentInquiriesSaved: boolean;
  setRecentInquiriesSaved: (saved: boolean) => void;
  recentInquirySelections: Array<{ id: string; bureau: string; creditor: string }>;
  setRecentInquirySelections: (selections: Array<{ id: string; bureau: string; creditor: string }>) => void;
  recentInquiryDispute: { reason: string; instruction: string; selectedInquiries: string[] } | null;
  setRecentInquiryDispute: (dispute: { reason: string; instruction: string; selectedInquiries: string[] } | null) => void;
  onRecentInquiryDisputeSaved: (disputeData?: { selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>; reason: string; instruction: string }) => void;
  
  // Older Inquiries state
  olderInquiriesSaved: boolean;
  setOlderInquiriesSaved: (saved: boolean) => void;
  olderInquirySelections: Array<{ id: string; bureau: string; creditor: string }>;
  setOlderInquirySelections: (selections: Array<{ id: string; bureau: string; creditor: string }>) => void;
  olderInquiryDispute: { reason: string; instruction: string; selectedInquiries: string[] } | null;
  setOlderInquiryDispute: (dispute: { reason: string; instruction: string; selectedInquiries: string[] } | null) => void;
  onOlderInquiryDisputeSaved: (disputeData?: { selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>; reason: string; instruction: string }) => void;
}

export function HardInquiriesSection({
  creditData,
  savedDisputes,
  onDisputeSaved,
  onDisputeReset,
  onInquirySaved,
  onInquiryReset,
  hardCollapsed,
  setHardCollapsed,
  showHardInquiries,
  setShowHardInquiries,
  recentInquiriesSaved,
  setRecentInquiriesSaved,
  recentInquirySelections,
  setRecentInquirySelections,
  recentInquiryDispute,
  setRecentInquiryDispute,
  onRecentInquiryDisputeSaved,
  olderInquiriesSaved,
  setOlderInquiriesSaved,
  olderInquirySelections,
  setOlderInquirySelections,
  olderInquiryDispute,
  setOlderInquiryDispute,
  onOlderInquiryDisputeSaved,
}: HardInquiriesSectionProps) {
  const hardInquiriesRef = useRef<HTMLDivElement>(null);

  // Calculate recent inquiries count
  const calculateRecentInquiriesCount = () => {
    const inquiries = creditData?.CREDIT_RESPONSE?.CREDIT_INQUIRY || [];
    const inquiriesArray = Array.isArray(inquiries) ? inquiries : [inquiries];

    const currentDate = new Date('2025-06-18'); // Use consistent report date
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(cutoffDate.getMonth() - 24); // 24 months ago

    return inquiriesArray.filter((inquiry: any) => {
      const inquiryDate = new Date(inquiry['@_Date']);
      return inquiryDate >= cutoffDate;
    }).length;
  };

  const recentInquiriesCount = calculateRecentInquiriesCount();

  // Helper function for inquiry status text
  const getInquiryStatusText = () => {
    if (recentInquiriesCount === 0) {
      return "You have 0 inquiries that affect the credit score";
    }
    const inquiryWord = recentInquiriesCount === 1 ? 'inquiry' : 'inquiries';
    const affectWord = recentInquiriesCount === 1 ? 'affects' : 'affect';
    return `You have ${recentInquiriesCount} ${inquiryWord} that ${affectWord} the credit score`;
  };

  // Handle header reset
  const handleHeaderReset = () => {
    setRecentInquiriesSaved(false);
    setOlderInquiriesSaved(false);
    setRecentInquirySelections([]);
    setOlderInquirySelections([]);
    setRecentInquiryDispute(null);
    setOlderInquiryDispute(null);
  };

  return (
    <div className="mb-4" ref={hardInquiriesRef}>
      {hardCollapsed ? (
        <SavedCollapsedCard
          sectionName="Hard Inquiries"
          successMessage="Hard Inquiries – Disputes Saved"
          summaryText={`You've saved disputes for ${Object.values(savedDisputes).filter((x: any) => x.isRecent).length} inquiry(ies) across TransUnion, Equifax, and Experian.`}
          onExpand={() => {
            setHardCollapsed(false);
            setShowHardInquiries(true);
            console.log('↩️ HARD INQUIRIES EXPANDED');
          }}
        />
      ) : (
        <Card
          className={`${
            recentInquiriesSaved || olderInquiriesSaved
              ? 'border border-green-500 bg-green-50'
              : showHardInquiries 
                ? 'border-2 border-gray-300' 
                : 'border border-gray-200'
          } transition-all duration-300 hover:shadow-lg`}
        >
          <CardHeader
            className={`cursor-pointer ${
              recentInquiriesSaved || olderInquiriesSaved
                ? 'hover:bg-green-100'
                : 'hover:bg-gray-50'
            } transition-colors duration-200`}
            onClick={() => setShowHardInquiries(!showHardInquiries)}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  recentInquiriesSaved || olderInquiriesSaved ? 'bg-green-600' : 
                  recentInquiriesCount > 0 ? 'bg-orange-500' : 'bg-green-600'
                }`}>
                  {recentInquiriesSaved || olderInquiriesSaved ? '✓' : recentInquiriesCount}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${
                    recentInquiriesSaved || olderInquiriesSaved ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {recentInquiriesSaved || olderInquiriesSaved ? 'Hard Inquiries – Disputes Saved' : 'Hard Inquiries'}
                  </h3>
                  <p className={`text-sm ${
                    recentInquiriesSaved || olderInquiriesSaved ? 'text-green-700' : 
                    recentInquiriesCount > 0 ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    {recentInquiriesSaved || olderInquiriesSaved
                      ? "You've saved disputes across TransUnion, Equifax, and Experian."
                      : getInquiryStatusText()
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${
                  recentInquiriesSaved || olderInquiriesSaved ? 'text-green-600' : 'text-gray-600'
                }`}>3 Bureaus</span>
                {showHardInquiries ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>
          {showHardInquiries && (
            <CardContent>
              <Inquiries
                creditData={creditData}
                onDisputeSaved={onDisputeSaved}
                onHeaderReset={handleHeaderReset}
                savedDisputes={savedDisputes}
                onInquirySaved={onInquirySaved}
                onInquiryReset={onInquiryReset}
                onOlderInquiriesSaved={setOlderInquiriesSaved}
                onRecentInquiriesSaved={setRecentInquiriesSaved}
                onRecentInquiryDisputeSaved={onRecentInquiryDisputeSaved}
                onOlderInquiryDisputeSaved={onOlderInquiryDisputeSaved}
                initialRecentSelections={recentInquirySelections}
                initialOlderSelections={olderInquirySelections}
                initialRecentDisputeData={recentInquiryDispute}
                initialOlderDisputeData={olderInquiryDispute}
                forceRecentExpanded={!!recentInquiryDispute}
                forceOlderExpanded={!!olderInquiryDispute}
              />
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}