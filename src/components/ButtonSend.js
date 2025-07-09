import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { ArrowUp } from 'lucide-react-native';

const ButtonSend = ({ onPress }) => {
  const styles = StyleSheet.create({
    button: {
      borderWidth: 1,
      padding: 5,
      backgroundColor: 'black',
      borderColor: 'black',
      borderRadius: 20,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <ArrowUp color="white" size={20} />
    </TouchableOpacity>
  );
};

export default ButtonSend;
