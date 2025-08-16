import React from 'react';
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
import { Icon } from '../../../components/Icons/Icon';
import Accordion from '../../../components/Selects/Accordion';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';
import Option from '../../../components/Options/Option';
import Config from '../../../configs/config';
import FloatingActionButton from '../../../components/Buttons/FloatingActionButton';
import InputModal from '../../../components/Inputs/InputModal';
import InputSelect from '../../../components/Inputs/InputSelect';
import UploadDirectoryModal from '../../../components/Uploads/UploadDirectoryModal';

const DocumentsComponent = ({
  folders,
  selectedDoc,
  loading,
  // isDownloading,
  // initialLoadProgress,
  // downloadProgress,
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
  isAdmin,
  refreshing,
  formatDocName,
  setExpandedFolder,
  setSelectedDoc,
  setShowOption,
  setInputModalVisible,
  setSelectMode,
  setShowSelectModal,
  setSelectedFolderId,
  setUploadModalVisible,
  createFolder,
  uploadToDrive,
  downloadAndShareFile,
  documentAction,
  onRefresh,
  setShowSuccess,
  setShowError,
  navigation,
  selectedFolderId,
}) => {
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
        {/* {renderProgress()} */}

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
            console.log(value);
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
          data={folders}
          filterKey="folderName"
          renderMode={selectMode === 'upload' ? 'folders' : 'documents'}
          onSelect={item => {
            setShowSelectModal(false);
            if (selectMode === 'delete') {
              documentAction(item);
            } else if (selectMode === 'upload') {
              setSelectedFolderId(item.id);
              setUploadModalVisible(true);
            }
            setSelectMode(null);
          }}
        />

        <UploadDirectoryModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onUpload={uri => uploadToDrive(uri, selectedFolderId)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsComponent;
