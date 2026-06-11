import { Platform } from 'react-native';

// In development, use 10.0.2.2 for Android emulator to hit localhost, otherwise localhost.
// Note: If testing on a real device, you will need to replace this with your computer's local IP (e.g. http://192.168.1.5:5000/api/v1)
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://localhost:5000/api/v1';
