import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Icon } from '../Icons/Icon';
import { useExpandStore } from '../../hooks/ComponentHooks/useExpandStore';

const InputSelect = ({
  visible,
  onClose,
  onSelect,
  title,
  message,
  folders = [],
  renderMode,
}) => {
  const [search, setSearch] = useState('');
  const { expanded, setExpanded, toggleExpanded } = useExpandStore();

  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      setExpanded(true);
    } else {
      setExpanded(false);
      setSearch('');
      modalOpacity.setValue(0);
      modalScale.setValue(0.9);
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(dropdownHeight, {
      toValue: expanded ? 300 : 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const dataList = React.useMemo(() => {
    let result = [];

    if (renderMode === 'folders') {
      result = folders
        .filter(
          folder =>
            !search.trim() ||
            folder.folderName.toLowerCase().includes(search.toLowerCase()),
        )
        .map(folder => ({
          type: 'folder',
          id: folder.id,
          folderName: folder.folderName,
          data: folder,
        }));
    } else if (renderMode === 'documents') {
      return folders.flatMap(folder =>
        (folder.docs || [])
          .filter(
            doc =>
              !search.trim() ||
              doc.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map(doc => ({
            type: 'document',
            id: doc.id,
            documentName: doc.name,
            data: doc,
          })),
      );
    }

    console.log('Data Fetched:', {
      renderMode,
      search,
      totalItems: result.length,
      items: result,
    });

    return result;
  }, [folders, renderMode, search]);

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
      position: 'relative',
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
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: '#f9f9f9',
      paddingHorizontal: 10,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
    },
    dropdown: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      backgroundColor: '#fff',
      overflow: 'hidden',
    },
    folderItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 0.5,
      borderColor: '#ccc',
      fontWeight: 'bold',
    },
    documentItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 0.5,
      borderColor: '#ccc',
      fontWeight: 'bold',
    },
    noItem: {
      fontStyle: 'italic',
      paddingVertical: 8,
      paddingHorizontal: 12,
      color: '#777',
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      borderRadius: 20,
      padding: 6,
      zIndex: 1000,
    },
  });

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { opacity: modalOpacity, transform: [{ scale: modalScale }] },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search folders or documents..."
              value={search}
              onChangeText={text => {
                setSearch(text);
                if (!expanded) setExpanded(true);
              }}
              onFocus={() => setExpanded(true)}
            />
            <TouchableOpacity onPress={toggleExpanded}>
              <Icon
                name={expanded ? 'ChevronUp' : 'ChevronDown'}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.dropdown, { height: dropdownHeight }]}>
            {expanded && (
              <FlatList
                data={dataList}
                keyExtractor={item => `${item.id}`}
                renderItem={({ item }) =>
                  item.type === 'folder' ? (
                    <TouchableOpacity
                      style={styles.folderItem}
                      onPress={() => {
                        setSearch(item.folderName);
                        onSelect(item.data);
                        setExpanded(false);
                      }}
                    >
                      <Text style={{ fontWeight: 'bold' }}>
                        {item.folderName}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.documentItem}
                      onPress={() => {
                        setSearch(item.documentName);
                        onSelect(item.data);
                        setExpanded(false);
                      }}
                    >
                      <Text>{item.documentName}</Text>
                    </TouchableOpacity>
                  )
                }
                ListEmptyComponent={
                  <Text style={styles.noItem}>
                    (No matching folders or documents)
                  </Text>
                }
              />
            )}
          </Animated.View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="X" size={20} color="black" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default InputSelect;
