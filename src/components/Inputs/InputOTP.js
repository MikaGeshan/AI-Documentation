import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const InputOTP = ({ value, onChangeText, error }) => {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleChange = text => {
    const sanitized = text.replace(/[^0-9]/g, '');
    if (sanitized.length <= 6) {
      onChangeText(sanitized);
    }
  };

  const renderBoxes = () =>
    Array.from({ length: 6 }).map((_, index) => {
      const isFocused = value.length === index;
      const boxStyle = [styles.otpBox, isFocused && styles.otpBoxFocused];

      return (
        <View key={index} style={boxStyle}>
          <Text style={styles.otpDigit}>{value[index] || ''}</Text>
        </View>
      );
    });

  const styles = StyleSheet.create({
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    otpBox: {
      width: 45,
      height: 55,
      borderWidth: 1.5,
      borderRadius: 8,
      borderColor: '#E9ECEF',
      backgroundColor: '#F8F9FA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    otpBoxFocused: {
      borderColor: '#A1D4F7',
    },
    otpDigit: {
      color: '#000',
      fontSize: 24,
    },
    errorText: {
      color: '#FF6B6B',
      textAlign: 'center',
      marginTop: 10,
    },
  });

  return (
    <View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        keyboardType="numeric"
        maxLength={6}
        value={value}
        onChangeText={handleChange}
        autoFocus
      />

      <TouchableOpacity
        style={styles.otpContainer}
        onPress={focusInput}
        activeOpacity={1}
      >
        {renderBoxes()}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default InputOTP;
