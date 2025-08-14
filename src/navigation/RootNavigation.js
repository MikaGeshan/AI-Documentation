import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WelcomeScreen from '../screens/WelcomeScreen';
import DocumentsScreen from '../screens/Main/DocumentsScreen';
import ChatScreen from '../screens/Main/ChatScreen';

import Header from '../components/Headers/Header';
import { Icon } from '../components/Icons/Icon';
import ViewDocumentScreen from '../screens/Main/ViewDocumentScreen';
import useAuthStore from '../hooks/auth/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import CallerScreen from '../screens/Call/CallerScreen';
import ReceiverScreen from '../screens/Call/ReceiverScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import CreateExploreScreen from '../screens/Explore/CreateExploreScreen';
import ViewExploreScreen from '../screens/Explore/ViewExploreScreen';
import EditExploreScreen from '../screens/Explore/EditExploreScreen';
import ViewExploreListScreen from '../screens/Explore/ViewExploreListScreen';
import SignInContainer from '../screens/Authentication/Containers/SignInContainer';
import RegisterContainer from '../screens/Authentication/Containers/RegisterContainer';
import VerifyOTPContainer from '../screens/Authentication/Containers/VerifyOTPContainer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DocumentsTabIcon = ({ color, size }) => (
  <Icon name="FileText" color={color} size={size} />
);

const ChatTabIcon = ({ color, size }) => (
  <Icon name="MessageCircle" color={color} size={size} />
);

const ExploreTabIcon = ({ color, size }) => (
  <Icon name="Compass" color={color} size={size} />
);

const BottomTabNavigation = () => {
  const { isAdmin } = useAuthStore.getState();
  const logout = useAuthStore(state => state.logout);
  const navigation = useNavigation();

  return (
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
              onSettingsPress={() => {
                if (isAdmin) {
                  console.log(isAdmin);
                  navigation.navigate('Receiver');
                } else {
                  navigation.navigate('Caller');
                }
              }}
              onLogoutPress={logout}
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
              onSettingsPress={() => {
                if (isAdmin) {
                  navigation.navigate('Receiver');
                } else {
                  navigation.navigate('Caller');
                }
              }}
              onLogoutPress={logout}
            />
          ),
          tabBarIcon: ChatTabIcon,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          header: () => (
            <Header
              title="Mobile Documentation Explorer"
              description="Fel Free to Explore the Available Documentation"
              onSettingsPress={() => {
                if (isAdmin) {
                  navigation.navigate('Receiver');
                } else {
                  navigation.navigate('Caller');
                }
              }}
              onLogoutPress={logout}
            />
          ),
          tabBarIcon: ExploreTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigation = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const { isAuthenticated, hydrateFromStorage, hydrated } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        await AsyncStorage.setItem('hasLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }

      await hydrateFromStorage();
    };

    init();
  }, [hydrateFromStorage]);

  if (isFirstLaunch === null || !hydrated) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFirstLaunch && !isAuthenticated && (
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      )}

      {!isAuthenticated && (
        <>
          <Stack.Screen name="Login" component={SignInContainer} />
          <Stack.Screen name="Register" component={RegisterContainer} />
          <Stack.Screen name="Verify" component={VerifyOTPContainer} />
        </>
      )}

      {isAuthenticated && (
        <>
          <Stack.Screen
            name="ScreenBottomTabs"
            component={BottomTabNavigation}
          />
          <Stack.Screen
            name="ViewExplore"
            component={ViewExploreScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="ViewExploreList"
            component={ViewExploreListScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="CreateExplore"
            component={CreateExploreScreen}
            options={{ headerShown: true, headerTitle: 'Create New Explore' }}
          />
          <Stack.Screen
            name="EditExplore"
            component={EditExploreScreen}
            options={{ headerShown: true, headerTitle: 'Edit Explore' }}
          />
          <Stack.Screen
            name="ViewDocument"
            component={ViewDocumentScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Caller"
            component={CallerScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Receiver"
            component={ReceiverScreen}
            options={{ headerShown: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
