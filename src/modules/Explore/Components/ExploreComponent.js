import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import React from 'react';
import FloatingActionButton from '../../../components/Buttons/FloatingActionButton';
import ExploreSection from '../../../components/Sections/ExploreSection';

const ExploreComponent = ({
  exploreData,
  isAdmin,
  isRefreshing,
  onRefresh,
  handleNavigation,
  fabActions,
  navigation,
}) => {
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
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
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
            actions={fabActions}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ExploreComponent;
