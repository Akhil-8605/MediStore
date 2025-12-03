import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>💊</Text>
        </View>
        
        <Text style={styles.title}>Welcome to MediStore</Text>
        <Text style={styles.subtitle}>
          Your personal healthcare companion for managing medicines and prescriptions.
        </Text>
        
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Get Started" 
          onPress={() => router.push('/login')}
          size="lg"
        />
        <Button 
          title="Skip" 
          variant="ghost" 
          onPress={() => router.push('/login')}
          style={styles.skipButton}
        />
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
    width: 100,
    height: 100,
    backgroundColor: Colors.secondary,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconText: {
    fontSize: 48,
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
  },
  skipButton: {
    marginTop: 8,
  }
});
