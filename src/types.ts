export type SolidColor = { type: 'solid'; color: string };

export type ColorStop = {
  id: string;
  color: string;
  position: number; // 0–100
};

export type LinearGradient = {
  type: 'linear';
  angle: number; // 0–360
  stops: ColorStop[];
};

export type RadialGradient = {
  type: 'radial';
  cx: number; // 0–100 (percentage)
  cy: number; // 0–100
  stops: ColorStop[];
};

export type ColorValue = SolidColor | LinearGradient | RadialGradient;

export type Mode = 'static' | 'marquee';
export type Lang = 'zh-TW' | 'en';
export type Rotation = 0 | 90 | 180 | 270;

export type Preset = {
  id: string;
  name: string;
  textColor: ColorValue;
  bgColor: ColorValue;
};

export type TextPreset = {
  id: string;
  name: string;
  text: string;
};

export type Settings = {
  text: string;
  textColor: ColorValue;
  bgColor: ColorValue;
  mode: Mode;
  marqueeSpeed: number; // 100–2000 px/s
  rotation: Rotation;
  lang: Lang;
};

export const DEFAULT_TEXT_COLOR: ColorValue = { type: 'solid', color: '#FFFFFF' };
export const DEFAULT_BG_COLOR: ColorValue = { type: 'solid', color: '#000000' };

export const DEFAULT_SETTINGS: Settings = {
  text: 'HYPE\nSIGN',
  textColor: DEFAULT_TEXT_COLOR,
  bgColor: DEFAULT_BG_COLOR,
  mode: 'static',
  marqueeSpeed: 400,
  rotation: 0,
  lang: 'zh-TW',
};

export const MIN_SPEED = 100;
export const MAX_SPEED = 2000;

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}
