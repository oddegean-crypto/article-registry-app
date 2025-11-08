import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as FileSystemLegacy from 'expo-file-system/legacy';

// Platform-specific storage helper
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      const filePath = `${FileSystemLegacy.documentDirectory}${key}.json`;
      const fileInfo = await FileSystemLegacy.getInfoAsync(filePath);
      if (fileInfo.exists) {
        return await FileSystemLegacy.readAsStringAsync(filePath);
      }
      return null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const filePath = `${FileSystemLegacy.documentDirectory}${key}.json`;
    await FileSystemLegacy.writeAsStringAsync(filePath, value);
  },
};

export const lightTheme = {
  // Background colors
  background: '#f5f5f5',
  cardBackground: '#fff',
  headerBackground: '#fff',
  modalBackground: '#fff',
  
  // Text colors
  text: '#333',
  textSecondary: '#666',
  textTertiary: '#999',
  
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  
  // Borders and dividers
  border: '#e0e0e0',
  divider: '#f5f5f5',
  
  // Status colors
  success: '#10B981',
  successLight: '#ECFDF5',
  error: '#FF6B6B',
  warning: '#FF9500',
  
  // Special colors
  badge: '#f0f0f0',
  badgeText: '#666',
  shadow: '#000',
  
  // Input colors
  inputBackground: '#fff',
  inputBorder: '#e0e0e0',
  placeholder: '#999',
};

export const darkTheme = {
  // Background colors
  background: '#121212',
  cardBackground: '#1e1e1e',
  headerBackground: '#1e1e1e',
  modalBackground: '#2a2a2a',
  
  // Text colors
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  
  // Primary colors
  primary: '#0A84FF',
  primaryLight: '#1c3a52',
  
  // Borders and dividers
  border: '#333333',
  divider: '#2a2a2a',
  
  // Status colors
  success: '#30D158',
  successLight: '#1a3a2e',
  error: '#FF453A',
  warning: '#FFD60A',
  
  // Special colors
  badge: '#2a2a2a',
  badgeText: '#b0b0b0',
  shadow: '#000',
  
  // Input colors
  inputBackground: '#2a2a2a',
  inputBorder: '#333333',
  placeholder: '#808080',
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await storage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        setIsDark(stored === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDark;
      setIsDark(newMode);
      await storage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
