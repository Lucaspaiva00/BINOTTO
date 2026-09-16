import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "pt" | "it" | "fr";

const labels = {
  pt: { dashboard: "Dashboard", users: "Usuários", services: "Serviços", inspections: "Perícias", finance: "Financeiro", admins: "Administradores", settings: "Configurações", logout: "Sair" },
  it: { dashboard: "Dashboard", users: "Utenti", services: "Servizi", inspections: "Perizie", finance: "Finanze", admins: "Amministratori", settings: "Impostazioni", logout: "Esci" },
  fr: { dashboard: "Tableau de bord", users: "Utilisateurs", services: "Services", inspections: "Expertises", finance: "Finances", admins: "Administrateurs", settings: "Paramètres", logout: "Quitter" },
};

type ContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; labels: typeof labels.pt };
const LanguageContext = createContext<ContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => (localStorage.getItem("binotto-language") as AppLanguage) || "pt");
  const setLanguage = (next: AppLanguage) => { setLanguageState(next); localStorage.setItem("binotto-language", next); };
  useEffect(() => { document.documentElement.lang = language === "pt" ? "pt-BR" : language === "it" ? "it-IT" : "fr-FR"; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, labels: labels[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
