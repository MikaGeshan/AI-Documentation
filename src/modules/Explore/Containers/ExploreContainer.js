import React, { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ExploreAction } from '../Stores/ExploreAction';
import SignInActions from '../../Authentication/Stores/SignInActions';
import ExploreComponent from '../Components/ExploreComponent';

const ExploreContainer = () => {
  const navigation = useNavigation();
  const isAdmin = SignInActions(state => state.isAdmin);

  const {
    exploreData,
    getContent,
    setIsEditing,
    setIsDeleting,
    isRefreshing,
    setIsRefreshing,
  } = ExploreAction();

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
  }, [setIsRefreshing, getContent]);

  useEffect(() => {
    getContent();
  }, [getContent]);

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
