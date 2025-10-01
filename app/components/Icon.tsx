
import React from 'react';
import { Text } from 'react-native';

const Icon = ({ children, style }: { children: React.ReactNode, style?: any }) => <Text style={[{ fontSize: 20 }, style]}>{children}</Text>;

export default Icon;
