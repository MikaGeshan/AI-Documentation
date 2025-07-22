import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import Button from '../Buttons/Button';

const { width } = Dimensions.get('window');

const Dot = ({ index, scrollX, dotStyle }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const position = scrollX.value / width;
    const opacity = interpolate(
      position,
      [index - 1, index, index + 1],
      [0.3, 1, 0.3],
    );
    const scale = interpolate(
      position,
      [index - 1, index, index + 1],
      [1, 1.5, 1],
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return <Animated.View style={[dotStyle, animatedStyle]} />;
};

const Onboarding = ({ slides, onDone }) => {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  const styles = StyleSheet.create({
    onboardingContainer: {
      flex: 1,
    },
    slide: {
      width,
      padding: 28,
      paddingBottom: 120,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      height: 260,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: 250,
      height: 250,
    },
    textContainer: {
      height: 150,
      maxHeight: 180,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginTop: 12,
    },
    indicatorContainer: {
      position: 'absolute',
      bottom: 100,
      flexDirection: 'row',
      alignSelf: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#333',
      margin: 6,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
    },
  });

  return (
    <View style={styles.onboardingContainer}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {slides.map((item, index) => (
          <View
            key={index}
            style={[styles.slide, { backgroundColor: item.backgroundColor }]}
          >
            <View style={styles.contentContainer}>
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
            {index === slides.length - 1 && (
              <View style={styles.buttonContainer}>
                <Button text="Get Started" onPress={onDone} />
              </View>
            )}
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => (
          <Dot key={i} index={i} scrollX={scrollX} dotStyle={styles.dot} />
        ))}
      </View>
    </View>
  );
};

export default Onboarding;
