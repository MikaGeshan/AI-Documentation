import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ExploreAction } from '../Stores/ExploreAction';
import SignInActions from '../../Authentication/Stores/SignInActions';
import ExploreComponent from '../Components/ExploreComponent';
import Loader from '../../../components/Loaders/Loader';

const ExploreContainer = () => {
  const navigation = useNavigation();
  const isAdmin = SignInActions(state => state.isAdmin);
  const initialLoad = useRef(false);

  const {
    exploreData,
    getContent,
    setIsEditing,
    setIsDeleting,
    isRefreshing,
    setIsRefreshing,
    isLoading,
    setIsLoading,
  } = ExploreAction();

  console.log('explore data retrieved', exploreData);

  const handleNavigation = (
    filter = 'all',
    sort = { field: 'id', order: 'asc' },
  ) => {
    navigation.navigate('ViewExploreList', { filter, sort });
  };

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await getContent();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing, getContent]);

  // Initial load function with loading state
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await getContent();
      initialLoad.current = true;
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, getContent]);

  useEffect(() => {
    if (!initialLoad.current) {
      loadData();
    }
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      if (initialLoad.current && navigation.isFocused()) {
        onRefresh();
      }
    }, [onRefresh, navigation]),
  );

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
    <>
      <ExploreComponent
        exploreData={exploreData}
        isAdmin={isAdmin}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        handleNavigation={handleNavigation}
        fabActions={fabActions}
        navigation={navigation}
      />
      <Loader visible={isLoading} />
    </>
  );
};

export default ExploreContainer;
