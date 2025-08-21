import React, { useEffect, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { ExploreAction } from '../Stores/ExploreAction';
import ViewExploreListComponent from '../Components/ViewExploreListComponent';
import Config from '../../../App/Network';

const ViewExploreListContainer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { filter, sort } = route.params || {};

  const {
    exploreData,
    displayData,
    setDisplayData,
    setExploreData,
    isEditing,
    isDeleting,
    isRefreshing,
    setIsRefreshing,
  } = ExploreAction();

  const getContent = useCallback(async () => {
    try {
      const response = await axios.get(
        `${Config.API_URL}/api/explore-contents`,
      );
      setExploreData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch explore content:', error);
    }
  }, [setExploreData]);

  const handleDeleteExplore = async id => {
    try {
      const response = await axios.delete(
        `${Config.API_URL}/api/delete-explore/${id}`,
      );
      if (response.status === 200) {
        console.log('Success', 'Explore item deleted successfully.');
        await onRefresh();
      } else {
        console.warn('Error', 'Failed to delete explore item.');
      }
    } catch (error) {
      console.error('Delete error:', error.response?.data || error);
      console.warn(
        'Error',
        error.response?.data?.message || 'Failed to delete explore item',
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getContent();
    setIsRefreshing(false);
  }, [getContent, setIsRefreshing]);

  useEffect(() => {
    getContent();
  }, [getContent]);

  useEffect(() => {
    let filtered = [...exploreData];

    if (filter && filter.toLowerCase() !== 'all') {
      filtered = filtered.filter(item =>
        item.filter?.toLowerCase().includes(filter.toLowerCase()),
      );
    }

    if (sort) {
      filtered.sort((a, b) => {
        if (sort.field === 'id') {
          return sort.order === 'asc'
            ? Number(a.id) - Number(b.id)
            : Number(b.id) - Number(a.id);
        }
        if (sort.field === 'title') {
          return sort.order === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return 0;
      });
    }

    setDisplayData(filtered);
  }, [exploreData, filter, setDisplayData, sort]);

  return (
    <ViewExploreListComponent
      displayData={displayData}
      isEditing={isEditing}
      isDeleting={isDeleting}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      navigation={navigation}
      handleDeleteExplore={handleDeleteExplore}
    />
  );
};

export default ViewExploreListContainer;
