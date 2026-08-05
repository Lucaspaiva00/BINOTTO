import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import ptBR from './locales/pt-BR.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import en from './locales/en.json'

const resources = {
  'pt-BR': { translation: ptBR },
  fr: { translation: fr },
  it: { translation: it },
  en: { translation: en },
}

type SupportedLanguage = 'pt-BR' | 'fr' | 'it' | 'en'

export function getDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales?.()?.[0]?.languageTag ?? 'pt-BR'

  if (locale.startsWith('pt')) return 'pt-BR'
  if (locale.startsWith('fr')) return 'fr'
  if (locale.startsWith('it')) return 'it'
  if (locale.startsWith('en')) return 'en'

  return 'pt-BR'
}

const initialLanguage = getDeviceLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'pt-BR',

    supportedLngs: ['pt-BR', 'fr', 'it', 'en'],

    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
