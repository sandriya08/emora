import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface ShapeProps {
  onPress: () => void;
  title: string;
  subtitle: string;
  style?: any;
}

export const PlusShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="120" height="120" viewBox="0 0 100 100">
      <Path
        d="M35 15 C35 10 65 10 65 15 L65 35 L85 35 C90 35 90 65 85 65 L65 65 L65 85 C65 90 35 90 35 85 L35 65 L15 65 C10 65 10 35 15 35 L35 35 Z"
        fill="#FFC02A" // Headspace Yellow
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const BlobShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="140" height="140" viewBox="0 0 200 200">
      <Path
        d="M45.7,-76.3C58.9,-69.3,69.2,-55.3,77.5,-40.4C85.7,-25.5,91.8,-9.7,89.5,4.9C87.1,19.5,76.3,32.9,64.7,43.2C53.1,53.5,40.7,60.8,27.1,68.4C13.5,76, -1.2,83.9, -15.9,82.4C-30.6,80.9, -45.4,70, -56.5,58C-67.6,46, -75,32.8, -79.9,18.7C-84.8,4.6, -87.2,-10.4, -81.9,-22.8C-76.6,-35.1, -63.7,-44.8, -50.2,-52.1C-36.7,-59.4, -22.6,-64.3, -6.9,-65.4C8.9,-66.4, 32.5,-83.3, 45.7,-76.3Z"
        fill="#40C1A3" // Headspace Teal
        transform="translate(100 100)"
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const HeartShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="130" height="130" viewBox="0 0 100 100">
      <Path
        d="M50 88 C -20 40, 10 -15, 50 20 C 90 -15, 120 40, 50 88 Z"
        fill="#FF7597" // Love Pink
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const StarburstShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="140" height="140" viewBox="0 0 100 100">
      <Path
        d="M50 5 L60 35 L95 25 L75 50 L95 75 L60 65 L50 95 L40 65 L5 75 L25 50 L5 25 L40 35 Z"
        fill="#51A5FF" // Headspace Blue
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const DropShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="120" height="120" viewBox="0 0 100 100">
      <Path
        d="M50 5 C50 5, 20 50, 20 70 A 30 30 0 0 0 80 70 C 80 50, 50 5, 50 5 Z"
        fill="#BFDBFE" // pastel blue alternate
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export const MoonShape = ({ onPress, title, subtitle, style }: ShapeProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container, style]} activeOpacity={0.8}>
    <Svg width="130" height="130" viewBox="0 0 100 100">
      <Path
        d="M70 10 A 40 40 0 1 0 90 80 A 50 50 0 1 1 70 10 Z"
        fill="#FFC02A" // Headspace Yellow
      />
    </Svg>
    <View style={styles.textOverlay}>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#353A40',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 12,
    color: '#353A40',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 10,
  },
});
