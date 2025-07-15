import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import Header from '../components/Header';
import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '../components/Icon';

const Stack = createNativeStackNavigator();

export const RootNavigation = () => {
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
    </Stack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const DocumentsHeader = () => {
  return (
    <Header
      title="Mobile Documentation Explorer"
      description="Browse and search through our documentations"
    />
  );
};

const ChatHeader = () => {
  return (
    <Header
      title="Mobile Documentation Chatbot"
      description="Powered by DeepSeek"
    />
  );
};

export const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4B0082',
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
};
