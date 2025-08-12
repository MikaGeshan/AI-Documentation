/* eslint-disable react/no-unstable-nested-components */
import {
  StyleSheet,
  View,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import React, { useEffect, useState } from 'react';
import { Icon } from '../Icons/Icon';

const Dropdown = ({ selectedValue = [], onValueChange }) => {
  const [selectedValues, setSelectedValues] = useState(
    Array.isArray(selectedValue) ? selectedValue : [],
  );

  const items = [
    { label: 'Mobile', value: 'mobile' },
    { label: 'Javascript', value: 'javascript' },
    { label: 'Android', value: 'android' },
    { label: 'IOS', value: 'ios' },
  ];

  useEffect(() => {
    setSelectedValues(Array.isArray(selectedValue) ? selectedValue : []);
  }, [selectedValue]);

  const toggleSelection = value => {
    if (!value) return;

    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter(item => item !== value)
      : [...selectedValues, value];

    setSelectedValues(updatedValues);
    onValueChange && onValueChange(updatedValues);
  };

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 12,
    },
    pickerWrapper: {
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 50,
      justifyContent: 'center',
    },
    pickerText: {
      fontSize: 14,
      color: '#333',
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    iconContainer: {
      top: 15,
      right: 12,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 8,
    },
    chip: {
      backgroundColor: '#d1e7dd',
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipText: {
      fontSize: 12,
      color: '#0f5132',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.pickerWrapper}>
        <RNPickerSelect
          onValueChange={toggleSelection}
          placeholder={{ label: 'Select genres...', value: null }}
          Icon={() => <Icon name="ChevronDown" size={20} color="grey" />}
          items={items}
          useNativeAndroidPickerStyle={false}
          style={{
            inputIOS: styles.pickerText,
            inputAndroid: styles.pickerText,
            iconContainer: styles.iconContainer,
            placeholder: { color: '#999' },
          }}
        />
      </View>

      <View style={styles.chipsContainer}>
        {Array.isArray(selectedValues) &&
          selectedValues.map(value => (
            <TouchableOpacity
              key={value}
              style={styles.chip}
              onPress={() => toggleSelection(value)}
            >
              <Text style={styles.chipText}>{value}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

export default Dropdown;
