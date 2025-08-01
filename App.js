import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/navigation/RootNavigation';
import { configureGoogleSignIn } from './src/services/googleAuthService';
import { autoConfigureIP } from './src/configs/networkConfig';

const App = () => {
  useEffect(() => {
    autoConfigureIP();
    configureGoogleSignIn();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
