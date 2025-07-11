import { StyleSheet, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import ButtonSend from './ButtonSend';
import { abortDeepSeekRequest } from '../hooks/abortDeepSeekResponse';

const InputBox = ({ onSend }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState('');

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsProcessing(true);
    console.log(' Mode: SEND — Mengirim pertanyaan:', trimmed);
    const messageToSend = trimmed;
    setText('');

    try {
      await onSend(messageToSend);
    } finally {
      setIsProcessing(false);
      console.log('Status: SELESAI — Selesai mengirim atau dibatalkan');
    }
  };

  const handleButtonPress = () => {
    if (isProcessing) {
      console.log('Mode: STOP — Membatalkan permintaan...');
      abortDeepSeekRequest();
      setIsProcessing(false);
    } else {
      sendMessage();
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
        onPress={handleButtonPress}
        iconName={isProcessing ? 'Square' : 'ArrowUp'}
      />
    </View>
  );
};

export default InputBox;
