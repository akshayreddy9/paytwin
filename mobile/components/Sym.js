import { View } from 'react-native';
import createIconSet from '@expo/vector-icons/createIconSet';
import glyphMap from './symbols-map.json';
import { SCALE } from '../lib/theme';

// Google Material Symbols (outlined and filled), the icon style used by the reference app.
export const SYMBOL_FONTS = {
  MaterialSymbols: require('../assets/fonts/MaterialSymbols.ttf'),
  MaterialSymbolsFill: require('../assets/fonts/MaterialSymbolsFill.ttf'),
};

const Outlined = createIconSet(glyphMap, 'MaterialSymbols', SYMBOL_FONTS.MaterialSymbols);
const Filled = createIconSet(glyphMap, 'MaterialSymbolsFill', SYMBOL_FONTS.MaterialSymbolsFill);

export const hasSymbol = (name) => glyphMap[name] != null;

// duo: two-tone icon (light filled shape under a dark outline), the style of the
// reference app's service grids. duo can be a colour string for the fill.
export function Sym({ fill, duo, size = 24, color, style, ...props }) {
  const s = size * SCALE;
  if (duo) {
    const tint = typeof duo === 'string' ? duo : '#D3E7FF';
    return (
      <View style={[{ width: s, height: s }, style]}>
        <Filled size={s} color={tint} style={{ position: 'absolute', left: 0, top: 0 }} {...props} />
        <Outlined size={s} color={color} style={{ position: 'absolute', left: 0, top: 0 }} {...props} />
      </View>
    );
  }
  const Icon = fill ? Filled : Outlined;
  return <Icon size={s} color={color} style={style} {...props} />;
}
