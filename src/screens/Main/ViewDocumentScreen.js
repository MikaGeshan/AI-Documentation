import { SafeAreaView, StyleSheet } from 'react-native';
import React from 'react';
import WebView from 'react-native-webview';

const ViewDocumentScreen = ({ route }) => {
  const { url, title } = route.params;

  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    webViewContainer: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <WebView
        source={{ uri: url, title }}
        startInLoadingState
        style={styles.webViewContainer}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  );
};

export default ViewDocumentScreen;
