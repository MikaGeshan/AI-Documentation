import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ButtonCall from '../Buttons/ButtonCall';

const GettingCall = ({ onAnswer }) => {
  const styles = StyleSheet.create({
    callContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    innerContainer: {
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      marginBottom: 10,
    },
    subtext: {
      fontSize: 16,
      color: '#666',
    },
  });

  return (
    <SafeAreaView style={styles.callContainer}>
      <KeyboardAvoidingView
        style={styles.callContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Incoming Call...</Text>
          <ButtonCall
            backgroundColor={'green'}
            name={'Phone'}
            onPress={onAnswer}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GettingCall;
