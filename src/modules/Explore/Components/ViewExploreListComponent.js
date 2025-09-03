import React from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  RefreshControl,
  FlatList,
  View,
} from 'react-native';
import CardExplore from '../../../components/Cards/CardExplore';

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
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      color: '#666',
      marginTop: 40,
    },
    listContent: {
      padding: 8,
    },
    cardWrapper: {
      flex: 1,
      margin: 8,
    },
  });

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <CardExplore
        title={item.title}
        filter={item.filter}
        description={item.description}
        image={item.image}
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
  );

  return (
    <SafeAreaView style={styles.safeView}>
      <KeyboardAvoidingView style={styles.keyboardView}>
        {displayData.length === 0 ? (
          <Text style={styles.emptyText}>No explore items available.</Text>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={index => index.toString()}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ViewExploreListComponent;
