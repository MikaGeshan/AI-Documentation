import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Icon } from '../Icons/Icon';

const ButtonSend = ({
  onPress,
  iconName = 'ArrowUp',
  iconColor = 'white',
  iconSize = 20,
}) => {
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
      <Icon name={iconName} color={iconColor} size={iconSize} />
    </TouchableOpacity>
  );
};

export default ButtonSend;
