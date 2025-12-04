import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from "@/assets/images/favicon.png";

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}><Image source={Logo} /></Text>
        </View>

        <Text style={styles.title}>Welcome to MediStore</Text>
        <Text style={styles.subtitle}>
          Your personal healthcare companion for managing medicines and prescriptions.
        </Text>

        <View style={styles.footer}>
          <Button
            title="Get Started"
            onPress={() => router.push('/login')}
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 150,
    height: 150,
    backgroundColor: Colors.logoback,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconText: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.charcoal,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutralGray,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    padding: 24,
    gap: 12,
    width: '100%',
  },
  skipButton: {
    marginTop: 8,
  }
});
