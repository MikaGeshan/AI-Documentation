import { KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import React from 'react';
import WebView from 'react-native-webview';

const EditDocumentScreen = ({ route }) => {
  const { url, title } = route.params;

  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardViewContainer: {
      flex: 1,
    },
    webViewContainer: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView style={styles.keyboardViewContainer}>
        <WebView
          source={{ uri: url }}
          startInLoadingState
          style={styles.webViewContainer}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditDocumentScreen;
