import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Rect, G } from 'react-native-svg';

interface CareSymbolProps {
  code: string;
  size?: number;
  showLabel?: boolean;
}

// ISO 3758 Standard Care Symbols
const CareSymbolSVG: React.FC<{ code: string; size: number }> = ({ code, size }) => {
  const viewBox = "0 0 100 100";
  const stroke = "#000";
  const strokeWidth = 3;
  
  switch (code.toUpperCase()) {
    // WASHING SYMBOLS - Washtub
    case 'A1': // Wash 30°C
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          {/* Washtub */}
          <Path
            d="M 15 35 L 15 55 Q 15 75 50 75 Q 85 75 85 55 L 85 35 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* One dot for 30°C */}
          <Circle cx="50" cy="52" r="4" fill={stroke} />
        </Svg>
      );
    
    case 'A2': // Wash 40°C
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 15 35 L 15 55 Q 15 75 50 75 Q 85 75 85 55 L 85 35 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Two dots for 40°C */}
          <Circle cx="44" cy="52" r="4" fill={stroke} />
          <Circle cx="56" cy="52" r="4" fill={stroke} />
        </Svg>
      );
    
    case 'A3': // Wash 60°C
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 15 35 L 15 55 Q 15 75 50 75 Q 85 75 85 55 L 85 35 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Three dots for 60°C */}
          <Circle cx="40" cy="52" r="4" fill={stroke} />
          <Circle cx="50" cy="52" r="4" fill={stroke} />
          <Circle cx="60" cy="52" r="4" fill={stroke} />
        </Svg>
      );
      
    case 'A5': // Hand wash
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 15 50 L 15 65 Q 15 80 50 80 Q 85 80 85 65 L 85 50 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Hand */}
          <Path
            d="M 35 45 Q 35 35 45 30 Q 50 28 55 30 Q 65 35 65 45"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
      );
    
    case 'A6': // Do not wash
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 15 35 L 15 55 Q 15 75 50 75 Q 85 75 85 55 L 85 35 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* X mark */}
          <Line x1="20" y1="30" x2="80" y2="80" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="80" y1="30" x2="20" y2="80" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    // BLEACHING SYMBOLS - Triangle
    case 'B1': // Any bleach
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 50 20 L 85 80 L 15 80 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
      );
    
    case 'B2': // Non-chlorine bleach only
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 50 20 L 85 80 L 15 80 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Diagonal lines */}
          <Line x1="40" y1="40" x2="45" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="55" y1="40" x2="60" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    case 'B3': // Do not bleach
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 50 20 L 85 80 L 15 80 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* X mark */}
          <Line x1="25" y1="30" x2="75" y2="75" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="75" y1="30" x2="25" y2="75" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    // IRONING SYMBOLS - Iron shape
    case 'C1': // Iron low (1 dot)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 25 40 L 65 40 L 85 55 L 85 65 L 25 65 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle cx="45" cy="52" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'C2': // Iron medium (2 dots)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 25 40 L 65 40 L 85 55 L 85 65 L 25 65 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle cx="40" cy="52" r="3" fill={stroke} />
          <Circle cx="50" cy="52" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'C3': // Iron high (3 dots)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 25 40 L 65 40 L 85 55 L 85 65 L 25 65 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle cx="35" cy="52" r="3" fill={stroke} />
          <Circle cx="45" cy="52" r="3" fill={stroke} />
          <Circle cx="55" cy="52" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'C4': // Do not iron
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Path
            d="M 25 40 L 65 40 L 85 55 L 85 65 L 25 65 Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* X mark */}
          <Line x1="30" y1="45" x2="70" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="70" y1="45" x2="30" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    // DRY CLEANING SYMBOLS - Circle
    case 'D1': // Dry clean - Any solvent (A)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx="50" cy="50" r="30" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Text
            x="50"
            y="62"
            fontSize="28"
            fontWeight="bold"
            textAnchor="middle"
            fill={stroke}
          >
            A
          </Text>
        </Svg>
      );
    
    case 'D2': // Dry clean - Perchloroethylene (P)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx="50" cy="50" r="30" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Text
            x="50"
            y="62"
            fontSize="28"
            fontWeight="bold"
            textAnchor="middle"
            fill={stroke}
          >
            P
          </Text>
        </Svg>
      );
    
    case 'D3': // Dry clean - Petroleum solvent (F)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx="50" cy="50" r="30" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Text
            x="50"
            y="62"
            fontSize="28"
            fontWeight="bold"
            textAnchor="middle"
            fill={stroke}
          >
            F
          </Text>
        </Svg>
      );
    
    case 'D4': // Do not dry clean
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Circle cx="50" cy="50" r="30" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          {/* X mark */}
          <Line x1="30" y1="30" x2="70" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="70" y1="30" x2="30" y2="70" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    // TUMBLE DRYING SYMBOLS - Square with circle
    case 'E1': // Tumble dry low (1 dot)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Rect x="20" y="20" width="60" height="60" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="50" cy="50" r="20" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="50" cy="50" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'E2': // Tumble dry medium (2 dots)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Rect x="20" y="20" width="60" height="60" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="50" cy="50" r="20" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="44" cy="50" r="3" fill={stroke} />
          <Circle cx="56" cy="50" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'E3': // Tumble dry high (3 dots)
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Rect x="20" y="20" width="60" height="60" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="50" cy="50" r="20" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="40" cy="50" r="3" fill={stroke} />
          <Circle cx="50" cy="50" r="3" fill={stroke} />
          <Circle cx="60" cy="50" r="3" fill={stroke} />
        </Svg>
      );
    
    case 'E4': // Do not tumble dry
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Rect x="20" y="20" width="60" height="60" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Circle cx="50" cy="50" r="20" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          {/* X mark */}
          <Line x1="35" y1="35" x2="65" y2="65" stroke={stroke} strokeWidth={strokeWidth} />
          <Line x1="65" y1="35" x2="35" y2="65" stroke={stroke} strokeWidth={strokeWidth} />
        </Svg>
      );
    
    default:
      return (
        <Svg width={size} height={size} viewBox={viewBox}>
          <Rect x="10" y="10" width="80" height="80" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
          <Text
            x="50"
            y="58"
            fontSize="16"
            textAnchor="middle"
            fill={stroke}
          >
            {code}
          </Text>
        </Svg>
      );
  }
};

const getCareSymbolName = (code: string): string => {
  const careNames: { [key: string]: string } = {
    'A1': 'Wash at 30°C',
    'A2': 'Wash at 40°C',
    'A3': 'Wash at 60°C',
    'A4': 'Wash at 95°C',
    'A5': 'Hand wash only',
    'A6': 'Do not wash',
    'B1': 'Any bleach allowed',
    'B2': 'Non-chlorine bleach only',
    'B3': 'Do not bleach',
    'C1': 'Iron low temp (110°C)',
    'C2': 'Iron medium temp (150°C)',
    'C3': 'Iron high temp (200°C)',
    'C4': 'Do not iron',
    'D1': 'Dry clean - any solvent',
    'D2': 'Dry clean - perchloroethylene',
    'D3': 'Dry clean - petroleum solvent',
    'D4': 'Do not dry clean',
    'E1': 'Tumble dry low heat',
    'E2': 'Tumble dry medium heat',
    'E3': 'Tumble dry high heat',
    'E4': 'Do not tumble dry',
  };
  
  return careNames[code.toUpperCase()] || code;
};

export const CareSymbol: React.FC<CareSymbolProps> = ({ code, size = 48, showLabel = true }) => {
  return (
    <View style={styles.symbolContainer}>
      <CareSymbolSVG code={code} size={size} />
      {showLabel && (
        <Text style={styles.symbolLabel}>{getCareSymbolName(code)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  symbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  symbolLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 80,
  },
});
