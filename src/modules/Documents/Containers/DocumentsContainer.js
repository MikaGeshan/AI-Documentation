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

  const getFolderContents = async () => {
    try {
      const url = `${Config.API_URL}/api/drive-contents`;
      console.log('Fetching folder contents from:', url);

      const response = await axios.get(url);
      const data = response.data;

      const mapSubFolders = {
        subfolders: data.subfolders.map(sub => ({
          id: sub.id,
          name: sub.name,
          webViewLink: sub.webViewLink,
          files: sub.files.map(file => ({
            ...file,
            downloadUrl:
              file.mimeType === 'application/vnd.google-apps.document'
                ? file.webViewLink
                : `https://drive.google.com/uc?id=${file.id}&export=download`,
          })),
        })),
      };

      console.log(mapSubFolders);
      return mapSubFolders;
    } catch (error) {
      console.error(
        'Failed to fetch drive contents',
        error?.response?.data || error.message,
      );
      return null;
    }
  };

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

  // const convertDocument = async fileId => {
  //   try {
  //     if (!fileId) throw new Error('Missing file ID');

  //     const backendUrl = `${Config.API_URL}/api/convert-docs`;
  //     console.log('Calling backend at:', backendUrl);

  //     const response = await axios.post(backendUrl, { file_id: fileId });
  //     const data = response.data;

  //     if (data?.error) {
  //       throw new Error(`Backend error: ${data.error}`);
  //     }

  //     if (!data?.text) {
  //       throw new Error('Invalid response from backend');
  //     }

  //     console.log('Document conversion successful from backend');
  //     return {
  //       fileId,
  //       title: data.title || 'Untitled',
  //       content: data.text,
  //     };
  //   } catch (error) {
  //     console.error('Document conversion failed:', error.message);
  //     return null;
  //   }
  // };

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

  const downloadAndShareFile = async doc => {
    try {
      const { id, name } = doc;
      const downloadUrl = `${Config.API_URL}/api/download-docs?file_id=${id}`;
      const localPath = `${RNFS.DocumentDirectoryPath}/${
        name || 'Untitled Document'
      }.pdf`;

      console.log('Starting download for:', {
        id,
        name,
        downloadUrl,
        localPath,
      });

      setIsDownloading(true);
      setDownloadProgress(0);

      const download = RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: localPath,
        progress: data => {
          const progress = Math.floor(
            (data.bytesWritten / data.contentLength) * 100,
          );
          console.log(`Download progress: ${progress}%`);
          setDownloadProgress(progress);
        },
        begin: () => {
          console.log('Download started...');
          setDownloadProgress(0);
        },
        progressDivider: 1,
      });

      const result = await download.promise;
      console.log('Download result:', result);

      setIsDownloading(false);

      if (result.statusCode === 200) {
        console.log('Download completed at:', localPath);

        if (Platform.OS === 'ios') {
          console.log('Sharing file on iOS:', localPath);
          await Share.open({
            url: 'file://' + localPath,
            type: 'application/pdf',
          });
        } else {
          console.log('Skipping share on Android, file saved at:', localPath);
        }

        setSuccessMessage('Document Successfully Downloaded.');
        setShowSuccess(true);
      } else {
        console.error(`Download failed with status: ${result.statusCode}`);
        throw new Error(`Download failed. Status: ${result.statusCode}`);
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setIsDownloading(false);
      setErrorMessage('Error Downloading Document');
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
      await downloadAndShareFile(doc);
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
        downloadAndShareFile={downloadAndShareFile}
        documentAction={documentAction}
        onRefresh={onRefresh}
        setShowSuccess={setShowSuccess}
        setShowError={setShowError}
        selectedFolderId={selectedFolderId}
        viewDocument={viewDocument}
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

      <Loader visible={loading || isDownloading} />
    </>
  );
};

export default DocumentsContainer;
