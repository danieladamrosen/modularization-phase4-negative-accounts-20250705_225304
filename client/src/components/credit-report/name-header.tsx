interface NameHeaderProps {
  creditData: any;
}

export function NameHeader({ creditData }: NameHeaderProps) {
  const getFormattedName = () => {
    if (!creditData) return 'DONALD BLAIR';
    const firstName = creditData.CREDIT_RESPONSE.BORROWER['@_FirstName'];
    const lastName = creditData.CREDIT_RESPONSE.BORROWER['@_LastName'];
    return `${firstName} ${lastName}`;
  };

  const getFormattedSSN = () => {
    if (!creditData || 
        !creditData.CREDIT_RESPONSE.BORROWER['@_SSN'] || 
        creditData.CREDIT_RESPONSE.BORROWER['@_SSN'] === 'XXXXXXXXX') {
      return 'XXX-XX-XXXX';
    }
    const ssn = creditData.CREDIT_RESPONSE.BORROWER['@_SSN'];
    return `XXX-XX-${ssn.slice(-4)}`;
  };

  return (
    <div className="text-center mb-4 mt-6">
      <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-1 tracking-tight">
        {getFormattedName()}
      </h1>
      <p className="text-slate-600 text-base font-medium">
        SSN: {getFormattedSSN()}
      </p>
    </div>
  );
}