import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Accordion from '../components/Accordion';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';
import { preloadAllDocuments } from '../services/documentCacheManager';
import Option from '../components/Option';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { requestAndroidPermission } from '../utils/requestPermission';
import { fetchConvertedPdfUrl } from '../services/docxProcessToPdf';

const DocumentsScreen = () => {
  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOption, setShowOption] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const navigation = useNavigation();

  const formatDocName = name => {
    if (!name) return '(untitled)';
    const cleanedName = name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\(Converted\)/gi, '')
      .trim();
    return cleanedName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

  const loadFolders = async () => {
    try {
      const folderMapStr = await AsyncStorage.getItem('doc-folder-map');
      if (!folderMapStr) return;
      const folderMap = JSON.parse(folderMapStr);
      const folderList = Object.entries(folderMap).map(
        ([folderName, docs]) => ({
          folderName,
          docs,
        }),
      );
      setFolders(folderList);
    } catch (e) {
      console.error('Error loading folders:', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await preloadAllDocuments();
        await loadFolders();
      } catch (e) {
        console.error('Failed to preload:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const viewDocument = () => {
    if (!selectedDoc) return;
    setShowOption(false);
    navigation.navigate('ViewDocument', { doc: selectedDoc });
  };

  const openDownloadedFile = async filePath => {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        Alert.alert('File Not Found', 'File does not exist at the given path.');
        return;
      }

      await FileViewer.open(filePath, {
        showOpenWithDialog: true,
      });
    } catch (e) {
      console.error('File open error:', e);
      Alert.alert('Error', 'Unable to open the file.');
    }
  };

  const downloadDocument = async (docUrl, fileName) => {
    console.log('Doc URL:', docUrl);

    const path =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`
        : `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

    try {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidPermission();
        if (!granted) {
          Alert.alert('Permission denied', 'Cannot access storage.');
          return;
        }
      }

      const fileUrl = await fetchConvertedPdfUrl(docUrl);

      if (!fileUrl) {
        Alert.alert('Download Failed', 'PDF URL not found.');
        return;
      }

      const res = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: path,
      }).promise;

      if (res.statusCode === 200) {
        Alert.alert(
          'Download Complete',
          `File saved to:\n${path}`,
          [
            { text: 'OK' },
            {
              text: 'Open',
              onPress: () => openDownloadedFile(path),
            },
          ],
          { cancelable: true },
        );
      } else {
        Alert.alert('Download Failed', `Status code: ${res.statusCode}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: 16,
    },
    itemContainer: {
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemText: {
      fontSize: 14,
      color: '#333',
    },
    noItemText: {
      fontStyle: 'italic',
      color: '#666',
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4aa8ea" />
          <Text>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {folders.map(folder => (
            <Accordion key={folder.folderName} title={folder.folderName}>
              {folder.docs.length > 0 ? (
                folder.docs.map((doc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.itemContainer}
                    onPress={() => {
                      setSelectedDoc(doc);
                      setTimeout(() => {
                        setShowOption(true);
                      }, 100);
                    }}
                  >
                    <Text style={styles.itemText}>
                      {formatDocName(doc.title || doc.name || '(no title)')}
                    </Text>
                    <Icon name="Ellipsis" size={16} color="#4aa8ea" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noItemText}>(No documents)</Text>
              )}
            </Accordion>
          ))}
        </ScrollView>
        <Option
          visible={showOption}
          onClose={() => setShowOption(false)}
          title="Choose Options Below"
          message={`What do you want to do with "${formatDocName(
            selectedDoc?.title || selectedDoc?.name,
          )}"?`}
          option1Text="Open"
          option2Text="Download"
          onOption1={viewDocument}
          onOption2={() => {
            const docUrl = selectedDoc.url;
            const fileName = selectedDoc.title || 'untitled';

            downloadDocument(docUrl, fileName);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
