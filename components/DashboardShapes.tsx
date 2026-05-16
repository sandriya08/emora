import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface ShapeProps {
  onPress: () => void;
  title: string;
  subtitle: string;
  style?: any;
}

const handlePress = (onPress: () => void) => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {
    console.warn("Haptics failed:", err);
  }
  onPress();
};

const FloatingShape = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle} pointerEvents="box-none">{children}</Animated.View>;
};

export const PlusShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity
    onPress={() => handlePress(onPress)}
    style={[styles.container, style]}
    activeOpacity={0.6}
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
  >
    <FloatingShape>
      <View style={styles.shapeContainer}>
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Path
            d="M35 15 H65 V35 H85 V65 H65 V85 H35 V65 H15 V35 H35 Z"
            fill="#FFB088" // Peach
          />
        </Svg>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.titleText}>{title.toLowerCase()}</Text>
          <Text style={styles.subtitleText}>{subtitle.toLowerCase()}</Text>
        </View>
      </View>
    </FloatingShape>
  </TouchableOpacity>
);

export const BlobShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity
    onPress={() => handlePress(onPress)}
    style={[styles.container, style]}
    activeOpacity={0.6}
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
  >
    <FloatingShape delay={500}>
      <View style={styles.shapeContainer}>
        <Svg width="130" height="130" viewBox="0 0 200 200">
          <Path
            d="M45.7,-76.3C58.9,-69.3,69.2,-55.3,77.5,-40.4C85.7,-25.5,91.8,-9.7,89.5,4.9C87.1,19.5,76.3,32.9,64.7,43.2C53.1,53.5,40.7,60.8,27.1,68.4C13.5,76, -1.2,83.9, -15.9,82.4C-30.6,80.9, -45.4,70, -56.5,58C-67.6,46, -75,32.8, -79.9,18.7C-84.8,4.6, -87.2,-10.4, -81.9,-22.8C-76.6,-35.1, -63.7,-44.8, -50.2,-52.1C-36.7,-59.4, -22.6,-64.3, -6.9,-65.4C8.9,-66.4, 32.5,-83.3, 45.7,-76.3Z"
            fill="#81E6D9" // Mint
            transform="translate(100 100)"
          />
        </Svg>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.titleText}>{title.toLowerCase()}</Text>
          <Text style={styles.subtitleText}>{subtitle.toLowerCase()}</Text>
        </View>
      </View>
    </FloatingShape>
  </TouchableOpacity>
);

export const HeartShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity
    onPress={() => handlePress(onPress)}
    style={[styles.container, style]}
    activeOpacity={0.6}
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
  >
    <FloatingShape delay={1000}>
      <View style={styles.shapeContainer}>
        <Svg width="120" height="120" viewBox="0 0 100 100">
          <Path
            d="M50 88 C -20 40, 10 -15, 50 20 C 90 -15, 120 40, 50 88 Z"
            fill="#FFDEE9" // Soft Pink
          />
        </Svg>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.titleText}>{title.toLowerCase()}</Text>
          <Text style={styles.subtitleText}>{subtitle.toLowerCase()}</Text>
        </View>
      </View>
    </FloatingShape>
  </TouchableOpacity>
);

export const MoonShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity
    onPress={() => handlePress(onPress)}
    style={[styles.container, style]}
    activeOpacity={0.6}
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
  >
    <FloatingShape delay={2000}>
      <View style={styles.shapeContainer}>
        <Svg width="120" height="120" viewBox="0 0 100 100">
          <Path
            d="M70 10 A 40 40 0 1 0 90 80 A 50 50 0 1 1 70 10 Z"
            fill="#A5F3FC" // Light Blue
          />
        </Svg>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.titleText}>{title.toLowerCase()}</Text>
          <Text style={styles.subtitleText}>{subtitle.toLowerCase()}</Text>
        </View>
      </View>
    </FloatingShape>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  shapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: 101,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#353A40',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 11,
    color: '#353A40',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.8,
    paddingHorizontal: 15,
  },
});
