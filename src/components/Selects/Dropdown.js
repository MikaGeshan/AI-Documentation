import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../Icons/Icon';

const Dropdown = ({ selectedValue = [], onValueChange, items = [] }) => {
  const [inputText, setInputText] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedValues, setSelectedValues] = useState(
    Array.isArray(selectedValue) ? selectedValue : [],
  );

  const animationHeight = useSharedValue(0);

  useEffect(() => {
    const newValues = Array.isArray(selectedValue) ? selectedValue : [];
    if (JSON.stringify(newValues) !== JSON.stringify(selectedValues)) {
      setSelectedValues(newValues);
    }
  }, [selectedValue, selectedValues]);

  useEffect(() => {
    animationHeight.value = withTiming(dropdownVisible ? 150 : 0, {
      duration: 200,
    });
  }, [animationHeight, dropdownVisible]);

  const filteredItems = items.filter(
    item =>
      !selectedValues.includes(item) &&
      item.toLowerCase().includes(inputText.toLowerCase()),
  );

  const addValue = value => {
    if (!value || selectedValues.includes(value)) return;
    const updated = [...selectedValues, value];
    setSelectedValues(updated);
    onValueChange && onValueChange(updated);
    setInputText('');
    setDropdownVisible(false);
  };

  const removeValue = value => {
    const updated = selectedValues.filter(v => v !== value);
    setSelectedValues(updated);
    onValueChange && onValueChange(updated);
  };

  const toggleDropdown = () => {
    setDropdownVisible(prev => !prev);
  };

  // Handle Enter / Submit
  const handleSubmitEditing = () => {
    const trimmedText = inputText.trim();
    if (trimmedText && !selectedValues.includes(trimmedText)) {
      addValue(trimmedText);
      Keyboard.dismiss();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: animationHeight.value,
    opacity: animationHeight.value === 0 ? 0 : 1,
  }));

  const styles = StyleSheet.create({
    container: { margin: 16 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 50,
    },
    input: { flex: 1 },
    dropdown: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      marginTop: 4,
      overflow: 'hidden',
    },
    item: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    chip: {
      backgroundColor: '#d1e7dd',
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: {
      fontSize: 12,
      color: '#0f5132',
      marginRight: 6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Type or select..."
          value={inputText}
          onChangeText={text => {
            setInputText(text);
            setDropdownVisible(true);
          }}
          onFocus={() => setDropdownVisible(true)}
          onSubmitEditing={handleSubmitEditing} // <- handle Enter key
          returnKeyType="done"
        />
        <TouchableOpacity onPress={toggleDropdown}>
          <Icon
            name={dropdownVisible ? 'ChevronUp' : 'ChevronDown'}
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.dropdown, animatedStyle]}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {filteredItems.map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => addValue(item)}
              style={styles.item}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.chipsContainer}>
        {selectedValues.map(value => (
          <TouchableOpacity
            key={value}
            style={styles.chip}
            onPress={() => removeValue(value)}
          >
            <Text style={styles.chipText}>{value}</Text>
            <Icon name="X" size={14} color="#0f5132" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Dropdown;
