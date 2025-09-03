import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import React from 'react';
import { Icon } from '../Icons/Icon';

const CardExplore = ({
  title,
  filter,
  image,
  onPress,
  onPressEdit,
  isEditing,
  onPressDelete,
  isDeleting,
  borderColor,
}) => {
  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      marginHorizontal: 6,
      borderColor: borderColor,
      borderWidth: 1,
      borderRadius: 10,
    },
    imageContainer: {
      width: 150,
      height: 150,
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
      alignItems: 'flex-start',
      width: '100%',
    },
    title: {
      color: 'black',
      fontSize: 16,
      fontFamily: 'poppins',
      fontWeight: 'bold',
      textAlign: 'left',
    },
    filter: {
      color: '#666',
      fontSize: 13,
      marginTop: 2,
      textAlign: 'left',
    },
    iconContainer: {
      flexDirection: 'row',
      marginTop: 8,
    },
    iconButton: {
      marginRight: 12,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          {image ? (
            <>
              {console.log('Image loaded:', image)}
              <Image source={{ uri: image }} style={styles.image} />
            </>
          ) : (
            <Text>No image available</Text>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          {!!filter && <Text style={styles.filter}>{filter}</Text>}
        </View>
        {(isEditing || isDeleting) && (
          <View style={styles.iconContainer}>
            {isEditing && (
              <Pressable onPress={onPressEdit} style={styles.iconButton}>
                <Icon name="SquarePen" size={20} color="black" />
              </Pressable>
            )}
            {isDeleting && (
              <Pressable onPress={onPressDelete}>
                <Icon name="Trash" size={20} color="red" />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CardExplore;
