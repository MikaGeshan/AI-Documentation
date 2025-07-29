import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import Accordion from '../Others/Accordion';

const InputSelect = ({
  visible,
  onClose,
  onSelect,
  title,
  message,
  folders,
  showOnlyFolders = false,
}) => {
  const [search, setSearch] = useState('');
  const [expandedFolder, setExpandedFolder] = useState(null);
  const filteredFolders = folders
    .map(folder => ({
      ...folder,
      docs: showOnlyFolders
        ? []
        : folder.docs.filter(doc =>
            (doc.title || doc.name || '')
              .toLowerCase()
              .includes(search.toLowerCase()),
          ),
    }))
    .filter(folder =>
      showOnlyFolders
        ? folder.folderName.toLowerCase().includes(search.toLowerCase())
        : true,
    );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      maxHeight: '90%',
    },
    title: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 6,
    },
    message: {
      color: '#444',
      marginBottom: 12,
    },
    input: {
      borderColor: '#ccc',
      borderWidth: 1,
      padding: 8,
      borderRadius: 8,
      marginBottom: 12,
    },
    docItem: {
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderColor: '#ccc',
    },
    noItem: {
      fontStyle: 'italic',
      paddingVertical: 4,
      color: '#777',
    },
    closeButton: {
      marginTop: 12,
      alignSelf: 'center',
      backgroundColor: '#4AA8EA',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    closeText: {
      fontWeight: 'bold',
      color: 'white',
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TextInput
            style={styles.input}
            placeholder={
              showOnlyFolders ? 'Search folders...' : 'Search documents...'
            }
            value={search}
            onChangeText={setSearch}
          />

          {showOnlyFolders ? (
            <FlatList
              data={filteredFolders}
              keyExtractor={item => item.folderName}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.docItem}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text>{item.folderName}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noItem}>(No matching folders)</Text>
              }
            />
          ) : (
            <ScrollView>
              {filteredFolders.map(folder => (
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
                        style={styles.docItem}
                        onPress={() => {
                          onSelect(doc);
                          onClose();
                        }}
                      >
                        <Text>{doc.title || doc.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noItem}>(No matching documents)</Text>
                  )}
                </Accordion>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default InputSelect;
