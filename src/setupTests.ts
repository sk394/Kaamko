// Jest setup file for testing configuration
// This file will be used to configure testing environment

import '@testing-library/jest-native/extend-expect';

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const React = require('react');
  const {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
  } = require('react-native');

  const Card = ({ children, style }: any) =>
    React.createElement(View, { style }, children);
  Card.Content = ({ children }: any) => React.createElement(View, {}, children);

  const Button = ({
    children,
    onPress,
    disabled,
    style,
    contentStyle,
    mode,
    ...props
  }: any) =>
    React.createElement(
      TouchableOpacity,
      {
        onPress: disabled ? undefined : onPress,
        style,
        accessibilityState: { disabled },
        accessible: true,
        ...props,
      },
      React.createElement(Text, {}, children)
    );

  const PaperProvider = ({ children, theme }: any) =>
    React.createElement(View, {}, children);
  const Divider = ({ style }: any) =>
    React.createElement(View, { style }, null);
  const Surface = ({ children, style }: any) =>
    React.createElement(View, { style }, children);
  const Icon = ({ source, size, color }: any) =>
    React.createElement(View, {
      style: { width: size, height: size, backgroundColor: color },
    });

  const Snackbar = ({ children, visible, onDismiss, action, style }: any) => {
    if (!visible) return null;
    return React.createElement(
      View,
      { style },
      React.createElement(Text, {}, children),
      action &&
        React.createElement(
          TouchableOpacity,
          { onPress: action.onPress, accessible: true },
          React.createElement(Text, {}, action.label)
        )
    );
  };

  return {
    Card,
    Text: ({ children, variant, style }: any) =>
      React.createElement(Text, { style }, children),
    Button,
    PaperProvider,
    Divider,
    Surface,
    Icon,
    ActivityIndicator: ({ size, style }: any) =>
      React.createElement(ActivityIndicator, { size, style }),
    Snackbar,
    MD3LightTheme: {},
  };
});
