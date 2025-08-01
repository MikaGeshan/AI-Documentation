import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Icon } from '../Icons/Icon';

const ButtonCall = ({ name, onPress, backgroundColor }) => {
  const styles = StyleSheet.create({
    buttonContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
      <Icon name={name} size={24} color={'#FFF'} />
    </TouchableOpacity>
  );
};

export default ButtonCall;
