import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '../../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconName;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  autoComplete?: TextInput['props']['autoComplete'];
  returnKeyType?: TextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!secureTextEntry);
  const float = useSharedValue(value ? 1 : 0);
  const border = useSharedValue(0);

  useEffect(() => {
    float.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [float, value]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -17]) },
      { scale: interpolate(float.value, [0, 1], [1, 0.86]) },
    ],
    color: focused ? '#D4E3FF' : Colors.text.tertiary,
  }));

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(230,57,70,${interpolate(border.value, [0, 1], [0.08, 0.55])})`,
  }));

  const onFocus = () => {
    setFocused(true);
    float.value = withTiming(1, { duration: 180 });
    border.value = withTiming(1, { duration: 180 });
  };

  const onBlur = () => {
    setFocused(false);
    float.value = withTiming(value ? 1 : 0, { duration: 180 });
    border.value = withTiming(0, { duration: 180 });
  };

  return (
    <Animated.View style={[styles.wrap, fieldStyle]}>
      <Ionicons
        name={icon}
        size={17}
        color={focused ? '#E8EFFD' : Colors.text.tertiary}
        style={styles.icon}
      />
      <View style={styles.inputZone}>
        <Animated.Text style={[styles.label, labelStyle]} allowFontScaling={false}>
          {label}
        </Animated.Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          selectionColor={Colors.accent.crimson}
          placeholderTextColor="transparent"
          allowFontScaling={false}
        />
      </View>
      {secureTextEntry ? (
        <Pressable onPress={() => setVisible(current => !current)} hitSlop={8} style={styles.eyeBtn}>
          <Ionicons
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={17}
            color={Colors.text.tertiary}
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 58,
    borderRadius: Radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(9,14,24,0.64)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  icon: {
    marginTop: 2,
    marginRight: 10,
  },
  inputZone: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: 10,
    left: 0,
    fontSize: 14,
    fontFamily: Typography.fontPrimary,
  },
  input: {
    color: Colors.text.primary,
    fontFamily: Typography.fontPrimary,
    fontSize: 15,
    paddingTop: 16,
    paddingBottom: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },
});

export default AuthInput;

