import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigation } from './src/App/RootNavigation';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
// import { configureGoogleSignIn } from './src/App/Google';
import { autoConfigureIP } from './src/App/Network';

const App = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // configureGoogleSignIn();

    (async () => {
      const ip = await autoConfigureIP();
      if (ip) {
        console.log('Server IP configured globally:', ip);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return null; // Keep screen blank or show splash while resolving server IP
  }

  return (
    <NavigationContainer>
      <AutocompleteDropdownContextProvider>
        <RootNavigation />
      </AutocompleteDropdownContextProvider>
    </NavigationContainer>
  );
};

export default App;
