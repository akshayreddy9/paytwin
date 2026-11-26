import { Image, View } from 'react-native';
import { Text } from './Text';
import { screenWidth, z } from '../lib/theme';

const isDark = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140;
};

// Splash set from the admin panel: picture in the middle, optional text near the bottom, chosen background.
export function AdminSplash({ settings }) {
  const size = Math.min(screenWidth() * 0.55, 240);
  const bg = settings?.splashBg || '#FFFFFF';
  const text = settings?.splashText || settings?.appName;
  return (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={{ uri: settings.splashLogo }} style={{ width: size, height: size }} resizeMode="contain" />
      {!!text && <Text style={{ position: 'absolute', bottom: z(48), fontSize: 20, fontWeight: '600', color: isDark(bg) ? '#fff' : '#3C4043' }}>{text}</Text>}
    </View>
  );
}

// Plain background while the saved settings are read (a few milliseconds), so the default logo never flashes.
export function SplashBlank({ settings }) {
  return <View style={{ flex: 1, backgroundColor: settings?.splashBg || '#FFFFFF' }} />;
}
