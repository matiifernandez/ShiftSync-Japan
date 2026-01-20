import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

const Logo: React.FC<LogoProps> = ({ size = 100, style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Japan Sun / Background Circle */}
        <Circle cx="50" cy="50" r="48" fill="#D9381E" />
        
        {/* Mount Fuji Body */}
        <Path 
          d="M20 80 L50 25 L80 80 Z" 
          fill="#FFFFFF" 
        />
        
        {/* Fuji Shadow / Detail */}
        <Path 
          d="M50 25 L80 80 L65 80 L50 53 Z" 
          fill="#F3F4F6" 
          opacity="0.3"
        />

        {/* Snow Cap Detail (Jagged bottom) */}
        <Path 
          d="M50 25 L38 46 L45 42 L50 48 L55 42 L62 46 Z" 
          fill="#E5E7EB" 
        />
      </Svg>
    </View>
  );
};

export default Logo;
