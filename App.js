import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/navigation/RootNavigation';
import { configureGoogleSignIn } from './src/services/googleAuthService';
import { autoConfigureIP } from './src/configs/networkConfig';
import { initializeSocket } from './src/configs/socket';

const App = () => {
  useEffect(() => {
    async function setup() {
      const ip = await autoConfigureIP();
      const socket = initializeSocket(`http://${ip}:3000`);
    }

    setup();
    configureGoogleSignIn();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
