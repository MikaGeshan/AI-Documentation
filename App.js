import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/navigation/RootNavigation';
import { navigationRef } from './src/navigation/NavigationService';
import { configureGoogleSignIn } from './src/services/googleAuthService';

const App = () => {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
