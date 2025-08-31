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
} from 'react-native';
import { Icon } from '../../../components/Icons/Icon';
import Accordion from '../../../components/Selects/Accordion';
import Option from '../../../components/Options/Option';
import FloatingActionButton from '../../../components/Buttons/FloatingActionButton';
import InputModal from '../../../components/Inputs/InputModal';
import InputSelect from '../../../components/Inputs/InputSelect';
import UploadDirectoryModal from '../../../components/Uploads/UploadDirectoryModal';

const DocumentsComponent = ({
  folders,
  selectedDoc,
  loading,
  showOption,
  expandedFolder,
  uploadModalVisible,
  inputModalVisible,
  showSelectModal,
  selectMode,
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
  viewDocument,
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
          {Array.isArray(folder.files) && folder.files.length > 0 ? (
            folder.files.map((doc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.itemContainer}
                onPress={() => {
                  setSelectedDoc(doc);
                  setTimeout(() => setShowOption(true), 100);
                }}
              >
                <Text style={styles.itemText}>{formatDocName(doc.name)}</Text>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
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
          onOption1={viewDocument}
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
          data={
            selectMode === 'delete'
              ? folders?.flatMap(f => f.docs || []) || []
              : folders || []
          }
          filterKey={selectMode === 'delete' ? 'name' : 'folderName'}
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
