import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';

const Option = ({
  visible,
  onClose,
  title,
  message,
  option1Text,
  option2Text,
  onOption1,
  onOption2,
}) => {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    box: {
      width: Dimensions.get('window').width * 0.8,
      backgroundColor: 'white',
      padding: 24,
      borderRadius: 12,
      elevation: 5,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#333',
    },
    message: {
      fontSize: 14,
      color: '#444',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    button: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#4aa8ea',
      borderRadius: 8,
    },
    buttonText: {
      color: 'white',
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.box}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              <Text style={styles.message}>{message}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={onOption1}>
                  <Text style={styles.buttonText}>{option1Text}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={onOption2}>
                  <Text style={styles.buttonText}>{option2Text}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default Option;
