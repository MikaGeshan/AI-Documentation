import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Accordion from '../components/Accordion';
import { preloadAllFolders } from '../services/documentFolderCacheManager';

const DocumentsScreen = () => {
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const loadFolders = async () => {
      const data = await preloadAllFolders();
      setFolders(data);
    };
    loadFolders();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: 16,
    },
    docItem: {
      paddingVertical: 4,
    },
    docText: {
      fontSize: 14,
      color: '#333',
    },
    noDoc: {
      fontStyle: 'italic',
      color: '#666',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {folders.map(folder => (
            <Accordion key={folder.folderName} title={folder.folderName}>
              {folder.docs.length > 0 ? (
                folder.docs.map((doc, idx) => (
                  <View key={idx} style={styles.docItem}>
                    <Text style={styles.docText}>
                      {doc.title || doc.name || '(no title)'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDoc}>(No documents)</Text>
              )}
            </Accordion>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
