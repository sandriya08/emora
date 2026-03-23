import { Redirect, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";

const slides = [
  {
    id: "1",
    title: "Welcome to Emora",
    description: "A calm space to understand and express your emotions.",
    media: require("../assets/images/onboarding1.png"),
    tags: ["Safe Space", "Mindfulness", "Growth"],
  },
  {
    id: "2",
    title: "Understand Your Patterns",
    description:
      "Emora gently analyzes emotional shifts to help you find clarity and balance.",
    media: require("../assets/images/onboarding2.png"),
    tags: [
      "Stress",
      "Anxiety",
      "Burnout",
      "Sleep Disturbance",
      "Emotional Exhaustion",
      "Self-Esteem",
      "Depression",
      "Adjustment Issues",
    ],
  },
  {
    id: "3",
    title: "Support That Feels Personal",
    description:
      "Guided reflection and personalized self-care tailored to your needs.",
    media: require("../assets/images/onboarding3.png"),
    tags: ["Breathing", "Meditation", "Self-Care"],
  },
  {
    id: "4",
    title: "Connect With Support",
    description:
      "Find professionals aligned to your specific emotional and mental needs.",
    media: require("../assets/images/onboarding4.png"),
    tags: ["Expert Help", "Matching", "Quality Care"],
  },
];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          if (index !== currentIndex) {
            setCurrentIndex(index);
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.imageContainer}>
              <Image source={item.media} style={styles.image} resizeMode="cover" />
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.tagContainer}>
                {item.tags.map((tag: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
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

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Softer, lighter color
  },
  slide: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 30,
    backgroundColor: "#FFF5F7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#353A40",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#595F69",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  tag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tagText: {
    color: "#595F69",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: "#E2E4E9",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#FF7597",
  },
  button: {
    backgroundColor: "#FF7597", // Orange button
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: "#FF7597",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
