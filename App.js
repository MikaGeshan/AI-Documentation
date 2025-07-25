import React, { useEffect } from 'react';
import { RootNavigation } from './src/navigation/RootNavigation';
import { NavigationContainer } from '@react-navigation/native';
import { preloadAllDocuments } from './src/services/documentCacheManager';
import { checkAuthStatus } from './src/services/googleAuthService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '26723233307-snv7epos4ebv90nvqj6t2fd8r7046d4d.apps.googleusercontent.com',
      iosClientId:
        '26723233307-7706ktadqcg17diik9v3cvsrdnlrbn90.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    // checkAuthStatus();
    // preloadAllDocuments();
  }, []);
  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
};

export default App;
