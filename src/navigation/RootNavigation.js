import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/Main/DocumentsScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import DocumentViewerScreen from '../screens/Main/DocumentViewerScreen';

import Header from '../components/Header';
import Icon from '../components/Icon';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

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

  useEffect(() => {
    const firstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    firstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ScreenBottomTabs" component={BottomTabNavigation} />
      <Stack.Screen
        name="ViewDocument"
        component={DocumentViewerScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
};

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
        header: DocumentsHeader,
        tabBarIcon: ({ color, size }) => (
          <Icon name="FileText" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        header: ChatHeader,
        tabBarIcon: ({ color, size }) => (
          <Icon name="MessageCircle" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);
