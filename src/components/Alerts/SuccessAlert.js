import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Dimensions, View } from 'react-native';
import Icon from '../Icons/Icon';

const { width } = Dimensions.get('window');

const SuccessAlert = ({ message = 'Success!', onHide }) => {
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 16,
      duration: 400,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (onHide) onHide();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [slideAnim, onHide]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      zIndex: 999,
      alignItems: 'flex-end',
      paddingHorizontal: 16,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
      borderColor: '#2e7d32',
      borderWidth: 2,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      maxWidth: 300,
    },
    icon: {
      marginRight: 10,
    },
    message: {
      color: '#2e7d32',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.toast, { left: slideAnim }]}>
        <Icon name="BadgeCheck" size={24} color="#2e7d32" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export default SuccessAlert;
