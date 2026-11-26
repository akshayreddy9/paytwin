import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../components/Text';
import { Sym } from '../components/ui';
import { Wordmark } from '../components/Logo';
import { useApp } from '../lib/store';
import { z } from '../lib/theme';
import { AdminSplash, SplashBlank } from '../components/AdminSplash';

function Badge({ icon, label, sub }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
      <Sym name={icon} size={20} color="#6B6B6B" />
      <View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#5A5A5A' }}>{label}</Text>
        {!!sub && <Text style={{ fontSize: 6, color: '#8A8A8A' }}>{sub}</Text>}
      </View>
    </View>
  );
}

// Splash: wordmark with the tagline, then route to the right place.
export default function Splash() {
  const { booted, user, accounts, settings, settingsReady } = useApp();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, [fade]);

  useEffect(() => {
    if (!booted) return undefined;
    const t = setTimeout(() => {
      if (!user) router.replace('/welcome');
      else if (!user.profileComplete) router.replace('/setup-profile');
      else if (!accounts.length) router.replace('/link-bank');
      else router.replace('/home');
    }, 1100);
    return () => clearTimeout(t);
  }, [booted, user, accounts.length]);

  // Admin panel splash (logo / colour / text) wins over the built-in design.
  if (!settingsReady) return <SplashBlank settings={settings} />;
  if (settings?.splashLogo) return <AdminSplash settings={settings} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: fade }}>
        <Wordmark size={64} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), marginTop: z(2) }}>
          <View style={{ width: z(14), height: z(3), backgroundColor: '#F37021' }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1D1D1D' }}>Made with ❤ in India</Text>
          <View style={{ width: z(14), height: z(3), backgroundColor: '#0E8E46' }} />
        </View>
      </Animated.View>
      <Animated.View style={{ alignItems: 'center', paddingBottom: z(48), opacity: fade }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#7A7A7A', letterSpacing: 0.6 }}>SAFE & SECURE UPI PAYMENTS</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(18), marginTop: z(10) }}>
          <Badge icon="verified_user" label="UPI" sub="POWERED" />
          <Sym name="shield" size={26} color="#6B6B6B" />
          <Badge icon="lock" label="256-BIT" sub="ENCRYPTED" />
        </View>
      </Animated.View>
    </View>
  );
}
