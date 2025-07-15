import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon'; // asumsi path Icon kamu

const Accordion = ({ title, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const [expanded, setExpanded] = useState(false); // lokal state untuk ikon
  const isExpanded = useSharedValue(false);
  const height = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(height.value, { duration: 300 }),
    overflow: 'hidden',
  }));

  const toggleAccordion = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    isExpanded.value = newExpanded;
    height.value = newExpanded ? contentHeight : 0;
  };

  const onLayoutContent = event => {
    const layoutHeight = event.nativeEvent.layout.height;
    if (contentHeight === 0) {
      setContentHeight(layoutHeight);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          color="#333"
          size={20}
        />
      </TouchableOpacity>

      <Animated.View style={[animatedStyle]}>
        <View onLayout={onLayoutContent} style={styles.contentWrapper}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
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

export default Accordion;
