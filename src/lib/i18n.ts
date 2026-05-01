import { useSettings } from '../store/settingsStore';
import type { Lang } from '../types';

type Dict = Record<string, string>;

const ZH: Dict = {
  'app.title': '電子應援手板',
  'settings.open': '開啟設定',
  'settings.title': '設定',
  'settings.close': '關閉',

  'mode.label': '顯示模式',
  'mode.static': '固定顯示',
  'mode.marquee': '跑馬燈',

  'text.label': '文字',
  'text.placeholder': '輸入要顯示的文字（可多行）',

  'speed.label': '跑馬燈速度',
  'speed.unit': 'px/秒',

  'rotate.label': '旋轉畫面',
  'rotate.button': '旋轉 90°',

  'fullscreen.enter': '全螢幕',
  'fullscreen.exit': '離開全螢幕',

  'lang.label': '語言',
  'lang.zh': '繁體中文',
  'lang.en': 'English',

  'color.text': '文字顏色',
  'color.bg': '背景顏色',
  'color.solid': '純色',
  'color.linear': '線性漸層',
  'color.radial': '圓形漸層',

  'gradient.angle': '角度',
  'gradient.center': '中心點',
  'gradient.stops': '色彩節點',
  'gradient.add': '＋ 新增節點',
  'gradient.remove': '刪除',
  'gradient.position': '位置',

  'preset.section': '預設組合',
  'preset.empty': '尚未儲存任何預設組合',
  'preset.namePlaceholder': '預設名稱',
  'preset.save': '儲存目前顏色',
  'preset.apply': '套用',
  'preset.delete': '刪除',
  'preset.deleteConfirm': '再點一次確認',

  'reset.label': '重置設定',
  'reset.button': '重置為黑底白字',
  'reset.confirm': '再點一次確認重置',
};

const EN: Dict = {
  'app.title': 'Hype Sign',
  'settings.open': 'Open settings',
  'settings.title': 'Settings',
  'settings.close': 'Close',

  'mode.label': 'Display mode',
  'mode.static': 'Static',
  'mode.marquee': 'Marquee',

  'text.label': 'Text',
  'text.placeholder': 'Enter text to display (multi-line supported)',

  'speed.label': 'Marquee speed',
  'speed.unit': 'px/s',

  'rotate.label': 'Rotate display',
  'rotate.button': 'Rotate 90°',

  'fullscreen.enter': 'Fullscreen',
  'fullscreen.exit': 'Exit fullscreen',

  'lang.label': 'Language',
  'lang.zh': '繁體中文',
  'lang.en': 'English',

  'color.text': 'Text color',
  'color.bg': 'Background color',
  'color.solid': 'Solid',
  'color.linear': 'Linear',
  'color.radial': 'Radial',

  'gradient.angle': 'Angle',
  'gradient.center': 'Center',
  'gradient.stops': 'Color stops',
  'gradient.add': '+ Add stop',
  'gradient.remove': 'Remove',
  'gradient.position': 'Position',

  'preset.section': 'Presets',
  'preset.empty': 'No saved presets yet',
  'preset.namePlaceholder': 'Preset name',
  'preset.save': 'Save current colors',
  'preset.apply': 'Apply',
  'preset.delete': 'Delete',
  'preset.deleteConfirm': 'Tap again to confirm',

  'reset.label': 'Reset',
  'reset.button': 'Reset to defaults',
  'reset.confirm': 'Tap again to confirm reset',
};

const DICTS: Record<Lang, Dict> = {
  'zh-TW': ZH,
  en: EN,
};

export function useT() {
  const lang = useSettings((s) => s.lang);
  const dict = DICTS[lang];
  return (key: string): string => dict[key] ?? key;
}
