import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations, TranslationKey } from '../lib/translations';
import { supabase } from '../lib/supabase';

const LANGUAGE_KEY = 'user_language_preference';

// Simple event emitter for live updates without complex context
const listeners = new Set<(lang: 'en' | 'ja') => void>();

export function useTranslation() {
  const [locale, setLocale] = useState<'en' | 'ja'>('en');

  // Load initial language
  useEffect(() => {
    loadLanguage();

    // Subscribe to changes
    const onLanguageChange = (newLang: 'en' | 'ja') => {
      setLocale(newLang);
    };
    listeners.add(onLanguageChange);

    return () => {
      listeners.delete(onLanguageChange);
    };
  }, []);

  const loadLanguage = async () => {
    try {
      // 1. Check local storage first (fast)
      const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLang === 'en' || storedLang === 'ja') {
        setLocale(storedLang);
        return;
      }

      // 2. If not local, fetch from DB (once)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_language) {
          const dbLang = profile.preferred_language as 'en' | 'ja';
          setLocale(dbLang);
          await AsyncStorage.setItem(LANGUAGE_KEY, dbLang);
          return;
        }
      }

      // 3. Fallback to System Language
      const systemLocales = Localization.getLocales();
      const primaryLocale = systemLocales[0]?.languageCode;
      
      const defaultLang = primaryLocale === 'ja' ? 'ja' : 'en';
      setLocale(defaultLang);
      
    } catch (error) {
      console.log('Error loading language', error);
    }
  };

  const changeLanguage = async (newLang: 'en' | 'ja') => {
    setLocale(newLang);
    await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
    
    // Notify other components
    listeners.forEach(listener => listener(newLang));
  };

  const t = useCallback((key: TranslationKey) => {
    return translations[locale][key] || key;
  }, [locale]);

  return { t, locale, changeLanguage };
}
