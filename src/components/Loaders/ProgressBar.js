import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const ProgressBar = ({
  progress = 0,
  height = 10,
  backgroundColor = '#eee',
  progressColor = '#4aa8ea',
  showPercentage = false,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View
        style={[
          styles.progress,
          { width: `${clampedProgress}%`, backgroundColor: progressColor },
        ]}
      />
      {showPercentage && (
        <Text style={styles.percentage}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    height: '100%',
  },
  percentage: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: 12,
    color: '#000',
  },
});
