import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design width (360dp — standard Android)
const BASE_W = 360;
const BASE_H = 800;

/** Scale a size relative to screen width */
export const sw = (size: number) => (SCREEN_W / BASE_W) * size;

/** Scale a size relative to screen height */
export const sh = (size: number) => (SCREEN_H / BASE_H) * size;

/** Scale font size with capping for readability */
export const sf = (size: number) => {
  const scaled = sw(size);
  const maxScale = 1.25; // never scale more than 25% up
  return Math.min(scaled, size * maxScale);
};

export const screenWidth  = SCREEN_W;
export const screenHeight = SCREEN_H;

/** True if device is a large phone / small tablet (≥ 480dp) */
export const isLargeScreen = SCREEN_W >= 480;
