import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, AlertTriangle, ThumbsUp, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InquiriesProps {
  creditData: any;
  onDisputeSaved?: (disputeData?: {
    reason: string;
    instruction: string;
    selectedItems: { [key: string]: boolean };
    isRecentInquiries?: boolean;
  }) => void;
  onHeaderReset?: (inquiryType?: 'older' | 'recent') => void;
  initialDisputeData?: {
    reason: string;
    instruction: string;
    selectedItems: { [key: string]: boolean };
  } | null;
  forceExpanded?: boolean;
  showOlderOnly?: boolean;
  hideOlderInquiries?: boolean;
  onOlderInquiriesSaved?: (saved: boolean) => void;
  onRecentInquiriesSaved?: (saved: boolean) => void;
  onRecentInquiryDisputeSaved?: (disputeData?: {
    selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>;
    reason: string;
    instruction: string;
  }) => void;
  onOlderInquiryDisputeSaved?: (disputeData?: {
    selectedInquiries: Array<{ id: string; bureau: string; creditor: string }>;
    reason: string;
    instruction: string;
  }) => void;
  initialRecentSelections?: Array<{ id: string; bureau: string; creditor: string }>;
  initialOlderSelections?: Array<{ id: string; bureau: string; creditor: string }>;
  initialRecentDisputeData?: {
    reason: string;
    instruction: string;
    selectedInquiries: string[];
  } | null;
  initialOlderDisputeData?: {
    reason: string;
    instruction: string;
    selectedInquiries: string[];
  } | null;
}

export function Inquiries({
  creditData,
  onDisputeSaved,
  onHeaderReset,
  initialDisputeData,
  forceExpanded,
  showOlderOnly,
  hideOlderInquiries,
  onOlderInquiriesSaved,
  onRecentInquiriesSaved,
  onRecentInquiryDisputeSaved,
  onOlderInquiryDisputeSaved,
  initialRecentSelections = [],
  initialOlderSelections = [],
  initialRecentDisputeData = null,
  initialOlderDisputeData = null,
}: InquiriesProps): JSX.Element {
  const [showOlderInquiries, setShowOlderInquiries] = useState(false);
  const [showRecentInquiries, setShowRecentInquiries] = useState(false);
  
  // Initialize older inquiry selections from props
  const [selectedOlderInquiries, setSelectedOlderInquiries] = useState<{ [key: string]: boolean }>(() => {
    if (initialOlderDisputeData && initialOlderDisputeData.selectedInquiries) {
      return initialOlderDisputeData.selectedInquiries.reduce((acc, item) => ({ ...acc, [item]: true }), {});
    }
    return initialOlderSelections.reduce((acc, item) => ({ ...acc, [`${item.id}-${item.bureau}`]: true }), {});
  });
  
  // Initialize recent inquiry selections from props
  const [selectedRecentInquiries, setSelectedRecentInquiries] = useState<{ [key: string]: boolean }>(() => {
    if (initialRecentDisputeData && initialRecentDisputeData.selectedInquiries) {
      return initialRecentDisputeData.selectedInquiries.reduce((acc, item) => ({ ...acc, [item]: true }), {});
    }
    return initialRecentSelections.reduce((acc, item) => ({ ...acc, [`${item.id}-${item.bureau}`]: true }), {});
  });
  
  // Initialize dispute reasons and instructions from props
  const [selectedReason, setSelectedReason] = useState(initialOlderDisputeData?.reason || '');
  const [selectedInstruction, setSelectedInstruction] = useState(initialOlderDisputeData?.instruction || '');
  const [selectedRecentReason, setSelectedRecentReason] = useState(initialRecentDisputeData?.reason || '');
  const [selectedRecentInstruction, setSelectedRecentInstruction] = useState(initialRecentDisputeData?.instruction || '');
  
  // Initialize saved states from props
  const [isOlderDisputeSaved, setIsOlderDisputeSaved] = useState(!!initialOlderDisputeData);
  const [isRecentDisputeSaved, setIsRecentDisputeSaved] = useState(!!initialRecentDisputeData);
  const [savedOlderDispute, setSavedOlderDispute] = useState<any>(null);
  const [savedRecentDispute, setSavedRecentDispute] = useState<any>(null);
  const [showOlderGuideArrow, setShowOlderGuideArrow] = useState(false);
  const [showGuideArrow, setShowGuideArrow] = useState(false);
  const [showCombinedCollapsedBox, setShowCombinedCollapsedBox] = useState(false);
  const [hasEverShownCombinedBox, setHasEverShownCombinedBox] = useState(false);
  const [isTypingReason, setIsTypingReason] = useState(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [isRecentTypingReason, setIsRecentTypingReason] = useState(false);
  const [isRecentTypingInstruction, setIsRecentTypingInstruction] = useState(false);
  const [showOlderInquiryWarning, setShowOlderInquiryWarning] = useState(false);
  const [showRecentInquiryWarning, setShowRecentInquiryWarning] = useState(false);
  const [pendingInquirySelection, setPendingInquirySelection] = useState<string | null>(null);
  const [pendingRecentInquirySelection, setPendingRecentInquirySelection] = useState<string | null>(
    null
  );
  const [pendingBulkSelection, setPendingBulkSelection] = useState<{
    [key: string]: boolean;
  } | null>(null);
  const [warningInquiryName, setWarningInquiryName] = useState<string>('');

  // New states for sub-card save choreography
  const [olderSaved, setOlderSaved] = useState(false);
  const [recentSaved, setRecentSaved] = useState(false);

  // Initialize state with saved dispute data and maintain persistence
  useEffect(() => {
    if (initialDisputeData?.isRecentInquiries && !isRecentDisputeSaved) {
      setSelectedRecentInquiries(initialDisputeData.selectedItems || {});
      setSelectedRecentReason(initialDisputeData.reason || '');
      setSelectedRecentInstruction(initialDisputeData.instruction || '');
      setIsRecentDisputeSaved(true);
      setSavedRecentDispute(initialDisputeData);
    } else if (
      initialDisputeData &&
      !initialDisputeData.isRecentInquiries &&
      !isOlderDisputeSaved
    ) {
      setSelectedOlderInquiries(initialDisputeData.selectedItems || {});
      setSelectedReason(initialDisputeData.reason || '');
      setSelectedInstruction(initialDisputeData.instruction || '');
      setIsOlderDisputeSaved(true);
      setSavedOlderDispute(initialDisputeData);
    }
  }, [initialDisputeData]);

  // Maintain saved state when sections are reopened - CRITICAL: Ensure saved disputes persist
  useEffect(() => {
    if (savedOlderDispute && !isOlderDisputeSaved) {
      setSelectedOlderInquiries(savedOlderDispute.selectedItems || {});
      setSelectedReason(savedOlderDispute.reason || '');
      setSelectedInstruction(savedOlderDispute.instruction || '');
      setIsOlderDisputeSaved(true);
    }
  }, [savedOlderDispute, isOlderDisputeSaved]);

  // CRITICAL FIX: Monitor for showOlderInquiries changes and restore saved state immediately
  useEffect(() => {
    if (savedOlderDispute && showOlderInquiries && !isOlderDisputeSaved) {
      setSelectedOlderInquiries(savedOlderDispute.selectedItems || {});
      setSelectedReason(savedOlderDispute.reason || '');
      setSelectedInstruction(savedOlderDispute.instruction || '');
      setIsOlderDisputeSaved(true);
    }
  }, [showOlderInquiries, savedOlderDispute, isOlderDisputeSaved]);

  useEffect(() => {
    if (savedRecentDispute && !isRecentDisputeSaved) {
      setSelectedRecentInquiries(savedRecentDispute.selectedItems || {});
      setSelectedRecentReason(savedRecentDispute.reason || '');
      setSelectedRecentInstruction(savedRecentDispute.instruction || '');
      setIsRecentDisputeSaved(true);
    }
  }, [savedRecentDispute, isRecentDisputeSaved]);

  // CRITICAL FIX: Monitor for showRecentInquiries changes and restore saved state immediately
  useEffect(() => {
    if (savedRecentDispute && showRecentInquiries && !isRecentDisputeSaved) {
      setSelectedRecentInquiries(savedRecentDispute.selectedItems || {});
      setSelectedRecentReason(savedRecentDispute.reason || '');
      setSelectedRecentInstruction(savedRecentDispute.instruction || '');
      setIsRecentDisputeSaved(true);
    }
  }, [showRecentInquiries, savedRecentDispute, isRecentDisputeSaved]);

  // Helper function to get inquiry data by key from both recent and older
  const getInquiryData = (inquiryKey: string) => {
    const { recent, older } = getInquiriesByBureau();

    // Check recent inquiries first
    for (const bureau in recent) {
      const inquiry = recent[bureau as keyof typeof recent].find(
        (inq: any) => inq.key === inquiryKey
      );
      if (inquiry) {
        return inquiry;
      }
    }

    // Check older inquiries
    for (const bureau in older) {
      const inquiry = older[bureau as keyof typeof older].find(
        (inq: any) => inq.key === inquiryKey
      );
      if (inquiry) {
        return inquiry;
      }
    }

    return null;
  };

  // Helper function to calculate actual bureau disputes for selected inquiries
  const calculateBureauDisputes = (selectedInquiries: { [key: string]: boolean }) => {
    const selectedKeys = Object.keys(selectedInquiries).filter(key => selectedInquiries[key]);
    return selectedKeys.length; // Each selected inquiry = 1 dispute (it only appears in one bureau)
  };

  // Helper function to get total bureau disputes for older inquiries
  const getOlderBureauDisputeCount = () => {
    return calculateBureauDisputes(selectedOlderInquiries);
  };

  // Helper function to get total bureau disputes for recent inquiries
  const getRecentBureauDisputeCount = () => {
    return calculateBureauDisputes(selectedRecentInquiries);
  };

  // Helper function to check if inquiry is tied to an open account
  const isInquiryTiedToOpenAccount = (inquiry: any) => {
    if (!creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY) {
      return false;
    }

    const accounts = Array.isArray(creditData.CREDIT_RESPONSE.CREDIT_LIABILITY)
      ? creditData.CREDIT_RESPONSE.CREDIT_LIABILITY
      : [creditData.CREDIT_RESPONSE.CREDIT_LIABILITY];

    const inquiryName = inquiry['@_Name']?.toLowerCase().trim();
    if (!inquiryName) {
      return false;
    }

    // Check if any account matches the inquiry name (open or closed)
    const hasMatch = accounts.some((account: any, index: number) => {
      const subscriberCode = account['@_SubscriberCode']?.toLowerCase().trim() || '';
      const accountOwner = account['@_AccountOwnershipType']?.toLowerCase().trim() || '';
      const accountStatus = account['@_AccountStatusType'];
      const creditorName = account._CREDITOR?.['@_Name']?.toLowerCase().trim() || '';

      // Check if account is open
      const isOpen = accountStatus !== 'C' && accountStatus !== 'Closed';

      // Enhanced name matching for CITI and other patterns
      let nameMatch = false;

      // Check multiple name fields for matches
      if (inquiryName.includes('citi')) {
        nameMatch =
          subscriberCode.includes('citi') ||
          subscriberCode.includes('citibank') ||
          creditorName.includes('citi') ||
          creditorName.includes('citibank');
      } else {
        // General matching logic
        nameMatch =
          (subscriberCode &&
            (subscriberCode.includes(inquiryName) || inquiryName.includes(subscriberCode))) ||
          (creditorName &&
            (creditorName.includes(inquiryName) || inquiryName.includes(creditorName))) ||
          (accountOwner &&
            (accountOwner.includes(inquiryName) || inquiryName.includes(accountOwner)));
      }

      if (nameMatch) {
        // Return true for any match (open or closed) - let user decide
        return true;
      }

      return false;
    });

    return hasMatch;
  };

  // AI typing animation function
  const typeText = async (
    text: string,
    setter: (text: string) => void,
    isTypingSetter: (isTyping: boolean) => void,
    speed = 30
  ) => {
    isTypingSetter(true);
    let currentText = '';
    for (let i = 0; i <= text.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, speed));
      currentText = text.substring(0, i);
      setter(currentText);
    }
    isTypingSetter(false);
  };

  // Auto-populate fields for older inquiries - SIMPLIFIED
  const autoPopulateOlderFields = async () => {
    const defaultReason = 'Inquiry not authorized by me';
    const defaultInstruction = 'Please remove this unauthorized inquiry immediately';

    // Use AI typing animation for both fields
    await typeText(defaultReason, setSelectedReason, setIsTypingReason, 30);
    
    // Small pause between reason and instruction
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    await typeText(defaultInstruction, setSelectedInstruction, setIsTypingInstruction, 30);
    
    // Show arrow after typing completes
    setTimeout(() => {
      setShowOlderGuideArrow(true);
    }, 200);
  };

  // Auto-populate fields for recent inquiries - with AI typing animation
  const autoPopulateRecentFields = async () => {
    const defaultReason = 'Inquiry not authorized by me';
    const defaultInstruction = 'Please remove this unauthorized inquiry immediately';

    // Use AI typing animation for both fields
    await typeText(defaultReason, setSelectedRecentReason, setIsRecentTypingReason, 30);
    
    // Small pause between reason and instruction
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    await typeText(defaultInstruction, setSelectedRecentInstruction, setIsRecentTypingInstruction, 30);
    
    // Show arrow after typing completes
    setTimeout(() => {
      setShowGuideArrow(true);
      
      // Hide arrow after 4 seconds and restore warning box (matching Personal Information behavior)
      setTimeout(() => {
        setShowGuideArrow(false);
      }, 4000);
    }, 200);
  };

  // Get inquiries data and group by bureau
  const getInquiriesByBureau = () => {
    if (!creditData?.CREDIT_RESPONSE?.CREDIT_INQUIRY) {
      return {
        recent: { TransUnion: [], Equifax: [], Experian: [] },
        older: { TransUnion: [], Equifax: [], Experian: [] },
      };
    }

    const inquiries = creditData.CREDIT_RESPONSE.CREDIT_INQUIRY;
    const inquiryArray = Array.isArray(inquiries) ? inquiries : [inquiries];

    const currentDate = new Date('2025-06-18');
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(cutoffDate.getMonth() - 24);

    const recent = { TransUnion: [] as any[], Equifax: [] as any[], Experian: [] as any[] };
    const older = { TransUnion: [] as any[], Equifax: [] as any[], Experian: [] as any[] };

    inquiryArray.forEach((inquiry, index) => {
      if (inquiry?.['@_Date']) {
        const inquiryDate = new Date(inquiry['@_Date']);
        const key = `inquiry_${index}`;
        const bureau = inquiry.CREDIT_REPOSITORY?.['@_SourceType'] || 'Equifax';

        const inquiryWithKey = { ...inquiry, key };

        const isRecent = inquiryDate >= cutoffDate;

        if (isRecent) {
          if (recent[bureau as keyof typeof recent]) {
            recent[bureau as keyof typeof recent].push(inquiryWithKey);
          }
        } else {
          if (older[bureau as keyof typeof older]) {
            older[bureau as keyof typeof older].push(inquiryWithKey);
          }
        }
      }
    });

    return { recent, older };
  };

  const { recent: recentInquiries, older: olderInquiries } = getInquiriesByBureau();

  // Handle inquiry selection with warning modal
  const toggleOlderInquirySelection = (inquiryKey: string) => {
    const isCurrentlySelected = selectedOlderInquiries[inquiryKey];

    // If selecting (not deselecting), check for account matches first
    if (!isCurrentlySelected) {
      // Get inquiry data from older inquiries
      const { older } = getInquiriesByBureau();
      let inquiryData = null;

      for (const bureau in older) {
        inquiryData = older[bureau as keyof typeof older].find(
          (inq: any) => inq.key === inquiryKey
        );
        if (inquiryData) break;
      }

      // Check if this older inquiry is tied to an open account
      if (inquiryData && isInquiryTiedToOpenAccount(inquiryData)) {
        setWarningInquiryName(inquiryData['@_Name'] || 'this inquiry');
        setPendingInquirySelection(inquiryKey);
        setShowOlderInquiryWarning(true);
        return;
      } else {
        setShowOlderInquiryWarning(true);
        setPendingInquirySelection(inquiryKey);
        return;
      }
    }

    // If deselecting, proceed normally and reset saved state if previously saved
    setSelectedOlderInquiries((prev) => {
      const newSelected = { ...prev, [inquiryKey]: false };

      // If no inquiries are selected after this deselection, clear the form
      const hasAnySelected = Object.values(newSelected).some(Boolean);
      if (!hasAnySelected) {
        setSelectedReason('');
        setSelectedInstruction('');
        if (isOlderDisputeSaved) {
          setIsOlderDisputeSaved(false);
          setSavedOlderDispute(null);
          if (onHeaderReset) {
            onHeaderReset('older');
          }
        }
      } else if (isOlderDisputeSaved) {
        // If still has selections but was previously saved, reset saved state
        setIsOlderDisputeSaved(false);
        setSavedOlderDispute(null);
        if (onHeaderReset) {
          onHeaderReset('older');
        }
      }

      return newSelected;
    });
  };

  // Handle warning modal proceed for older inquiries
  const handleOlderWarningProceed = () => {
    setShowOlderInquiryWarning(false);

    if (pendingInquirySelection) {
      // Auto-scroll to 10px above the selected older inquiry item (responsive spacing)
      setTimeout(() => {
        const inquiryElement = document.querySelector(`[data-inquiry-key="${pendingInquirySelection}"]`);
        if (inquiryElement) {
          const rect = inquiryElement.getBoundingClientRect();
          const isMobile = window.innerWidth < 768;
          const scrollOffset = isMobile ? 10 : 10; // Keep 10px for both but can be adjusted
          const targetScrollY = window.pageYOffset + rect.top - scrollOffset;
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        }
      }, 100);

      setSelectedOlderInquiries((prev) => {
        const newSelected = { ...prev, [pendingInquirySelection]: true };

        const wasEmpty = Object.values(prev).every((val) => !val);
        const hasNewSelections = Object.values(newSelected).some(Boolean);

        if (wasEmpty && hasNewSelections && !selectedReason && !selectedInstruction) {
          setTimeout(() => autoPopulateOlderFields(), 100);
        }

        return newSelected;
      });

      setPendingInquirySelection(null);
    }
  };

  // Handle warning modal proceed for recent inquiries
  const handleRecentWarningProceed = () => {
    setShowRecentInquiryWarning(false);

    if (pendingBulkSelection) {
      // Handle bulk selection after warning
      setSelectedRecentInquiries(pendingBulkSelection);
      setPendingBulkSelection(null);

      // Auto-scroll - mobile targets TransUnion text, desktop gets header -20px
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          // Find "Select All Score-Impact Items" button and scroll 20px below it
          const button = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent?.includes('Select All Score-Impact Items')
          );
          if (button) {
            const rect = button.getBoundingClientRect();
            const targetScrollY = window.pageYOffset + rect.bottom + 20;
            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
          }
        } else {
          const cardHeader = document.querySelector('[data-testid="recent-inquiries-header"]');
          if (cardHeader) {
            const rect = cardHeader.getBoundingClientRect();
            const targetScrollY = window.pageYOffset + rect.top - 20;
            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
          }
        }
      }, 100);

      if (!selectedRecentReason && !selectedRecentInstruction) {
        setTimeout(() => autoPopulateRecentFields(), 200);
      }
    } else if (pendingRecentInquirySelection) {
      // Handle individual selection after warning
      setSelectedRecentInquiries((prev) => {
        const newSelected = { ...prev, [pendingRecentInquirySelection]: true };

        const wasEmpty = Object.values(prev).every((val) => !val);
        const hasNewSelections = Object.values(newSelected).some(Boolean);

        if (wasEmpty && hasNewSelections && !selectedRecentReason && !selectedRecentInstruction) {
          setTimeout(() => autoPopulateRecentFields(), 100);
          
          // Auto-scroll to TransUnion name on mobile after warning confirmation
          setTimeout(() => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
              const recentHeader = document.querySelector('[data-testid="recent-inquiries-header"]');
              if (recentHeader) {
                const rect = recentHeader.getBoundingClientRect();
                // Find "Select All Score-Impact Items" button and scroll 20px below it
                const button = Array.from(document.querySelectorAll('button')).find(btn => 
                  btn.textContent?.includes('Select All Score-Impact Items')
                );
                const targetScrollY = button ? 
                  window.pageYOffset + button.getBoundingClientRect().bottom + 20 :
                  window.pageYOffset + rect.top + 230;
                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
              }
            }
          }, 500);
        }

        return newSelected;
      });

      setPendingRecentInquirySelection(null);
    }
  };

  const toggleRecentInquirySelection = (inquiryKey: string) => {
    // Check if we're trying to select an inquiry
    const isSelecting = !selectedRecentInquiries[inquiryKey];


    if (isSelecting) {
      // Get inquiry data from recent inquiries
      const { recent } = getInquiriesByBureau();
      let inquiryData = null;

      for (const bureau in recent) {
        inquiryData = recent[bureau as keyof typeof recent].find(
          (inq: any) => inq.key === inquiryKey
        );
        if (inquiryData) break;
      }


      if (inquiryData && isInquiryTiedToOpenAccount(inquiryData)) {
        // Show warning modal for recent inquiries tied to open accounts
        setWarningInquiryName(inquiryData['@_Name'] || 'this inquiry');
        setPendingRecentInquirySelection(inquiryKey);
        setShowRecentInquiryWarning(true);
        return;
      }
    }

    setSelectedRecentInquiries((prev) => {
      const newSelected = { ...prev, [inquiryKey]: !prev[inquiryKey] };

      const wasEmpty = Object.values(prev).every((val) => !val);
      const hasNewSelections = Object.values(newSelected).some(Boolean);
      const isSelecting = !prev[inquiryKey];

      // If no inquiries are selected after this change, clear the form
      if (!hasNewSelections) {
        setSelectedRecentReason('');
        setSelectedRecentInstruction('');
        if (isRecentDisputeSaved) {
          setIsRecentDisputeSaved(false);
          setSavedRecentDispute(null);
          if (onHeaderReset) {
            onHeaderReset('recent');
          }
        }
      }
      // If selecting after having none selected, trigger autotype and auto-scroll
      else if (
        wasEmpty &&
        hasNewSelections &&
        !selectedRecentReason &&
        !selectedRecentInstruction
      ) {
        setTimeout(() => autoPopulateRecentFields(), 100);
        
        // Auto-scroll to TransUnion name on mobile when selecting recent inquiry
        setTimeout(() => {
          const isMobile = window.innerWidth < 768;
          if (isMobile && isSelecting) {
            const recentHeader = document.querySelector('[data-testid="recent-inquiries-header"]');
            if (recentHeader) {
              const rect = recentHeader.getBoundingClientRect();
              // Find "Select All Score-Impact Items" button and scroll 20px below it
              const button = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent?.includes('Select All Score-Impact Items')
              );
              const targetScrollY = button ? 
                window.pageYOffset + button.getBoundingClientRect().bottom + 20 :
                window.pageYOffset + rect.top + 230;
              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            }
          }
        }, 500);
      }
      // If modifying selections after being saved, reset saved state
      else if (isRecentDisputeSaved && hasNewSelections) {
        setIsRecentDisputeSaved(false);
        setSavedRecentDispute(null);
        if (onHeaderReset) {
          onHeaderReset('recent');
        }
      }

      return newSelected;
    });
  };

  // Check form completion for arrows - match Personal Information timing exactly
  const checkOlderFormCompletionAndShowArrow = () => {
    // Don't show arrow during typing animation (matching Personal Information behavior)
    if (isTypingReason || isTypingInstruction) {
      return;
    }

    const hasSelectedItems = Object.values(selectedOlderInquiries).some(Boolean);
    const hasReason = selectedReason;
    const hasInstruction = selectedInstruction;

    if (hasSelectedItems && hasReason && hasInstruction && !isOlderDisputeSaved) {
      setShowOlderGuideArrow(true);
      
      // Hide arrow after 4 seconds and restore warning box (matching Personal Information behavior)
      setTimeout(() => {
        setShowOlderGuideArrow(false);
      }, 4000);
    } else {
      setShowOlderGuideArrow(false);
    }
  };

  // Check arrow with explicit values (for when state hasn't updated yet) - matching Personal Information
  const checkOlderFormCompletionAndShowArrowWithValues = (
    reasonText: string,
    instructionText: string
  ) => {
    const hasSelectedItems = Object.values(selectedOlderInquiries).some(Boolean);
    const hasReason = !!reasonText;
    const hasInstruction = !!instructionText;

    if (hasSelectedItems && hasReason && hasInstruction && !isOlderDisputeSaved) {
      setShowOlderGuideArrow(true);
      
      // Hide arrow after 4 seconds and restore warning box (matching Personal Information behavior)
      setTimeout(() => {
        setShowOlderGuideArrow(false);
      }, 4000);
    }
  };

  const checkRecentFormCompletionAndShowArrow = () => {
    // Don't show arrow during typing animation (matching Personal Information and Older Inquiries behavior)
    if (isRecentTypingReason || isRecentTypingInstruction) {
      return;
    }

    const hasReason = selectedRecentReason;
    const hasInstruction = selectedRecentInstruction;
    const hasSelectedItems = Object.values(selectedRecentInquiries).some(Boolean);

    if (hasSelectedItems && hasReason && hasInstruction && !isRecentDisputeSaved) {
      setShowGuideArrow(true);
      
      // Hide arrow after 4 seconds and restore warning box (matching Personal Information behavior)
      setTimeout(() => {
        setShowGuideArrow(false);
      }, 4000);
    } else {
      setShowGuideArrow(false);
    }
  };

  // Check arrow with explicit values for Recent Inquiries (matching Personal Information pattern)
  const checkRecentFormCompletionAndShowArrowWithValues = (
    reasonText: string,
    instructionText: string
  ) => {
    const hasSelectedItems = Object.values(selectedRecentInquiries).some(Boolean);
    const hasReason = !!reasonText;
    const hasInstruction = !!instructionText;

    if (hasSelectedItems && hasReason && hasInstruction && !isRecentDisputeSaved) {
      setShowGuideArrow(true);
    }
  };

  // This function is not used - save logic is in button click handler

  // Handle section expansion with scroll to "1" circle
  const handleOlderInquiriesToggle = () => {
    setShowOlderInquiries(!showOlderInquiries);
    
    if (!showOlderInquiries) {
      // Opening the section - scroll to "1" circle
      setTimeout(() => {
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
          if (element.textContent?.includes('Choose unauthorized inquiries to dispute')) {
            const parent = element.closest('.flex.items-center.gap-3');
            if (parent) {
              const circle = parent.querySelector('.circle-badge-blue, .circle-badge-green');
              if (circle && circle.textContent === '1') {
                const rect = circle.getBoundingClientRect();
                const targetScrollY = window.pageYOffset + rect.top - 20;
                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                return;
              }
            }
          }
        }
      }, 100);
    }
  };

  // Date formatting
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',  
      year: 'numeric',
    });
  };

  // Bureau color coding
  const getBureauColor = (bureau: string): string => {
    switch (bureau.toLowerCase()) {
      case 'transunion':
        return 'text-cyan-700';
      case 'equifax':
        return 'text-red-600';
      case 'experian':
        return 'text-blue-800';
      default:
        return 'text-gray-600';
    }
  };

  // Render bureau section with inquiries
  const renderBureauSection = (bureau: string, inquiries: any[], isRecent: boolean) => {
    const selectedItems = isRecent ? selectedRecentInquiries : selectedOlderInquiries;
    const isDisputeSaved = isRecent ? isRecentDisputeSaved : isOlderDisputeSaved;

    return (
      <div key={bureau} className="space-y-4">
        <div className={`flex items-center gap-2 mb-2 ${isRecent ? 'mt-6' : 'mt-3'}`}>
          <h4 className={`font-bold ${getBureauColor(bureau)}`}>{bureau}</h4>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-[100px] flex flex-col items-center justify-center">
            <ThumbsUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-center text-green-700 font-bold">Clean slate!</p>
            <p className="text-xs text-center text-gray-500">No recent inquiries</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inquiries.map((inquiry) => {
              const isSelected = selectedItems[inquiry.key];

              return (
                <div
                  key={inquiry.key}
                  data-inquiry-key={!isRecent ? inquiry.key : undefined}
                  className={`
                    border rounded-lg p-3 h-[100px] cursor-pointer transition-all duration-200
                    ${
                      isDisputeSaved
                        ? isSelected
                          ? 'border-3 border-green-500 bg-green-50'
                          : 'bg-green-50 border border-green-200'
                        : isSelected
                          ? 'border-3 border-red-500 bg-white'
                          : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() =>
                    isRecent
                      ? toggleRecentInquirySelection(inquiry.key)
                      : toggleOlderInquirySelection(inquiry.key)
                  }
                >
                  <div className="flex gap-2 h-full">
                    <input
                      type="checkbox"
                      className="flex-shrink-0 mt-0.5"
                      checked={isSelected}
                      onChange={() => {}}
                    />
                    <div className="flex-1 min-w-0 flex items-center">
                      <div className="w-full">
                        <p className="text-xs font-bold mb-1 truncate">
                          {inquiry['@_Name'] || 'Unknown Creditor'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          {formatDate(inquiry['@_Date'])}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          {inquiry['@CreditBusinessType'] || 'Unknown Type'}
                        </p>
                        <p
                          className={`text-xs flex items-center gap-1 ${isRecent ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {isRecent ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              May Impact Score
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="w-3 h-3" />
                              No Impact to Score
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render dispute form - EXACT replica from Personal Information
  const renderDisputeForm = (isRecent: boolean) => {
    const reason = isRecent ? selectedRecentReason : selectedReason;
    const instruction = isRecent ? selectedRecentInstruction : selectedInstruction;
    const setReason = isRecent ? setSelectedRecentReason : setSelectedReason;
    const setInstruction = isRecent ? setSelectedRecentInstruction : setSelectedInstruction;
    const selectedItems = isRecent ? selectedRecentInquiries : selectedOlderInquiries;
    const hasSelectedItems = Object.values(selectedItems).some(Boolean);
    const isTypingReasonState = isRecent ? isRecentTypingReason : isTypingReason;
    const isTypingInstructionState = isRecent ? isRecentTypingInstruction : isTypingInstruction;
    const showArrow = isRecent ? showGuideArrow : showOlderGuideArrow;
    const isDisputeSavedState = isRecent ? isRecentDisputeSaved : isOlderDisputeSaved;

    if (!hasSelectedItems) return null;

    const disputeReasons = [
      'Inquiry not authorized by me',
      'I never applied for credit with this company',
      'This inquiry is older than 2 years',
      'This is a duplicate inquiry',
      'I was only shopping for rates',
      'This inquiry was made without my permission',
      'This is fraudulent inquiry activity',
      'Other (specify below)',
    ];

    const disputeInstructions = [
      'Please remove this unauthorized inquiry immediately',
      'Delete this inquiry as I never applied for credit',
      'Remove this outdated inquiry from my report',
      'Please delete this duplicate inquiry',
      'Remove this inquiry as I was only rate shopping',
      'Delete this unauthorized inquiry from my credit file',
      'Remove this fraudulent inquiry immediately',
      'Other (specify below)',
    ];

    return (
      <div className="mt-4">
        <div
          className={`pt-4 rounded-lg py-4 ${isDisputeSavedState ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <div className="border-t border-gray-200 mb-4"></div>
          <div className="flex items-start gap-2 mb-4 mt-2">
            {isDisputeSavedState ? (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 mr-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-blue-600">
                2
              </div>
            )}
            <h4 className={`font-semibold ${isDisputeSavedState ? 'text-green-600' : 'text-gray-900'}`}>
              {isDisputeSavedState ? (() => {
                // Count selected inquiries to determine singular/plural
                const olderCount = Object.values(selectedOlderInquiries).filter(Boolean).length;
                const recentCount = Object.values(selectedRecentInquiries).filter(Boolean).length;
                const totalCount = olderCount + recentCount;
                return totalCount === 1 ? 'Dispute Saved' : 'Disputes Saved';
              })() : 'Create Dispute'}
            </h4>
          </div>

          <div className="space-y-4">
            {/* Reason Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Dispute Reason</label>
              </div>
              {isTypingReasonState ? (
                <div className="relative">
                  <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>AI typing</span>
                  </div>
                  <div className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 min-h-[42px] flex items-center">
                    {reason || 'AI is typing...'}
                  </div>
                </div>
              ) : (
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger
                    className={`w-full text-left ${
                      isDisputeSavedState && hasSelectedItems
                        ? 'border-green-500'
                        : hasSelectedItems
                          ? 'border-red-500'
                          : 'border-gray-300'
                    }`}
                  >
                    <SelectValue placeholder="Select a dispute reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeReasons.map((reasonOption, index) => (
                      <SelectItem key={index} value={reasonOption}>
                        {reasonOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Instruction Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Dispute Instruction</label>
              </div>
              {isTypingInstructionState ? (
                <div className="relative">
                  <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>AI typing</span>
                  </div>
                  <div className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 min-h-[42px] flex items-center">
                    {instruction || 'AI is typing...'}
                  </div>
                </div>
              ) : (
                <Select value={instruction} onValueChange={setInstruction}>
                  <SelectTrigger
                    className={`w-full text-left ${
                      isDisputeSavedState && hasSelectedItems
                        ? 'border-green-500'
                        : hasSelectedItems
                          ? 'border-red-500'
                          : 'border-gray-300'
                    }`}
                  >
                    <SelectValue placeholder="Select dispute instructions..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeInstructions.map((instructionOption, index) => (
                      <SelectItem key={index} value={instructionOption}>
                        {instructionOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Save Button Section */}
          <div className="flex gap-2 justify-between items-center pt-4">
            {hasSelectedItems && !isDisputeSavedState && !showArrow ? (
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
              {/* Flying Arrow Guide */}
              {showArrow && (
                <div
                  className="absolute right-full top-1/2 transform -translate-y-1/2 z-50 pr-2 pointer-events-none"
                  style={{ width: 'calc(100vw - 160px)', left: 'calc(-100vw + 140px)' }}
                >
                  <div className="flex items-center animate-fly-arrow">
                    <div className="w-16 h-1 bg-blue-600"></div>
                    <div className="w-0 h-0 border-l-[10px] border-t-[6px] border-b-[6px] border-l-blue-600 border-t-transparent border-b-transparent"></div>
                  </div>
                </div>
              )}
              {isDisputeSavedState ? (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 mr-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-1 bg-blue-600">
                  3
                </span>
              )}
              <Button
                onClick={() => {
                  // If already saved, display "Complete Review" again for consistency
                  if (isDisputeSavedState) {
                    return;
                  }

                  // New save choreography for sub-cards
                  if (isRecent) {
                    const disputeData = {
                      reason: selectedRecentReason,
                      instruction: selectedRecentInstruction,
                      selectedItems: selectedRecentInquiries,
                    };
                    
                    // Mark Recent Inquiries as saved
                    setRecentSaved(true);
                    setSavedRecentDispute(disputeData);
                    setIsRecentDisputeSaved(true);
                    
                    // Notify parent that Recent Inquiries is saved
                    if (onRecentInquiriesSaved) {
                      onRecentInquiriesSaved(true);
                    }

                    // Call the specific recent inquiry dispute saved handler for state persistence
                    if (onRecentInquiryDisputeSaved) {
                      // Convert selectedItems to the format expected by parent
                      const selectedInquiriesArray = Object.keys(selectedRecentInquiries)
                        .filter(key => selectedRecentInquiries[key])
                        .map(key => {
                          const [id, bureau] = key.split('-');
                          return { id, bureau, creditor: `Creditor-${id}` }; // Using available data structure
                        });
                      
                      onRecentInquiryDisputeSaved({
                        selectedInquiries: selectedInquiriesArray,
                        reason: selectedRecentReason,
                        instruction: selectedRecentInstruction,
                      });
                    }

                    // Call parent callback to trigger header green checkmark
                    if (onDisputeSaved) {
                      onDisputeSaved({
                        reason: selectedRecentReason,
                        instruction: selectedRecentInstruction,
                        selectedItems: selectedRecentInquiries,
                        isRecentInquiries: true,
                      });
                    }

                    // New choreography: blue→green, scroll, pause, collapse
                    // Step 1: Button changes to green (immediate)
                    // Step 2: Scroll to 20px above "Hard Inquiries" section
                    setTimeout(() => {
                      const hardInquiriesSection = document.querySelector('[data-section="inquiries"]');
                      if (hardInquiriesSection) {
                        const rect = hardInquiriesSection.getBoundingClientRect();
                        const targetScrollY = window.pageYOffset + rect.top - 20;
                        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                      }
                    }, 50);

                    // Step 3: Pause 0.5s, then collapse Recent Inquiries
                    setTimeout(() => {
                      setShowRecentInquiries(false);
                    }, 500);

                    // Step 4: CASCADE - After 0.5s delay, check if parent should collapse
                    setTimeout(() => {
                      // Check if both sub-cards are saved to trigger parent collapse
                      if (olderSaved || isOlderDisputeSaved) {
                        // Both sections saved - trigger parent Hard Inquiries collapse
                        setTimeout(() => {
                          // Scroll to next section after parent collapse
                          const nextSection = document.querySelector('[data-section="accounts"]');
                          if (nextSection) {
                            const rect = nextSection.getBoundingClientRect();
                            const targetScrollY = window.pageYOffset + rect.top - 20;
                            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                          }
                        }, 500);
                      }
                    }, 1000);

                  } else {
                    // Older Inquiries save choreography
                    const selectedItems = Object.keys(selectedOlderInquiries)
                      .filter((key) => selectedOlderInquiries[key])
                      .reduce(
                        (acc, key) => {
                          acc[key] = true;
                          return acc;
                        },
                        {} as { [key: string]: boolean }
                      );

                    const disputeData = {
                      reason: selectedReason,
                      instruction: selectedInstruction,
                      selectedItems,
                    };
                    
                    // Mark Older Inquiries as saved
                    setOlderSaved(true);
                    setSavedOlderDispute(disputeData);
                    setIsOlderDisputeSaved(true);
                    
                    // Notify parent that Older Inquiries is saved
                    if (onOlderInquiriesSaved) {
                      onOlderInquiriesSaved(true);
                    }

                    // Call the specific older inquiry dispute saved handler for state persistence
                    if (onOlderInquiryDisputeSaved) {
                      // Convert selectedItems to the format expected by parent
                      const selectedInquiriesArray = Object.keys(selectedItems).map(key => {
                        const [id, bureau] = key.split('-');
                        return { id, bureau, creditor: `Creditor-${id}` }; // Using available data structure
                      });
                      
                      onOlderInquiryDisputeSaved({
                        selectedInquiries: selectedInquiriesArray,
                        reason: selectedReason,
                        instruction: selectedInstruction,
                      });
                    }

                    // Call parent callback if available
                    if (onDisputeSaved) {
                      onDisputeSaved(disputeData);
                    }

                    // New choreography: blue→green, scroll, pause, collapse
                    // Step 1: Button changes to green (immediate)
                    // Step 2: Scroll to 20px above "Hard Inquiries" section
                    setTimeout(() => {
                      const hardInquiriesSection = document.querySelector('[data-section="inquiries"]');
                      if (hardInquiriesSection) {
                        const rect = hardInquiriesSection.getBoundingClientRect();
                        const targetScrollY = window.pageYOffset + rect.top - 20;
                        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                      }
                    }, 50);

                    // Step 3: Pause 0.5s, then collapse Older Inquiries
                    setTimeout(() => {
                      setShowOlderInquiries(false);
                    }, 500);

                    // Step 4: Check if both sub-cards are saved to trigger parent collapse
                    setTimeout(() => {
                      if (recentSaved || isRecentDisputeSaved) {
                        // Both sections saved - trigger parent Hard Inquiries collapse
                        setTimeout(() => {
                          // Scroll to next section after parent collapse
                          const nextSection = document.querySelector('[data-section="accounts"]');
                          if (nextSection) {
                            const rect = nextSection.getBoundingClientRect();
                            const targetScrollY = window.pageYOffset + rect.top - 20;
                            window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                          }
                        }, 500);
                      }
                    }, 1000);
                  }
                }}
                disabled={!Object.values(selectedItems).some(Boolean) || !reason || !instruction}
                className={`${
                  isDisputeSavedState
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-4 py-2 rounded-md disabled:bg-gray-400 transition-colors duration-200 w-[190px] h-10 flex items-center justify-center`}
              >
                {isDisputeSavedState ? (
                  <>
                    <span className="text-white text-sm mr-2">✅</span>
                    <span>Dispute Saved</span>
                  </>
                ) : (
                  'Save Dispute and Continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get total counts
  const getTotalOlderCount = () => {
    return Object.values(olderInquiries).reduce(
      (sum, bureauInquiries) => sum + bureauInquiries.length,
      0
    );
  };

  const getTotalRecentCount = () => {
    return Object.values(recentInquiries).reduce(
      (sum, bureauInquiries) => sum + bureauInquiries.length,
      0
    );
  };

  // useEffect hooks
  useEffect(() => {
    checkOlderFormCompletionAndShowArrow();
  }, [
    selectedOlderInquiries,
    selectedReason,
    selectedInstruction,
    isOlderDisputeSaved,
    isTypingReason,
    isTypingInstruction,
  ]);

  useEffect(() => {
    checkRecentFormCompletionAndShowArrow();
  }, [
    selectedRecentInquiries,
    selectedRecentReason,
    selectedRecentInstruction,
    isRecentDisputeSaved,
    isRecentTypingReason,
    isRecentTypingInstruction,
  ]);

  // REMOVED: Duplicate useEffect hooks that were causing state interference
  // The primary useEffect hooks at the top of the component handle all state restoration

  // Calculate combined dispute information
  const getCombinedDisputeInfo = () => {
    const olderCount = savedOlderDispute
      ? Object.keys(savedOlderDispute.selectedItems || {}).length
      : 0;
    const recentCount = savedRecentDispute
      ? Object.keys(savedRecentDispute.selectedItems || {}).length
      : 0;
    const totalCount = olderCount + recentCount;
    
    // Only count actual disputes saved, not bureau multipliers
    const totalDisputes = totalCount;

    return {
      olderCount,
      recentCount,
      totalCount,
      totalDisputes,
      hasOlderDispute: !!savedOlderDispute,
      hasRecentDispute: !!savedRecentDispute,
    };
  };

  const combinedInfo = getCombinedDisputeInfo();

  return (
    <div className="space-y-3">
      {/* Elegant Collapse Button - Shows only after combined box has been shown and sections reopened */}
      {!showCombinedCollapsedBox &&
        hasEverShownCombinedBox &&
        (combinedInfo.hasOlderDispute || combinedInfo.hasRecentDispute) && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => {
                setShowCombinedCollapsedBox(true);
                setHasEverShownCombinedBox(true);
                setShowOlderInquiries(false);
                setShowRecentInquiries(false);
              }}
              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-1.5 rounded-md text-xs transition-colors duration-200 flex items-center gap-1.5"
            >
              <span className="font-medium">Collapse All Inquiries</span>
              <ChevronUp className="w-3 h-3" />
            </Button>
          </div>
        )}

      {/* Combined Collapsed Box - Shows when both sections are saved and collapsed */}
      {showCombinedCollapsedBox &&
        (combinedInfo.hasOlderDispute || combinedInfo.hasRecentDispute) && (
          <Card className="border border-green-300 bg-green-50 transition-all duration-300">
            <CardHeader
              className="cursor-pointer transition-colors collapsed-box-height hover:bg-green-100"
              onClick={() => {
                setShowCombinedCollapsedBox(false);
                // Show individual collapsed boxes, not expanded sections
                setShowOlderInquiries(false);
                setShowRecentInquiries(false);
              }}
            >
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="text-base font-semibold text-green-700 leading-5">
                      {(() => {
                        const totalOlderInquiries = getTotalOlderCount();
                        const totalRecentInquiries = getTotalRecentCount();
                        
                        let title = 'Hard Inquiries Disputes Saved';
                        
                        // Add counts to the title line
                        if (totalOlderInquiries > 0 && totalRecentInquiries > 0) {
                          title += ` (${totalOlderInquiries + totalRecentInquiries})`;
                        } else if (totalOlderInquiries > 0) {
                          title += ` (${totalOlderInquiries})`;
                        } else if (totalRecentInquiries > 0) {
                          title += ` (${totalRecentInquiries})`;
                        }
                        
                        return title;
                      })()}
                    </div>
                    <div className="text-sm text-green-600 leading-4">
                      {(() => {
                        const disputedRecent = combinedInfo.hasRecentDispute ? combinedInfo.recentCount : 0;
                        const disputedOlder = combinedInfo.hasOlderDispute ? combinedInfo.olderCount : 0;
                        
                        // Only show disputed count in line 2
                        if (disputedRecent > 0 && disputedOlder > 0) {
                          return `${disputedRecent + disputedOlder} disputed`;
                        } else if (disputedRecent > 0) {
                          return `${disputedRecent} disputed`;
                        } else if (disputedOlder > 0) {
                          return `${disputedOlder} disputed`;
                        }
                        
                        return 'Dispute completed';
                      })()}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </div>
            </CardHeader>
          </Card>
        )}



      {/* Individual Inquiry Sections - Hide when showing combined box */}
      {!showCombinedCollapsedBox && (
        <>
          {/* Older Inquiries Section */}
          <Card
            className={`${showOlderInquiries ? 'border-2 border-gray-300' : 'border border-gray-200'} ${isOlderDisputeSaved ? 'bg-green-50 border border-green-500 rounded-lg' : ''} transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              className={`cursor-pointer ${isOlderDisputeSaved ? 'bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-lg' : 'hover:bg-gray-50'}`}
              onClick={handleOlderInquiriesToggle}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  {isOlderDisputeSaved ? (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                      {getTotalOlderCount()}
                    </div>
                  )}
                  <div className={isOlderDisputeSaved ? "mt-0.5" : ""}>
                    <h3 className={`text-lg font-bold ${isOlderDisputeSaved ? 'text-green-700' : 'text-gray-900'}`}>
                      {isOlderDisputeSaved
                        ? `Older Inquiries – Disputes Saved`
                        : `${getTotalOlderCount()} Older Inquiries`}
                    </h3>
                    <p className={`text-sm ${isOlderDisputeSaved ? 'text-green-700' : 'text-green-600'}`}>
                      {isOlderDisputeSaved
                        ? `You've saved disputes across TransUnion, Equifax, and Experian.`
                        : 'Inquiries older than 24 months do not impact the score'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">{getTotalOlderCount()} items</span>
                  {showOlderInquiries ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>

            {showOlderInquiries && (
              <CardContent
                className={`
            pt-0 rounded-b-lg
            ${Object.values(selectedOlderInquiries).some(Boolean) && !isOlderDisputeSaved ? 'bg-red-50 border-red-200 border' : ''}
            ${isOlderDisputeSaved ? 'bg-green-50 border border-green-500' : ''}
          `}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderBureauSection('TransUnion', olderInquiries.TransUnion, false)}
                  {renderBureauSection('Equifax', olderInquiries.Equifax, false)}
                  {renderBureauSection('Experian', olderInquiries.Experian, false)}
                </div>
                {renderDisputeForm(false)}
              </CardContent>
            )}
          </Card>

          {/* Recent Inquiries Section */}
          <Card
            className={`${showRecentInquiries ? 'border-2 border-gray-300' : 'border border-gray-200'} ${isRecentDisputeSaved ? 'bg-green-50 border border-green-500 rounded-lg' : ''} transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              data-testid="recent-inquiries-header"
              className={`cursor-pointer ${isRecentDisputeSaved ? 'bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-lg' : 'hover:bg-gray-50'}`}
              onClick={() => setShowRecentInquiries(!showRecentInquiries)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  {isRecentDisputeSaved ? (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-orange-400 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                      {getTotalRecentCount()}
                    </div>
                  )}
                  <div className={isRecentDisputeSaved ? "mt-0.5" : ""}>
                    <h3 className={`text-lg font-bold ${isRecentDisputeSaved ? 'text-green-700' : 'text-gray-900'}`}>
                      {isRecentDisputeSaved
                        ? `Recent Inquiries – Disputes Saved`
                        : `${getTotalRecentCount()} Recent ${getTotalRecentCount() === 1 ? 'Inquiry' : 'Inquiries'}`}
                    </h3>
                    <p className={`text-sm ${isRecentDisputeSaved ? 'text-green-700' : 'text-orange-500 font-medium tracking-tight'}`}>
                      {isRecentDisputeSaved
                        ? `You've saved disputes across TransUnion, Equifax, and Experian.`
                        : `${getTotalRecentCount()} ${getTotalRecentCount() === 1 ? 'inquiry' : 'inquiries'} that may impact your credit score`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">{getTotalRecentCount()} {getTotalRecentCount() === 1 ? 'item' : 'items'}</span>
                  {showRecentInquiries ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>

            {showRecentInquiries && (
              <CardContent
                className={`
            pt-5 rounded-b-lg
            ${Object.values(selectedRecentInquiries).some(Boolean) && !isRecentDisputeSaved ? 'bg-red-50 border-red-200 border' : ''}
            ${isRecentDisputeSaved ? 'bg-green-50 border border-green-500' : ''}
          `}
              >
                <div className="flex justify-between items-center mb-0">
                  {/* Step 1 Instruction - Show green checkmark when saved */}
                  {!showCombinedCollapsedBox && !(isRecentDisputeSaved && isOlderDisputeSaved) ? (
                    <div className="flex items-center gap-3">
                      {isRecentDisputeSaved ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-green-600">
                          ✓
                        </div>
                      ) : (
                        <div className="circle-badge-blue">1</div>
                      )}
                      <span className={`text-base font-bold ${isRecentDisputeSaved ? 'text-green-600' : 'text-gray-700'}`}>
                        Choose unauthorized inquiries to dispute (optional)
                      </span>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  <Button
                    size="sm"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 h-8 text-sm font-medium"
                    onClick={() => {

                      // Get all recent inquiries
                      const allInquiries = Object.values(recentInquiries).flat();

                      // Check each inquiry for account matches
                      let hasAccountMatches = false;
                      const inquiriesWithMatches = [];

                      for (const inquiry of allInquiries) {
                        if (isInquiryTiedToOpenAccount(inquiry)) {
                          hasAccountMatches = true;
                          inquiriesWithMatches.push(inquiry);
                        }
                      }

                      if (hasAccountMatches) {
                        // Show warning modal for bulk selection with account matches
                        setWarningInquiryName(
                          `${inquiriesWithMatches.length} inquiries that match existing accounts`
                        );
                        // Store all inquiries for bulk selection after warning
                        const allSelected = allInquiries.reduce(
                          (acc, inquiry) => {
                            acc[inquiry.key] = true;
                            return acc;
                          },
                          {} as { [key: string]: boolean }
                        );
                        setPendingBulkSelection(allSelected);
                        setShowRecentInquiryWarning(true);
                      } else {
                        // No account matches, proceed with selection
                        const allSelected = allInquiries.reduce(
                          (acc, inquiry) => {
                            acc[inquiry.key] = true;
                            return acc;
                          },
                          {} as { [key: string]: boolean }
                        );
                        setSelectedRecentInquiries(allSelected);

                        // Scroll to 20px above TransUnion on mobile, or use existing behavior on desktop
                        const hasWarnings = Object.keys(allSelected).some(key => 
                          shouldShowRecentInquiryWarning(key, false)
                        );
                        // Auto-scroll - mobile gets 500px offset, desktop gets -20px
                        setTimeout(() => {
                          const isMobile = window.innerWidth < 768;
                          if (isMobile) {
                            // Find "Select All Score-Impact Items" button and scroll 20px below it
                            const button = Array.from(document.querySelectorAll('button')).find(btn => 
                              btn.textContent?.includes('Select All Score-Impact Items')
                            );
                            if (button) {
                              const rect = button.getBoundingClientRect();
                              const targetScrollY = window.pageYOffset + rect.bottom + 20;
                              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                            }
                          } else {
                            const recentHeader = document.querySelector('[data-testid="recent-inquiries-header"]');
                            if (recentHeader) {
                              const rect = recentHeader.getBoundingClientRect();
                              const targetScrollY = window.pageYOffset + rect.top - 20;
                              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                            }
                          }
                        }, 300);

                        if (!selectedRecentReason && !selectedRecentInstruction) {
                          setTimeout(() => autoPopulateRecentFields(), 200);
                        }
                      }
                    }}
                  >
                    Select All Score-Impact Items
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderBureauSection('TransUnion', recentInquiries.TransUnion, true)}
                  {renderBureauSection('Equifax', recentInquiries.Equifax, true)}
                  {renderBureauSection('Experian', recentInquiries.Experian, true)}
                </div>
                {renderDisputeForm(true)}
              </CardContent>
            )}
          </Card>
        </>
      )}

      {/* Warning Modal for Older Inquiries */}
      {showOlderInquiryWarning && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setShowOlderInquiryWarning(false);
              setPendingInquirySelection(null);
            }}
          />
          <div className="fixed left-[50%] top-[50%] z-50 w-[95%] max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg p-6 md:p-8 shadow-2xl min-h-[320px]">
            {/* X Close Button */}
            <button
              onClick={() => {
                setShowOlderInquiryWarning(false);
                setPendingInquirySelection(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Warning Icon */}
            <div className="flex items-start gap-2 mb-6 -ml-1">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-xl font-semibold text-gray-900 mb-4">
                  Warning: Old Inquiry
                </h3>

                {/* Main Content */}
                <div className="text-gray-700 mb-6 text-lg md:text-base">
                  <p className="mb-4">
                    <span className="hidden md:inline">This inquiry is more than 24 months old, so it no longer impacts your credit score.</span>
                    <span className="md:hidden">This inquiry is over 24 months old and doesn&apos;t impact your score.</span>
                  </p>
                  <p className="mb-4">
                    <span className="hidden md:inline">Disputing it won&apos;t help your score — and if there&apos;s an open account linked to it, you could lose that account, which can hurt your score.</span>
                    <span className="md:hidden">Disputing won&apos;t help your score and may close linked accounts.</span>
                  </p>
                  <p className="mb-4 font-semibold text-red-700 text-lg md:text-base">
                    <span className="hidden md:inline">We recommend that you do not dispute this inquiry.</span>
                    <span className="md:hidden">We recommend not disputing this.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOlderInquiryWarning(false);
                  setPendingInquirySelection(null);
                }}
                className="flex-1 px-4 py-4 md:px-6 md:py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOlderWarningProceed}
                className="flex-1 px-4 py-4 md:px-6 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </>
      )}

      {/* Warning Modal for Recent Inquiries */}
      {showRecentInquiryWarning && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setShowRecentInquiryWarning(false);
              setPendingRecentInquirySelection(null);
              setPendingBulkSelection(null);
            }}
          />
          <div className="fixed left-[50%] top-[50%] z-50 w-[95%] max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg p-6 md:p-8 shadow-2xl">
            {/* X Close Button */}
            <button
              onClick={() => {
                setShowRecentInquiryWarning(false);
                setPendingRecentInquirySelection(null);
                setPendingBulkSelection(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Warning Icon */}
            <div className="flex items-start gap-2 mb-6 -ml-1">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-xl font-semibold text-gray-900 mb-4">
                  Warning: Account Match Found
                </h3>

                {/* Main Content */}
                <div className="text-gray-700 mb-6 text-lg md:text-base">
                  <p className="mb-4">
                    <span className="hidden md:inline">The inquiry from &quot;{warningInquiryName}&quot; appears to match an open account on your credit report.</span>
                    <span className="md:hidden">This inquiry may match an open account.</span>
                  </p>

                  <p className="mb-4 font-medium">Disputing may:</p>

                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li className="hidden md:list-item">Potentially close your open account</li>
                    <li className="hidden md:list-item">Reduce your available credit</li>
                    <li className="hidden md:list-item">Negatively impact your credit score</li>
                    <li className="hidden md:list-item">Affect your credit utilization ratio</li>
                    <li className="md:hidden">Close your account</li>
                    <li className="md:hidden">Reduce available credit</li>
                    <li className="md:hidden">Impact your score</li>
                  </ul>

                  <p className="text-red-600 font-bold text-lg md:text-base">
                    <span className="hidden md:inline">Only dispute this inquiry if you&apos;re certain it was unauthorized or if you&apos;re willing to accept these risks.</span>
                    <span className="md:hidden">Only dispute if certain it was unauthorized.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRecentInquiryWarning(false);
                  setPendingRecentInquirySelection(null);
                  setPendingBulkSelection(null);
                }}
                className="flex-1 px-4 py-4 md:px-6 md:py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecentWarningProceed}
                className="flex-1 px-4 py-4 md:px-6 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Inquiries;
