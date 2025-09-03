import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { EditExploreAction } from '../Stores/EditExploreAction';
import EditExploreComponent from '../Components/EditExploreComponent';
import Config from '../../../App/Network';
import SuccessDialog from '../../../components/Alerts/SuccessDialog';
import ErrorDialog from '../../../components/Alerts/ErrorDialog';

const EditExploreContainer = ({ route, navigation }) => {
  const { onRefresh, exploreItem } = route.params || {};
  const {
    formData,
    setFormData,
    errors,
    imageFile,
    setImageFile,
    originalData,
    setOriginalData,
    validateForm,
    resetForm,
    showSuccessDialog,
    setShowSuccessDialog,
    showErrorDialog,
    setShowErrorDialog,
  } = EditExploreAction();

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
  }, [exploreItem, setFormData, setOriginalData]);

  const imagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
      });

      if (result.didCancel || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.uri) {
        setFormData('image', asset.uri);
        setImageFile({
          uri:
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', ''),
          name: asset.fileName || 'image.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (err) {
      console.error('Image pick error:', err);
      setShowErrorDialog(true);
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
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('filter', formData.filters?.join(',') || '');
      form.append('web_link', formData.web_link);

      if (imageFile) form.append('image', imageFile);

      await axios.post(
        `${Config.API_URL}/api/update-explore/${exploreItem.id}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      resetForm();
      setImageFile(null);

      if (typeof onRefresh === 'function') onRefresh();
      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        navigation.goBack();
      }, 3000);
    } catch (error) {
      console.error('Update error:', error.response?.data || error);
      setShowErrorDialog(true);
    }
  };

  return (
    <>
      <EditExploreComponent
        formData={formData}
        errors={errors}
        setFormData={setFormData}
        imagePicker={imagePicker}
        handleSubmit={handleSubmit}
      />
      {showSuccessDialog && (
        <SuccessDialog message={'Success Updated Explorer'} visible={true} />
      )}
      {showErrorDialog && (
        <ErrorDialog message={'Failed to Update the Explorer'} visible={true} />
      )}
    </>
  );
};

export default EditExploreContainer;
