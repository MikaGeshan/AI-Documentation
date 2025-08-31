import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const Loader = ({ visible }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [visible, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    spinnerContainer: {
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      width: 100,
      height: 100,
    },
    spinner: {
      width: 50,
      height: 50,
      borderWidth: 5,
      borderRadius: 25,
      borderTopColor: '#4aa8ea',
      borderRightColor: '#4aa8ea',
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.spinnerContainer}>
          <Animated.View style={[styles.spinner, animatedStyle]} />
        </View>
      </View>
    </Modal>
  );
};

export default Loader;
