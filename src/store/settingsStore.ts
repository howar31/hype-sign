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

type State = Settings & {
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
};

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const useSettings = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      presets: [],
      textPresets: [],

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
    }),
    {
      name: 'hype-sign:v1',
      version: 2,
      // v1 → v2: presets used to be { textColor, bgColor } pairs. Split each
      // pair into two single-color presets so the new preset model works.
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
      }),
    },
  ),
);
