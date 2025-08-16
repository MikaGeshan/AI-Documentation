import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import axios from 'axios';
import { autoConfigureIP } from '../../../configs/networkConfig';
import Config from '../../../configs/config';
import { Platform } from 'react-native';
import { getFolderContents } from '../../../services/googleDocumentService';
import DocumentsComponent from '../Components/DocumentsComponent';
import { DocumentAction } from '../Stores/DocumentAction';
import SignInActions from '../../Authentication/Stores/SignInActions';

const DocumentsContainer = () => {
  const {
    folders,
    selectedDoc,
    selectedFolderId,
    loading,
    initialLoadProgress,
    isDownloading,
    downloadProgress,
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
    setSelectedDoc,
    setSelectedFolderId,
    setDownloadProgress,
    setIsDownloading,
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
  } = DocumentAction();

  const loadFolders = DocumentAction(state => state.loadFolders);

  const user = SignInActions(state => state.user);
  const isAdmin = SignInActions(state => state.isAdmin);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const ip = await autoConfigureIP();
      if (!ip) {
        console.warn('autoConfigureIP failed. Skipping folder load.');
        return;
      }
      await loadFolders();
    };
    init();
  }, [loadFolders]);

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
        email: user?.email,
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
      formData.append('email', user?.email || '');
      formData.append('folder_id', folderId);
      formData.append('file', {
        uri: formatUri,
        name: fileName,
        type: 'application/pdf',
      });

      console.log(formData);

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
      setErrorMessage(
        error.response?.data?.message || 'Error Uploading Document.',
      );
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
        throw new Error(`Download failed. Status: ${result.statusCode}`);
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
        data: { file_id: id, email: user?.email },
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

  const documentAction = async doc => {
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

  return (
    <DocumentsComponent
      folders={folders}
      selectedDoc={selectedDoc}
      loading={loading}
      isDownloading={isDownloading}
      initialLoadProgress={initialLoadProgress}
      downloadProgress={downloadProgress}
      showOption={showOption}
      expandedFolder={expandedFolder}
      uploadModalVisible={uploadModalVisible}
      inputModalVisible={inputModalVisible}
      showSelectModal={showSelectModal}
      selectMode={selectMode}
      successMessage={successMessage}
      showSuccess={showSuccess}
      errorMessage={errorMessage}
      showError={showError}
      isAdmin={isAdmin}
      refreshing={refreshing}
      formatDocName={formatDocName}
      setExpandedFolder={setExpandedFolder}
      setSelectedDoc={setSelectedDoc}
      setShowOption={setShowOption}
      setInputModalVisible={setInputModalVisible}
      setSelectMode={setSelectMode}
      setShowSelectModal={setShowSelectModal}
      setSelectedFolderId={setSelectedFolderId}
      setUploadModalVisible={setUploadModalVisible}
      createFolder={createFolder}
      uploadToDrive={uploadToDrive}
      downloadAndShareFile={downloadAndShareFile}
      documentAction={documentAction}
      onRefresh={onRefresh}
      setShowSuccess={setShowSuccess}
      setShowError={setShowError}
      selectedFolderId={selectedFolderId}
    />
  );
};

export default DocumentsContainer;
