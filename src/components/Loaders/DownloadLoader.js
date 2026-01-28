import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

const RotatingLoader = ({ children, size = 28 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ rotate }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default RotatingLoader;
