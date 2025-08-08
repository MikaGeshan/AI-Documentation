import { Image, StyleSheet, Text, View, Platform } from 'react-native';
import React from 'react';
import ExploreButton from '../Buttons/ExploreButton';

const CardExplore = ({ title, filter, description, image, onPress }) => {
  const styles = StyleSheet.create({
    container: {
      width: 170,
      backgroundColor: '#FFF',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginHorizontal: 6,

      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    imageContainer: {
      width: 110,
      height: 110,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#FEF4E2',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    infoContainer: {
      marginTop: 10,
      alignItems: 'center',
      width: '100%',
    },
    title: {
      color: 'black',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    filter: {
      color: '#666',
      fontSize: 12,
      marginTop: 2,
      textAlign: 'center',
    },
    description: {
      color: '#333',
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    buttonContainer: {
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        {!!filter && <Text style={styles.filter}>{filter}</Text>}
        <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
          {description}
        </Text>
        <View style={styles.buttonContainer}>
          <ExploreButton onPress={onPress} />
        </View>
      </View>
    </View>
  );
};

export default CardExplore;
