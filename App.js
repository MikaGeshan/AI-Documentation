import React, { useEffect } from 'react';
import { RootNavigation } from './src/navigation/RootNavigation';
import { NavigationContainer } from '@react-navigation/native';
import { configureGoogleSignIn } from './src/services/googleAuthService';

const App = () => {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);
  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
