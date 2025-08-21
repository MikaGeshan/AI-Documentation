import React from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import CardExplore from '../../../components/Cards/CardExplore';
import Config from '../../../App/Network';

const ViewExploreListComponent = ({
  displayData,
  isEditing,
  isDeleting,
  isRefreshing,
  onRefresh,
  navigation,
  handleDeleteExplore,
}) => {
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
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
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
                  onPressDelete={() => handleDeleteExplore(item.id)}
                />
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewExploreListComponent;
