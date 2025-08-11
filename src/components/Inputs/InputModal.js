import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Icon } from '../Icons/Icon';

const InputModal = ({
  visible,
  onClose,
  onSubmit,
  message = 'Text Input Message:',
  placeholder = 'Type here...',
  buttonColor = '#4AA8EA',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handlePress = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue.trim());
    setInputValue('');
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      elevation: 5,
    },
    message: {
      fontSize: 16,
      marginBottom: 10,
      color: '#333',
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    button: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 8,
      zIndex: 1,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.message}>{message}</Text>

          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={inputValue}
            onChangeText={setInputValue}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name={'X'} size={20} color={'black'} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default InputModal;
