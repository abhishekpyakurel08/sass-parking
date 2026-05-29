import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface ErrorBannerProps {
  error: string | null;
  clearError: () => void;
}

export const ErrorBanner = ({ error, clearError }: ErrorBannerProps) => {
  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 4000);
      return () => clearTimeout(t);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <Animated.View 
      entering={FadeInUp} 
      exiting={FadeOutUp} 
      style={styles.container}
    >
      <AlertCircle color="#FFF" size={20} style={styles.icon} />
      <Text style={styles.text} numberOfLines={2}>
        {error}
      </Text>
      <TouchableOpacity onPress={clearError} style={styles.closeBtn}>
        <X color="#FFF" size={16} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
});
