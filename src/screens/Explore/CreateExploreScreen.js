import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import InputText from '../../components/Inputs/InputText';
import Dropdown from '../../components/Selects/Dropdown';
import Button from '../../components/Buttons/Button';
import Config from '../../configs/config';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import SuccessDialog from '../../components/Alerts/SuccessDialog';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RegisterActions } from '../Authentication/Stores/RegisterActions';

const CreateExploreScreen = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const { onRefresh } = route.params || {};
  const {
    formData,
    errors,
    setFormData,
    validateForm,
    resetForm,
    // setErrors,
    // showPassword,
    // togglePassword,
    // showConfirmPassword,
    // setShowConfirmPassword,
    // showSuccessDialog,
    // setShowSuccessDialog,
    // isLoading,
    // setIsLoading,
  } = RegisterActions();

  const imagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
      });

      if (result.didCancel || !result.assets?.length) return;

      const asset = result.assets[0];

      setFormData('image', asset.uri);
      setImageFile({
        uri:
          Platform.OS === 'android'
            ? asset.uri
            : asset.uri.replace('file://', ''),
        name: asset.fileName || 'image.jpg',
        type: asset.type || 'image/jpeg',
      });
    } catch (err) {
      console.error('Image pick error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const form = new FormData();

      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('filter', formData.filters?.join(',') || '');
      form.append('web_link', formData.web_link);

      if (imageFile) {
        form.append('image', imageFile);
      }

      await axios.post(`${Config.API_URL}/api/create-explore`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      resetForm();
      setImageFile(null);
      if (typeof onRefresh === 'function') {
        onRefresh();
      }

      setShowDialog(true);

      setTimeout(() => {
        setShowDialog(false);
        navigation.goBack();
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error.response?.data || error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create explore',
      );
    }
  };

  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
      padding: 8,
    },
    inputGroup: {
      padding: 8,
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    imagePreview: {
      width: '100%',
      height: 180,
      borderRadius: 8,
      marginTop: 8,
    },
    uploadButton: {
      paddingVertical: 10,
      backgroundColor: '#eee',
      alignItems: 'center',
      borderRadius: 6,
    },
    uploadText: {
      fontSize: 14,
      color: '#333',
    },
    errors: {
      color: 'red',
      marginTop: 4,
    },
    errorBorder: {
      borderWidth: 1,
      borderColor: 'red',
      borderRadius: 12,
    },
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView style={styles.keyboardContainer}>
        <SuccessDialog
          message={'Successfully Created Explore Item'}
          visible={showDialog}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.text}>Title</Text>
          <View style={errors.title && styles.errorBorder}>
            <InputText
              placeholder="Add a Title"
              value={formData.title}
              onChangeText={text => setFormData('title', text)}
              error={errors.title}
            />
          </View>
          {errors.title && <Text style={styles.errors}>{errors.title}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.text}>Description</Text>
          <View style={errors.description && styles.errorBorder}>
            <InputText
              placeholder="Add a Description Max 100 Characters"
              value={formData.description}
              onChangeText={text => setFormData('description', text)}
              error={errors.description}
              multiline={true}
              maxLength={100}
            />
          </View>
          {errors.description && (
            <Text style={styles.errors}>{errors.description}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.text}>Website or Documentation URL</Text>
          <View style={errors.web_link && styles.errorBorder}>
            <InputText
              placeholder="Provide link for the documentation"
              value={formData.web_link}
              onChangeText={text => setFormData('web_link', text)}
              error={errors.web_link}
            />
          </View>
          {errors.web_link && (
            <Text style={styles.errors}>{errors.web_link}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.text}>Filters</Text>
          <View style={errors.filters && styles.errorBorder}>
            <Dropdown
              selectedValue={formData.filters}
              onValueChange={valueArray => setFormData('filters', valueArray)}
              error={errors.filters}
            />
          </View>
          {errors.filters && (
            <Text style={styles.errors}>{errors.filters}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.text}>Upload Cover</Text>
          <TouchableOpacity
            style={[styles.uploadButton, errors.image && styles.errorBorder]}
            onPress={imagePicker}
          >
            <Text style={styles.uploadText}>
              {formData.image ? 'Change Image' : 'Pick an Image'}
            </Text>
          </TouchableOpacity>
          {formData.image && (
            <Image
              source={{ uri: formData.image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          {errors.image && <Text style={styles.errors}>{errors.image}</Text>}
        </View>

        <Button text="Create" onPress={handleSubmit} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateExploreScreen;
