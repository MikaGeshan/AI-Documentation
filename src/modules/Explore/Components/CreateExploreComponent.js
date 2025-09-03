import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import React from 'react';

import InputText from '../../../components/Inputs/InputText';
import Dropdown from '../../../components/Selects/Dropdown';
import Button from '../../../components/Buttons/Button';

const CreateExploreComponent = ({
  formData,
  errors,
  setFormData,
  onPickImage,
  onSubmit,
  getFilter,
}) => {
  const [filterItems, setFilterItems] = React.useState([]);

  React.useEffect(() => {
    const fetchFilters = async () => {
      const filters = await getFilter();
      console.log('Filters retrieved successfully:', filters);
      setFilterItems(filters);
    };
    fetchFilters();
  }, [getFilter]);

  const styles = StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    keyboardContainer: {
      flex: 1,
      padding: 8,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
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
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputGroup}>
            <Text style={styles.text}>Title</Text>
            <View style={errors.title && styles.errorBorder}>
              <InputText
                autoCapitalize={false}
                autoCorrect={false}
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
                autoCapitalize={false}
                autoCorrect={false}
                placeholder="Add a Description Max 200 Characters"
                value={formData.description}
                onChangeText={text => setFormData('description', text)}
                error={errors.description}
                multiline={true}
                maxLength={200}
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
                autoCapitalize={false}
                autoCorrect={false}
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
                items={filterItems}
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
              onPress={onPickImage}
            >
              <Text style={styles.uploadText}>
                {formData.image ? 'Change Image' : 'Pick an Image'}
              </Text>
            </TouchableOpacity>
            {formData.image?.uri && (
              <Image
                source={{ uri: formData.image.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
            {errors.image && <Text style={styles.errors}>{errors.image}</Text>}
          </View>
          <Button text="Create" onPress={onSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateExploreComponent;
