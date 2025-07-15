import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Header = ({ title, description }) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#EFEDEC',
      borderBottomWidth: 2,
      borderBottomColor: '#ECEAE9',
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 10,
    },
    textContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    text: {
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '500',
    },
    subtext: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '300',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{title}</Text>
        <Text style={styles.subtext}>{description}</Text>
      </View>
    </SafeAreaView>
  );
};

export default Header;
