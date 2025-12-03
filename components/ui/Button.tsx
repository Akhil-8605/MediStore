import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  style 
}: ButtonProps) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.neutralGray;
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    switch (variant) {
      case 'primary': return Colors.white;
      case 'secondary': return Colors.primary;
      case 'outline': return Colors.primary;
      case 'ghost': return Colors.text;
      default: return Colors.white;
    }
  };

  const getBorderWidth = () => {
    return variant === 'outline' ? 1 : 0;
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      style={[
        styles.container, 
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: Colors.primary,
          borderWidth: getBorderWidth(),
          height: size === 'lg' ? 56 : size === 'md' ? 48 : 36,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: size === 'lg' ? 16 : 14 }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: '600',
  }
});
