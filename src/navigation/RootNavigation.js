import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/Main/DocumentsScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import DocumentViewerScreen from '../screens/Main/DocumentViewerScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import VerifyOTPScreen from '../screens/Auth/VerifyOTPScreen';

import Header from '../components/Headers/Header';
import { Icon } from '../components/Icons/Icon';
import axios from 'axios';
import EditDocumentScreen from '../screens/Main/EditDocumentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DocumentsTabIcon = ({ color, size }) => (
  <Icon name="FileText" color={color} size={size} />
);

const ChatTabIcon = ({ color, size }) => (
  <Icon name="MessageCircle" color={color} size={size} />
);

const BottomTabNavigation = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#4aa8ea',
      tabBarInactiveTintColor: '#999',
    }}
  >
    <Tab.Screen
      name="Documents"
      component={DocumentsScreen}
      options={{
        header: () => (
          <Header
            title="Mobile Documentation Explorer"
            description="Browse and search through our documentations"
          />
        ),
        tabBarIcon: DocumentsTabIcon,
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        header: () => (
          <Header
            title="Mobile Documentation Chatbot"
            description="Powered by DeepSeek"
          />
        ),
        tabBarIcon: ChatTabIcon,
      }}
    />
  </Tab.Navigator>
);

export const RootNavigation = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    init();
  }, []);

  if (isFirstLaunch === null) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && !isAuthenticated && (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}

      {!isAuthenticated && (
        <>
          <Stack.Screen name="Login">
            {props => (
              <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />
            )}
          </Stack.Screen>

          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Verify" component={VerifyOTPScreen} />
        </>
      )}

      {isAuthenticated && (
        <>
          <Stack.Screen
            name="ScreenBottomTabs"
            component={BottomTabNavigation}
          />
          <Stack.Screen
            name="ViewDocument"
            component={DocumentViewerScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="EditDocument"
            component={EditDocumentScreen}
            options={{ headerShown: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
