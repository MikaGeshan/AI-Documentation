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
import InputModal from '../../components/Inputs/InputModal';
import Uploads from '../../components/Others/Uploads';

import { getFolderContents } from '../../services/googleDocumentService';

const DocumentsScreen = () => {
  const navigation = useNavigation();

  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadProgress, setInitialLoadProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showOption, setShowOption] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState(null);

  const [selectMode, setSelectMode] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        setIsAdmin(role === 'admin');

        setInitialLoadProgress(20);
        await getFolderContents();
        setInitialLoadProgress(60);
        await loadFolders();
        setInitialLoadProgress(100);
      } catch (e) {
        console.error('Failed to initializing:', e);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    init();
  }, []);

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

  const createFolder = async name => {
    try {
      const response = await axios.post(`${API_URL}/api/create-folder`, {
        name,
      });
      setSuccessMessage(response.data.message || 'Folder berhasil dibuat.');
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
      setShowError(true);
    }
  };

  const uploadToDrive = async (uri, folderId) => {
    try {
      const formatUri =
        Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const fileName = decodeURIComponent(uri.split('/').pop());

      const formData = new FormData();
      formData.append('folder_id', folderId);
      formData.append('file', {
        uri: formatUri,
        name: fileName,
        type: 'application/pdf',
      });

      await axios.post(`${API_URL}/api/upload-docs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMessage('Dokumen berhasil diunggah.');
      setShowSuccess(true);
      await loadFolders();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Gagal mengunggah dokumen.';
      setErrorMessage(message);
      setShowError(true);
    }
  };

  const downloadAndShareFile = async doc => {
    try {
      const { id, name } = doc;
      const downloadUrl = `${API_URL}/api/download-docs?file_id=${id}`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${
        name || 'Dokumen'
      }.pdf`;

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

      if (result.statusCode === 200) {
        await Share.open({
          url: 'file://' + localPath,
          type: 'application/pdf',
        });
        setSuccessMessage('Dokumen berhasil diunduh dan dibagikan.');
        setShowSuccess(true);
      } else {
        throw new Error(`Download gagal. Status: ${result.statusCode}`);
      }
    } catch (err) {
      setIsDownloading(false);
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const deleteDocument = async id => {
    try {
      await axios.delete(`${API_URL}/api/delete-docs`, {
        data: { file_id: id },
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccessMessage('Dokumen berhasil dihapus.');
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
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
      await deleteDocument(doc.id);
      await loadFolders();
    }

    setSelectMode(null);
    setShowSelectModal(false);
  };

  const loadFolders = async () => {
    try {
      const data = await getFolderContents();
      if (!data?.subfolders) return;

      const folderList = data.subfolders.map(sub => ({
        id: sub.id,
        folderName: sub.name,
        docs: sub.files || [],
      }));

      setFolders(folderList);
    } catch (e) {
      console.error('Error loading folders:', e);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await getFolderContents();
      if (data) {
        await AsyncStorage.setItem('doc-folder-map', JSON.stringify(data));
        await loadFolders();
      }
    } catch (e) {
      console.error('Error refreshing folders:', e);
    } finally {
      setRefreshing(false);
    }
  };

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
        key={folder.id}
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
              navigation.navigate('ViewDocument', {
                url: `${API_URL}/api/view-docs?file_id=${selectedDoc.id}`,
                title: selectedDoc.name,
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
                iconSize: 25,
                onPress: () => {
                  setSelectMode('upload');
                  setShowSelectModal(true);
                },
              },
              {
                iconName: 'FolderUp',
                iconColor: '#fff',
                iconSize: 25,
                onPress: () => setInputModalVisible(true),
              },
              {
                iconName: 'Trash',
                iconColor: '#fff',
                iconSize: 25,
                onPress: () => {
                  setSelectMode('delete');
                  setShowSelectModal(true);
                },
              },
            ]}
          />
        )}

        <InputModal
          visible={inputModalVisible}
          onClose={() => setInputModalVisible(false)}
          onSubmit={value => {
            createFolder(value);
            setInputModalVisible(false);
          }}
          message="Create Folder"
          placeholder="Enter new folder name"
          buttonColor="#4AA8EA"
        />

        <InputSelect
          visible={showSelectModal}
          onClose={() => setShowSelectModal(false)}
          title={selectMode === 'delete' ? 'Select Document' : 'Select Folder'}
          message={
            selectMode === 'delete'
              ? 'Choose a document to delete'
              : 'Choose a folder to upload to'
          }
          folders={folders}
          showOnlyFolders={selectMode === 'upload'}
          onSelect={item => {
            setShowSelectModal(false);
            if (selectMode === 'delete') handleDocAction(item);
            else if (selectMode === 'upload') {
              setSelectedFolderId(item.id);
              setUploadModalVisible(true);
            }
            setSelectMode(null);
          }}
        />

        <Uploads
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onUpload={uri => uploadToDrive(uri, selectedFolderId)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
