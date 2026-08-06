import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n, { getDeviceLanguage } from '@/i18n'
import AuthService from '@/services/AuthService'

type Language = 'pt-BR' | 'fr' | 'it' | 'en'

const localeMap: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  fr: 'fr-FR',
  it: 'it-IT',
  en: 'en-US',
}

type LanguageContextType = {
  language: Language
  locale: string
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext({} as LanguageContextType)

export function LanguageContextProvider({ children }: any) {
  const [language, setLanguageState] = useState<Language>('pt-BR')
  const [locale, setLocale] = useState<string>('pt-BR');

  const setLanguage = async (lang: Language) => {
    setLocale(localeMap[lang]);
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem("language", lang);

    try {
      await AuthService.changeLanguage(localeMap[lang]);
    } catch (e) {
      // console.log("Erro ao sincronizar idioma com backend", e);
    }
  };

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('language')
        const lang = (saved as Language) ?? getDeviceLanguage()

        setLanguageState(lang)
        setLocale(localeMap[lang])
        i18n.changeLanguage(lang)
      } catch (e) {
      }
    }

    loadLanguage()
  }, [])
  
  return (
    <LanguageContext.Provider
      value={{
        language,
        locale,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}