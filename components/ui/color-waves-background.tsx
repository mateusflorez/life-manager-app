import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type GradientBlobProps = {
  id: string;
  color: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  duration: number;
  moveRangeX: number;
  moveRangeY: number;
};

function GradientBlob({
  id,
  color,
  cx,
  cy,
  rx,
  ry,
  duration,
  moveRangeX,
  moveRangeY,
}: GradientBlobProps) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    offsetX.value = withRepeat(
      withSequence(
        withTiming(moveRangeX, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-moveRangeX, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    offsetY.value = withRepeat(
      withSequence(
        withTiming(moveRangeY, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
        withTiming(-moveRangeY, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    cx: cx + offsetX.value,
    cy: cy + offsetY.value,
  }));

  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="70%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <AnimatedEllipse
        animatedProps={animatedProps}
        rx={rx}
        ry={ry}
        fill={`url(#${id})`}
      />
    </>
  );
}

type ColorWavesBackgroundProps = {
  theme?: 'light' | 'dark';
};

const DARK_BLOBS = [
  // Blue - top left
  {
    id: 'grad1',
    color: '#4338CA',
    cx: SCREEN_WIDTH * 0.2,
    cy: SCREEN_HEIGHT * 0.15,
    rx: SCREEN_WIDTH * 0.9,
    ry: SCREEN_HEIGHT * 0.5,
    duration: 4000,
    moveRangeX: 80,
    moveRangeY: 60,
  },
  // Purple - left
  {
    id: 'grad2',
    color: '#6D28D9',
    cx: SCREEN_WIDTH * 0.0,
    cy: SCREEN_HEIGHT * 0.5,
    rx: SCREEN_WIDTH * 0.8,
    ry: SCREEN_HEIGHT * 0.45,
    duration: 5000,
    moveRangeX: 100,
    moveRangeY: 80,
  },
  // Pink - center
  {
    id: 'grad3',
    color: '#BE185D',
    cx: SCREEN_WIDTH * 0.5,
    cy: SCREEN_HEIGHT * 0.6,
    rx: SCREEN_WIDTH * 0.85,
    ry: SCREEN_HEIGHT * 0.5,
    duration: 4500,
    moveRangeX: 120,
    moveRangeY: 70,
  },
  // Cyan - top right
  {
    id: 'grad4',
    color: '#0E7490',
    cx: SCREEN_WIDTH * 0.85,
    cy: SCREEN_HEIGHT * 0.1,
    rx: SCREEN_WIDTH * 0.7,
    ry: SCREEN_HEIGHT * 0.4,
    duration: 5500,
    moveRangeX: 70,
    moveRangeY: 90,
  },
  // Orange - right
  {
    id: 'grad5',
    color: '#C2410C',
    cx: SCREEN_WIDTH * 1.0,
    cy: SCREEN_HEIGHT * 0.4,
    rx: SCREEN_WIDTH * 0.75,
    ry: SCREEN_HEIGHT * 0.45,
    duration: 6000,
    moveRangeX: 90,
    moveRangeY: 65,
  },
  // Violet - bottom
  {
    id: 'grad6',
    color: '#7C3AED',
    cx: SCREEN_WIDTH * 0.3,
    cy: SCREEN_HEIGHT * 0.9,
    rx: SCREEN_WIDTH * 0.8,
    ry: SCREEN_HEIGHT * 0.4,
    duration: 5000,
    moveRangeX: 85,
    moveRangeY: 55,
  },
];

const LIGHT_BLOBS = [
  // Blue - top left
  {
    id: 'grad1',
    color: '#818CF8',
    cx: SCREEN_WIDTH * 0.2,
    cy: SCREEN_HEIGHT * 0.15,
    rx: SCREEN_WIDTH * 0.9,
    ry: SCREEN_HEIGHT * 0.5,
    duration: 4000,
    moveRangeX: 80,
    moveRangeY: 60,
  },
  // Purple - left
  {
    id: 'grad2',
    color: '#A78BFA',
    cx: SCREEN_WIDTH * 0.0,
    cy: SCREEN_HEIGHT * 0.5,
    rx: SCREEN_WIDTH * 0.8,
    ry: SCREEN_HEIGHT * 0.45,
    duration: 5000,
    moveRangeX: 100,
    moveRangeY: 80,
  },
  // Pink - center
  {
    id: 'grad3',
    color: '#F472B6',
    cx: SCREEN_WIDTH * 0.5,
    cy: SCREEN_HEIGHT * 0.6,
    rx: SCREEN_WIDTH * 0.85,
    ry: SCREEN_HEIGHT * 0.5,
    duration: 4500,
    moveRangeX: 120,
    moveRangeY: 70,
  },
  // Cyan - top right
  {
    id: 'grad4',
    color: '#22D3EE',
    cx: SCREEN_WIDTH * 0.85,
    cy: SCREEN_HEIGHT * 0.1,
    rx: SCREEN_WIDTH * 0.7,
    ry: SCREEN_HEIGHT * 0.4,
    duration: 5500,
    moveRangeX: 70,
    moveRangeY: 90,
  },
  // Yellow - right
  {
    id: 'grad5',
    color: '#FBBF24',
    cx: SCREEN_WIDTH * 1.0,
    cy: SCREEN_HEIGHT * 0.4,
    rx: SCREEN_WIDTH * 0.75,
    ry: SCREEN_HEIGHT * 0.45,
    duration: 6000,
    moveRangeX: 90,
    moveRangeY: 65,
  },
  // Violet - bottom
  {
    id: 'grad6',
    color: '#C084FC',
    cx: SCREEN_WIDTH * 0.3,
    cy: SCREEN_HEIGHT * 0.9,
    rx: SCREEN_WIDTH * 0.8,
    ry: SCREEN_HEIGHT * 0.4,
    duration: 5000,
    moveRangeX: 85,
    moveRangeY: 55,
  },
];

export function ColorWavesBackground({ theme = 'dark' }: ColorWavesBackgroundProps) {
  const isLight = theme === 'light';
  const blobs = isLight ? LIGHT_BLOBS : DARK_BLOBS;
  const bgColor = isLight ? '#F8FAFC' : '#0a0a12';

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]}
      >
        {blobs.map((blob) => (
          <GradientBlob key={blob.id} {...blob} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
