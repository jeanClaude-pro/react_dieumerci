import type { TFunction } from "i18next";
import type { NavigationItem, NavigationSection } from "../config/navigation";
import { roleLabels } from "../config/navigation";
import type { User } from "../types/auth";

/** Navigation texts in the active language (French defaults live in navigation.ts). */
export const navLabel = (t: TFunction, item: NavigationItem) => t(`nav.items.${item.id}.label`, { defaultValue: item.label });
export const navShort = (t: TFunction, item: NavigationItem) =>
  t(`nav.items.${item.id}.short`, { defaultValue: item.shortLabel || item.label });
export const navDescription = (t: TFunction, item: NavigationItem) =>
  item.description ? t(`nav.items.${item.id}.description`, { defaultValue: item.description }) : "";
export const sectionTitle = (t: TFunction, section: NavigationSection) => t(`nav.sections.${section.key}`, { defaultValue: section.title });
export const roleLabel = (t: TFunction, role: User["role"] | string | null | undefined) =>
  role ? t(`roles.${role}`, { defaultValue: roleLabels[role as User["role"]] || role }) : "";
