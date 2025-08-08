import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';

const EditExploreScreen = () => {
  const styles = StyleSheet.create({
    safeView: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.safeView}>
      <KeyboardAvoidingView style={styles.keyboardView}>
        <View>
          <Text>EditExploreScreen</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditExploreScreen;
