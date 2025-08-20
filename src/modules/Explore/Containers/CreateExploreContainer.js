import React from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

import Config from '../../../configs/config';
import CreateExploreComponent from '../Components/CreateExploreComponent';
import { CreateExploreAction } from '../Stores/CreateExploreAction';

const CreateExploreContainer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onRefresh } = route.params || {};

  const {
    formData,
    errors,
    showDialog,
    setShowDialog,
    setFormData,
    validateForm,
    resetForm,
  } = CreateExploreAction();

  const imagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
      });

      if (result.didCancel || !result.assets?.length) return;

      const asset = result.assets[0];

      setFormData('image', {
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

  const getFilter = async () => {
    try {
      const result = await axios.get(
        `${Config.API_URL}/api/explore-get-filters`,
      );
      console.log('API Response:', result.data);
      return result.data?.filters || [];
    } catch (error) {
      console.error('Error fetching filters:', error);
      return [];
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting form:', formData);

    if (!validateForm()) return;
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('filter', formData.filters?.join(',') || '');
      form.append('web_link', formData.web_link);

      if (formData.image) {
        form.append('image', {
          uri: formData.image.uri,
          type: formData.image.type,
          name: formData.image.name,
        });
      }

      await axios.post(`${Config.API_URL}/api/create-explore`, form, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      resetForm();
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

  return (
    <CreateExploreComponent
      formData={formData}
      errors={errors}
      setFormData={setFormData}
      getFilter={getFilter}
      showDialog={showDialog}
      onPickImage={imagePicker}
      onSubmit={handleSubmit}
    />
  );
};

export default CreateExploreContainer;
