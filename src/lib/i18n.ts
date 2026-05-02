import { useSettings } from '../store/settingsStore';
import type { Lang } from '../types';

type Dict = Record<string, string>;

const ZH: Dict = {
  'app.title': '電子應援手板',
  'settings.title': '設定',
  'settings.close': '關閉',

  'tab.text': '文字',
  'tab.tint': '字色',
  'tab.backdrop': '底色',
  'tab.settings': '設定',

  'panel.modeSplit': '並排模式',
  'panel.modeFloating': '浮動模式',
  'panel.toggleMode': '切換面板模式',
  'panel.resizeHandle': '拖曳調整面板高度',
  'panel.dragHandle': '拖曳此處移動面板',

  'preset.saveCurrent': '儲存目前顏色',

  'mode.label': '顯示模式',
  'mode.static': '固定顯示',
  'mode.marquee': '跑馬燈',

  'text.label': '文字',
  'text.placeholder': '輸入要顯示的文字（可多行）',

  'speed.label': '跑馬燈速度',
  'speed.unit': 'px/秒',

  'margin.label': '邊界寬度',
  'margin.unit': '%',
  'margin.note': '以視窗短邊百分比為單位；背景仍會滿版至邊緣',

  'weight.label': '字體粗細',
  'weight.note': '若目前字體不支援該粗細，會自動套用最接近的可用值',

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
  'color.type.solid': '純色',
  'color.type.linear': '線性',
  'color.type.radial': '圓形',

  'gradient.angle': '角度',
  'gradient.center': '中心點',
  'gradient.stops': '色彩節點',
  'gradient.add': '＋ 新增節點',
  'gradient.remove': '刪除',
  'gradient.position': '位置',

  'colorPreset.section': '顏色樣板',
  'colorPreset.list': '已儲存的顏色樣板',
  'textPreset.section': '儲存目前文字',
  'textPreset.list': '已儲存的文字樣板',
  'preset.empty': '尚未儲存任何樣板',
  'preset.namePlaceholder': '樣板名稱（可留白）',
  'preset.save': '儲存',
  'preset.apply': '套用',
  'preset.applyConfirm': '再點一次確認套用',
  'preset.delete': '刪除',
  'preset.deleteConfirm': '再點一次確認',
  'preset.edit': '編輯',
  'preset.done': '完成',
  'preset.moveUp': '上移',
  'preset.moveDown': '下移',

  'reset.tint.label': '重置字色',
  'reset.tint.button': '重置字色全部設定（純色 / 線性 / 圓形）',
  'reset.bg.label': '重置底色',
  'reset.bg.button': '重置底色全部設定（純色 / 線性 / 圓形）',
  'reset.confirm': '再點一次確認重置',

  'clear.label': '清除文字',
  'clear.button': '清空目前文字',
  'clear.confirm': '再點一次確認清除',

  'version.label': '版本',
  'version.updateReady': '新版已就緒，重開後生效',
  'version.repo': 'GitHub',
  'version.sponsor': '贊助',
};

const EN: Dict = {
  'app.title': 'Hype Sign',
  'settings.title': 'Settings',
  'settings.close': 'Close',

  'tab.text': 'Text',
  'tab.tint': 'Tint',
  'tab.backdrop': 'Backdrop',
  'tab.settings': 'Settings',

  'panel.modeSplit': 'Split mode',
  'panel.modeFloating': 'Floating mode',
  'panel.toggleMode': 'Toggle panel mode',
  'panel.resizeHandle': 'Drag to resize panel',
  'panel.dragHandle': 'Drag here to move panel',

  'preset.saveCurrent': 'Save current color',

  'mode.label': 'Display mode',
  'mode.static': 'Static',
  'mode.marquee': 'Marquee',

  'text.label': 'Text',
  'text.placeholder': 'Enter text to display (multi-line supported)',

  'speed.label': 'Marquee speed',
  'speed.unit': 'px/s',

  'margin.label': 'Edge margin',
  'margin.unit': '%',
  'margin.note': "Percentage of the viewport's shorter side; background still fills edge-to-edge",

  'weight.label': 'Font weight',
  'weight.note': "If the current font doesn't ship this weight, the closest available one is used",

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
  'color.type.solid': 'Solid',
  'color.type.linear': 'Linear',
  'color.type.radial': 'Radial',

  'gradient.angle': 'Angle',
  'gradient.center': 'Center',
  'gradient.stops': 'Color stops',
  'gradient.add': '+ Add stop',
  'gradient.remove': 'Remove',
  'gradient.position': 'Position',

  'colorPreset.section': 'Color presets',
  'colorPreset.list': 'Saved color presets',
  'textPreset.section': 'Save current text',
  'textPreset.list': 'Saved text presets',
  'preset.empty': 'Nothing saved yet',
  'preset.namePlaceholder': 'Name (optional)',
  'preset.save': 'Save',
  'preset.apply': 'Apply',
  'preset.applyConfirm': 'Tap again to apply',
  'preset.delete': 'Delete',
  'preset.deleteConfirm': 'Tap again to confirm',
  'preset.edit': 'Edit',
  'preset.done': 'Done',
  'preset.moveUp': 'Move up',
  'preset.moveDown': 'Move down',

  'reset.tint.label': 'Reset tint',
  'reset.tint.button': 'Reset all tint settings (solid / linear / radial)',
  'reset.bg.label': 'Reset backdrop',
  'reset.bg.button': 'Reset all backdrop settings (solid / linear / radial)',
  'reset.confirm': 'Tap again to confirm',

  'clear.label': 'Clear text',
  'clear.button': 'Clear current text',
  'clear.confirm': 'Tap again to confirm',

  'version.label': 'Version',
  'version.updateReady': 'New version ready — reopen to apply',
  'version.repo': 'GitHub',
  'version.sponsor': 'Sponsor',
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
