import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Image as NativeImage,
} from 'react-native';
import ResponsiveText from 'react-native-skia-responsive-text';
import {
  Canvas,
  Image,
  useImage,
  useTouchHandler,
  Skia,
  Path,
  useCanvasRef,
  useFont,
  SkMatrix,
  SkFont,
} from '@shopify/react-native-skia';
import {
  AccessibilityLabels,
  Colors,
  deviceHeight,
  deviceWidth,
} from '../constants/Constants';
import {Button, Touchable} from '../components';
import {Close, Brush, TextEdit, TickWhite, Eraser} from '../assets/svgs';
import GlobalStyles from '../constants/GlobalStyles';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import {Texts} from '../constants/Strings';
import type {
  CurrentPath,
  PhotoEditorComponentProps,
  TextBoxData,
} from './types';
import {getPaint, makeMatrix} from './utils';
import TextBox from './TextBox';
import {textBoxSize} from './constants';
import {isTablet} from '../utils/DeviceInfoUtil';
import type {SvgComponent} from './types';

type EditOptionButtonProps = {
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  Icon: SvgComponent;
};

enum EditModes {
  brush = 1,
  text = 2,
}

const PhotoEditor: FunctionComponent<PhotoEditorComponentProps> = ({
  image,
  onCrossPress,
}) => {
  const parsedImage = useImage(image);
  const font = useFont(
    require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    isTablet ? 30 : 25,
  );
  const insets = useContext(SafeAreaInsetsContext);
  const touchState = useRef(false);
  const photoCanvasRef = useCanvasRef();
  const [strokeWidth] = useState(3);
  const [strokeColor] = useState(Colors.white);
  const eraserPath = useRef(Skia.Path.Make()).current;
  const [completedPaths, setCompletedPaths] = useState<CurrentPath[]>([
    {
      path: Skia.Path.Make(),
      paint: getPaint(strokeWidth, strokeColor),
    },
  ]);
  const [texts, setTexts] = useState<TextBoxData[]>([]);
  const [editMode, setEditMode] = useState<number | undefined>();
  const [eraserEnabled, setEraserEnabled] = useState(false);
  const topPositionStyle = useMemo(
    () => ({
      top: insets?.top ? insets.top + 12 : 24,
    }),
    [insets?.top],
  );

  useEffect(() => {
    !editMode && setEraserEnabled(false);
  }, [editMode]);

  const addTextBox = useCallback(() => {
    const newTextBox: TextBoxData = {
      text: '',
      matrix: makeMatrix(textBoxSize),
      color: strokeColor,
    };
    setTexts([...texts, newTextBox]);
  }, [strokeColor, texts]);

  const onBrushPress = useCallback(() => {
    setEditMode(EditModes.brush);
  }, []);

  const onAddTextPress = useCallback(() => {
    setEditMode(EditModes.text);
    (!texts.length || texts[texts.length - 1]?.text) && addTextBox();
  }, [addTextBox, texts]);

  const undoPaths = useCallback((prevPaths: CurrentPath[]) => {
    prevPaths[prevPaths?.length - 2]?.path.reset();
    prevPaths.splice(prevPaths?.length - 2, 1);
    setCompletedPaths([...prevPaths]);
  }, []);

  const undoText = useCallback(() => {
    texts.pop();
    setTexts([...texts]);
  }, [texts]);

  const onUndoPress = useCallback(() => {
    editMode === EditModes.brush ? undoPaths(completedPaths) : undoText();
  }, [completedPaths, editMode, undoPaths, undoText]);

  const onDonePress = useCallback(() => {
    setEditMode(undefined);
  }, []);

  const onEraserPress = useCallback(() => {
    setEraserEnabled(!eraserEnabled);
  }, [eraserEnabled]);

  const onChangeText = useCallback(
    (texBoxData: TextBoxData) => (text: string) => {
      texBoxData.text = text;
    },
    [],
  );

  const updatePaths = useCallback(
    (prevPaths: CurrentPath[], newPath: CurrentPath) => {
      prevPaths.push(newPath);
      setCompletedPaths([...completedPaths]);
    },
    [completedPaths],
  );

  const onDrawingStart = useCallback(
    (touchInfo: {x: number; y: number}) => {
      const currentPath = completedPaths[completedPaths.length - 1];
      const {x, y} = touchInfo;
      touchState.current = true;
      currentPath?.path?.moveTo(x, y);
    },
    [completedPaths],
  );

  const onDrawingActive = useCallback(
    (touchInfo: {x: number; y: number}) => {
      const currentPath = completedPaths[completedPaths.length - 1];
      if (touchState.current) {
        const {x, y} = touchInfo;
        currentPath.path.lineTo(x, y);
      }
    },
    [completedPaths],
  );

  const onDrawingFinished = useCallback(() => {
    const newPath = {
      path: Skia.Path.Make(),
      paint: getPaint(strokeWidth, strokeColor),
    };
    updatePaths(completedPaths, newPath);
    touchState.current = false;
  }, [completedPaths, strokeColor, strokeWidth, updatePaths]);

  const onEraserDrawingStart = useCallback(
    (touchInfo: {x: number; y: number}) => {
      const {x, y} = touchInfo;
      touchState.current = true;
      eraserPath?.moveTo(x, y);
    },
    [eraserPath],
  );

  const onEraserDrawingActive = useCallback(
    (touchInfo: {x: number; y: number}) => {
      const {x, y} = touchInfo;
      if (touchState.current) {
        eraserPath.lineTo(x, y);
      }
    },
    [eraserPath],
  );

  const onEraserDrawingFinished = useCallback(() => {
    touchState.current = false;
    photoCanvasRef?.current?.redraw();
  }, [photoCanvasRef]);

  const pencilTouchHandler = useTouchHandler(
    {
      onActive: onDrawingActive,
      onStart: onDrawingStart,
      onEnd: onDrawingFinished,
    },
    [completedPaths],
  );

  const eraserTouchHandler = useTouchHandler({
    onActive: onEraserDrawingActive,
    onStart: onEraserDrawingStart,
    onEnd: onEraserDrawingFinished,
  });

  const renderEditOptions = useCallback(
    () => (
      <>
        <EditOptionButton
          style={[styles.crossButton, topPositionStyle]}
          onPress={onCrossPress}
          Icon={Close}
        />
        <EditOptionButton
          style={[styles.brushView, topPositionStyle]}
          onPress={onBrushPress}
          Icon={Brush}
        />
        <EditOptionButton
          style={[styles.addTextView, topPositionStyle]}
          onPress={onAddTextPress}
          Icon={TextEdit}
        />
      </>
    ),
    [onAddTextPress, onBrushPress, onCrossPress, topPositionStyle],
  );

  const renderEditModeOptions = useCallback(
    () => (
      <View style={[styles.editModeOptionsView, topPositionStyle]}>
        <Touchable
          disabled={
            editMode === EditModes.brush
              ? completedPaths?.length === 1
              : texts?.length === 0
          }
          onPress={onUndoPress}>
          <Text style={styles.undoText}>{Texts.undo}</Text>
        </Touchable>
        <View style={GlobalStyles.rowAlignCenter}>
          {editMode === EditModes.brush && (
            <EditOptionButton
              Icon={Eraser}
              style={styles.eraserButtonView}
              onPress={onEraserPress}
            />
          )}
          <Button
            accessibilityLabel={AccessibilityLabels.EditDoneButton}
            title={Texts.done}
            onPress={onDonePress}
            viewStyle={styles.doneButton}
            LeftIcon={TickWhite}
          />
        </View>
      </View>
    ),
    [
      completedPaths?.length,
      editMode,
      onDonePress,
      onEraserPress,
      onUndoPress,
      texts?.length,
      topPositionStyle,
    ],
  );

  return (
    <>
      <NativeImage source={{uri: image}} style={[styles.nativeImage]} />
      <Canvas
        onTouch={
          editMode === EditModes.brush
            ? eraserEnabled
              ? eraserTouchHandler
              : pencilTouchHandler
            : undefined
        }
        ref={photoCanvasRef}
        style={GlobalStyles.flex1}>
        {!eraserEnabled && (
          <Image
            x={0}
            y={0}
            height={deviceHeight}
            width={deviceWidth}
            image={parsedImage}
            fit={'cover'}
          />
        )}
        {completedPaths?.map((path, index) => (
          <Path key={index} path={path.path} paint={path.paint} />
        ))}
        <Path
          path={eraserPath}
          strokeWidth={20}
          style={'stroke'}
          blendMode={'clear'}
        />
        {(!editMode || editMode === EditModes.brush) &&
          texts?.map(({text, matrix}, index) => (
            <ResponsiveText
              key={index}
              text={text}
              matrix={matrix as unknown as SkMatrix}
              font={font as SkFont}
              lineHeight={isTablet ? 37 : 30}
              color={strokeColor}
              width={textBoxSize.width}
            />
          ))}
      </Canvas>
      {editMode === EditModes.text &&
        texts?.map((texBoxData, index) => (
          <TextBox
            key={texBoxData?.text ?? '' + index}
            data={texBoxData}
            onChangeText={onChangeText(texBoxData)}
          />
        ))}
      {!editMode ? renderEditOptions() : renderEditModeOptions()}
    </>
  );
};

const EditOptionButton = ({style, onPress, Icon}: EditOptionButtonProps) => {
  return (
    <Touchable style={[styles.commonOptionContainer, style]} onPress={onPress}>
      <Icon />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  crossButton: {
    left: 24,
  },
  nativeImage: {
    position: 'absolute',
    height: deviceHeight,
    width: deviceWidth,
    zIndex: 0,
  },
  commonOptionContainer: {
    ...GlobalStyles.centerContent,
    borderRadius: 12,
    height: 48,
    width: 48,
    backgroundColor: Colors.transparentWhite,
    position: 'absolute',
  },
  editModeOptionsView: {
    width: deviceWidth,
    position: 'absolute',
    ...GlobalStyles.rowSpaceBetween,
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 24,
  },
  doneButton: {
    width: 96,
  },
  eraserButtonView: {position: 'relative', marginRight: 12},
  brushView: {
    right: 82,
  },
  addTextView: {
    right: 24,
  },
  undoText: {
    ...GlobalStyles.bodyTextBold,
    color: Colors.white,
  },
});

export default PhotoEditor;
