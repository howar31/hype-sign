import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SETTINGS,
  MAX_SPEED,
  MIN_SPEED,
  makeId,
  type ColorValue,
  type Lang,
  type Mode,
  type Preset,
  type Rotation,
  type Settings,
} from '../types';

type State = Settings & {
  presets: Preset[];
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
  resetSettings: () => void;
  savePreset: (name: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
};

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const useSettings = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      presets: [],

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
      resetSettings: () => {
        // Keep lang and presets; reset everything else.
        const { lang, presets } = get();
        set({ ...DEFAULT_SETTINGS, lang, presets });
      },

      savePreset: (name) => {
        const { textColor, bgColor, presets } = get();
        const preset: Preset = {
          id: makeId(),
          name: name.trim() || `Preset ${presets.length + 1}`,
          textColor,
          bgColor,
        };
        set({ presets: [...presets, preset] });
      },
      applyPreset: (id) => {
        const p = get().presets.find((x) => x.id === id);
        if (!p) return;
        set({ textColor: p.textColor, bgColor: p.bgColor });
      },
      deletePreset: (id) => {
        set({ presets: get().presets.filter((x) => x.id !== id) });
      },
      renamePreset: (id, name) => {
        set({
          presets: get().presets.map((x) => (x.id === id ? { ...x, name } : x)),
        });
      },
    }),
    {
      name: 'hype-sign:v1',
      version: 1,
      partialize: (s) => ({
        text: s.text,
        textColor: s.textColor,
        bgColor: s.bgColor,
        mode: s.mode,
        marqueeSpeed: s.marqueeSpeed,
        rotation: s.rotation,
        lang: s.lang,
        presets: s.presets,
      }),
    },
  ),
);
