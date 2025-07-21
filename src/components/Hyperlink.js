import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Hyperlink = ({ text }) => {
  const styles = StyleSheet.create({
    text: {
      color: '#4aa8ea',
    },
  });

  return (
    <TouchableOpacity>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default Hyperlink;
