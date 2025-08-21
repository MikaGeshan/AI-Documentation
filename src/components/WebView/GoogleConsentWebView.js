import React, { useState } from 'react';
import {
  Modal,
  ActivityIndicator,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_CALLBACK_URL } from '@env';
import axios from 'axios';
import Config from '../../App/Network';

export default function GoogleConsentWebView({
  visible,
  authUrl,
  onCancel,
  onMessage,
}) {
  const [loading, setLoading] = useState(true);

  const onNavigationStateChange = async navState => {
    const { url } = navState;

    if (url.startsWith(GOOGLE_CALLBACK_URL)) {
      const match = url.match(/[?&]code=([^&]+)/);
      if (match && match[1]) {
        const code = decodeURIComponent(match[1]);

        try {
          const res = await axios.post(
            `${Config.API_URL}/api/auth/google/get-token`,
            {
              code,
            },
          );

          onMessage(res.data);
        } catch (err) {
          console.error('Google token exchange failed:', err);
          Alert.alert('Google Auth Failed', 'Could not get tokens.');
          onCancel?.(err);
        }
      } else {
        onCancel?.(new Error('No code found in redirect URL'));
      }
    }
  };

  const styles = StyleSheet.create({
    webViewContainer: {
      flex: 1,
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -20,
      marginTop: -20,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: authUrl }}
          originWhitelist={authUrl}
          onNavigationStateChange={onNavigationStateChange}
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <ActivityIndicator style={styles.loading} size="large" color="#000" />
        )}
      </View>
    </Modal>
  );
}
