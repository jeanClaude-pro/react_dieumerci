import { afterEach, expect, test } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import i18n, { setLanguage } from "../src/i18n";
import LanguageToggle from "../src/components/ui/LanguageToggle";
import ExchangeRateChip from "../src/components/ui/ExchangeRateChip";
import { formatUSD } from "../src/i18n/format";
import { serverMessage } from "../src/i18n/serverMessages";

afterEach(async () => {
  cleanup();
  await act(async () => { await setLanguage("fr"); });
  localStorage.clear();
});

// A typed value must survive a language switch (no remount, no reload).
function Draft() {
  const [value, setValue] = useState("");
  return <input aria-label="draft" value={value} onChange={(event) => setValue(event.target.value)} />;
}

test("French is the default and the toggle marks the active language", () => {
  render(<LanguageToggle />);
  expect(i18n.language).toBe("fr");
  expect(screen.getByRole("button", { name: "FR" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false");
});

test("switching to English is instant, keeps typed data and is remembered", async () => {
  render(<><LanguageToggle /><ExchangeRateChip loading={false} rate={null} /><Draft /></>);
  expect(screen.getByText("Taux non disponible")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("draft"), { target: { value: "125 pièces" } });

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "EN" })); });

  expect(screen.getByText("Rate not available")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("draft")).toHaveValue("125 pièces");
  expect(localStorage.getItem("ui.language")).toBe("en");
  expect(document.documentElement.lang).toBe("en");
});

test("money and server messages follow the language, amounts stay identical", async () => {
  expect(formatUSD(1234.5)).toBe("$1,234.50");
  expect(serverMessage("Authentication required")).toBe("Connexion requise");
  await act(async () => { await setLanguage("en"); });
  expect(formatUSD(1234.5)).toBe("$1,234.50");
  expect(serverMessage("Authentication required")).toBe("Authentication required");
  expect(serverMessage("REÇU INVALIDE")).toBe("INVALID RECEIPT");
});
