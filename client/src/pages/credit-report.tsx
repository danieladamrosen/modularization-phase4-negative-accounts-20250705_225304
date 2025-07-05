import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Credit Report Components
import { CreditReportHeader } from '@/components/credit-report/header';
import { AccountRow } from '@/components/credit-report/account-row';
import { PublicRecordRow } from '@/components/credit-report/public-record-row';
import { Inquiries } from '@/components/credit-report/inquiries-working';
import { PersonalInfo } from '@/components/credit-report/personal-info';
import { CreditSummary } from '@/components/credit-report/credit-summary';
import { CompletionCenter } from '@/components/credit-report/completion-center';
import { DisputeModal } from '@/components/credit-report/dispute-modal';
import { RippleLoader } from '@/components/ui/ripple-loader';
import { SavedCollapsedCard } from '@/components/ui/saved-collapsed-card';
import { NameHeader } from '@/components/credit-report/name-header';
import { AiScanSection } from '@/components/credit-report/ai-scan-section';
import { CreditScoresSection } from '@/components/credit-report/credit-scores-section';
import { InstructionsBanner } from '@/components/credit-report/instructions-banner';
import { HardInquiriesSection } from '@/components/credit-report/hard-inquiries-section';
import { PublicRecordsSection } from '@/components/credit-report/public-records-section';
import PositiveClosedAccountsSection from '@/components/credit-report/positive-closed-accounts-section';
import NegativeAccountsSection from '@/components/credit-report/negative-accounts-section';

// Utilities and Data
import { parseCreditReport } from '@/lib/credit-data';

// Import bureau logos and score gauge
import transUnionLogo from '../assets/transunion-logo.png';
import equifaxLogo from '../assets/equifax-logo.png';
import experianLogo from '../assets/experian-logo.png';
import scoreGaugeArc from '../assets/score-gauge-arc.png';

export default function CreditReportPage() {
  // Core data state
  const [creditData, setCreditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dispute management state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [savedDisputes, setSavedDisputes] = useState<{
    [accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] };
  }>({});

  // AI scanning state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiViolations, setAiViolations] = useState<{ [accountId: string]: string[] }>({});
  const [aiScanCompleted, setAiScanCompleted] = useState(false);
  const [aiScanDismissed, setAiScanDismissed] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{
    totalViolations: number;
    affectedAccounts: number;
  }>({
    totalViolations: 0,
    affectedAccounts: 0,
  });

  // Hard Inquiries auto-collapse state
  type SavedInquiry = { bureau: 'TU' | 'EQ' | 'EX'; isRecent: boolean };
  const [savedInquiries, setSavedInquiries] = useState<Record<string, SavedInquiry>>({});
  const [hardCollapsed, setHardCollapsed] = useState(false);
  
  // Hard Inquiries sub-card saved states
  const [olderInquiriesSaved, setOlderInquiriesSaved] = useState(false);
  const [recentInquiriesSaved, setRecentInquiriesSaved] = useState(false);

  // UI state management
  const [showCreditAccounts, setShowCreditAccounts] = useState(false);
  const [showPositiveAccounts, setShowPositiveAccounts] = useState(false);
  const [showNegativeAccounts, setShowNegativeAccounts] = useState(false);

  const [showHardInquiries, setShowHardInquiries] = useState(false);
  const [showCreditSummary, setShowCreditSummary] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [negativeAccountsCollapsed, setNegativeAccountsCollapsed] = useState(false);
  const [userHasManuallyExpanded, setUserHasManuallyExpanded] = useState(false);
  
  // Credit Summary review saved state
  const [creditSummaryReviewSaved, setCreditSummaryReviewSaved] = useState(false);

  // Personal Information saved state management
  const [personalInfoSelections, setPersonalInfoSelections] = useState<Record<string, boolean>>({});
  const [personalInfoDispute, setPersonalInfoDispute] = useState<{
    selectedItems: string[];
    reason: string;
    instruction: string;
  } | null>(null);

  // Recent Inquiries saved state management
  const [recentInquirySelections, setRecentInquirySelections] = useState<Array<{
    id: string;
    bureau: string;
    creditor: string;
  }>>([]);
  const [recentInquiryDispute, setRecentInquiryDispute] = useState<{
    reason: string;
    instruction: string;
    selectedInquiries: string[];
  } | null>(null);

  // Older Inquiries saved state management  
  const [olderInquirySelections, setOlderInquirySelections] = useState<Array<{
    id: string;
    bureau: string;
    creditor: string;
  }>>([]);
  const [olderInquiryDispute, setOlderInquiryDispute] = useState<{
    reason: string;
    instruction: string;
    selectedInquiries: string[];
  } | null>(null);

  // Refs for scroll behavior (negativeAccountsRef moved to NegativeAccountsSection component)


  // Load credit data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/donald-blair-credit-report.json');
        const rawData = await response.json();
        const parsedData = parseCreditReport(rawData);
        setCreditData(parsedData);
      } catch (error) {
        console.error('Error loading credit data:', error);
      } finally {
        // Keep loader visible for minimum 5 seconds to show Cloudy animation
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      }
    };

    loadData();
  }, []);

  // Note: Negative accounts auto-collapse logic moved to NegativeAccountsSection component

  // Hard Inquiries auto-collapse effect - CASCADE behavior when both sub-cards saved
  useEffect(() => {
    // Check if both sub-cards are saved to trigger parent collapse
    if (!hardCollapsed && olderInquiriesSaved && recentInquiriesSaved) {
      setTimeout(() => {
        // hardInquiriesRef removed - now handled by HardInquiriesSection component
        window.scrollBy(0, -20);
        setHardCollapsed(true);
        console.log('🔔 HARD INQUIRIES COLLAPSED - Both sub-cards saved');
      }, 500);
    }
  }, [olderInquiriesSaved, recentInquiriesSaved, hardCollapsed]);

  // Event handlers

  const handleDisputeSaved = (
    accountId: string,
    disputeData?: { reason: string; instruction: string; violations?: string[] }
  ) => {
    setSavedDisputes((prev) => ({
      ...prev,
      [accountId]: disputeData || true,
    }));
  };

  const handleDisputeReset = (accountId: string) => {
    setSavedDisputes((prev) => {
      const newDisputes = { ...prev };
      delete newDisputes[accountId];
      return newDisputes;
    });
  };

  const handleContinueToWizard = () => {
    console.log('Continuing to wizard...');
  };

  const handleShowDisputeItems = () => {
    console.log('Showing dispute items...');
  };

  // Hard Inquiries callback handlers
  const handleInquirySaved = (id: string, bureau: 'TU' | 'EQ' | 'EX', isRecent: boolean) => {
    console.log(`✅ SAVE-HANDLER (${isRecent ? 'recent' : 'older'}): ${id}`);
    setSavedInquiries((prev) => ({ ...prev, [id]: { bureau, isRecent } }));
  };

  const handleInquiryReset = (id: string) => {
    console.log(`🧹 RESET-HANDLER: ${id}`);
    setSavedInquiries((prev) => {
      const { [id]: _unused, ...rest } = prev;
      return rest;
    });
  };

  // Personal Information dispute save handler
  const handlePersonalInfoDisputeSaved = (disputeData?: {
    selectedItems: { [key: string]: boolean };
    reason: string;
    instruction: string;
  }) => {
    if (disputeData) {
      setPersonalInfoSelections(disputeData.selectedItems);
      setPersonalInfoDispute({
        reason: disputeData.reason,
        instruction: disputeData.instruction,
        selectedItems: Object.keys(disputeData.selectedItems).filter(
          (key) => disputeData.selectedItems[key]
        ),
      });
    }

    setSavedDisputes((prev) => ({
      ...prev,
      'personal-info': true,
    }));
  };

  // Recent Inquiries dispute save handler
  const handleRecentInquiryDisputeSaved = (disputeData?: {
    selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>;
    reason: string;
    instruction: string;
  }) => {
    if (disputeData) {
      setRecentInquirySelections(disputeData.selectedInquiries);
      setRecentInquiryDispute({
        reason: disputeData.reason,
        instruction: disputeData.instruction,
        selectedInquiries: disputeData.selectedInquiries.map(inq => inq.id),
      });
    }

    setSavedDisputes((prev) => ({
      ...prev,
      'recent-inquiries': true,
    }));
    setRecentInquiriesSaved(true);
  };

  // Older Inquiries dispute save handler
  const handleOlderInquiryDisputeSaved = (disputeData?: {
    selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>;
    reason: string;
    instruction: string;
  }) => {
    if (disputeData) {
      setOlderInquirySelections(disputeData.selectedInquiries);
      setOlderInquiryDispute({
        reason: disputeData.reason,
        instruction: disputeData.instruction,
        selectedInquiries: disputeData.selectedInquiries.map(inq => inq.id),
      });
    }

    setSavedDisputes((prev) => ({
      ...prev,
      'older-inquiries': true,
    }));
    setOlderInquiriesSaved(true);
  };



  const handleAiScan = async () => {
    setIsAiScanning(true);

    // Add 5 second delay to make it feel like AI is thinking
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      // Call the real AI scan API with credit data
      const response = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditData }),
      });

      if (response.ok) {
        const violations = await response.json();

        // Count total violations and affected accounts
        let totalViolations = 0;
        let affectedAccounts = 0;

        Object.keys(violations).forEach((accountId) => {
          if (violations[accountId] && violations[accountId].length > 0) {
            totalViolations += violations[accountId].length;
            affectedAccounts++;
          }
        });

        setAiViolations(violations);
        setAiSummaryData({ totalViolations, affectedAccounts });
        setAiScanCompleted(true);
        setShowAiSummary(true);
      } else {
        console.error('AI scan failed:', response.statusText);
        // Fallback to show no violations found
        setAiViolations({});
        setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
        setShowAiSummary(true);
      }
    } catch (error) {
      console.error('AI scan error:', error);
      // Fallback to show no violations found
      setAiViolations({});
      setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
      setShowAiSummary(true);
    }

    setIsAiScanning(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <RippleLoader />
      </div>
    );
  }

  // Get data arrays
  const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];

  // Create enhanced public records from credit data
  const publicRecordsFromCredit = accounts
    .filter(
      (account: any) =>
        account['@_AccountType'] &&
        ['13', '14', '15', '16', '93', '94', '95'].includes(account['@_AccountType'])
    )
    .map((account: any) => ({
      ...account,
      '@publicRecordType':
        account['@_AccountType'] === '93'
          ? 'BANKRUPTCY'
          : account['@_AccountType'] === '94'
            ? 'TAX LIEN'
            : account['@_AccountType'] === '95'
              ? 'JUDGMENT'
              : 'PUBLIC RECORD',
      '@courtName': account['@_SubscriberName'] || 'Court Name Not Available',
      '@courtAddress': 'Court Address Not Available',
      caseNumber: account['@_AccountNumber'] || 'Case Number Not Available',
      filingDate: account['@_AccountOpenedDate'] || 'Filing Date Not Available',
      status: account['@_AccountStatusType'] || 'Status Not Available',
    }));

  // Get public records from the existing structure if available
  const existingPublicRecords = creditData?.CREDIT_RESPONSE?.CREDIT_PUBLIC_RECORD || [];

  // Combine both sources, giving priority to existing public records
  const allPublicRecords = [...existingPublicRecords, ...publicRecordsFromCredit];

  // Show all public records (they are typically negative by nature)
  const publicRecords = allPublicRecords.length > 0 ? allPublicRecords : publicRecordsFromCredit;

  const hasPublicRecords = publicRecords && publicRecords.length > 0;

  // Calculate recent inquiries count (inquiries within 24 months)

  // Calculate counts
  const disputeReasons = [
    'This account does not belong to me',
    'Account information is inaccurate',
    'Payment history is incorrect',
    'Account should be closed/paid',
    'Duplicate account reporting',
    'Identity theft/fraud account',
    'Settled account still showing balance',
    'Account beyond statute of limitations',
    'Incorrect dates (opened/closed/last activity)',
    'Unauthorized charges on this account',
  ];

  const disputeInstructions = [
    'Please remove this inaccurate information immediately',
    'Verify and correct all account details',
    'Update payment history to reflect accurate information',
    'Remove this account as it has been paid in full',
    'Delete this duplicate entry from my credit report',
    'Remove this fraudulent account immediately',
    'Update account to show zero balance',
    'Remove this time-barred account',
    'Correct all dates associated with this account',
    'Remove all unauthorized charges and related negative marks',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-2 px-4">
        {/* Header */}
        <CreditReportHeader />

        {/* Name Section */}
        <NameHeader creditData={creditData} />

        {/* AI-Powered Compliance Scan */}
        <AiScanSection
          isAiScanning={isAiScanning}
          showAiSummary={showAiSummary}
          aiScanDismissed={aiScanDismissed}
          aiSummaryData={aiSummaryData}
          onAiScan={handleAiScan}
          onDismissAiSummary={() => {
            setShowAiSummary(false);
            setAiScanDismissed(true);
          }}
        />

        {/* Credit Scores */}
        <CreditScoresSection
          transUnionLogo={transUnionLogo}
          equifaxLogo={equifaxLogo}
          experianLogo={experianLogo}
          scoreGaugeArc={scoreGaugeArc}
        />

        {/* Friendly Instructions */}
        <InstructionsBanner />

        {/* Credit Summary Section */}
        <div className="mb-4" data-section="credit-summary">
          {creditSummaryReviewSaved && !showCreditSummary ? (
            <CreditSummary 
              creditData={creditData}
              isReviewSaved={creditSummaryReviewSaved}
              onReviewSaved={() => setCreditSummaryReviewSaved(true)}
              isExpanded={showCreditSummary}
              setIsExpanded={setShowCreditSummary}
            />
          ) : (
            <Card
              className={`${
                creditSummaryReviewSaved 
                  ? 'border border-green-500 bg-green-50' 
                  : showCreditSummary 
                    ? 'border-2 border-gray-300' 
                    : 'border border-gray-200'
              } transition-all duration-300 hover:shadow-lg`}
            >
              <CardHeader
                className={`cursor-pointer ${
                  creditSummaryReviewSaved 
                    ? 'hover:bg-green-100' 
                    : 'hover:bg-gray-50'
                } transition-colors duration-200`}
                onClick={() => setShowCreditSummary(!showCreditSummary)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      creditSummaryReviewSaved ? 'bg-green-600' : 'bg-blue-500'
                    }`}>
                      {creditSummaryReviewSaved ? '✓' : 'CS'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${
                        creditSummaryReviewSaved ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {creditSummaryReviewSaved ? 'Credit Summary – Review Saved' : 'Credit Summary'}
                      </h3>
                      <p className={`text-sm ${
                        creditSummaryReviewSaved ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {creditSummaryReviewSaved 
                          ? "You've completed reviewing the credit summary and score impact data." 
                          : "Summary of credit accounts, balances, and score impact"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${
                      creditSummaryReviewSaved ? 'text-green-600' : 'text-gray-600'
                    }`}>3 Bureaus</span>
                    {showCreditSummary ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CardHeader>
              {showCreditSummary && (
                <CardContent>
                  <CreditSummary 
                    creditData={creditData}
                    isReviewSaved={creditSummaryReviewSaved}
                    onReviewSaved={() => setCreditSummaryReviewSaved(true)}
                    isExpanded={showCreditSummary}
                    setIsExpanded={setShowCreditSummary}
                  />
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Personal Information Section */}
        <div className="mb-4">
          <PersonalInfo
            borrower={creditData?.CREDIT_RESPONSE?.BORROWER || {}}
            reportInfo={creditData?.CREDIT_RESPONSE || {}}
            onDisputeSaved={handlePersonalInfoDisputeSaved}
            onHeaderReset={() => {
              setSavedDisputes((prev) => ({
                ...prev,
                'personal-info': false,
              }));
              setPersonalInfoSelections({});
              setPersonalInfoDispute(null);
            }}
            initialSelections={personalInfoSelections}
            initialDisputeData={personalInfoDispute}
            forceExpanded={false}
          />
        </div>

        {/* Hard Inquiries Section */}
        <HardInquiriesSection
          creditData={creditData}
          savedDisputes={savedDisputes}
          onDisputeSaved={handleDisputeSaved}
          onDisputeReset={handleDisputeReset}
          onInquirySaved={handleInquirySaved}
          onInquiryReset={handleInquiryReset}
          hardCollapsed={hardCollapsed}
          setHardCollapsed={setHardCollapsed}
          showHardInquiries={showHardInquiries}
          setShowHardInquiries={setShowHardInquiries}
          recentInquiriesSaved={recentInquiriesSaved}
          setRecentInquiriesSaved={setRecentInquiriesSaved}
          recentInquirySelections={recentInquirySelections}
          setRecentInquirySelections={setRecentInquirySelections}
          recentInquiryDispute={recentInquiryDispute}
          setRecentInquiryDispute={setRecentInquiryDispute}
          onRecentInquiryDisputeSaved={handleRecentInquiryDisputeSaved}
          olderInquiriesSaved={olderInquiriesSaved}
          setOlderInquiriesSaved={setOlderInquiriesSaved}
          olderInquirySelections={olderInquirySelections}
          setOlderInquirySelections={setOlderInquirySelections}
          olderInquiryDispute={olderInquiryDispute}
          setOlderInquiryDispute={setOlderInquiryDispute}
          onOlderInquiryDisputeSaved={handleOlderInquiryDisputeSaved}
        />

        {/* Credit Accounts Master Section */}
        <div className="mb-4">
          <Card
            className={`${showCreditAccounts ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setShowCreditAccounts(!showCreditAccounts)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    negativeAccounts.length > 0 ? 'bg-red-600' : 'bg-gray-500'
                  }`}>
                    {positiveAccounts.length + negativeAccounts.length}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Credit Accounts
                    </h3>
                    <p className="text-sm text-gray-600">
                      {negativeAccounts.length > 0 
                        ? `${negativeAccounts.length} negative accounts may be impacting your credit score`
                        : 'All accounts are in good standing'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm ${
                    negativeAccounts.length > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {positiveAccounts.length + negativeAccounts.length} accounts
                  </span>
                  {showCreditAccounts ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {showCreditAccounts && (
              <CardContent className="pt-3">
                <div className="space-y-4">
                  {/* Positive & Closed Accounts Nested Section */}
                  <PositiveClosedAccountsSection
                    creditData={creditData}
                    aiViolations={aiViolations}
                    disputeReasons={disputeReasons}
                    disputeInstructions={disputeInstructions}
                    onDisputeSaved={handleDisputeSaved}
                    onDisputeReset={handleDisputeReset}
                    aiScanCompleted={aiScanCompleted}
                    savedDisputes={savedDisputes}
                    showPositiveAccounts={showPositiveAccounts}
                    setShowPositiveAccounts={setShowPositiveAccounts}
                    expandAll={expandAll}
                    setExpandAll={setExpandAll}
                    showAllDetails={showAllDetails}
                    setShowAllDetails={setShowAllDetails}
                  />

                  {/* Negative Accounts Nested Section */}
                  <NegativeAccountsSection
                    creditData={creditData}
                    aiViolations={aiViolations}
                    disputeReasons={disputeReasons}
                    disputeInstructions={disputeInstructions}
                    onDisputeSaved={handleDisputeSaved}
                    onDisputeReset={handleDisputeReset}
                    aiScanCompleted={aiScanCompleted}
                    savedDisputes={savedDisputes}
                    showNegativeAccounts={showNegativeAccounts}
                    setShowNegativeAccounts={setShowNegativeAccounts}
                    expandAll={expandAll}
                    setExpandAll={setExpandAll}
                    showAllDetails={showAllDetails}
                    setShowAllDetails={setShowAllDetails}
                    negativeAccountsCollapsed={negativeAccountsCollapsed}
                    setNegativeAccountsCollapsed={setNegativeAccountsCollapsed}
                    userHasManuallyExpanded={userHasManuallyExpanded}
                    setUserHasManuallyExpanded={setUserHasManuallyExpanded}
                  />
                </div>

                {/* Close Credit Accounts Master Card */}
              </CardContent>
            )}
          </Card>
        </div>



        {/* Public Records Section */}
        <PublicRecordsSection
          publicRecords={publicRecords}
          hasPublicRecords={hasPublicRecords}
          savedDisputes={savedDisputes}
          handleDisputeSaved={handleDisputeSaved}
          handleDisputeReset={handleDisputeReset}
          expandAll={expandAll}
        />

        {/* Completion Center */}
        <div className="mb-12 mt-12">
          <CompletionCenter
            onContinueToWizard={handleContinueToWizard}
            onShowDisputeItems={handleShowDisputeItems}
          />
        </div>

        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          accounts={accounts}
          selectedAccount={null}
        />
      </div>
    </div>
  );
}
