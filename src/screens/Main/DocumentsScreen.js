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
import { useDocumentStore } from '../../hooks/useDocumentStore';
import { useValidationStore } from '../../hooks/useValidationStore';
import Button from '../../components/Buttons/Button';
import Config from '../../configs/config';
import { autoConfigureIP } from '../../configs/networkConfig';

const DocumentsScreen = () => {
  const navigation = useNavigation();
  const {
    folders,
    selectedDoc,
    selectedFolderId,
    loading,
    initialLoadProgress,
    isDownloading,
    downloadProgress,

    setSelectedDoc,
    setSelectedFolderId,
    setDownloadProgress,
    setIsDownloading,
  } = useDocumentStore();

  const loadFolders = useDocumentStore(state => state.loadFolders);

  const {
    isAdmin,
    showOption,
    expandedFolder,
    uploadModalVisible,
    inputModalVisible,
    showSelectModal,
    selectMode,
    successMessage,
    showSuccess,
    errorMessage,
    showError,

    setShowOption,
    setExpandedFolder,
    setUploadModalVisible,
    setInputModalVisible,
    setShowSelectModal,
    setSelectMode,
    setSuccessMessage,
    setShowSuccess,
    setErrorMessage,
    setShowError,
  } = useValidationStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const ip = await autoConfigureIP();
      if (!ip) {
        console.warn('autoConfigureIP failed. Skipping folder load.');
        return;
      }

      await useDocumentStore.getState().loadFolders(); // ✅ now safe
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
      const response = await axios.post(`${Config.API_URL}/api/create-folder`, {
        name,
      });

      setRefreshing(true);
      await loadFolders();
      setRefreshing(false);

      setSuccessMessage(response.data.message || 'Folder Created.');
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error Creating Folder');
      setShowError(true);
      setRefreshing(false);
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

      await axios.post(`${Config.API_URL}/api/upload-docs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadModalVisible(false);

      setTimeout(async () => {
        setRefreshing(true);
        await loadFolders();
        setRefreshing(false);

        setSuccessMessage('Document Uploaded.');
        setShowSuccess(true);
      }, 400);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error Uploading Document.';
      setErrorMessage(message);
      setShowError(true);
    }
  };

  const downloadAndShareFile = async doc => {
    try {
      const { id, name } = doc;
      const downloadUrl = `${Config.API_URL}/api/download-docs?file_id=${id}`;
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
        setSuccessMessage('Document Downloaded.');
        setShowSuccess(true);
      } else {
        throw new Error(`Download gagal. Status: ${result.statusCode}`);
      }
    } catch (err) {
      setIsDownloading(false);
      setErrorMessage('Error Downloading Document');
      setShowError(true);
    }
  };

  const deleteDocument = async id => {
    try {
      await axios.delete(`${Config.API_URL}/api/delete-docs`, {
        data: { file_id: id },
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccessMessage('Document Deleted.');
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage('Error Deleting Document');
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

  const renderFolders = () => {
    return folders.map(folder => {
      const isThisExpanded = expandedFolder === folder.id;
      return (
        <Accordion
          key={folder.id}
          title={folder.folderName}
          isExpanded={!!isThisExpanded}
          onToggle={() =>
            setExpandedFolder(expandedFolder === folder.id ? null : folder.id)
          }
        >
          {Array.isArray(folder.docs) && folder.docs.length > 0 ? (
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
      );
    });
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
                url: `${Config.API_URL}/api/view-docs?file_id=${selectedDoc.id}`,
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

      <Button
        text={'Receive'}
        onPress={() => navigation.navigate('Receiver')}
      />
    </SafeAreaView>
  );
};

export default DocumentsScreen;
