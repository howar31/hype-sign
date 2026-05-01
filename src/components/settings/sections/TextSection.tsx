import { useSettings } from '../../../store/settingsStore';
import { TextInput } from '../TextInput';
import { ModeToggle } from '../ModeToggle';
import { SpeedSlider } from '../SpeedSlider';
import { TextPresetManager } from '../presets/TextPresetManager';

export function TextSection() {
  const mode = useSettings((s) => s.mode);
  return (
    <>
      <TextInput />
      <ModeToggle />
      {mode === 'marquee' && <SpeedSlider />}
      <TextPresetManager />
    </>
  );
}
