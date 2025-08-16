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
import React, { useState, useEffect } from 'react';
import InputText from '../../../components/Inputs/InputText';
import Dropdown from '../../../components/Selects/Dropdown';
import Button from '../../../components/Buttons/Button';
import Config from '../../../configs/config';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RegisterActions } from '../../Authentication/Stores/RegisterActions';

const EditExploreScreen = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [originalData, setOriginalData] = useState({});

  const navigation = useNavigation();
  const route = useRoute();
  const { onRefresh, exploreItem } = route.params || {};
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

  useEffect(() => {
    if (exploreItem) {
      const filtersRaw = exploreItem.filter || '';
      const filtersArray = filtersRaw
        ? filtersRaw.split(',').filter(f => f.trim() !== '')
        : [];

      const initialData = {
        title: exploreItem.title || '',
        description: exploreItem.description || '',
        web_link: exploreItem.web_link || '',
        filters: filtersArray,
        image: exploreItem.image || '',
      };

      setFormData('title', initialData.title);
      setFormData('description', initialData.description);
      setFormData('web_link', initialData.web_link);
      setFormData('filters', initialData.filters);
      setFormData('image', initialData.image);
      setOriginalData(initialData);
    }
  }, [exploreItem, setFormData]);

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

    const changed =
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.web_link !== originalData.web_link ||
      (formData.filters || []).join(',') !==
        (originalData.filters || []).join(',') ||
      !!imageFile;

    if (!changed) {
      Alert.alert('No Changes', 'Nothing to update.');
      return;
    }

    try {
      const form = new FormData();
      form.append('_method', 'PUT');
      console.log('Form Data:', formData);
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('filter', formData.filters?.join(',') || '');
      form.append('web_link', formData.web_link);

      if (imageFile) {
        form.append('image', imageFile);
      }

      await axios.post(
        `${Config.API_URL}/api/update-explore/${exploreItem.id}`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
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
      console.error('Update error:', error.response?.data || error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update explore item',
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
          message={'Successfully Updated Explore Item'}
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
              source={{
                uri: formData.image.startsWith('http')
                  ? formData.image
                  : `${Config.API_URL}${formData.image}`,
              }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          {errors.image && <Text style={styles.errors}>{errors.image}</Text>}
        </View>

        <Button text="Update" onPress={handleSubmit} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditExploreScreen;
