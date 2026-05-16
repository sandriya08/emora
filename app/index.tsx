import { Redirect, useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withTiming
} from "react-native-reanimated";

const slides = [
  {
    id: "1",
    title: "Welcome to Emora",
    description: "A sanctuary for your thoughts. Explore a calm space designed to help you understand and express your true emotions.",
    media: require("../assets/images/onboarding1.png"),
    tags: ["Safe Space", "Mindfulness", "Emotional Growth"],
  },
  {
    id: "2",
    title: "Clarity in Every Breath",
    description:
      "Emora gently observes emotional shifts, offering insights that help you navigate stress, anxiety, and daily burnout.",
    media: require("../assets/images/onboarding2.png"),
    tags: [
      "Stress",
      "Anxiety",
      "Depression",
      "Burnout",
      "Sleep Quality",
      "Self-Esteem",
      "Exhaustion",
    ],
  },
  {
    id: "3",
    title: "Personalized Care",
    description:
      "Enjoy guided reflections and self-care activities specifically tailored to your unique emotional landscape.",
    media: require("../assets/images/onboarding3.png"),
    tags: ["Meditation", "Self-Care", "Reflection"],
  },
  {
    id: "4",
    title: "Professional Connection",
    description:
      "Bridge the gap with mental health professionals who specialize in exactly what you're experiencing.",
    media: require("../assets/images/onboarding4.png"),
    tags: ["Expert Help", "Matching", "Quality Care"],
  },
];

const DecorativeBlob = ({ color, size, top, left, right, bottom, delay = 0 }: any) => {
  const scale = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      pointerEvents="none"
      style={[
        styles.blob, 
        { 
          backgroundColor: color, 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          top, left, right, bottom 
        },
        animatedStyle
      ]} 
    />
  );
};

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listWidth, setListWidth] = useState(width || 400);

  const onLayout = (event: any) => {
    const { width: layoutWidth } = event.nativeEvent.layout;
    if (layoutWidth > 0 && layoutWidth !== listWidth) {
      setListWidth(layoutWidth);
    }
  };

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / listWidth);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      router.replace("/login");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Blobs */}
      <DecorativeBlob color="rgba(230, 230, 250, 0.4)" size={300} top={-100} right={-100} />
      <DecorativeBlob color="rgba(250, 215, 160, 0.2)" size={250} bottom={100} left={-100} />

      <TouchableOpacity 
        style={styles.skipButton}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: listWidth }]}>
            <Animated.View 
              entering={FadeInUp.delay(200).springify()}
              style={styles.imageContainer}
            >
              <Image source={item.media} style={styles.image} resizeMode="contain" />
              <LinearGradient
                colors={['transparent', 'rgba(250, 249, 246, 0.8)']}
                style={styles.imageGradient}
              />
            </Animated.View>

            <View style={styles.contentContainer}>
              <Animated.Text 
                entering={FadeInDown.delay(400).springify()}
                style={styles.title}
              >
                {item.title}
              </Animated.Text>
              
              <Animated.Text 
                entering={FadeInDown.delay(500).springify()}
                style={styles.description}
              >
                {item.description}
              </Animated.Text>

              <Animated.View 
                entering={FadeInDown.delay(600).springify()}
                style={styles.tagContainer}
              >
                {item.tags.map((tag: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {currentIndex === slides.length - 1 && (
          <TouchableOpacity
            style={styles.buttonTouch}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FAD7A0', '#FFB088']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                Start Journey
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  blob: {
    position: 'absolute',
    zIndex: -1,
  },
  slide: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  imageContainer: {
    width: 320,
    height: 320,
    alignSelf: "center",
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#353A40",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: "#595F69",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 35,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  tag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(230, 230, 250, 0.8)", // Lavender border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tagText: {
    color: "#8C8381",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 60,
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 35,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#E2E4E9",
    marginHorizontal: 5,
  },
  activeDot: {
    width: 28,
    backgroundColor: "#FAD7A0", // Gold highlight for active
    borderRadius: 4,
  },
  buttonTouch: {
    width: '100%',
    borderRadius: 25,
    shadowColor: "#FAD7A0",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  button: {
    paddingVertical: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#4A362D", // Dark brown for contrast
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: "#8C8381",
    fontSize: 16,
    fontWeight: "600",
  },
});
