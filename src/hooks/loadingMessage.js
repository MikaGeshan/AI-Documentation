import { useState } from 'react';

export const useLoadingMessage = () => {
  const [stage, setStage] = useState(null);

  const startStage = stageName => {
    console.log('[LoadingStage] ->', stageName);
    setStage(stageName);
  };

  const resetStage = () => {
    setStage(null);
  };

  const getMessage = () => {
    switch (stage) {
      case 'fetching':
        return 'Fetching URLs .....';
      case 'parsing':
        return 'Parsing Document .....';
      case 'reading':
        return 'Reading File .....';
      default:
        return null;
    }
  };

  return {
    stage,
    startStage,
    resetStage,
    loadingMessage: getMessage(),
  };
};
