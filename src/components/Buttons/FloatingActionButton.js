import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Icon } from '../Icons/Icon';

const FloatingActionButton = ({
  mainIcon = { name: 'Plus', color: '#fff', size: 24 },
  actions = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const open = useSharedValue(0);

  const toggleFAB = () => {
    const next = expanded ? 0 : 1;
    open.value = withTiming(next);
    setExpanded(!expanded);
  };

  const rotationStyle = useAnimatedStyle(() => {
    const rotate = interpolate(open.value, [0, 1], [0, 45], Extrapolate.CLAMP);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      zIndex: 100,
      alignItems: 'flex-end',
    },
    mainButton: {
      backgroundColor: '#4AA8EA',
      padding: 16,
      borderRadius: 30,
      elevation: 5,
    },
    actionButton: {
      position: 'absolute',
      right: 0,
    },
    button: {
      backgroundColor: '#4AA8EA',
      padding: 14,
      borderRadius: 25,
      marginBottom: 8,
      elevation: 4,
    },
  });

  return (
    <Animated.View style={styles.container}>
      {expanded &&
        actions.slice(0, 4).map((action, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.delay(index * 50)}
            exiting={FadeOutDown}
            style={[styles.actionButton, { bottom: (index + 1) * 70 + 20 }]}
          >
            <Pressable style={styles.button} onPress={action.onPress}>
              <Icon
                name={action.iconName}
                color={action.iconColor || '#fff'}
                size={action.iconSize || 20}
              />
            </Pressable>
          </Animated.View>
        ))}

      <Pressable style={styles.mainButton} onPress={toggleFAB}>
        <Animated.View style={rotationStyle}>
          <Icon
            name={mainIcon.name}
            color={mainIcon.color}
            size={mainIcon.size}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default FloatingActionButton;
