import {Dimensions, Platform} from 'react-native';

export const deviceHeight = Dimensions.get('window').height;
export const deviceScreenHeight = Dimensions.get('screen').height;
export const deviceWidth = Dimensions.get('window').width;
export const IS_IOS = Platform .OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

export const textBoxSize = deviceWidth - 140;