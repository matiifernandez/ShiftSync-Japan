import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({ size = 100, style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Círculo Rojo (Hinomaru) */}
        <Circle cx="50" cy="50" r="50" fill="#B7282E" />
        
        {/* Monte Fuji Estilizado (Blanco) */}
        <Path
          d="M20 65 L40 35 H60 L80 65 L65 55 L50 65 L35 55 Z"
          fill="white"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default Logo;