import React, { useEffect, useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import Config from '../../../configs/config';
import axios from 'axios';
import { useEditingStore } from '../../../hooks/ComponentHooks/useEditingStore';
import { useDeletingStore } from '../../../hooks/ComponentHooks/useDeletingStore';
import { useRefreshStore } from '../../../hooks/ComponentHooks/useRefreshStore';
import SignInActions from '../../Authentication/Stores/SignInActions';
import ExploreComponent from '../Components/ExploreComponent';

const ExploreContainer = () => {
  const navigation = useNavigation();
  const isAdmin = SignInActions(state => state.isAdmin);
  const { setIsEditing } = useEditingStore();
  const { setIsDeleting } = useDeletingStore();
  const { isRefreshing, setIsRefreshing } = useRefreshStore();

  const [exploreData, setExploreData] = useState([]);

  const getContent = async () => {
    try {
      const response = await axios.get(
        `${Config.API_URL}/api/explore-contents`,
      );
      setExploreData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch explore content:', error);
    }
  };

  const handleNavigation = (
    filter = 'all',
    sort = { field: 'id', order: 'asc' },
  ) => {
    navigation.navigate('ViewExploreList', { filter, sort });
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getContent();
    setIsRefreshing(false);
  }, [setIsRefreshing]);

  useEffect(() => {
    getContent();
  }, []);

  const fabActions = [
    {
      iconName: 'BookPlus',
      iconColor: '#fff',
      iconSize: 25,
      onPress: () => navigation.navigate('CreateExplore', { onRefresh }),
    },
    {
      iconName: 'NotebookPen',
      iconColor: '#fff',
      iconSize: 25,
      onPress: () => {
        setIsEditing(true);
        setIsDeleting(true);
        handleNavigation('all', { field: 'id', order: 'asc' });
      },
    },
  ];

  return (
    <ExploreComponent
      exploreData={exploreData}
      isAdmin={isAdmin}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      handleNavigation={handleNavigation}
      fabActions={fabActions}
      navigation={navigation}
    />
  );
};

export default ExploreContainer;
