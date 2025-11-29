import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

type Props = {
  visible: boolean;
  userName?: string;
  onFinish: () => void;
};

// Sur web, useNativeDriver n'est pas supporté
const useNativeDriver = Platform.OS !== 'web';

/**
 * Overlay de bienvenue animé après connexion
 */
export default function WelcomeOverlay({ visible, userName, onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(30);
      checkScale.setValue(0);

      // Séquence d'animation
      Animated.sequence([
        // Fade in + scale du conteneur
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver,
          }),
        ]),
        // Animation du checkmark
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver,
        }),
        // Slide up du texte
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver,
        }),
        // Pause
        Animated.delay(1200),
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver,
        }),
      ]).start(() => {
        onFinish();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const firstName = userName?.split(' ')[0] || 'vous';

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Cercle avec checkmark animé */}
        <Animated.View 
          style={[
            styles.checkCircle,
            {
              transform: [{ scale: checkScale }],
            },
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>

        {/* Texte de bienvenue */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }}
        >
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Text style={styles.userName}>{firstName} 👋</Text>
        </Animated.View>

        {/* Sous-texte */}
        <Animated.Text 
          style={[
            styles.subText,
            {
              opacity: Animated.multiply(fadeAnim, fadeAnim),
            },
          ]}
        >
          Connexion réussie
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 118, 210, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    padding: 40,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  checkmark: {
    fontSize: 40,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 16,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
});
