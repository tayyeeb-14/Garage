import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme/tokens';

type IconCircleProps = {
  children: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
};

const IconCircle = ({
  children,
  size = 48,
  backgroundColor = colors.primarySoft,
  style,
}: IconCircleProps) => (
  <View
    style={[
      styles.circle,
      {
        width: size,
        height: size,
        borderRadius: size * 0.38,
        backgroundColor,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconCircle;
