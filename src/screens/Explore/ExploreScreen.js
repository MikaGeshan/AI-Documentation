import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../hooks/auth/useAuthStore';
import FloatingActionButton from '../../components/Buttons/FloatingActionButton';
import CardExplore from '../../components/Cards/CardExplore';
import { useNavigation } from '@react-navigation/native';
import Config from '../../configs/config';
import axios from 'axios';

const ExploreScreen = () => {
  const navigation = useNavigation();
  const isAdmin = useAuthStore(state => state.isAdmin);
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
    scrollContent: {
      padding: 12,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardWrapper: {
      width: '48%',
      marginBottom: 12,
      alignItems: 'center',
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#666',
      marginTop: 40,
    },
  });

  return (
    <SafeAreaView style={styles.safeView}>
      <KeyboardAvoidingView style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {exploreData.length === 0 ? (
            <Text style={styles.emptyText}>No explore items available.</Text>
          ) : (
            <View style={styles.row}>
              {exploreData.map((item, index) => (
                <View key={index} style={styles.cardWrapper}>
                  <CardExplore
                    title={item.title}
                    filter={item.filter}
                    description={item.description}
                    image={`${Config.API_URL}${item.image}`}
                    onPress={() =>
                      navigation.navigate('ViewExplore', {
                        id: item.id,
                        web_link: item.web_link,
                      })
                    }
                  />
                </View>
              ))}
            </View>
          )}
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
                onPress: () => console.log('Mengedit Dokumentasi'),
              },
              {
                iconName: 'Trash',
                iconColor: '#fff',
                iconSize: 25,
                onPress: () => console.log('Menghapus Dokumentasi'),
              },
            ]}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ExploreScreen;
