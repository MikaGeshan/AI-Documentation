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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Accordion from '../components/Accordion';
import Icon from '../components/Icon';
import { useNavigation } from '@react-navigation/native';

const DocumentsScreen = () => {
  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFolders();
    setRefreshing(false);
  };

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

  useEffect(() => {
    loadFolders();
  }, []);

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
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {folders.map(folder => (
            <Accordion key={folder.folderName} title={folder.folderName}>
              {folder.docs.length > 0 ? (
                folder.docs.map((doc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.itemContainer}
                    onPress={() =>
                      navigation.navigate('ViewDocument', {
                        doc,
                      })
                    }
                  >
                    <Text style={styles.itemText}>
                      {formatDocName(doc.title || doc.name || '(no title)')}
                    </Text>
                    <Icon name="Download" size={16} color="#4aa8ea" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noItemText}>(No documents)</Text>
              )}
            </Accordion>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DocumentsScreen;
