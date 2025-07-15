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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Accordion from '../components/Accordion';

const DocumentsScreen = () => {
  const [folders, setFolders] = useState([]);

  const formatDocName = name => {
    if (!name) return '(untitled)';

    const cleanedName = name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\(Converted\)/gi, '')
      .trim();

    return cleanedName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
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
                      {formatDocName(doc.title || doc.name || '(no title)')}
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
