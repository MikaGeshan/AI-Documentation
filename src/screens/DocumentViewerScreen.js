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
import {
  downloadPdfToCache,
  fetchConvertedPdfUrl,
} from '../services/docxProcessToPdf';
import WebView from 'react-native-webview';

const DocumentViewerScreen = () => {
  const route = useRoute();
  const { doc } = route.params;
  const [pdfPath, setPdfPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const pdfUrl = await fetchConvertedPdfUrl(doc.url);
        console.log('PDF URL:', pdfUrl);
        if (!pdfUrl) throw new Error('Gagal mendapatkan URL PDF.');

        const localPath = await downloadPdfToCache(
          pdfUrl,
          doc.title || 'document',
        );
        if (!localPath) throw new Error('Gagal mengunduh PDF.');

        console.log('PDF downloaded to:', localPath);
        setPdfPath(localPath);
      } catch (err) {
        console.error('loadPdf error:', err);
        Alert.alert(
          'Error',
          err.message || 'Terjadi kesalahan saat memuat PDF',
        );
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [doc.url, doc.title]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4aa8ea" />
      </View>
    );
  }

  if (!pdfPath) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>PDF tidak bisa dimuat.</Text>
      </View>
    );
  }
  console.log('Rendering PDF at:', pdfPath);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{
          uri: `file://${pdfPath}`,
        }}
        useWebKit={true}
        style={styles.pdf}
        onLoad={() => {
          console.log('PDF loaded in WebView');
        }}
        onError={syntheticEvent => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          Alert.alert('WebView Error', nativeEvent.description);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
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

export default DocumentViewerScreen;
