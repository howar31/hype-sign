import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_BG_COLOR,
  DEFAULT_SETTINGS,
  DEFAULT_TEXT_COLOR,
  FONT_WEIGHT_STEP,
  MAX_FONT_WEIGHT,
  MAX_MARGIN,
  MAX_SPEED,
  MIN_FONT_WEIGHT,
  MIN_MARGIN,
  MIN_SPEED,
  makeId,
  type ColorValue,
  type Lang,
  type Mode,
  type Preset,
  type Rotation,
  type Settings,
  type TextPreset,
} from '../types';

export type PanelMode = 'split' | 'floating';
export type FloatingPos = { x: number; y: number };

export const DEFAULT_PANEL_MODE: PanelMode = 'split';
export const DEFAULT_FLOATING_POS: FloatingPos = { x: 24, y: 80 };
export const DEFAULT_MOBILE_PANEL_HEIGHT = 360;
export const MIN_MOBILE_PANEL_HEIGHT = 200;
export const DEFAULT_FLOATING_HEIGHT = 600;
export const MIN_FLOATING_HEIGHT = 200;

type PanelState = {
  // Persisted preferences
  panelMode: PanelMode;
  floatingPos: FloatingPos;
  mobilePanelHeight: number;
  floatingHeight: number;
  // Session-only — single visibility flag. Click on the display canvas
  // toggles this regardless of mode (no separate gear button anymore).
  panelVisible: boolean;
};

type State = Settings & PanelState & {
  presets: Preset[];
  textPresets: TextPreset[];
};

type Actions = {
  setText: (text: string) => void;
  setTextColor: (color: ColorValue) => void;
  setBgColor: (color: ColorValue) => void;
  setMode: (mode: Mode) => void;
  setMarqueeSpeed: (speed: number) => void;
  setRotation: (r: Rotation) => void;
  cycleRotation: () => void;
  setLang: (lang: Lang) => void;
  setMargin: (n: number) => void;
  setFontWeight: (n: number) => void;
  resetTextColor: () => void;
  resetBgColor: () => void;
  savePreset: (name: string, color: ColorValue) => void;
  applyPresetToText: (id: string) => void;
  applyPresetToBg: (id: string) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  saveTextPreset: (name: string) => void;
  applyTextPreset: (id: string) => void;
  deleteTextPreset: (id: string) => void;
  reorderPresets: (id: string, direction: 'up' | 'down') => void;
  reorderTextPresets: (id: string, direction: 'up' | 'down') => void;
  setPanelMode: (mode: PanelMode) => void;
  togglePanel: () => void;
  closePanel: () => void;
  setFloatingPos: (pos: FloatingPos) => void;
  setMobilePanelHeight: (h: number) => void;
  setFloatingHeight: (h: number) => void;
};

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const useSettings = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      presets: [],
      textPresets: [],
      panelMode: DEFAULT_PANEL_MODE,
      floatingPos: DEFAULT_FLOATING_POS,
      mobilePanelHeight: DEFAULT_MOBILE_PANEL_HEIGHT,
      floatingHeight: DEFAULT_FLOATING_HEIGHT,
      panelVisible: false,

      setText: (text) => set({ text }),
      setTextColor: (textColor) => set({ textColor }),
      setBgColor: (bgColor) => set({ bgColor }),
      setMode: (mode) => set({ mode }),
      setMarqueeSpeed: (speed) =>
        set({ marqueeSpeed: Math.max(MIN_SPEED, Math.min(MAX_SPEED, Math.round(speed))) }),
      setRotation: (rotation) => set({ rotation }),
      cycleRotation: () => {
        const idx = ROTATION_CYCLE.indexOf(get().rotation);
        const next = ROTATION_CYCLE[(idx + 1) % ROTATION_CYCLE.length];
        set({ rotation: next });
      },
      setLang: (lang) => set({ lang }),
      setMargin: (n) =>
        set({ margin: Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, Math.round(n))) }),
      setFontWeight: (n) => {
        const snapped = Math.round(n / FONT_WEIGHT_STEP) * FONT_WEIGHT_STEP;
        set({
          fontWeight: Math.max(MIN_FONT_WEIGHT, Math.min(MAX_FONT_WEIGHT, snapped)),
        });
      },
      resetTextColor: () => set({ textColor: DEFAULT_TEXT_COLOR }),
      resetBgColor: () => set({ bgColor: DEFAULT_BG_COLOR }),

      savePreset: (name, color) => {
        const { presets } = get();
        const preset: Preset = {
          id: makeId(),
          name: name.trim() || `Preset ${presets.length + 1}`,
          color,
        };
        set({ presets: [...presets, preset] });
      },
      applyPresetToText: (id) => {
        const p = get().presets.find((x) => x.id === id);
        if (!p) return;
        set({ textColor: p.color });
      },
      applyPresetToBg: (id) => {
        const p = get().presets.find((x) => x.id === id);
        if (!p) return;
        set({ bgColor: p.color });
      },
      deletePreset: (id) => {
        set({ presets: get().presets.filter((x) => x.id !== id) });
      },
      renamePreset: (id, name) => {
        set({
          presets: get().presets.map((x) => (x.id === id ? { ...x, name } : x)),
        });
      },

      saveTextPreset: (name) => {
        const { text, textPresets } = get();
        if (!text.trim()) return;
        const preset: TextPreset = {
          id: makeId(),
          name: name.trim(),
          text,
        };
        set({ textPresets: [...textPresets, preset] });
      },
      applyTextPreset: (id) => {
        const p = get().textPresets.find((x) => x.id === id);
        if (!p) return;
        set({ text: p.text });
      },
      deleteTextPreset: (id) => {
        set({ textPresets: get().textPresets.filter((x) => x.id !== id) });
      },

      reorderPresets: (id, direction) => {
        const arr = [...get().presets];
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= arr.length) return;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        set({ presets: arr });
      },
      reorderTextPresets: (id, direction) => {
        const arr = [...get().textPresets];
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= arr.length) return;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        set({ textPresets: arr });
      },

      setPanelMode: (mode) => set({ panelMode: mode }),
      togglePanel: () => set({ panelVisible: !get().panelVisible }),
      closePanel: () => set({ panelVisible: false }),
      setFloatingPos: (pos) => set({ floatingPos: pos }),
      setMobilePanelHeight: (h) => {
        // Allow the bottom sheet to grow to 90% of the viewport, leaving
        // ~10vh visible at the top so the user can still tap the canvas
        // to dismiss the panel.
        const max = typeof window !== 'undefined' ? window.innerHeight * 0.9 : 600;
        const clamped = Math.max(MIN_MOBILE_PANEL_HEIGHT, Math.min(max, Math.round(h)));
        set({ mobilePanelHeight: clamped });
      },
      setFloatingHeight: (h) => {
        const max = typeof window !== 'undefined' ? window.innerHeight - 40 : 1000;
        const clamped = Math.max(MIN_FLOATING_HEIGHT, Math.min(max, Math.round(h)));
        set({ floatingHeight: clamped });
      },
    }),
    {
      name: 'hype-sign:v1',
      version: 3,
      // v1 → v2: presets used to be { textColor, bgColor } pairs. Split each
      // pair into two single-color presets so the new preset model works.
      // v2 → v3: introduce panelMode / floatingPos / mobilePanelHeight; pure
      // additive — seed defaults if absent.
      migrate: (persisted, version) => {
        const s = persisted as Partial<State> & {
          presets?: Array<Partial<Preset> & { textColor?: ColorValue; bgColor?: ColorValue }>;
        };
        if (version < 2 && Array.isArray(s.presets)) {
          const next: Preset[] = [];
          for (const p of s.presets) {
            if (p.color) {
              next.push({ id: p.id ?? makeId(), name: p.name ?? '', color: p.color });
              continue;
            }
            const baseName = p.name ?? '';
            if (p.textColor) {
              next.push({
                id: makeId(),
                name: baseName ? `${baseName} (字)` : '字色',
                color: p.textColor,
              });
            }
            if (p.bgColor) {
              next.push({
                id: makeId(),
                name: baseName ? `${baseName} (底)` : '底色',
                color: p.bgColor,
              });
            }
          }
          s.presets = next;
        }
        if (version < 3) {
          if (!s.panelMode) s.panelMode = DEFAULT_PANEL_MODE;
          if (!s.floatingPos) s.floatingPos = DEFAULT_FLOATING_POS;
          if (typeof s.mobilePanelHeight !== 'number') s.mobilePanelHeight = DEFAULT_MOBILE_PANEL_HEIGHT;
          if (typeof s.floatingHeight !== 'number') s.floatingHeight = DEFAULT_FLOATING_HEIGHT;
        }
        return s as State;
      },
      partialize: (s) => ({
        text: s.text,
        textColor: s.textColor,
        bgColor: s.bgColor,
        mode: s.mode,
        marqueeSpeed: s.marqueeSpeed,
        rotation: s.rotation,
        lang: s.lang,
        margin: s.margin,
        fontWeight: s.fontWeight,
        presets: s.presets,
        textPresets: s.textPresets,
        panelMode: s.panelMode,
        floatingPos: s.floatingPos,
        mobilePanelHeight: s.mobilePanelHeight,
        floatingHeight: s.floatingHeight,
      }),
    },
  ),
);
