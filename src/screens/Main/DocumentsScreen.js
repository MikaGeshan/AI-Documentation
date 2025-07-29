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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';
import Share from 'react-native-share';
import axios from 'axios';

import { API_URL } from '@env';

import Accordion from '../../components/Others/Accordion';
import { Icon } from '../../components/Icons/Icon';
import Option from '../../components/Options/Option';
import ProgressBar from '../../components/Loaders/ProgressBar';
import FloatingActionButton from '../../components/Buttons/FloatingActionButton';
import InputSelect from '../../components/Inputs/InputSelect';
import ErrorDialog from '../../components/Alerts/ErrorDialog';
import SuccessDialog from '../../components/Alerts/SuccessDialog';

import { preloadAllDocuments } from '../../services/documentCacheManager';
import InputModal from '../../components/Inputs/InputModal';

const DocumentsScreen = () => {
  const navigation = useNavigation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);

  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadProgress, setInitialLoadProgress] = useState(0);

  const [showOption, setShowOption] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(null);

  const [selectMode, setSelectMode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const formatDocName = name => {
    if (!name) return '(Untitled)';
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

  const createFolder = async folderName => {
    try {
      const response = await axios.post(`${API_URL}/api/create-folder`, {
        name: folderName,
      });

      const data = response.data;
      console.log(data);
      setSuccessMessage(data.message || 'Folder berhasil dibuat.');
      setShowSuccess(true);
      setRefreshing(true);
    } catch (err) {
      console.error('Error creating folder:', err);
      setShowError(true);
      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  const downloadAndShareFile = async doc => {
    try {
      const fileId = doc.id;
      const fileName = doc.name || 'Untitled Document';
      const downloadUrl = `${API_URL}/api/download-docs?file_id=${fileId}`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

      setIsDownloading(true);
      setDownloadProgress(0);

      const download = RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: localPath,
        progress: data => {
          const progress = Math.floor(
            (data.bytesWritten / data.contentLength) * 100,
          );
          setDownloadProgress(progress);
        },
        begin: () => setDownloadProgress(0),
        progressDivider: 1,
      });

      const result = await download.promise;
      setIsDownloading(false);
      setDownloadProgress(0);

      if (result.statusCode === 200) {
        await Share.open({
          url: 'file://' + localPath,
          type: 'application/pdf',
          saveToFiles: true,
          failOnCancel: false,
        });
        setSuccessMessage('Dokumen berhasil diunduh dan siap dibagikan.');
        setShowSuccess(true);
      } else {
        setErrorMessage(`Download gagal. Status: ${result.statusCode}`);
        setShowError(true);
      }
    } catch (err) {
      setIsDownloading(false);
      setDownloadProgress(0);
      console.error('Download error:', err.message);
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const deleteDocument = async fileId => {
    try {
      const response = await axios.delete(`${API_URL}/api/delete-docs`, {
        data: { file_id: fileId },
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;
      setSuccessMessage(data.message || 'Dokumen berhasil dihapus.');
      setShowSuccess(true);
    } catch (error) {
      console.error('Delete error:', error);
      const message =
        error.response?.data?.message ||
        'Terjadi kesalahan saat menghapus dokumen.';
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDocAction = async doc => {
    if (!doc) return;

    if (selectMode === 'download') {
      await downloadAndShareFile(doc);
    } else if (selectMode === 'delete') {
      if (doc?.id) {
        await deleteDocument(doc.id);
        await loadFolders();
      }
    }

    setSelectMode(null);
    setShowSelectModal(false);
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
    await preloadAllDocuments();
    setRefreshing(false);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const getRole = await AsyncStorage.getItem('role');
        setIsUser(getRole === 'user');
        setIsAdmin(getRole === 'admin');

        setInitialLoadProgress(20);
        await preloadAllDocuments();
        setInitialLoadProgress(60);
        await loadFolders();
        setInitialLoadProgress(100);
      } catch (e) {
        console.error('Failed to initialize:', e);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    initialize();
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    dialogContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
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
    progressContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
  });

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

  return (
    <SafeAreaView style={styles.container}>
      {showSuccess && (
        <View style={styles.dialogContainer}>
          <SuccessDialog
            message={successMessage}
            onHide={() => setShowSuccess(false)}
          />
        </View>
      )}
      {showError && (
        <ErrorDialog
          visible={showError}
          message={errorMessage}
          onHide={() => setShowError(false)}
        />
      )}

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
          option1Text="View"
          option2Text="Download"
          onOption1={() => {
            setShowOption(false);
            if (selectedDoc?.id) {
              const fileId = selectedDoc.id;
              const title = selectedDoc.name || 'Untitled Document';
              const pdfUrl = `${API_URL}/api/view-docs?file_id=${fileId}`;

              navigation.navigate('ViewDocument', {
                url: pdfUrl,
                title,
              });
            }
          }}
          onOption2={async () => {
            await downloadAndShareFile(selectedDoc);
            setShowOption(false);
          }}
        />

        {isAdmin && (
          <FloatingActionButton
            mainIcon={{ name: 'Plus', color: '#fff', size: 30 }}
            actions={[
              {
                iconName: 'FilePlus',
                iconColor: '#fff',
                iconSize: 20,
                onPress: () => {
                  setModalVisible(true);
                },
              },
              {
                iconName: 'Trash',
                onPress: () => {
                  setSelectMode('delete');
                  setShowSelectModal(true);
                },
              },
            ]}
          />
        )}

        <InputModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={value => {
            createFolder(value);
            setModalVisible(false);
          }}
          message="Create Folder"
          placeholder="Enter new folder name"
          buttonColor="#4AA8EA"
        />

        <InputSelect
          visible={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          title="Select Document"
          message={`Choose a document to ${selectMode}`}
          folders={folders}
          onSelect={handleDocAction}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
