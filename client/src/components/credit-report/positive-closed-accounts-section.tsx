import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AccountRow } from './account-row';

interface PositiveClosedAccountsSectionProps {
  creditData: any;
  aiViolations: { [accountId: string]: string[] };
  disputeReasons: any;
  disputeInstructions: any;
  onDisputeSaved: (accountId: string, disputeData: any) => void;
  onDisputeReset: (accountId: string) => void;
  aiScanCompleted: boolean;
  savedDisputes: { [accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] } };
  showPositiveAccounts: boolean;
  setShowPositiveAccounts: (show: boolean) => void;
  expandAll: boolean;
  setExpandAll: (expand: boolean) => void;
  showAllDetails: boolean;
  setShowAllDetails: (show: boolean) => void;
}

export default function PositiveClosedAccountsSection({
  creditData,
  aiViolations,
  disputeReasons,
  disputeInstructions,
  onDisputeSaved,
  onDisputeReset,
  aiScanCompleted,
  savedDisputes,
  showPositiveAccounts,
  setShowPositiveAccounts,
  expandAll,
  setExpandAll,
  showAllDetails,
  setShowAllDetails,
}: PositiveClosedAccountsSectionProps) {
  
  // Function to determine if an account is closed
  const isClosedAccount = (account: any) => {
    // Check for closed account status
    const accountStatus = account['@_AccountStatusType'];
    if (
      accountStatus &&
      (accountStatus.toLowerCase().includes('closed') ||
        accountStatus.toLowerCase().includes('paid') ||
        accountStatus === 'C')
    )
      return true;

    // Check for closed date
    if (account['@_AccountClosedDate']) return true;

    // Check current rating for closed accounts
    const currentRating = account._CURRENT_RATING?.['@_Code'];
    if (currentRating && currentRating === 'C') return true;

    return false;
  };

  // Function to determine if an account is negative
  const isNegativeAccount = (account: any) => {
    // 1. Check derogatory data indicator
    if (account['@_DerogatoryDataIndicator'] === 'Y') {
      return true;
    }

    // 2. Check for collection account
    if (account['@IsCollectionIndicator'] === 'Y') {
      return true;
    }

    // 3. Check for charge-off
    if (account['@IsChargeoffIndicator'] === 'Y') {
      return true;
    }

    // 4. Check for past due amount
    if (account['@_PastDueAmount'] && parseInt(account['@_PastDueAmount']) > 0) {
      return true;
    }

    // 5. Check current rating code for late payments (2-9 indicate late payments)
    const currentRating = account._CURRENT_RATING?.['@_Code'];
    if (currentRating && ['2', '3', '4', '5', '6', '7', '8', '9'].includes(currentRating)) {
      return true;
    }

    // 6. Check for charge-off date
    if (account['@_ChargeOffDate']) {
      return true;
    }

    return false;
  };

  // Get positive accounts data
  const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
  const positiveAccounts = accounts
    .filter((account: any) => !isNegativeAccount(account))
    .sort((a: any, b: any) => {
      const aIsClosed = isClosedAccount(a);
      const bIsClosed = isClosedAccount(b);
      
      // Open accounts first, closed accounts last
      if (aIsClosed && !bIsClosed) return 1;
      if (!aIsClosed && bIsClosed) return -1;
      return 0;
    });

  return (
    <Card
      className={`${showPositiveAccounts ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
    >
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setShowPositiveAccounts(!showPositiveAccounts)}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gauge-green flex items-center justify-center text-white text-sm font-bold">
              {positiveAccounts.length}
            </div>
            <div>
              <h3 className="text-lg font-bold">Positive & Closed Accounts</h3>
              <p className="text-sm text-gray-600">
                Accounts in good standing helping your credit score
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-sm ${
              positiveAccounts.some((account: any) => {
                const accountId = account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'];
                return savedDisputes[accountId];
              }) ? 'text-green-600' : 'text-gray-600'
            }`}>{positiveAccounts.length} accounts</span>
            {showPositiveAccounts ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>
      </CardHeader>
      {showPositiveAccounts && (
        <CardContent className="pt-2">
          <div className="space-y-6">
            <div className="flex justify-end items-center mb-0">
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setExpandAll(!expandAll)}
                >
                  {expandAll ? 'Collapse All' : 'Expand All'}
                </button>
                <button
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setShowAllDetails(!showAllDetails)}
                >
                  {showAllDetails ? 'Hide Details' : 'Show All Details'}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {positiveAccounts.map((account: any, index: number) => (
                <AccountRow
                  key={`positive-${account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'] || index}`}
                  account={account}
                  aiViolations={aiViolations[account['@CreditLiabilityID']] || []}
                  disputeReasons={disputeReasons}
                  disputeInstructions={disputeInstructions}
                  onDisputeSaved={onDisputeSaved}
                  onDisputeReset={onDisputeReset}
                  expandAll={expandAll}
                  showAllDetails={showAllDetails}
                  aiScanCompleted={aiScanCompleted}
                  savedDisputes={savedDisputes}
                  isFirstInConnectedSection={false}
                  allNegativeAccountsSaved={false}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}