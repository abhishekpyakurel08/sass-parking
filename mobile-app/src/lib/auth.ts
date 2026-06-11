import * as SecureStore from 'expo-secure-store';

export const saveApiKey = async (key: string) => {
  await SecureStore.setItemAsync('operator_api_key', key);
};

export const getApiKey = async () => {
  return await SecureStore.getItemAsync('operator_api_key');
};

export const removeApiKey = async () => {
  await SecureStore.deleteItemAsync('operator_api_key');
};
