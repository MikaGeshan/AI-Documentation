import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { pickDirectory } from '@react-native-documents/picker';
import { Icon } from '../Icons/Icon';

const UploadDirectoryModal = ({ visible, onClose, onUpload, folderId }) => {
  const [selectedUri, setSelectedUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickDirectory = async () => {
    try {
      const { uri } = await pickDirectory({
        requestLongTermAccess: false,
      });
      setSelectedUri(uri);
    } catch (err) {
      console.error('Directory pick error:', err);
    }
  };

  const handleSend = async () => {
    if (!selectedUri) return;
    setLoading(true);

    try {
      await onUpload(selectedUri, folderId);
      setSelectedUri(null);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      position: 'relative',
    },
    closeIcon: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    pickButton: {
      borderWidth: 2,
      borderColor: '#4AA8EA',
      borderRadius: 12,
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    pickText: {
      color: '#4AA8EA',
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 10,
    },
    sendButton: {
      backgroundColor: '#4AA8EA',
      padding: 10,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Icon name="X" size={20} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Upload Directory</Text>

          <TouchableOpacity
            style={styles.pickButton}
            onPress={handlePickDirectory}
          >
            <Icon name="FolderOpen" size={48} color="#4AA8EA" />
            <Text style={styles.pickText}>
              {selectedUri ? selectedUri : 'Pick a folder'}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color="#4AA8EA" />
          ) : (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!selectedUri}
            >
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UploadDirectoryModal;
