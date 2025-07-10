import { StyleSheet, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import ButtonSend from './ButtonSend';

const InputBox = ({ onSend }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsLoading(true);
    const messageToSend = trimmed;
    setText('');

    try {
      await onSend(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    textInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      borderColor: '#E6E4E2',
      paddingHorizontal: 10,
      backgroundColor: '#FFFFFF',
    },
    textInput: {
      flex: 1,
      color: 'black',
      fontSize: 15,
      paddingVertical: 20,
      paddingHorizontal: 10,
    },
  });

  return (
    <View style={styles.textInputContainer}>
      <TextInput
        style={styles.textInput}
        placeholder="Ask Anything"
        placeholderTextColor="#898989"
        multiline
        value={text}
        onChangeText={setText}
      />
      <ButtonSend
        onPress={sendMessage}
        iconName={isLoading ? 'Square' : 'ArrowUp'}
      />
    </View>
  );
};

export default InputBox;
