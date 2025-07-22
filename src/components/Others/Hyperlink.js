import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Hyperlink = ({ text, onPress }) => {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    text: {
      color: '#4aa8ea',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default Hyperlink;
