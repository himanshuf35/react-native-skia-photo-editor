import React, {FunctionComponent, useCallback, useState} from 'react';
import {TextInput} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {TextBoxComponentProps} from './types';
import {textBoxSize} from './constants';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {toM4, translate} from './utils';
import GlobalStyles from '../constants/GlobalStyles';

const TextBox: FunctionComponent<TextBoxComponentProps> = ({
  data: {text, matrix, color},
  onChangeText,
}) => {
  const [changedText, setText] = useState(text);
  const gesture = Gesture.Pan().onChange(event => {
    matrix.value = translate(matrix.value, event.changeX, event.changeY);
  });

  const onChange = useCallback(
    (updatedText: string) => {
      onChangeText(updatedText);
      setText(updatedText);
    },
    [onChangeText],
  );

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: textBoxSize.width,
    top: 0,
    left: 0,
    transform: [
      {
        translateX: -textBoxSize.width / 2,
      },
      {
        translateY: -textBoxSize.height / 2,
      },
      {matrix: toM4(matrix.value)},
      {
        translateX: textBoxSize.width / 2,
      },
      {
        translateY: textBoxSize.height / 2 - 20,
      },
    ],
  }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>
        <TextInput
          autoFocus={!text}
          selectionColor={color}
          multiline={true}
          style={[GlobalStyles.headingText2, {color: color}]}
          onChangeText={onChange}>
          {changedText}
        </TextInput>
      </Animated.View>
    </GestureDetector>
  );
};

export default TextBox;
