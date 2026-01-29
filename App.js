import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/App/RootNavigation';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
// import { configureGoogleSignIn } from './src/App/Google';
import { autoConfigureIP } from './src/App/Network';

const App = () => {
  useEffect(() => {
    // configureGoogleSignIn();

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
