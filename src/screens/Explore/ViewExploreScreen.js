import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

const ViewExploreScreen = () => {
  const route = useRoute();
  const { web_link } = route.params || {};

  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
    },
    fallback: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: 'red',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {web_link ? (
          <WebView
            source={{ uri: web_link }}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
          />
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.errorText}>No web link was provided.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewExploreScreen;
