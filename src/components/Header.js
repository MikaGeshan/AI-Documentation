import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Header = () => {
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Mobile Documentation Chatbot</Text>
      </View>
    </SafeAreaView>
  );
};

export default Header;
