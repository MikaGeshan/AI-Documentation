import { StyleSheet, TextInput, View } from 'react-native';
import React from 'react';

const InputText = ({
  value,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  style,
  onPress,
  ...props
}) => {
  const styles = StyleSheet.create({
    inputTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      borderColor: '#E6E4E2',
      paddingHorizontal: 10,
      backgroundColor: '#FFFFFF',
      width: '100%',
    },
    inputText: {
      flex: 1,
      color: 'black',
      fontSize: 15,
      paddingVertical: 16,
      paddingHorizontal: 10,
    },
  });

  return (
    <View style={[styles.inputTextContainer, style]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#898989"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        value={value}
        onPress={onPress}
        style={styles.inputText}
        {...props}
      />
    </View>
  );
};

export default InputText;
