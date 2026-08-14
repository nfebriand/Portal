const fs = require('fs');
let code = fs.readFileSync('src/components/PerformanceAgreementView.tsx', 'utf8');

const handleToggleKMBSupportCode = `
  const handleToggleKMBSupport = (agreementId: string, indicatorId: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, supportedByKMB: !o.supportedByKMB } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };
`;

code = code.replace(
  "  const handleSaveRename = (agreementId: string, indicatorId: string) => {",
  handleToggleKMBSupportCode + "\n  const handleSaveRename = (agreementId: string, indicatorId: string) => {"
);

fs.writeFileSync('src/components/PerformanceAgreementView.tsx', code);
