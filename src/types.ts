import type {
  SkMatrix,
  SkPaint,
  SkPath,
  SkSize,
} from '@shopify/react-native-skia';
import type {SharedValue} from 'react-native-reanimated';

export type CurrentPath = {
  path: SkPath;
  paint: SkPaint;
};

export type TextBoxData = {
  text: string;
  matrix: SharedValue<SkMatrix>;
  color: string;
};

export type TextBoxComponentProps = {
  data: TextBoxData;
  onChangeText: (text: string) => void;
};

export type PhotoEditorComponentProps = {
  image: string;
  onCrossPress: () => void;
};

export type GestureHandlerProps = {
  matrix: SharedValue<SkMatrix>;
  size: SkSize;
};
