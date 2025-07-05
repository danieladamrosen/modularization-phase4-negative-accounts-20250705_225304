import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SavedCollapsedCard } from '@/components/ui/saved-collapsed-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  User,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building,
  Mail,
  Users,
  Hash,
  Shield,
  Pencil,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { parseCreditReport } from '@/lib/credit-data';

interface PersonalInfoProps {
  borrower: {
    '@_FirstName': string;
    '@_LastName': string;
    '@_MiddleName'?: string;
    '@_BirthDate': string;
    '@_SSN': string;
    _RESIDENCE: Array<{
      '@_StreetAddress': string;
      '@_City': string;
      '@_State': string;
      '@_PostalCode': string;
      '@BorrowerResidencyType': string;
    }>;
  };
  reportInfo: {
    '@CreditResponseID': string;
    '@CreditReportFirstIssuedDate': string;
  };
  onDisputeSaved?: (data: {
    reason: string;
    instruction: string;
    selectedItems: { [key: string]: boolean };
  }) => void;
  onHeaderReset?: () => void;
  initialSelections?: { [key: string]: boolean };
  initialDisputeData?: { reason: string; instruction: string; selectedItems: string[] } | null;
  forceExpanded?: boolean;
}

export function PersonalInfo({
  borrower,
  reportInfo,
  onDisputeSaved,
  onHeaderReset,
  initialSelections = {},
  initialDisputeData = null,
  forceExpanded = false,
}: PersonalInfoProps) {
  // Initialize state from saved data or defaults
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>(() => 
    initialDisputeData ? 
      initialDisputeData.selectedItems.reduce((acc, item) => ({ ...acc, [item]: true }), {}) :
      initialSelections
  );
  const [selectedReason, setSelectedReason] = useState<string>(initialDisputeData?.reason || '');
  const [selectedInstruction, setSelectedInstruction] = useState<string>(initialDisputeData?.instruction || '');
  const [showCustomReason, setShowCustomReason] = useState<boolean>(false);
  const [showCustomInstruction, setShowCustomInstruction] = useState<boolean>(false);
  const [customReason, setCustomReason] = useState<string>('');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isDisputeSaved, setIsDisputeSaved] = useState<boolean>(!!initialDisputeData);
  const [selectionsModified, setSelectionsModified] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!!initialDisputeData);
  const [isTypingReason, setIsTypingReason] = useState<boolean>(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState<boolean>(false);
  const [showGuideArrow, setShowGuideArrow] = useState<boolean>(false);
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(false);
  const [isReasonAIGenerated, setIsReasonAIGenerated] = useState<boolean>(false);
  const [isInstructionAIGenerated, setIsInstructionAIGenerated] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // Fetch custom templates
  const { data: customReasons = [] } = useQuery({
    queryKey: ['/api/templates', 'reason', 'personal_info'],
    queryFn: () => fetch('/api/templates/reason/personal_info').then((res) => res.json()),
  });

  const { data: customInstructions = [] } = useQuery({
    queryKey: ['/api/templates', 'instruction', 'personal_info'],
    queryFn: () => fetch('/api/templates/instruction/personal_info').then((res) => res.json()),
  });

  // Mutation to save custom templates
  const saveTemplateMutation = useMutation({
    mutationFn: (data: { type: string; text: string; category: string }) =>
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  // Helper function to calculate bureau disputes for personal information
  const calculatePersonalInfoBureauDisputes = () => {
    const selectedItemsCount = Object.values(selectedItems).filter(Boolean).length;
    return selectedItemsCount; // Each selected personal info item = 1 dispute across all 3 bureaus for that item
  };

  // Check if form is complete and show guide arrow
  const checkFormCompletionAndShowArrow = (currentSelectedItems = selectedItems) => {
    const hasReason = customReason.trim() || selectedReason;
    const hasInstruction = customInstruction.trim() || selectedInstruction;
    const hasSelectedItems = Object.values(currentSelectedItems).some(Boolean);

    console.log('Arrow check - personal info:', {
      hasSelectedItems,
      hasReason: !!hasReason,
      hasInstruction: !!hasInstruction,
      customReason,
      customInstruction,
      selectedReason,
      selectedInstruction,
      isDisputeSaved,
      currentSelectedItems,
    });

    if (hasSelectedItems && hasReason && hasInstruction && !isDisputeSaved) {
      console.log('Showing personal info arrow!');
      setShowGuideArrow(true);
      setTimeout(() => {
        setShowGuideArrow(false);
        console.log('Arrow hidden for personal info');
      }, 4000);
    }
  };

  // Check arrow with explicit values (for when state hasn't updated yet)
  const checkFormCompletionAndShowArrowWithValues = (
    currentSelectedItems: { [key: string]: boolean },
    reasonText: string,
    instructionText: string
  ) => {
    const hasSelectedItems = Object.values(currentSelectedItems).some(Boolean);
    const hasReason = !!reasonText;
    const hasInstruction = !!instructionText;

    console.log('Arrow check with values - personal info:', {
      hasSelectedItems,
      hasReason,
      hasInstruction,
      reasonText,
      instructionText,
      isDisputeSaved,
      currentSelectedItems,
    });

    if (hasSelectedItems && hasReason && hasInstruction && !isDisputeSaved) {
      console.log('Showing personal info arrow!');
      setShowGuideArrow(true);
      setTimeout(() => {
        setShowGuideArrow(false);
        console.log('Arrow hidden for personal info');
      }, 4000);
    }
  };

  // Typing animation function - matches accounts section
  const typeText = async (
    text: string,
    setter: (value: string) => void,
    isTypingSetter: (value: boolean) => void,
    speed: number = 30
  ) => {
    console.log('typeText starting with text:', text.substring(0, 50) + '...');
    isTypingSetter(true);
    setter('');

    for (let i = 0; i <= text.length; i++) {
      setter(text.slice(0, i));
      await new Promise((resolve) => setTimeout(resolve, speed));
    }

    console.log('typeText completed, final text:', text.substring(0, 50) + '...');
    isTypingSetter(false);
  };

  const formatSSN = (ssn: string) => {
    if (!ssn || ssn.length < 4) return 'XXX-XX-1234';
    const lastFour = ssn.slice(-4);
    return `XXX-XX-${lastFour}`;
  };

  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatZipCode = (zipCode: string): string => {
    if (!zipCode) return '';
    if (zipCode.length === 9) {
      return `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`;
    }
    return zipCode;
  };

  const primaryResidence = borrower._RESIDENCE?.[0];

  // Build personal info items using authentic credit report data - only include specific fields
  // Updated: 2025-06-08 - Added Former, Also Known As, Previous Employer fields
  // Extract employment information from credit report data
  const getEmploymentInfo = () => {
    try {
      const creditData = parseCreditReport();
      if (!creditData?.CREDIT_RESPONSE?.CREDIT_FILE) {
        return { currentEmployer: 'Not Available', previousEmployer: 'Not Available' };
      }

      let currentEmployer = 'Not Available';
      let previousEmployer = 'Not Available';

      // Check in CREDIT_FILE array for _BORROWER with EMPLOYER data
      const creditFiles = Array.isArray(creditData.CREDIT_RESPONSE.CREDIT_FILE)
        ? creditData.CREDIT_RESPONSE.CREDIT_FILE
        : [creditData.CREDIT_RESPONSE.CREDIT_FILE];

      for (const file of creditFiles) {
        if (file?._BORROWER?.EMPLOYER) {
          const employers = Array.isArray(file._BORROWER.EMPLOYER)
            ? file._BORROWER.EMPLOYER
            : [file._BORROWER.EMPLOYER];

          employers.forEach((emp: any) => {
            if (emp && emp['@_Name']) {
              if (
                emp['@EmploymentCurrentIndicator'] === 'Y' &&
                currentEmployer === 'Not Available'
              ) {
                currentEmployer = emp['@_Name'];
              } else if (
                emp['@EmploymentCurrentIndicator'] === 'N' &&
                previousEmployer === 'Not Available'
              ) {
                previousEmployer = emp['@_Name'];
              }
            }
          });
        }
      }

      return { currentEmployer, previousEmployer };
    } catch (error) {
      console.log('Employment extraction error:', error);
      return { currentEmployer: 'Not Available', previousEmployer: 'Not Available' };
    }
  };

  const { currentEmployer, previousEmployer } = getEmploymentInfo();

  // Get middle name from credit report data
  const getMiddleName = () => {
    try {
      const creditData = parseCreditReport();

      // Check in CREDIT_FILE array for _BORROWER with middle name
      if (creditData?.CREDIT_RESPONSE?.CREDIT_FILE) {
        const creditFiles = Array.isArray(creditData.CREDIT_RESPONSE.CREDIT_FILE)
          ? creditData.CREDIT_RESPONSE.CREDIT_FILE
          : [creditData.CREDIT_RESPONSE.CREDIT_FILE];

        for (const file of creditFiles) {
          if (file?._BORROWER?.['@_MiddleName']) {
            return file._BORROWER['@_MiddleName'];
          }
        }
      }

      // Also check if the borrower prop has middle name
      if (borrower?.['@_MiddleName']) {
        return borrower['@_MiddleName'];
      }

      // Parse from UnparsedName in CREDIT_FILE
      if (creditData?.CREDIT_RESPONSE?.CREDIT_FILE) {
        const creditFiles = Array.isArray(creditData.CREDIT_RESPONSE.CREDIT_FILE)
          ? creditData.CREDIT_RESPONSE.CREDIT_FILE
          : [creditData.CREDIT_RESPONSE.CREDIT_FILE];

        for (const file of creditFiles) {
          if (file?._BORROWER?.['@_UnparsedName']) {
            const unparsedName = file._BORROWER['@_UnparsedName'];
            const nameParts = unparsedName.split(' ');
            if (nameParts.length === 3) {
              return nameParts[1]; // Middle name
            }
          }
        }
      }

      return '';
    } catch (error) {
      console.log('Middle name extraction error:', error);
      return '';
    }
  };

  const middleName = getMiddleName();
  const fullName = middleName
    ? `${borrower['@_FirstName']} ${middleName} ${borrower['@_LastName']}`
    : `${borrower['@_FirstName']} ${borrower['@_LastName']}`;

  // Extract additional personal information from credit data
  const getAdditionalPersonalInfo = () => {
    // For now, return placeholder values until we properly map the data structure
    return {
      phoneNumbers: 'Not Available',
      formerNames: 'Not Available',
    };
  };

  const { phoneNumbers, formerNames } = getAdditionalPersonalInfo();

  // Debug logging to verify data extraction
  console.log('Personal Info Debug:', {
    firstName: borrower['@_FirstName'],
    lastName: borrower['@_LastName'],
    middleName: middleName,
    fullName: fullName,
    currentEmployer: currentEmployer,
    previousEmployer: previousEmployer,
    phoneNumbers: phoneNumbers,
    formerNames: formerNames,
  });

  const allPersonalInfoItems = [
    {
      id: 'name',
      label: 'Name',
      value: fullName,
      icon: User,
      isBasic: true,
    },
    {
      id: 'birthdate',
      label: 'Date of Birth',
      value: formatBirthDate(borrower['@_BirthDate']),
      icon: Calendar,
      isBasic: true,
    },
    {
      id: 'ssn',
      label: 'Social Security Number',
      value: formatSSN(borrower['@_SSN']),
      icon: Shield,
      isBasic: true,
    },
    {
      id: 'address',
      label: 'Current Address',
      value: primaryResidence
        ? `${primaryResidence['@_StreetAddress']}, ${primaryResidence['@_City']}, ${primaryResidence['@_State']} ${formatZipCode(primaryResidence['@_PostalCode'])}`
        : 'Not Available',
      icon: MapPin,
      isBasic: true,
    },
    {
      id: 'phone-numbers',
      label: 'Phone Numbers',
      value: phoneNumbers,
      icon: Phone,
      isBasic: false,
    },
    {
      id: 'former-names',
      label: 'Former Names/Aliases',
      value: formerNames,
      icon: Users,
      isBasic: false,
    },
    {
      id: 'current-employer',
      label: 'Current Employer',
      value: currentEmployer,
      icon: Building,
      isBasic: false,
    },
    {
      id: 'previous-address',
      label: 'Previous Addresses',
      value: borrower._RESIDENCE?.[1]
        ? `${borrower._RESIDENCE[1]['@_StreetAddress']}, ${borrower._RESIDENCE[1]['@_City']}, ${borrower._RESIDENCE[1]['@_State']} ${formatZipCode(borrower._RESIDENCE[1]['@_PostalCode'])}`
        : 'Not Available',
      icon: MapPin,
      isBasic: false,
    },
    {
      id: 'previous-employer',
      label: 'Previous Employer(s)',
      value: previousEmployer,
      icon: Building,
      isBasic: false,
    },
  ];

  // Filter items based on expanded state
  const personalInfoItems = isExpanded
    ? allPersonalInfoItems
    : allPersonalInfoItems.filter((item) => item.isBasic);

  const hasSelectedItems = Object.values(selectedItems).some(Boolean);

  const disputeReasons = [
    'This name is not mine or spelled wrong',
    'My date of birth is incorrect',
    'This address is wrong or outdated',
    'I never lived at this address',
    'This personal information is incorrect',
    "This is someone else's information",
    'Information from identity theft',
    "This phone number isn't mine",
    'Wrong employment information',
    'Other (specify below)',
  ];

  const disputeInstructions = [
    'Remove this incorrect information from my credit report immediately',
    'Delete this information and update with my correct details',
    'Remove this fraudulent information from my credit report now',
    'Delete this old address from my credit report permanently',
    "Remove this information that doesn't belong to me",
    'Delete this unauthorized information from my credit file',
    'Remove this unverifiable information completely',
    'Correct the spelling and update my credit report',
    'Delete this outdated information from my file',
    'Other (specify below)',
  ];

  // Helper function to determine selection type for auto-typing
  const getSelectionType = (selectedItems: { [key: string]: boolean }) => {
    const selectedItemIds = Object.keys(selectedItems).filter(key => selectedItems[key]);
    
    const addressItems = selectedItemIds.filter(itemId => 
      itemId.includes('address') || 
      itemId.includes('previous-address') ||
      itemId.includes('current-address')
    );
    
    const nonAddressItems = selectedItemIds.filter(itemId => 
      !itemId.includes('address') && 
      !itemId.includes('previous-address') &&
      !itemId.includes('current-address')
    );
    
    // If both address and non-address items are selected, it's mixed
    if (addressItems.length > 0 && nonAddressItems.length > 0) {
      return 'mixed';
    }
    // If only address items are selected
    else if (addressItems.length > 0 && nonAddressItems.length === 0) {
      return 'address-only';
    }
    // If only non-address items are selected
    else {
      return 'non-address-only';
    }
  };

  // Helper function to get appropriate auto-typing text based on selection
  const getAutoTypingText = (selectedItems: { [key: string]: boolean }) => {
    const selectionType = getSelectionType(selectedItems);
    
    // Mixed selections or non-address items use general personal information text
    if (selectionType === 'mixed' || selectionType === 'non-address-only') {
      return {
        reasonText: 'This personal information is incorrect',
        instructionText: 'Remove this incorrect information from my credit report immediately'
      };
    }
    // Address-only selections use address-specific text
    else {
      return {
        reasonText: 'This address is wrong or outdated',
        instructionText: 'Remove this incorrect information from my credit report immediately'
      };
    }
  };

  const handleSaveAndContinue = () => {
    console.log('SAVE CLICKED - Checking typing state:', { isTypingReason, isTypingInstruction });

    // If typing is in progress, complete it immediately before saving
    if (isTypingReason || isTypingInstruction) {
      console.log('SAVE CLICKED - Typing in progress, completing immediately');

      // Complete any ongoing typing animations immediately
      if (isTypingReason) {
        setIsTypingReason(false);
        // Force the complete reason text regardless of current state
        setSelectedReason('This personal information is incorrect');
      }

      if (isTypingInstruction) {
        setIsTypingInstruction(false);
        // Force the complete instruction text regardless of current state
        setSelectedInstruction(
          'Please remove this incorrect information from my credit report immediately'
        );
      }

      // Wait a brief moment for state to update before proceeding
      setTimeout(() => {
        proceedWithSave();
      }, 50);
      return;
    }

    proceedWithSave();
  };

  const proceedWithSave = () => {
    // Force complete text values when auto-typing was used
    let finalReason = showCustomReason ? customReason.trim() : selectedReason.trim();
    let finalInstruction = showCustomInstruction
      ? customInstruction.trim()
      : selectedInstruction.trim();

    // If we have auto-selected items and default text patterns, ensure complete text
    const hasAutoSelectedItems = Object.keys(selectedItems).some((key) => selectedItems[key]);

    if (hasAutoSelectedItems) {
      // For personal info disputes, always use complete expected text
      if (!finalReason || finalReason === 'This personal information is incorrect') {
        finalReason = 'This personal information is incorrect';
      }
      if (!finalInstruction || finalInstruction.includes('Please remove this incorrect')) {
        finalInstruction =
          'Please remove this incorrect information from my credit report immediately';
      }
    }

    console.log('SAVE DEBUG - Final reason text:', finalReason);
    console.log('SAVE DEBUG - Final instruction text:', finalInstruction);
    console.log('SAVE DEBUG - Instruction length:', finalInstruction.length);

    if (!finalReason || !finalInstruction) {
      console.log('Cannot save: Missing reason or instruction');
      return; // Don't save if validation fails
    }

    // ✅ PHASE 1: Save Action + Visual Feedback
    console.log('PHASE 1: Setting dispute as saved and applying green visual feedback');
    setIsDisputeSaved(true);

    // Notify parent component that dispute was saved
    if (onDisputeSaved) {
      onDisputeSaved({
        reason: finalReason,
        instruction: finalInstruction,
        selectedItems: selectedItems,
      });
    }

    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    console.log(`Saved ${selectedCount} personal information disputes`);

    // ✅ PHASE 2: Auto Scroll and Collapse Choreography
    console.log('PHASE 2: Starting save choreography sequence');

    // Wait 500ms for visual feedback
    setTimeout(() => {
      console.log('500ms wait complete - Auto-scrolling to 20px above Personal Information card');
      
      // Auto-scroll to 20px above the Personal Information card
      const personalInfoSection = document.querySelector('[data-section="personal-info"]');
      if (personalInfoSection) {
        const rect = personalInfoSection.getBoundingClientRect();
        const targetScrollY = window.pageYOffset + rect.top - 20;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });

        // Wait another 500ms after scroll
        setTimeout(() => {
          console.log('500ms scroll pause complete - Collapsing section');
          
          // Collapse the section
          setIsExpanded(false);
          
          // Set the collapsed state after a delay
          setTimeout(() => {
            setIsCollapsed(true);
          }, 300);
          
          // Wait another 500ms after collapse
          setTimeout(() => {
            console.log('500ms collapse pause complete - Auto-scrolling to next section');
            
            // Auto-scroll to 20px above the next section (Hard Inquiries)
            const nextSection = document.querySelector('[data-section="inquiries"]');
            if (nextSection) {
              const rect = nextSection.getBoundingClientRect();
              const targetScrollY = window.pageYOffset + rect.top - 20;
              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            }
          }, 500);
        }, 500);
      } else {
        // Fallback if section not found
        setTimeout(() => {
          setIsExpanded(false);
          setTimeout(() => {
            const nextSection = document.querySelector('[data-section="inquiries"]');
            if (nextSection) {
              const rect = nextSection.getBoundingClientRect();
              const targetScrollY = window.pageYOffset + rect.top - 20;
              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            }
          }, 500);
        }, 500);
      }
    }, 500);
  };

  const autoSaveDispute = () => {
    // Set dispute as saved immediately for instant visual feedback
    setIsDisputeSaved(true);

    console.log('Auto-saving personal information dispute...');

    // Show green background for 300ms, then position for collapse viewing
    setTimeout(() => {
      // First, scroll to position where we want to watch the collapse
      const personalInfoSection = document.querySelector('[data-section="personal-info"]');
      if (personalInfoSection) {
        const rect = personalInfoSection.getBoundingClientRect();
        const targetScrollY = window.pageYOffset + rect.top - 20;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });

        // After scroll completes, handle collapse
        setTimeout(() => {
          // Collapse handled by parent
        }, 300); // Wait for scroll to complete
      } else {
        // Collapse handled by parent
      }
    }, 300); // Shorter green display before positioning
  };

  const toggleSelection = (itemId: string) => {
    const newSelectedItems = {
      ...selectedItems,
      [itemId]: !selectedItems[itemId],
    };
    setSelectedItems(newSelectedItems);

    // Reset save button when selections change
    setIsDisputeSaved(false);
    
    // Reset collapsed state when selections change
    setIsCollapsed(false);

    // Mark selections as modified if dispute was previously saved
    if (isDisputeSaved) {
      setSelectionsModified(true);
      // Reset the header to default state when selections change after being saved
      onHeaderReset?.();
    }

    // Check if user clicked on any previous address item and trigger AI typing effect
    const isPreviousAddress = itemId.includes('previous-address') || itemId.includes('address-');
    const wasJustSelected = !selectedItems[itemId] && newSelectedItems[itemId];
    const wasJustUnselected = selectedItems[itemId] && !newSelectedItems[itemId];
    const hasNoExistingText =
      !selectedReason && !selectedInstruction && !customReason && !customInstruction;

    // Check if we now have only PREVIOUS address items selected (not current addresses)
    const hasOnlyPreviousAddressItems =
      Object.keys(newSelectedItems).some(
        (key) => newSelectedItems[key] && key.includes('previous-address')
      ) &&
      !Object.keys(newSelectedItems).some(
        (key) => newSelectedItems[key] && !key.includes('previous-address')
      );

    // Check if selection type changed and we need to update auto-typed text
    const currentSelectionType = getSelectionType(selectedItems);
    const newSelectionType = getSelectionType(newSelectedItems);
    const selectionTypeChanged = currentSelectionType !== newSelectionType;
    const hasExistingAIContent = isAIGenerated && selectedReason && selectedInstruction;
    
    // If selection type changed and we have existing AI content, retrigger auto-typing
    if (selectionTypeChanged && hasExistingAIContent && Object.values(newSelectedItems).some(Boolean)) {
      console.log(`Selection type changed from ${currentSelectionType} to ${newSelectionType}, retriggering auto-typing`);
      
      // Clear existing content
      setSelectedReason('');
      setSelectedInstruction('');
      setShowCustomReason(false);
      setShowCustomInstruction(false);
      setCustomReason('');
      setCustomInstruction('');
      setIsAIGenerated(true);
      setIsReasonAIGenerated(true);
      setIsInstructionAIGenerated(true);
      
      // Start auto-typing with new appropriate text
      setTimeout(async () => {
        const { reasonText, instructionText } = getAutoTypingText(newSelectedItems);
        
        await typeText(
          reasonText,
          (text) => {
            setSelectedReason(text);
          },
          setIsTypingReason
        );
        
        await typeText(
          instructionText,
          (text) => {
            setSelectedInstruction(text);
          },
          setIsTypingInstruction
        );
        
        setTimeout(() => {
          checkFormCompletionAndShowArrowWithValues(
            newSelectedItems,
            reasonText,
            instructionText
          );
        }, 200);
      }, 200);
    }

    // If user clicks on non-address item after auto-type was activated, reset to defaults
    if (!isPreviousAddress && wasJustSelected && isAIGenerated) {
      console.log('Resetting AI-generated content due to non-address selection');
      setSelectedReason('');
      setSelectedInstruction('');
      setCustomReason('');
      setCustomInstruction('');
      setIsAIGenerated(false);
      setShowCustomReason(false);
      setShowCustomInstruction(false);
      // Ensure button stays in unsaved state after reset
      setIsDisputeSaved(false);
    }
    // Trigger AI typing for previous address items only if ONLY previous addresses are selected
    else if (isPreviousAddress && wasJustSelected) {
      // Check if we have only previous address items and no other items
      const hasOnlyPreviousAddresses =
        Object.keys(newSelectedItems).some(
          (key) => newSelectedItems[key] && key.includes('previous-address')
        ) &&
        !Object.keys(newSelectedItems).some(
          (key) => newSelectedItems[key] && !key.includes('previous-address')
        );

      // Check if AI content already exists (to avoid re-typing)
      const hasExistingAIContent = isAIGenerated && selectedReason && selectedInstruction;

      // Auto-populate if only previous addresses selected and no existing AI content
      if (hasOnlyPreviousAddresses && !hasExistingAIContent) {
        console.log('Auto-populating dispute fields...');

        // Clear any existing selections
        setSelectedReason('');
        setSelectedInstruction('');
        setShowCustomReason(false);
        setShowCustomInstruction(false);
        setCustomReason('');
        setCustomInstruction('');
        setIsAIGenerated(true);
        setIsReasonAIGenerated(true);
        setIsInstructionAIGenerated(true);

        // Keep dropdown view and just update the selected values with typing effect
        setTimeout(async () => {
          const { reasonText, instructionText } = getAutoTypingText(newSelectedItems);

          await typeText(
            reasonText,
            (text) => {
              setSelectedReason(text);
            },
            setIsTypingReason
          );
          // Start instruction typing after reason is complete
          await typeText(
            instructionText,
            (text) => {
              setSelectedInstruction(text);
            },
            setIsTypingInstruction
          );

          // Wait a bit more for state to update before showing arrow
          setTimeout(() => {
            console.log('About to call arrow function with items:', newSelectedItems);
            checkFormCompletionAndShowArrowWithValues(
              newSelectedItems,
              reasonText,
              instructionText
            );

            // Don't auto-save - let user click save button manually
            console.log('AI typing completed - ready for user to save...');

            // Ready for user to manually save the dispute
          }, 200);
        }, 200);

        console.log('Started typewriter effects');
      } else if (hasOnlyPreviousAddresses && hasExistingAIContent) {
        // If AI content already exists and only previous addresses selected, just show the arrow
        console.log('AI content already exists, showing arrow only');
        checkFormCompletionAndShowArrowWithValues(
          newSelectedItems,
          selectedReason,
          selectedInstruction
        );
      } else {
        console.log('Mixed selections detected - using general personal information text');
        // For mixed selections, use general personal information text
        if (hasNoExistingText) {
          setSelectedReason('');
          setSelectedInstruction('');
          setShowCustomReason(false);
          setShowCustomInstruction(false);
          setCustomReason('');
          setCustomInstruction('');
          setIsAIGenerated(true);
          setIsReasonAIGenerated(true);
          setIsInstructionAIGenerated(true);

          setTimeout(async () => {
            const reasonText = 'This personal information is incorrect';
            const instructionText = 'Remove this incorrect information from my credit report immediately';

            await typeText(
              reasonText,
              (text) => {
                setSelectedReason(text);
              },
              setIsTypingReason
            );
            await typeText(
              instructionText,
              (text) => {
                setSelectedInstruction(text);
              },
              setIsTypingInstruction
            );

            setTimeout(() => {
              checkFormCompletionAndShowArrowWithValues(
                newSelectedItems,
                reasonText,
                instructionText
              );
            }, 200);
          }, 200);
        }
      }
    }
    // Trigger AI typing for non-address items when selected individually
    else if (!isPreviousAddress && wasJustSelected && hasNoExistingText) {
      console.log('Auto-populating non-address personal information...');
      
      // Clear any existing selections
      setSelectedReason('');
      setSelectedInstruction('');
      setShowCustomReason(false);
      setShowCustomInstruction(false);
      setCustomReason('');
      setCustomInstruction('');
      setIsAIGenerated(true);
      setIsReasonAIGenerated(true);
      setIsInstructionAIGenerated(true);

      // Auto-populate with appropriate text for non-address items
      setTimeout(async () => {
        const { reasonText, instructionText } = getAutoTypingText(newSelectedItems);

        await typeText(
          reasonText,
          (text) => {
            setSelectedReason(text);
          },
          setIsTypingReason
        );
        // Start instruction typing after reason is complete
        await typeText(
          instructionText,
          (text) => {
            setSelectedInstruction(text);
          },
          setIsTypingInstruction
        );

        // Show arrow after typing completes
        setTimeout(() => {
          console.log('About to show arrow after non-address auto-typing');
          checkFormCompletionAndShowArrowWithValues(
            newSelectedItems,
            reasonText,
            instructionText
          );
        }, 200);
      }, 200);
    }
    // If user unselected a non-address item and now only has PREVIOUS address items, re-trigger AI typing
    else if (
      !isPreviousAddress &&
      wasJustUnselected &&
      hasOnlyPreviousAddressItems &&
      !isAIGenerated
    ) {
      console.log('Re-triggering AI typing after unselecting non-address items');

      // Clear any existing selections
      setSelectedReason('');
      setSelectedInstruction('');
      setShowCustomReason(false);
      setShowCustomInstruction(false);
      setCustomReason('');
      setCustomInstruction('');
      setIsAIGenerated(true);

      // Re-trigger AI typing effect
      setTimeout(async () => {
        const { reasonText, instructionText } = getAutoTypingText(newSelectedItems);
        
        await typeText(
          reasonText,
          (text) => {
            setSelectedReason(text);
          },
          setIsTypingReason
        );
        await typeText(
          instructionText,
          (text) => {
            setSelectedInstruction(text);
          },
          setIsTypingInstruction
        );

        console.log('About to call arrow function after re-triggering AI:', newSelectedItems);
        checkFormCompletionAndShowArrowWithValues(
          newSelectedItems,
          reasonText,
          instructionText
        );

        // Ready for user to manually save
      }, 200);

      console.log('Started re-triggered typewriter effects');
    }
  };

  // Check if we should show the collapsed state
  if (isCollapsed && isDisputeSaved) {
    return (
      <div data-section="personal-info" className="mb-4 mt-2">
        <SavedCollapsedCard
          sectionName="Personal Information"
          successMessage="Personal Information – Disputes Saved"
          summaryText="You've saved disputes for personal information items across TransUnion, Equifax, and Experian."
          onExpand={() => {
            setIsCollapsed(false);
            setIsExpanded(true);
          }}
        />
      </div>
    );
  }

  return (
    <div data-section="personal-info" className="mb-4 mt-2">
      <Card
        className={`${
          isDisputeSaved 
            ? 'bg-green-50 border border-green-500' 
            : isExpanded 
              ? 'border-2 border-gray-300' 
              : 'border border-gray-200'
        } transition-all duration-300 hover:shadow-lg`}
      >
        <CardHeader
          className={`cursor-pointer ${
            isDisputeSaved 
              ? 'bg-green-50 hover:bg-green-100' 
              : 'hover:bg-gray-50'
          } transition-colors duration-200`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                isDisputeSaved ? 'bg-green-600' : 'bg-purple-600'
              }`}>
                {isDisputeSaved ? '✓' : 'PI'}
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDisputeSaved ? 'text-green-700' : 'text-gray-900'}`}>
                  {isDisputeSaved ? 'Personal Information – Disputes Saved' : 'Personal Information'}
                </h3>
                <p className={`text-sm ${isDisputeSaved ? 'text-green-700' : 'text-gray-600'}`}>
                  {isDisputeSaved 
                    ? "You've saved disputes for personal information items across TransUnion, Equifax, and Experian." 
                    : "Removing old personal info tied to bad accounts helps for deleting them."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm ${isDisputeSaved ? 'text-green-600' : 'text-gray-600'}`}>3 Bureaus</span>
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-6 relative">
          {/* Header with controlled clickable area */}




          {/* Container wrapper for bureau grid */}
          <div className={`${
            isDisputeSaved 
              ? 'bg-green-50 border-2 border-green-600' 
              : hasSelectedItems && !isDisputeSaved 
                ? 'bg-rose-50 border border-rose-200' 
                : 'bg-white border border-gray-300'
          } rounded-lg p-6`}>
            <div className="flex items-center justify-between pt-2 pb-5 w-full">
              <div className="flex items-center gap-2">
                {isDisputeSaved ? (
                  <span className="text-green-600 text-2xl font-bold leading-none">
                    ✓
                  </span>
                ) : (
                  <div className="circle-badge circle-badge-blue">
                    1
                  </div>
                )}
                <h3 className={`text-lg font-semibold ${
                  isDisputeSaved 
                    ? 'text-green-700' 
                    : ''
                }`}>
                  {isDisputeSaved 
                    ? "Personal Information Disputes Saved" 
                    : "Choose personal information to dispute"
                  }
                  {!isDisputeSaved && (
                    <span className="text-gray-500 font-normal ml-1">(optional)</span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => {
                  // Find all previous address items across all bureaus
                  const newSelections = { ...selectedItems };
                  const bureaus = ['transunion', 'equifax', 'experian'];
                  
                  // Find the previous address item in the data
                  const previousAddressItem = allPersonalInfoItems.find(
                    (item) => item.id === 'previous-address'
                  );
                  
                  if (previousAddressItem) {
                    // Select previous address for all three bureaus
                    bureaus.forEach(bureau => {
                      const itemId = `${bureau}-previous-address`;
                      newSelections[itemId] = true;
                    });
                    
                    // Update state
                    setSelectedItems(newSelections);
                    setSelectionsModified(true);
                    
                    // Trigger auto-typing if no existing AI content
                    const hasExistingAIContent = isAIGenerated && selectedReason && selectedInstruction;
                    if (!hasExistingAIContent) {
                      // Clear any existing content
                      setSelectedReason('');
                      setSelectedInstruction('');
                      setShowCustomReason(false);
                      setShowCustomInstruction(false);
                      setCustomReason('');
                      setCustomInstruction('');
                      setIsAIGenerated(true);
                      setIsReasonAIGenerated(true);
                      setIsInstructionAIGenerated(true);
                      
                      // Start auto-typing with address-specific text
                      setTimeout(async () => {
                        const { reasonText, instructionText } = getAutoTypingText(newSelections);
                        
                        await typeText(
                          reasonText,
                          (text) => {
                            setSelectedReason(text);
                          },
                          setIsTypingReason
                        );
                        
                        await typeText(
                          instructionText,
                          (text) => {
                            setSelectedInstruction(text);
                          },
                          setIsTypingInstruction
                        );
                        
                        // Show arrow after typing completes
                        setTimeout(() => {
                          checkFormCompletionAndShowArrowWithValues(
                            newSelections,
                            reasonText,
                            instructionText
                          );
                        }, 200);
                      }, 200);
                    }
                    
                    // Auto-scroll to Former Names/Aliases box after selection
                    setTimeout(() => {
                      const formerNamesElement = document.querySelector('[data-field="former-names"]');
                      if (formerNamesElement) {
                        const rect = formerNamesElement.getBoundingClientRect();
                        const targetScrollY = window.pageYOffset + rect.top - 20;
                        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                      }
                    }, 100);
                  }
                }}
                className="ml-auto px-4 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition shadow-sm"
              >
                Select All Previous Addresses
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-0" data-section="personal-info">
            {/* TransUnion Column */}
            <div>
              <div className="flex-between gap-2 mb-4">
                <h3 className="font-bold text-cyan-700">TransUnion</h3>
                {/* Mobile Show More toggle - matching bottom section style */}
                <button
                  onClick={() => {
                    // First expand the section if not already expanded
                    if (!isExpanded) {
                      setIsExpanded(true);
                    }
                    const newExpanded = !isExpanded;
                    setIsExpanded(newExpanded);

                    // When collapsing (Show Less), scroll back to section start for both mobile and desktop
                    if (!newExpanded) {
                      setTimeout(() => {
                        const personalInfoSection = document.querySelector(
                          '[data-section="personal-info"]'
                        );
                        if (personalInfoSection) {
                          const rect = personalInfoSection.getBoundingClientRect();
                          const offsetTop = window.pageYOffset + rect.top - 20;
                          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                        }
                      }, 100);
                    }
                  }}
                  className="md:hidden flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
                >
                  <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {personalInfoItems.map((item) => {
                  const IconComponent = item.icon;
                  const itemId = `transunion-${item.id}`;
                  const isSelected = selectedItems[itemId];

                  return (
                    <div
                      key={itemId}
                      data-field={
                        item.id === 'previous-address'
                          ? 'previous-address'
                          : item.id === 'former-names'
                            ? 'former-names'
                            : undefined
                      }
                      className={`${
                        isDisputeSaved && isSelected
                          ? 'border-3 border-green-500'
                          : isSelected
                            ? 'border-3 border-red-500'
                            : 'border border-gray-200 hover:border-gray-300'
                      } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                      onClick={() => toggleSelection(itemId)}
                    >
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(itemId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <IconComponent className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700">{item.label}</span>
                          </div>
                          <span className="text-sm text-gray-900 truncate">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equifax Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-red-700">Equifax</h3>
              </div>

              <div className="space-y-3">
                {personalInfoItems.map((item) => {
                  const IconComponent = item.icon;
                  const itemId = `equifax-${item.id}`;
                  const isSelected = selectedItems[itemId];

                  return (
                    <div
                      key={itemId}
                      className={`${
                        isDisputeSaved && isSelected
                          ? 'border-3 border-green-500'
                          : isSelected
                            ? 'border-3 border-red-500'
                            : 'border border-gray-200 hover:border-gray-300'
                      } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                      onClick={() => toggleSelection(itemId)}
                    >
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(itemId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <IconComponent className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700">{item.label}</span>
                          </div>
                          <span className="text-sm text-gray-900 truncate">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Experian Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-blue-800">Experian</h3>
              </div>

              <div className="space-y-3">
                {personalInfoItems.map((item) => {
                  const IconComponent = item.icon;
                  const itemId = `experian-${item.id}`;
                  const isSelected = selectedItems[itemId];

                  return (
                    <div
                      key={itemId}
                      className={`${
                        isDisputeSaved && isSelected
                          ? 'border-3 border-green-500'
                          : isSelected
                            ? 'border-3 border-red-500'
                            : 'border border-gray-200 hover:border-gray-300'
                      } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                      onClick={() => toggleSelection(itemId)}
                    >
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(itemId);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <IconComponent className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700">{item.label}</span>
                          </div>
                          <span className="text-sm text-gray-900 truncate">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>



          {hasSelectedItems && (
            <div
              className={`pt-4 mt-2 ${hasSelectedItems ? 'md:border-t' : 'border-t'} border-gray-200`}
            >
              <div className="flex items-start gap-2 mb-4">
                <div
                  className={`transition-colors duration-300 ${
                    isDisputeSaved ? 'circle-badge-green' : 'circle-badge-blue'
                  }`}
                >
                  {isDisputeSaved ? "✓" : "2"}
                </div>
                <h4 className={`font-semibold ${isDisputeSaved ? 'text-green-600' : 'text-gray-900'}`}>
                  {isDisputeSaved ? (() => {
                    // Count selected items to determine singular/plural
                    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
                    return selectedCount === 1 ? 'Dispute Saved' : 'Disputes Saved';
                  })() : 'Create Dispute'}
                </h4>
              </div>

              <div className="space-y-4">
                {/* Reason Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Dispute Reason</label>
                    {showCustomReason && (customReason || selectedReason) && !isAIGenerated && (
                      <button
                        onClick={() => {
                          // First expand the section if not already expanded
                          if (!isExpanded) {
                            setIsExpanded(true);
                          }
                          setSelectedReason('');
                          setCustomReason('');
                          setShowCustomReason(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear & Start Over
                      </button>
                    )}
                  </div>
                  {!showCustomReason ? (
                    <>
                      {isTypingReason ? (
                        <div className="relative">
                          <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                            <span>AI typing</span>
                          </div>
                          <div className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 min-h-[42px] flex items-center">
                            {selectedReason || 'AI is typing...'}
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={selectedReason}
                          onValueChange={(value) => {
                            if (value === '__custom__') {
                              setShowCustomReason(true);
                              setSelectedReason('');
                            } else {
                              setShowCustomReason(false);
                              setSelectedReason(value);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-full ${
                              isDisputeSaved && Object.values(selectedItems).some(Boolean)
                                ? 'border-green-500'
                                : Object.values(selectedItems).some(Boolean)
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                            }`}
                          >
                            <SelectValue placeholder="Select a dispute reason..." />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeReasons.map((reason, index) => (
                              <SelectItem key={index} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                            {customReasons.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-t">
                                  Your Saved Reasons
                                </div>
                                {customReasons.map((template: any) => (
                                  <SelectItem key={template.id} value={template.text}>
                                    <div className="flex items-center gap-2">
                                      <Save className="w-3 h-3 text-green-600" />
                                      {template.text.length > 50
                                        ? `${template.text.substring(0, 50)}...`
                                        : template.text}
                                    </div>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            <SelectItem value="__custom__">
                              <div className="flex items-center gap-2">
                                <Pencil className="w-3 h-3 text-yellow-600" />
                                Write custom reason...
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={customReason}
                        onChange={(e) => {
                          setCustomReason(e.target.value);
                          setSelectedReason(e.target.value);
                          setIsAIGenerated(false); // Reset flag when user types manually
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        placeholder="Type your custom dispute reason here..."
                        className={`w-full p-3 border rounded-md h-20 resize-none mobile-resizable focus:outline-none ${
                          isDisputeSaved && Object.values(selectedItems).some(Boolean)
                            ? 'border-green-500 focus:border-green-500'
                            : Object.values(selectedItems).some(Boolean)
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:border-gray-400'
                        }`}
                        rows={3}
                      />
                      {false && customReason.trim() && !isTypingReason && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              // First expand the section if not already expanded
                              if (!isExpanded) {
                                setIsExpanded(true);
                              }
                              saveTemplateMutation.mutate({
                                type: 'reason',
                                text: customReason.trim(),
                                category: 'personal_info',
                              });
                            }}
                            disabled={saveTemplateMutation.isPending}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            {saveTemplateMutation.isPending ? 'Saving...' : 'Save for future use'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Instruction Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Dispute Instructions
                    </label>
                    {showCustomInstruction &&
                      (customInstruction || selectedInstruction) &&
                      !isAIGenerated && (
                        <button
                          onClick={() => {
                            // First expand the section if not already expanded
                            if (!isExpanded) {
                              setIsExpanded(true);
                            }
                            setSelectedInstruction('');
                            setCustomInstruction('');
                            setShowCustomInstruction(false);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Clear & Start Over
                        </button>
                      )}
                  </div>
                  {!showCustomInstruction ? (
                    <>
                      {isTypingInstruction ? (
                        <div className="relative">
                          <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                            <span>AI typing</span>
                          </div>
                          <div className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900 min-h-[42px] flex items-center">
                            {selectedInstruction || 'AI is typing...'}
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={selectedInstruction}
                          onValueChange={(value) => {
                            if (value === '__custom__') {
                              setShowCustomInstruction(true);
                              setSelectedInstruction('');
                            } else {
                              setShowCustomInstruction(false);
                              setSelectedInstruction(value);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-full ${
                              isDisputeSaved && Object.values(selectedItems).some(Boolean)
                                ? 'border-green-500'
                                : Object.values(selectedItems).some(Boolean)
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                            }`}
                          >
                            <SelectValue placeholder="Select dispute instructions..." />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeInstructions.map((instruction, index) => (
                              <SelectItem key={index} value={instruction}>
                                {instruction}
                              </SelectItem>
                            ))}
                            {customInstructions.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-t">
                                  Your Saved Instructions
                                </div>
                                {customInstructions.map((template: any) => (
                                  <SelectItem key={template.id} value={template.text}>
                                    <div className="flex items-center gap-2">
                                      <Save className="w-3 h-3 text-green-600" />
                                      {template.text.length > 50
                                        ? `${template.text.substring(0, 50)}...`
                                        : template.text}
                                    </div>
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            <SelectItem value="__custom__">
                              <div className="flex items-center gap-2">
                                <Pencil className="w-3 h-3 text-yellow-600" />
                                Write custom instructions...
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={customInstruction}
                        onChange={(e) => {
                          setCustomInstruction(e.target.value);
                          setSelectedInstruction(e.target.value);
                          setIsAIGenerated(false); // Reset flag when user types manually
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        placeholder="Type your custom dispute instructions here..."
                        className={`w-full p-3 border rounded-md h-20 resize-none mobile-resizable focus:outline-none ${
                          isDisputeSaved && Object.values(selectedItems).some(Boolean)
                            ? 'border-green-500 focus:border-green-500'
                            : Object.values(selectedItems).some(Boolean)
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:border-gray-400'
                        }`}
                        rows={3}
                      />
                      {false && customInstruction.trim() && !isTypingInstruction && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              // First expand the section if not already expanded
                              if (!isExpanded) {
                                setIsExpanded(true);
                              }
                              saveTemplateMutation.mutate({
                                type: 'instruction',
                                text: customInstruction.trim(),
                                category: 'personal_info',
                              });
                            }}
                            disabled={saveTemplateMutation.isPending}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            {saveTemplateMutation.isPending ? 'Saving...' : 'Save for future use'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save Button Section */}
                <div className="flex gap-2 justify-between items-center">
                  {hasSelectedItems && !isDisputeSaved && !showGuideArrow ? (
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
                    {showGuideArrow && (
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
                    <span
                      className={`mr-1 transition-colors duration-300 ${
                        isDisputeSaved ? 'circle-badge-green' : 'circle-badge-blue'
                      }`}
                    >
                      3
                    </span>
                    <Button
                      onClick={() => {
                        // First expand the section if not already expanded
                        if (!isExpanded) {
                          setIsExpanded(true);
                        }

                        // If already saved, trigger same choreography as first save
                        if (isDisputeSaved) {
                          console.log(
                            'GREEN SAVE BUTTON CLICKED - Triggering collapse choreography again'
                          );
                          
                          // Trigger the same choreography as the initial save
                          setTimeout(() => {
                            // Scroll to 20px above Former Names/Aliases box
                            const formerNamesElement = document.querySelector('[data-field="former-names"]');
                            if (formerNamesElement) {
                              const rect = formerNamesElement.getBoundingClientRect();
                              const targetScrollY = window.pageYOffset + rect.top - 20;
                              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                              
                              // Wait for scroll (300ms) then pause (500ms)
                              setTimeout(() => {
                                setTimeout(() => {
                                  // Collapse the section
                                  setIsExpanded(false);
                                  
                                  // Wait after collapse (1000ms) then scroll to next section
                                  setTimeout(() => {
                                    // Scroll to Hard Inquiries section
                                    const hardInquiriesSection = document.querySelector('[data-section="inquiries"]');
                                    if (hardInquiriesSection) {
                                      const rect = hardInquiriesSection.getBoundingClientRect();
                                      const targetScrollY = window.pageYOffset + rect.top - 20;
                                      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
                                    }
                                  }, 1000);
                                }, 500);
                              }, 300);
                            }
                          }, 50);
                          return;
                        }

                        handleSaveAndContinue();
                      }}
                      disabled={
                        !Object.values(selectedItems).some(Boolean) ||
                        !(showCustomReason ? customReason.trim() : selectedReason) ||
                        !(showCustomInstruction ? customInstruction.trim() : selectedInstruction)
                      }
                      className={`${
                        isDisputeSaved
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white px-4 py-2 rounded-md disabled:bg-gray-400 transition-colors duration-200 w-[190px] h-10 flex items-center justify-center`}
                    >
                      {isDisputeSaved ? (
                        <>
                          <span className="text-white mr-2">✓</span>
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
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
}
