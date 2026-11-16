import { Image, View } from 'react-native';
import { Text } from './Text';
import { useApp } from '../lib/store';
import { C, SCALE, z } from '../lib/theme';

// Square app mark: cyan over navy (like the QR frame), white "pt".
// Uses the logo uploaded in the admin panel when there is one. `raw` skips screen scaling.
export function Logo({ size = 48, rounded = true, raw }) {
  const app = useApp();
  const d = raw ? size : z(size);
  const icon = app?.settings?.appIcon;
  if (icon) return <Image source={{ uri: icon }} style={{ width: d, height: d, borderRadius: rounded ? d * 0.24 : 0 }} />;
  return (
    <View style={{ width: d, height: d, borderRadius: rounded ? d * 0.24 : 0, overflow: 'hidden', backgroundColor: C.navyText }}>
      <View style={{ height: d * 0.5, backgroundColor: C.cyan }} />
      <View style={{ position: 'absolute', inset: 0, width: d, height: d, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: (raw ? size / SCALE : size) * 0.46, letterSpacing: -1, includeFontPadding: false }}>pt</Text>
      </View>
    </View>
  );
}

// Text wordmark: "pay" in navy, "twin" in cyan. Name comes from admin settings.
export function Wordmark({ size = 26, style }) {
  const app = useApp();
  const name = (app?.settings?.appName || 'PayTwin').toLowerCase();
  const split = name.startsWith('pay') ? 3 : Math.ceil(name.length / 2);
  return (
    <Text style={[{ fontSize: size, fontWeight: '700', letterSpacing: -size * 0.04, includeFontPadding: false }, style]}>
      <Text style={{ color: C.navyText }}>{name.slice(0, split)}</Text>
      <Text style={{ color: C.cyan }}>{name.slice(split)}</Text>
    </Text>
  );
}

// "UPI" mark drawn with text: italic, with the orange/green arrow ticks.
export function UpiMark({ size = 18, color = C.navyText }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: size, fontWeight: '700', fontStyle: 'italic', color, letterSpacing: 0.5 }}>UPI</Text>
      <View style={{ marginLeft: 2, width: 0, height: 0, borderTopWidth: z(size * 0.32), borderBottomWidth: z(size * 0.32), borderLeftWidth: z(size * 0.38), borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#F37021' }} />
      <View style={{ marginLeft: -z(size * 0.12), width: 0, height: 0, borderTopWidth: z(size * 0.32), borderBottomWidth: z(size * 0.32), borderLeftWidth: z(size * 0.38), borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#0E8E46' }} />
    </View>
  );
}

// Home header brand: wordmark ❤ UPI
export function BrandUpi() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
      <Wordmark size={22} />
      <Text style={{ fontSize: 16, color: '#EF3B4D' }}>❤</Text>
      <UpiMark size={18} />
    </View>
  );
}

// Grey "paytwin | Powered by UPI" footer used at the bottom of many screens.
export function PoweredBy({ bank, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(8), paddingVertical: z(10), opacity: 0.55 }, style]}>
      <Wordmark size={12} style={{ opacity: 0.9 }} />
      <View style={{ width: 1, height: z(12), backgroundColor: '#888' }} />
      <Text style={{ fontSize: 8, color: '#555' }}>Powered by</Text>
      <UpiMark size={11} color="#555" />
      {!!bank && (<>
        <View style={{ width: 1, height: z(12), backgroundColor: '#888' }} />
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#555' }}>✓ {bank}</Text>
      </>)}
    </View>
  );
}
