import { useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AccountRow } from './account-row';
import { SavedCollapsedCard } from '@/components/ui/saved-collapsed-card';

interface NegativeAccountsSectionProps {
  creditData: any;
  aiViolations: { [accountId: string]: string[] };
  disputeReasons: any;
  disputeInstructions: any;
  onDisputeSaved: (accountId: string, disputeData: any) => void;
  onDisputeReset: (accountId: string) => void;
  aiScanCompleted: boolean;
  savedDisputes: { [accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] } };
  showNegativeAccounts: boolean;
  setShowNegativeAccounts: (show: boolean) => void;
  expandAll: boolean;
  setExpandAll: (expand: boolean) => void;
  showAllDetails: boolean;
  setShowAllDetails: (show: boolean) => void;
  negativeAccountsCollapsed: boolean;
  setNegativeAccountsCollapsed: (collapsed: boolean) => void;
  userHasManuallyExpanded: boolean;
  setUserHasManuallyExpanded: (expanded: boolean) => void;
}

export default function NegativeAccountsSection({
  creditData,
  aiViolations,
  disputeReasons,
  disputeInstructions,
  onDisputeSaved,
  onDisputeReset,
  aiScanCompleted,
  savedDisputes,
  showNegativeAccounts,
  setShowNegativeAccounts,
  expandAll,
  setExpandAll,
  showAllDetails,
  setShowAllDetails,
  negativeAccountsCollapsed,
  setNegativeAccountsCollapsed,
  userHasManuallyExpanded,
  setUserHasManuallyExpanded,
}: NegativeAccountsSectionProps) {
  const negativeAccountsRef = useRef<HTMLDivElement>(null);

  // Function to determine if an account is negative
  const isNegativeAccount = (account: any) => {
    // 1. Check derogatory data indicator
    if (account['@_DerogatoryDataIndicator'] === 'Y') {
      return true;
    }

    // 2. Check for collection accounts
    if (account['@IsCollectionIndicator'] === 'true' || account['@IsCollectionIndicator'] === 'Y') {
      return true;
    }

    // 3. Check for charge-off accounts
    if (account['@IsChargeoffIndicator'] === 'true' || account['@IsChargeoffIndicator'] === 'Y') {
      return true;
    }

    // 4. Check for past due amounts (indicates late payments)
    const pastDue = parseInt(account['@_PastDueAmount'] || '0');
    if (pastDue > 0) {
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

  // Get negative accounts data
  const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
  const negativeAccounts = accounts.filter((account: any) => isNegativeAccount(account));

  return (
    <div ref={negativeAccountsRef}>
      {negativeAccountsCollapsed ? (
        <SavedCollapsedCard
          sectionName="Negative Accounts"
          successMessage="Negative Accounts – Disputes Saved"
          summaryText={(() => {
            const totalSavedDisputes = negativeAccounts.filter((account: any) => {
              const accountId = account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'];
              return savedDisputes[accountId];
            }).length;
            return `You've saved disputes for ${totalSavedDisputes} negative account(s) across TransUnion, Equifax, and Experian.`;
          })()}
          onExpand={() => {
            setNegativeAccountsCollapsed(false);
            setShowNegativeAccounts(true);
            setUserHasManuallyExpanded(true);
          }}
        />
      ) : (
        <Card
          className={`${showNegativeAccounts ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
        >
          <CardHeader
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => setShowNegativeAccounts(!showNegativeAccounts)}
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gauge-red flex items-center justify-center text-white text-sm font-bold">
                  {negativeAccounts.length}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Negative Accounts</h3>
                  <p className="text-sm text-gray-600">
                    Accounts that may be negatively impacting your credit score
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${
                  negativeAccounts.every((account: any) => {
                    const accountId = account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'];
                    return savedDisputes[accountId];
                  }) ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {negativeAccounts.length} accounts
                </span>
                {showNegativeAccounts ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>
          {showNegativeAccounts && (
            <CardContent className="pt-3">
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-600 font-bold">
                    Complete steps 1-2-3 for each account below to dispute negative items
                  </p>
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
                <div className="flex flex-col gap-6">
                  {negativeAccounts.map((account: any, index: number) => (
                      <AccountRow
                        key={`negative-${account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'] || index}`}
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
                        isFirstInConnectedSection={index === 0}
                        allNegativeAccountsSaved={negativeAccounts.every(
                          (acc: any) =>
                            savedDisputes[
                              acc['@CreditLiabilityID'] ||
                                acc['@_AccountNumber'] ||
                                acc['@_AccountIdentifier']
                            ]
                        )}
                      />
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}