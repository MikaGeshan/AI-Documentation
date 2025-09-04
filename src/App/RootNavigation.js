/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../components/Headers/Header';
import { Icon } from '../components/Icons/Icon';
import { useNavigation } from '@react-navigation/native';
import ViewExploreComponent from '../modules/Explore/Components/ViewExploreComponent';
import SignInContainer from '../modules/Authentication/Containers/SignInContainer';
import RegisterContainer from '../modules/Authentication/Containers/RegisterContainer';
import VerifyOTPContainer from '../modules/Authentication/Containers/VerifyOTPContainer';
import ChatContainer from '../modules/Chatbot/Containers/ChatContainer';
import DocumentsContainer from '../modules/Documents/Containers/DocumentsContainer';
import WelcomeScreen from '../modules/Main/WelcomeScreen';
import SignInActions from '../modules/Authentication/Stores/SignInActions';
import ViewDocumentComponent from '../modules/Documents/Components/ViewDocumentComponent';
import CreateExploreContainer from '../modules/Explore/Containers/CreateExploreContainer';
import ExploreContainer from '../modules/Explore/Containers/ExploreContainer';
import EditExploreContainer from '../modules/Explore/Containers/EditExploreContainer';
import ViewExploreListContainer from '../modules/Explore/Containers/ViewExploreListContainer';
import CallerContainer from '../modules/Call/Containers/CallerContainer';
import ReceiverContainer from '../modules/Call/Containers/ReceiverContainer';

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
  const { isAdmin } = SignInActions.getState();
  const logout = SignInActions(state => state.logout);
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
        component={DocumentsContainer}
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
        component={ChatContainer}
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
        component={ExploreContainer}
        options={{
          header: () => (
            <Header
              title="Mobile Documentation Explorer"
              description="Feel Free to Explore the Available Documentation"
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
  const { isAuthenticated, hydrateFromStorage, hydrated } = SignInActions();

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
            component={ViewExploreComponent}
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.title || 'Viewing Explore',
            })}
          />
          <Stack.Screen
            name="ViewExploreList"
            component={ViewExploreListContainer}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="CreateExplore"
            component={CreateExploreContainer}
            options={{ headerShown: true, headerTitle: 'Create New Explore' }}
          />
          <Stack.Screen
            name="EditExplore"
            component={EditExploreContainer}
            options={{ headerShown: true, headerTitle: 'Edit Explore' }}
          />
          <Stack.Screen
            name="ViewDocument"
            component={ViewDocumentComponent}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Caller"
            component={CallerContainer}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Receiver"
            component={ReceiverContainer}
            options={{ headerShown: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
