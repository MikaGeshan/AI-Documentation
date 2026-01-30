import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import axios from 'axios';
import { Platform } from 'react-native';
import DocumentsComponent from '../Components/DocumentsComponent';
import { DocumentAction } from '../Stores/DocumentAction';
import SignInActions from '../../Authentication/Stores/SignInActions';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';
import Config from '../../../App/Network';
import { useNavigation } from '@react-navigation/native';
import Loader from '../../../components/Loaders/Loader';

const DocumentsContainer = () => {
  const {
    folders,
    selectedDoc,
    selectedFolderId,
    loading,
    isDownloading,
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
    refreshing,
    setRefreshing,
  } = DocumentAction();

  const loadFolders = DocumentAction(state => state.loadFolders);

  const navigation = useNavigation();

  const user = SignInActions(state => state.user);

  const isAdmin = SignInActions(state => state.isAdmin);

  useEffect(() => {
    const init = async () => {
      await loadFolders();
    };
    init();
  }, [loadFolders]);

  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [setShowSuccess, showSuccess]);

  useEffect(() => {
    let timer;
    if (showError) {
      timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [setShowError, showError]);

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

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await loadFolders();
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
  const viewDocument = () => {
    setShowOption(false);
    if (selectedDoc?.webViewLink) {
      let url = selectedDoc.webViewLink;

      if (url.includes('docs.google.com/document')) {
        url = url.replace(/\/(edit|view).*$/, '/preview');
      }

      navigation.navigate('ViewDocument', {
        url,
        title: selectedDoc.name,
      });
    }
  };

  const deleteDocument = async id => {
    try {
      await axios.delete(`${Config.API_URL}/api/delete-docs`, {
        data: { file_id: id, email: user?.email },
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccessMessage('Folder Deleted.');
      setShowSuccess(true);
      await loadFolders();
    } catch (err) {
      setErrorMessage('Error Deleting Folder');
      setShowError(true);
    } finally {
      setRefreshing(false);
    }
  };

  const documentAction = async doc => {
    if (!doc) return;
    if (selectMode === 'download') {
      // await downloadAndShareFile(doc);
    } else if (selectMode === 'delete') {
      await deleteDocument(doc.id);
      await loadFolders();
    }
    setSelectMode(null);
    setShowSelectModal(false);
  };

  return (
    <>
      <DocumentsComponent
        folders={folders}
        navigation={navigation}
        selectedDoc={selectedDoc}
        showOption={showOption}
        expandedFolder={expandedFolder}
        uploadModalVisible={uploadModalVisible}
        inputModalVisible={inputModalVisible}
        showSelectModal={showSelectModal}
        selectMode={selectMode}
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
        documentAction={documentAction}
        onRefresh={onRefresh}
        setShowSuccess={setShowSuccess}
        setShowError={setShowError}
        selectedFolderId={selectedFolderId}
        viewDocument={viewDocument}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
      />

      {showSuccess && (
        <SuccessDialog
          message={successMessage}
          visible={true}
          onHide={() => setShowSuccess(false)}
        />
      )}

      {showError && (
        <ErrorDialog
          message={errorMessage}
          visible={true}
          onHide={() => setShowError(false)}
        />
      )}

      <Loader visible={loading} />
    </>
  );
};

export default DocumentsContainer;
