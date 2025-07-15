import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Button = ({ onPress, text }) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#4aa8ea',
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 24,
      minWidth: 200,
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
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default Button;
