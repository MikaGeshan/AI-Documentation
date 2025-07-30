import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../Icons/Icon';

const Accordion = ({ title, children, isExpanded, onToggle }) => {
  const [contentHeight, setContentHeight] = useState(0);

  // ✅ ensure boolean state
  const expandedShared = useSharedValue(!!isExpanded);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(expandedShared.value ? contentHeight : 0, {
      duration: 300,
    }),
    overflow: 'hidden',
  }));

  useEffect(() => {
    expandedShared.value = !!isExpanded;
  }, [isExpanded]);

  const toggleAccordion = () => {
    onToggle?.(); // optional chaining for safety
  };

  const onLayoutContent = event => {
    const layoutHeight = event.nativeEvent.layout.height;
    if (contentHeight === 0) {
      setContentHeight(layoutHeight);
    }
  };

  const styles = StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderColor: '#ccc',
      marginBottom: 10,
    },
    header: {
      padding: 16,
      backgroundColor: '#f0f0f0',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    contentWrapper: {
      padding: 16,
      backgroundColor: '#fff',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon
          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          color="#333"
          size={20}
        />
      </TouchableOpacity>

      <Animated.View style={animatedStyle}>
        <View onLayout={onLayoutContent} style={styles.contentWrapper}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export default Accordion;
