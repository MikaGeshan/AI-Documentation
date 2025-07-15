import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import Header from '../components/Header';
import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export const RootNavigation = () => {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScreenBottomTabs"
        component={BottomTabNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ header: Header }}
      />
    </Stack.Navigator>
  );
};

export const BottomTabNavigation = () => {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ header: Header }}
      />
    </Tab.Navigator>
  );
};
