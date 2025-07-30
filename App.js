import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/navigation/RootNavigation';
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
