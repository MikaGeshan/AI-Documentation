import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/navigation/RootNavigation';
import { configureGoogleSignIn } from './src/services/googleAuthService';
import { autoConfigureIP } from './src/configs/networkConfig';
import { initializeSocket } from './src/configs/socket';

const App = () => {
  useEffect(() => {
    const setup = async () => {
      try {
        await configureGoogleSignIn();
        const ip = await autoConfigureIP();

        initializeSocket(`http://${ip}:3000`);
      } catch (error) {
        console.error('Setup failed:', error);
      }
    };

    setup();
  }, []);

  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
