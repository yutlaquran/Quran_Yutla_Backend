import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Defs, Pattern, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const IslamicPattern = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <Path
          d="M50 10 L60 25 L50 40 L40 25 Z M25 25 L40 40 L25 55 L10 40 Z M75 25 L90 40 L75 55 L60 40 Z M50 55 L60 70 L50 85 L40 70 Z"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <Path
          d="M50 25 Q65 25 65 40 Q65 55 50 55 Q35 55 35 40 Q35 25 50 25"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      </Pattern>
    </Defs>
    <Rect width={width} height={height} fill="url(#pattern)" />
  </Svg>
);

const GeometricLogo = () => (
  <Svg width="140" height="140" viewBox="0 0 200 200">
    {/* Outer Star Points */}
    <Path
      d="M100 20 L115 60 L155 60 L123 85 L138 125 L100 100 L62 125 L77 85 L45 60 L85 60 Z"
      fill="white"
      stroke="white"
      strokeWidth="3"
    />
    
    {/* Inner Geometric Pattern */}
    <G transform="translate(100, 100)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <G key={i} transform={`rotate(${angle})`}>
          <Rect x="-6" y="-50" width="12" height="35" fill="white" />
          <Rect x="-4" y="-25" width="8" height="25" fill="#4A9B8E" />
        </G>
      ))}
      
      {/* Center Square */}
      <Rect x="-15" y="-15" width="30" height="30" fill="white" transform="rotate(45)" />
      <Rect x="-10" y="-10" width="20" height="20" fill="#4A9B8E" transform="rotate(45)" />
    </G>
    
    {/* Decorative Border */}
    <Path
      d="M100 35 L110 55 L130 55 L115 68 L120 88 L100 75 L80 88 L85 68 L70 55 L90 55 Z"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
    />
  </Svg>
);

export default function SplashScreen({ onFinish }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <IslamicPattern />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <GeometricLogo />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.arabicText}>منصة</Text>
          <Text style={styles.arabicTextLarge}>قرآن يتلى</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A9B8E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  arabicText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 5,
    textAlign: 'center',
  },
  arabicTextLarge: {
    fontSize: 42,
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
