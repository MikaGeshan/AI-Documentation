import React, { useEffect, useState, useRef, useMemo } from 'react';
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

const InputSelect = ({
  visible,
  onClose,
  onSelect,
  title,
  message,
  data = [],
  filterKey = 'name',
  renderItem,
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log('InputSelect opened with data:', data);

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

  useEffect(() => {
    if (visible && data.length > 0) {
      setExpanded(true);
    }
  }, [data, visible]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter(item =>
      String(item[filterKey] || '')
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [data, filterKey, search]);

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
    noItem: {
      fontStyle: 'italic',
      padding: 8,
      color: '#777',
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 6,
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
              placeholder="Search..."
              value={search}
              onChangeText={text => {
                setSearch(text);
                if (!expanded) setExpanded(true);
              }}
              onFocus={() => setExpanded(true)}
            />
            <TouchableOpacity onPress={() => setExpanded(prev => !prev)}>
              <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={20} />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.dropdown, { height: dropdownHeight }]}>
            {expanded && (
              <FlatList
                data={filteredData}
                keyExtractor={(item, idx) => `${item.id || idx}`}
                renderItem={({ item }) =>
                  renderItem ? (
                    renderItem(item, () => {
                      setSearch(item[filterKey]);
                      onSelect(item);
                      setExpanded(false);
                    })
                  ) : (
                    <TouchableOpacity
                      style={{
                        padding: 12,
                        borderBottomWidth: 0.5,
                        borderColor: '#ccc',
                      }}
                      onPress={() => {
                        setSearch(item[filterKey]);
                        onSelect(item);
                        setExpanded(false);
                      }}
                    >
                      <Text style={{ fontWeight: 'bold' }}>
                        {item[filterKey]}
                      </Text>
                    </TouchableOpacity>
                  )
                }
                ListEmptyComponent={
                  <Text style={styles.noItem}>(No matching items)</Text>
                }
              />
            )}
          </Animated.View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="X" size={20} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default InputSelect;
