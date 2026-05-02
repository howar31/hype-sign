import { FontWeightSlider } from '../FontWeightSlider';
import { FontPicker } from '../FontPicker';

// Dedicated Font tab — keeps font weight + face selection isolated from
// the Text tab so users don't expect text presets to capture font choice
// (text presets store text content only, by design).
export function FontSection() {
  return (
    <>
      <FontWeightSlider />
      <FontPicker />
    </>
  );
}
