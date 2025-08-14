import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Button = ({ onPress, text, disabled }) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#4AA8EA',
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 24,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default Button;
