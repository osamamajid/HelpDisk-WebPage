/**
 * Extension / category icon resolution.
 *
 * The backend stores plain Lucide icon *names* (kebab-case strings such as
 * "network-wired" or "volume-2") on Category records. They are resolved here to
 * real icon components so the UI never renders emoji or image sprites.
 */
import {
  Archive,
  Box,
  Briefcase,
  Building2,
  Cable,
  Cpu,
  Database,
  Disc3,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Globe,
  HardDrive,
  Headphones,
  Image,
  Keyboard,
  Laptop,
  Layers,
  Lock,
  MemoryStick,
  Monitor,
  Mouse,
  Network,
  Package,
  Printer,
  Router,
  Save,
  Settings,
  Shield,
  Smartphone,
  Tablet,
  Terminal,
  Usb,
  Volume2,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icons the backend may reference through Category.icon. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  computer: Laptop,
  laptop: Laptop,
  printer: Printer,
  'network-wired': Network,
  network: Network,
  'volume-2': Volume2,
  audio: Headphones,
  headphones: Headphones,
  monitor: Monitor,
  display: Monitor,
  wifi: Wifi,
  bluetooth: Cable,
  box: Box,
  package: Package,
  toolbox: Wrench,
  tools: Wrench,
  wrench: Wrench,
  'file-text': FileText,
  folder: Folder,
  chipset: Cpu,
  cpu: Cpu,
  bios: Zap,
  iso: Disc3,
  security: Shield,
  lock: Lock,
  server: Database,
  cloud: Layers,
  save: Save,
  default: Folder,
};

/** Extension driven icons used for file cards and table rows. */
const EXTENSION_ICONS: Record<string, LucideIcon> = {
  exe: Terminal,
  msi: Package,
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  iso: Disc3,
  img: FileImage,
  cab: Archive,
  bin: Disc3,
  msu: Package,
  msp: Package,
  pdf: FileText,
  txt: FileText,
  rtf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: FileVideo,
  pptx: FileVideo,
  mp4: FileVideo,
  mkv: FileVideo,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  svg: Image,
  webp: Image,
  dll: Layers,
  sys: Cpu,
  inf: FileCode,
  ini: FileCode,
  json: FileCode,
  xml: FileCode,
  log: FileText,
};

/** Fallback palette when a category has no colour of its own. */
const ICON_TONES = [
  'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
];

/**
 * Small named tones the admin can pick from on the category form. Stored as the
 * `Category.color` string so the backend stays icon/colour agnostic.
 */
export const COLOR_TONES = [
  { value: 'sky', label: 'Sky' },
  { value: 'violet', label: 'Violet' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'teal', label: 'Teal' },
] as const;

const TONE_CLASS: Record<string, string> = {
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS).filter((k) => k !== 'default');

export function categoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Folder;
  return CATEGORY_ICONS[name.toLowerCase()] ?? Folder;
}

export function extensionIcon(extension: string | null | undefined): LucideIcon {
  const key = (extension ?? '').toLowerCase().replace(/^\./, '');
  return EXTENSION_ICONS[key] ?? File;
}

/** Deterministic tone for a string, so a category keeps its colour across reloads. */
export function toneForValue(value: string | null | undefined, fallback = 'slate'): string {
  if (!value) return TONE_CLASS[fallback] ?? ICON_TONES[0];
  const known = TONE_CLASS[value.toLowerCase()];
  if (known) return known;
  // Allow arbitrary strings (e.g. a category name) to map onto a stable tone.
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return ICON_TONES[hash % ICON_TONES.length];
}

export { CATEGORY_ICONS, EXTENSION_ICONS, TONE_CLASS };

// Re-export the handful of icons the layout chrome needs by name.
export const ChromeIcons = {
  Briefcase,
  Globe,
  Building2,
  Keyboard,
  Mouse,
  MemoryStick,
  HardDrive,
  Router,
  Smartphone,
  Tablet,
  Usb,
  Settings,
  Server: Database,
};
