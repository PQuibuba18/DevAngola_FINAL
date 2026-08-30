// services/storage.ts
// Wrapper sobre expo-secure-store para armazenar token e dados de sessão.
// NUNCA usar AsyncStorage para tokens — não é seguro.
// SecureStore usa Keystore (Android) e Keychain (iOS).

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'devangola_token';
const USER_KEY  = 'devangola_user';

export const Storage = {

  async saveSession(token: string, user: object): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getUser<T = object>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; }
    catch { return null; }
  },

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
