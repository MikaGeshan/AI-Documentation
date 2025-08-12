import { ScrollView, StyleSheet, View, Text } from 'react-native';
import Hyperlink from '../../components/Buttons/Hyperlink';
import CardExplore from '../Cards/CardExplore';
import Config from '../../configs/config';

const ExploreSection = ({
  title,
  data,
  filterFn,
  sortFn,
  emptyText,
  onSeeAll,
  navigation,
}) => {
  const filtered = filterFn ? data.filter(filterFn) : data;
  const sorted = sortFn ? [...filtered].sort(sortFn) : filtered;

  const styles = StyleSheet.create({
    contentTitle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardWrapper: {
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
    <View>
      <View style={styles.contentTitle}>
        <Text style={styles.title}>{title}</Text>
        <Hyperlink text="See All" onPress={onSeeAll} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          sorted.map((item, index) => (
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
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ExploreSection;
