import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import WebView from 'react-native-webview';

import {
  downloadPdfToCache,
  fetchConvertedPdfUrl,
} from '../../services/docxProcessToPdf';

const DocumentViewerScreen = () => {
  const { params } = useRoute();
  const { doc } = params;

  const [pdfPath, setPdfPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doc?.url) {
      Alert.alert('Error', 'No document URL provided.');
      setLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        const pdfUrl = await fetchConvertedPdfUrl(doc.url);
        if (!pdfUrl) throw new Error('Failed to fetch PDF URL.');
        console.log('PDF URL:', pdfUrl);

        const title = doc.title?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'document';
        const localPath = await downloadPdfToCache(pdfUrl, title);

        if (!localPath) throw new Error('Failed to download PDF.');
        console.log('PDF downloaded to:', localPath);

        setPdfPath(localPath);
      } catch (error) {
        console.error('PDF loading error:', error);
        Alert.alert('Error', error.message || 'Failed to load PDF.');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [doc.url, doc.title]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: 'red',
    },
    pdf: {
      flex: 1,
      width: Dimensions.get('window').width,
    },
  });

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4aa8ea" />
      </View>
    );
  }

  if (!pdfPath) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Unable to display PDF.</Text>
      </View>
    );
  }

  console.log('Rendering PDF at:', pdfPath);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: `file://${pdfPath}` }}
        useWebKit
        style={styles.pdf}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        allowFileAccess={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        onLoad={() => console.log('PDF loaded in WebView')}
        onError={({ nativeEvent }) =>
          Alert.alert('WebView Error', nativeEvent.description)
        }
      />
    </View>
  );
};

export default DocumentViewerScreen;
