import * as SecureStore from 'expo-secure-store';

/**
 * Token storage on a device: the iOS Keychain or the Android Keystore.
 * Metro picks `secure-storage.web.ts` instead when bundling for web, so
 * expo-secure-store never enters the web bundle — it has no web implementation.
 */
export async function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
