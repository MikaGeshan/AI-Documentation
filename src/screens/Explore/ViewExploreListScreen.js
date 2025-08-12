import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Config from '../../configs/config';
import CardExplore from '../../components/Cards/CardExplore';
import { useEditingStore } from '../../hooks/ComponentHooks/useEditingStore';
import { useDeletingStore } from '../../hooks/ComponentHooks/useDeletingStore';

const ViewExploreListScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { filter, sort } = route.params || {};

  const { isEditing } = useEditingStore();
  const { isDeleting } = useDeletingStore();

  const [exploreData, setExploreData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getContent = async () => {
    try {
      const response = await axios.get(
        `${Config.API_URL}/api/explore-contents`,
      );
      setExploreData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch explore content:', error);
    }
  };

  const handleDeleteExplore = async () => {
    console.log('Deleting Explore Item');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getContent();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    getContent();
  }, []);

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
  }, [exploreData, filter, sort]);

  const styles = StyleSheet.create({
    safeView: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollView: { flex: 1, padding: 16 },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#666',
      marginTop: 40,
    },
    cardWrapper: {
      marginBottom: 12,
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
          {displayData.length === 0 ? (
            <Text style={styles.emptyText}>No explore items available.</Text>
          ) : (
            displayData.map((item, index) => (
              <View key={index} style={styles.cardWrapper}>
                <CardExplore
                  title={item.title}
                  filter={item.filter}
                  s
                  description={item.description}
                  image={`${Config.API_URL}${item.image}`}
                  isEditing={isEditing}
                  isDeleting={isDeleting}
                  onPress={() =>
                    navigation.navigate('ViewExplore', {
                      id: item.id,
                      web_link: item.web_link,
                    })
                  }
                  onPressEdit={() =>
                    navigation.navigate('EditExplore', {
                      exploreItem: item,
                      onRefresh,
                    })
                  }
                  onPressDelete={handleDeleteExplore}
                />
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewExploreListScreen;
