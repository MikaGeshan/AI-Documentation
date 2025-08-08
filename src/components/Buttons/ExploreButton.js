import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Icon } from '../Icons/Icon';

const ExploreButton = ({ onPress }) => {
  const styles = StyleSheet.create({
    buttonContainer: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignSelf: 'center',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 14,
      color: 'black',
      marginRight: 4,
    },
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>Explore Now!</Text>
        <Icon name="ChevronRight" color="black" size={16} />
      </View>
    </TouchableOpacity>
  );
};

export default ExploreButton;
