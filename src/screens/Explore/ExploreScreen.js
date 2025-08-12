import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../hooks/auth/useAuthStore';
import FloatingActionButton from '../../components/Buttons/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import Config from '../../configs/config';
import axios from 'axios';
import ExploreSection from '../../components/Sections/ExploreSection';
import { useEditingStore } from '../../hooks/ComponentHooks/useEditingStore';
import { useDeletingStore } from '../../hooks/ComponentHooks/useDeletingStore';

const ExploreScreen = () => {
  const navigation = useNavigation();
  const isAdmin = useAuthStore(state => state.isAdmin);
  const { setIsEditing } = useEditingStore();
  const { setIsDeleting } = useDeletingStore();
  const [exploreData, setExploreData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
    setRefreshing(true);
    await getContent();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    getContent();
  }, []);

  const styles = StyleSheet.create({
    safeView: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
  });

  return (
    <SafeAreaView style={styles.safeView}>
      <KeyboardAvoidingView style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ExploreSection
            title="By Filter"
            data={exploreData}
            filterFn={item => item.filter?.toLowerCase().includes('mobile')}
            emptyText="No items available at the moment."
            onSeeAll={() => handleNavigation('mobile')}
            navigation={navigation}
            styles={styles}
          />

          <ExploreSection
            title="By Title"
            data={exploreData}
            sortFn={(a, b) => a.title.localeCompare(b.title)}
            emptyText="No items available at the moment."
            onSeeAll={() =>
              handleNavigation('all', { field: 'title', order: 'asc' })
            }
            navigation={navigation}
            styles={styles}
          />

          <ExploreSection
            title="Explore All"
            data={exploreData}
            sortFn={(a, b) => Number(a.id) - Number(b.id)}
            emptyText="No items available at the moment."
            onSeeAll={() =>
              handleNavigation('all', { field: 'id', order: 'asc' })
            }
            navigation={navigation}
            styles={styles}
          />
        </ScrollView>

        {isAdmin && (
          <FloatingActionButton
            mainIcon={{ name: 'Plus', color: '#fff', size: 30 }}
            actions={[
              {
                iconName: 'BookPlus',
                iconColor: '#fff',
                iconSize: 25,
                onPress: () =>
                  navigation.navigate('CreateExplore', { onRefresh }),
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
            ]}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ExploreScreen;
