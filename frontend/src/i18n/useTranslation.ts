import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { TRANSLATIONS, type Locale, type TranslationSchema } from "./translations";

export function useTranslation(): { t: TranslationSchema; locale: Locale } {
  const locale = useSelector(
    (s: RootState) => (s.chat.responseLanguage || "km") as Locale,
  );
  const t = TRANSLATIONS[locale] || TRANSLATIONS.km;
  return { t, locale };
}

export default useTranslation;
