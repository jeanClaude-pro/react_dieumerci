import { useState } from "react";
import { AlertTriangle, FileDown, RefreshCw, Shield, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Dialog from "../../components/ui/Dialog";
import type { ReportSections } from "./reportGenerator";

const SECTION_KEYS: (keyof ReportSections)[] = ["financial", "sales", "products", "clients", "expenses", "entries"];
const allSections = (value: boolean): ReportSections =>
  Object.fromEntries(SECTION_KEYS.map((key) => [key, value])) as unknown as ReportSections;

/**
 * Official PDF report. Generation is confirmed by the administrator's
 * password, verified by the server (POST /auth/verify-password).
 */
export default function ReportBuilderDialog({ adminName, periodLabel, onClose, verifyPassword, onGenerate }: {
  adminName: string;
  periodLabel: string;
  onClose: () => void;
  verifyPassword: (password: string) => Promise<boolean>;
  onGenerate: (options: { sections: ReportSections; signatureText: string; hasSignature: boolean; hasStamp: boolean }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<ReportSections>(() => allSections(true));
  const [signatureText, setSignatureText] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [hasStamp, setHasStamp] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = SECTION_KEYS.filter((key) => sections[key]).length;
  const official = hasSignature && hasStamp;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      if (!(await verifyPassword(password))) {
        setError(t("reports.builder.wrongPassword"));
        setPassword("");
        return;
      }
      await onGenerate({ sections, signatureText, hasSignature, hasStamp });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog label={t("reports.builder.title")} onClose={onClose}>
      <form className="dialog-panel report-builder-panel" onSubmit={submit}>
        <header className="dialog-head">
          <div>
            <h2 className="dialog-title"><FileDown aria-hidden="true" />{t("reports.builder.title")}</h2>
            <p className="dialog-subtitle">{t("reports.builder.subtitle", { period: periodLabel })}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t("common.close")}><X aria-hidden="true" /></button>
        </header>

        <div className="dialog-body report-builder-grid">
          <fieldset className="report-builder-sections">
            <legend className="field-label">{t("reports.builder.sections")}</legend>
            <div className="report-builder-links">
              <button type="button" className="link-button" onClick={() => setSections(allSections(true))}>{t("reports.builder.selectAll")}</button>
              <button type="button" className="link-button" onClick={() => setSections(allSections(false))}>{t("reports.builder.selectNone")}</button>
            </div>
            <div className="check-grid">
              {SECTION_KEYS.map((key) => (
                <label key={key} className={`check-card ${sections[key] ? "is-checked" : ""}`}>
                  <input type="checkbox" checked={sections[key]} onChange={(event) => setSections((previous) => ({ ...previous, [key]: event.target.checked }))} />
                  <span><strong>{t(`reports.builder.section.${key}.label`)}</strong><small>{t(`reports.builder.section.${key}.desc`)}</small></span>
                </label>
              ))}
            </div>
            <p className="field-hint">{t("reports.builder.selectedCount", { count: selected })}</p>
          </fieldset>

          <div className="report-builder-side">
            <div className="readonly-field"><span>{t("reports.builder.admin")}</span><strong>{adminName}</strong></div>
            <label className="field">
              <span className="field-label">{t("reports.builder.titleOptional")}</span>
              <input className="input" value={signatureText} onChange={(event) => setSignatureText(event.target.value)} placeholder={t("reports.builder.titlePlaceholder")} />
            </label>
            <label className={`check-card ${hasSignature ? "is-checked" : ""}`}>
              <input type="checkbox" checked={hasSignature} onChange={(event) => setHasSignature(event.target.checked)} />
              <span><strong>{t("reports.builder.signature")}</strong><small>{t("reports.builder.signatureDesc")}</small></span>
            </label>
            <label className={`check-card ${hasStamp ? "is-checked" : ""}`}>
              <input type="checkbox" checked={hasStamp} onChange={(event) => setHasStamp(event.target.checked)} />
              <span><strong>{t("reports.builder.stamp")}</strong><small>{t("reports.builder.stampDesc")}</small></span>
            </label>
            <div className={`alert ${official ? "alert-success" : "alert-warning"}`} role="note">
              {official ? <Shield aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              <span>{official ? t("reports.builder.willBeOfficial") : t("reports.builder.willBeUnofficial")}</span>
            </div>
            <label className="field">
              <span className="field-label">{t("reports.builder.password")}</span>
              <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
          </div>
        </div>

        <footer className="dialog-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !selected}>
            {busy ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <FileDown aria-hidden="true" />}
            {busy ? t("reports.builder.generating") : t("reports.builder.generate")}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
