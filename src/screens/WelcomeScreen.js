import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import Onboarding from '../components/Onboarding';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const slides = [
    {
      title: 'Official Documentation for Mobile Front End Developer',
      subtitle:
        'This app is designed to help you search for related documentation on mobile front-end development.',
      image: require('../assets/man-book.png'),
    },
    {
      title: 'Get Started',
      subtitle: 'Let’s begin your journey!',
      backgroundColor: '#FFFFF',
      image: require('../assets/man-laptop.png'),
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#EFEDEC',
    },
    textContainer: {
      padding: 6,
      alignItems: 'center',
    },
    text: {
      fontSize: 20,
      color: 'black',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    description: {
      fontSize: 10,
      color: 'black',
      textAlign: 'center',
      marginTop: 10,
    },
    buttonContainer: {
      marginTop: 10,
      alignSelf: 'center',
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container}>
        <Onboarding slides={slides} onDone={() => navigation.replace('Home')} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
