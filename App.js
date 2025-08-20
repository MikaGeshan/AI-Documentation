import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/App/RootNavigation';
import { configureGoogleSignIn } from './src/services/googleAuthService';
import { autoConfigureIP } from './src/configs/networkConfig';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';

const App = () => {
  useEffect(() => {
    configureGoogleSignIn();

    (async () => {
      const ip = await autoConfigureIP();
      if (ip) {
        console.log('Server IP configured globally:', ip);
      }
    })();
  }, []);

  return (
    <NavigationContainer>
      <AutocompleteDropdownContextProvider>
        <RootNavigation />
      </AutocompleteDropdownContextProvider>
    </NavigationContainer>
  );
};

export default App;
