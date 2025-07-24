import React, { useEffect } from 'react';
import { RootNavigation } from './src/navigation/RootNavigation';
import { NavigationContainer } from '@react-navigation/native';
import { preloadAllDocuments } from './src/services/documentCacheManager';
import { checkAuthStatus } from './src/services/fetchData';

const App = () => {
  useEffect(() => {
    checkAuthStatus();
    preloadAllDocuments();
  }, []);
  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
