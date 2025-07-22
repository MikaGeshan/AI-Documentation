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
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { useNavigation } from '@react-navigation/native';

import Accordion from '../../components/Others/Accordion';
import Icon from '../../components/Icons/Icon';
import Option from '../../components/Others/Option';
import ProgressBar from '../../components/Loaders/ProgressBar';

import { preloadAllDocuments } from '../../services/documentCacheManager';
import { requestAndroidPermission } from '../../utils/requestPermission';
import { fetchConvertedPdfUrl } from '../../services/docxProcessToPdf';

const DocumentsScreen = () => {
  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadProgress, setInitialLoadProgress] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(null);

  const navigation = useNavigation();

  const formatDocName = name => {
    if (!name) return '(untitled)';
    return name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\(Converted\)/gi, '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const openDownloadedFile = async filePath => {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        Alert.alert('File Not Found', 'File does not exist at the given path.');
        return;
      }
      await FileViewer.open(filePath, { showOpenWithDialog: true });
    } catch (e) {
      console.error('File open error:', e);
      Alert.alert('Error', 'Unable to open the file.');
    }
  };

  const downloadFile = async (docUrl, fileName) => {
    const outputPath =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`
        : `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

    try {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidPermission();
        if (!granted)
          return Alert.alert('Permission denied', 'Cannot access storage.');
      }

      const fileUrl = await fetchConvertedPdfUrl(docUrl);
      if (!fileUrl) return Alert.alert('Download Failed', 'PDF URL not found.');

      setIsDownloading(true);
      setDownloadProgress(0);

      const result = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: outputPath,
        progress: data => {
          const percent = Math.floor(
            (data.bytesWritten / data.contentLength) * 100,
          );
          setDownloadProgress(percent);
        },
        progressDivider: 1,
      }).promise;

      if (result.statusCode === 200) {
        Alert.alert('Download Complete', `File saved to:\n${outputPath}`, [
          { text: 'OK' },
          { text: 'Open', onPress: () => openDownloadedFile(outputPath) },
        ]);
      } else {
        Alert.alert('Download Failed', `Status code: ${result.statusCode}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download file.');
    } finally {
      setIsDownloading(false);
    }
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setInitialLoadProgress(20);
        await preloadAllDocuments();
        setInitialLoadProgress(60);
        await loadFolders();
        setInitialLoadProgress(100);
      } catch (e) {
        console.error('Failed to preload:', e);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    load();
  }, []);

  const renderProgress = () => {
    if (!loading && !isDownloading) return null;
    const progress = loading ? initialLoadProgress : downloadProgress;
    const label = loading
      ? 'Preparing documents...'
      : `Downloading: ${progress}%`;

    return (
      <View style={styles.progressContainer}>
        <Text>{label}</Text>
        <ProgressBar progress={progress} />
      </View>
    );
  };

  const renderFolders = () =>
    folders.map(folder => (
      <Accordion
        key={folder.folderName}
        title={folder.folderName}
        isExpanded={expandedFolder === folder.folderName}
        onToggle={() =>
          setExpandedFolder(prev =>
            prev === folder.folderName ? null : folder.folderName,
          )
        }
      >
        {folder.docs.length > 0 ? (
          folder.docs.map((doc, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.itemContainer}
              onPress={() => {
                setSelectedDoc(doc);
                setTimeout(() => setShowOption(true), 100);
              }}
            >
              <Text style={styles.itemText}>
                {formatDocName(doc.title || doc.name)}
              </Text>
              <Icon name="Ellipsis" size={16} color="#4aa8ea" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noItemText}>(No documents)</Text>
        )}
      </Accordion>
    ));

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16 },
    itemContainer: {
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemText: { fontSize: 14, color: '#333' },
    noItemText: { fontStyle: 'italic', color: '#666' },
    progressContainer: { paddingHorizontal: 16, paddingTop: 10 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {renderProgress()}

        {!loading && (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderFolders()}
          </ScrollView>
        )}

        <Option
          visible={showOption}
          onClose={() => setShowOption(false)}
          title="Choose Options Below"
          message={`What do you want to do with "${formatDocName(
            selectedDoc?.title || selectedDoc?.name,
          )}"?`}
          option1Text="Open"
          option2Text="Download"
          onOption1={() => {
            setShowOption(false);
            setSelectedDoc(null);
            navigation.navigate('ViewDocument', { doc: selectedDoc });
          }}
          onOption2={() => {
            const docUrl = selectedDoc.url;
            const fileName = selectedDoc.title || 'untitled';
            downloadFile(docUrl, fileName);
            setShowOption(false);
            setSelectedDoc(null);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
