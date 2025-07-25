import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/Main/DocumentsScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import DocumentViewerScreen from '../screens/Main/DocumentViewerScreen';

import Header from '../components/Headers/Header';
import Icon from '../components/Icons/Icon';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import VerifyOTPScreen from '../screens/Auth/VerifyOTPScreen';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DocumentsHeader = () => (
  <Header
    title="Mobile Documentation Explorer"
    description="Browse and search through our documentations"
  />
);

const ChatHeader = () => (
  <Header
    title="Mobile Documentation Chatbot"
    description="Powered by DeepSeek"
  />
);

export const RootNavigation = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkInitialState = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        const token = await AsyncStorage.getItem('token');

        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }

        if (token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error during launch check:', error);
        setIsFirstLaunch(false);
        setIsLoggedIn(false);
      }
    };

    checkInitialState();
  }, []);

  if (isFirstLaunch === null || isLoggedIn === null) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {props => (
              <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Verify" component={VerifyOTPScreen} />
        </>
      ) : (
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
        </>
      )}
    </Stack.Navigator>
  );
};

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
    ref={navigationRef}
  >
    <Tab.Screen
      name="Documents"
      component={DocumentsScreen}
      options={{
        header: DocumentsHeader,
        tabBarIcon: DocumentsTabIcon,
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        header: ChatHeader,
        tabBarIcon: ChatTabIcon,
      }}
    />
  </Tab.Navigator>
);
