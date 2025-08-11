import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '../Icons/Icon';

const Accordion = ({ title, children, isExpanded, onToggle }) => {
  const [measured, setMeasured] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const expandedShared = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(expandedShared.value ? contentHeight : 0, {
      duration: 300,
    }),
    overflow: 'hidden',
  }));

  useEffect(() => {
    if (measured) {
      expandedShared.value = isExpanded ? 1 : 0;
    }
  }, [isExpanded, measured, contentHeight, expandedShared]);

  const onLayoutContent = e => {
    if (!measured) {
      setContentHeight(e.nativeEvent.layout.height);
      setMeasured(true);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 10,
      borderRadius: 10,
      backgroundColor: '#E6E6E6',
      overflow: 'hidden',
    },
    header: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#E6E6E6',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
    },
    contentWrapper: {
      padding: 16,
      backgroundColor: '#E6E6E6',
    },
    hiddenMeasure: {
      position: 'absolute',
      opacity: 0,
      zIndex: -1,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon
          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          color="#333"
          size={20}
        />
      </TouchableOpacity>

      {!measured && (
        <View style={styles.hiddenMeasure} onLayout={onLayoutContent}>
          <View style={styles.contentWrapper}>{children}</View>
        </View>
      )}

      <Animated.View style={animatedStyle}>
        <View style={styles.contentWrapper}>{children}</View>
      </Animated.View>
    </View>
  );
};

export default Accordion;
