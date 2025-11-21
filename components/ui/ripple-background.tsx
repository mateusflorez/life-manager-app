import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RippleConfig = {
  x: number;
  y: number;
  delay: number;
  duration: number;
  maxSize: number;
  color: string;
};

type RippleProps = {
  config: RippleConfig;
};

function Ripple({ config }: RippleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, {
          duration: config.duration,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0, 1]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0.4, 0.2, 0]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.ripple,
        animatedStyle,
        {
          left: config.x - config.maxSize / 2,
          top: config.y - config.maxSize / 2,
          width: config.maxSize,
          height: config.maxSize,
          borderRadius: config.maxSize / 2,
          borderColor: config.color,
        },
      ]}
    />
  );
}

type RippleBackgroundProps = {
  isDark?: boolean;
  rippleCount?: number;
};

export function RippleBackground({ isDark = false, rippleCount = 6 }: RippleBackgroundProps) {
  const ripples = useMemo(() => {
    const colors = isDark
      ? ['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)']
      : ['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)'];

    return Array.from({ length: rippleCount }, (_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT * 0.8,
      delay: i * 800,
      duration: 4000 + Math.random() * 2000,
      maxSize: 200 + Math.random() * 200,
      color: colors[i % colors.length],
    }));
  }, [isDark, rippleCount]);

  return (
    <View style={styles.container} pointerEvents="none">
      {ripples.map((config, index) => (
        <Ripple key={index} config={config} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
  },
});
