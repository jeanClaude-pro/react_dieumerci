import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from "../../i18n";

/** FR / EN switch. Instant, no reload; the choice is remembered on this device. */
export default function LanguageToggle({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { t, i18n } = useTranslation();
  const active = (i18n.resolvedLanguage || i18n.language || "fr") as AppLanguage;
  return (
    <div className={`lang-toggle ${compact ? "is-compact" : ""} ${className}`} role="group" aria-label={t("language.label")}>
      {!compact && <Languages aria-hidden="true" className="lang-toggle-icon" />}
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          aria-pressed={active === language}
          className={active === language ? "is-active" : ""}
          onClick={() => { if (active !== language) void setLanguage(language); }}
          title={t(`language.${language}`)}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
