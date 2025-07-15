import React, { useEffect } from 'react';
import { RootNavigation } from './src/navigation/RootNavigation';
import { NavigationContainer } from '@react-navigation/native';
import { preloadAllDocuments } from './src/services/documentCacheManager';
import { preloadAllFolders } from './src/services/documentFolderCacheManager';

const App = () => {
  useEffect(() => {
    const preloadData = async () => {
      await preloadAllFolders();
      await preloadAllDocuments();
    };
    preloadData();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
