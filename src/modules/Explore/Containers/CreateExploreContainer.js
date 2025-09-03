import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

import CreateExploreComponent from '../Components/CreateExploreComponent';
import { CreateExploreAction } from '../Stores/CreateExploreAction';
import Config from '../../../App/Network';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';

const CreateExploreContainer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onRefresh } = route.params || {};

  const {
    formData,
    errors,
    setFormData,
    validateForm,
    resetForm,
    showSuccessDialog,
    setShowSuccessDialog,
    showErrorDialog,
    setShowErrorDialog,
  } = CreateExploreAction();

  useFocusEffect(
    React.useCallback(() => {
      setShowSuccessDialog(false);
      setShowErrorDialog(false);
    }, [setShowSuccessDialog, setShowErrorDialog]),
  );

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

      setShowSuccessDialog(true);

      setTimeout(() => {
        setShowSuccessDialog(false);
        navigation.goBack();
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error.response?.data || error);

      setShowErrorDialog(true);

      setTimeout(() => {
        setShowErrorDialog(false);
      }, 3000);
    }
  };

  return (
    <>
      <CreateExploreComponent
        formData={formData}
        errors={errors}
        setFormData={setFormData}
        getFilter={getFilter}
        onPickImage={imagePicker}
        onSubmit={handleSubmit}
      />

      {showSuccessDialog && (
        <SuccessDialog
          message={'Successfully Created Explore Item'}
          visible={true}
        />
      )}
      {showErrorDialog && (
        <ErrorDialog message={'Error Creating Explore Item'} visible={true} />
      )}
    </>
  );
};

export default CreateExploreContainer;
