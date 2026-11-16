import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Avatar, BankLogo, Seal, Sheet, Sym, s as ui } from '../components/ui';
import { Wordmark } from '../components/Logo';
import { post } from '../lib/api';
import { useApp } from '../lib/store';
import { C, screenWidth, z } from '../lib/theme';
import { upiLink } from './my-qr';

const PANEL = 0.9;

function SettingRow({ icon, title, sub, badge, onPress, last }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: '#eee' }} style={{ flexDirection: 'row', paddingVertical: z(14), gap: z(14), borderBottomWidth: last ? 0 : 1, borderColor: '#F0F0F0' }}>
      <Sym name={icon} size={26} color="#3A3A3A" />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8) }}>
          <Text style={{ fontSize: 16, color: '#1D1D1D' }}>{title}</Text>
          {!!badge && <View style={{ backgroundColor: C.badge, borderRadius: z(4), paddingHorizontal: z(5), paddingVertical: z(1) }}><Text style={{ fontSize: 10, color: '#3A2E00', fontWeight: '600' }}>{badge}</Text></View>}
        </View>
        {!!sub && <Text style={{ fontSize: 13, color: '#7A7A7A', marginTop: z(3), lineHeight: 18 }}>{sub}</Text>}
      </View>
      <Sym name="chevron_right" size={24} color="#3A3A3A" />
    </Pressable>
  );
}

// Profile panel that slides in from the left over Home (tap the avatar).
export default function Profile() {
  const { user, accounts, settings, toast, signOut, applyMe } = useApp();
  const insets = useSafeAreaInsets();
  const x = useRef(new Animated.Value(0)).current;
  const [bankSheet, setBankSheet] = useState(false);
  const width = screenWidth() * PANEL;
  const primary = accounts.find((a) => a.primary) || accounts[0];
  const appName = settings?.appName || 'PayTwin';

  useEffect(() => { Animated.timing(x, { toValue: 1, duration: 260, useNativeDriver: true }).start(); }, [x]);
  const close = (then) => Animated.timing(x, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => { router.back(); if (then) setTimeout(then, 50); });
  const go = (path) => close(() => router.push(path));

  if (!user) return null;
  const copy = async () => { await Clipboard.setStringAsync(user.upiId); toast('UPI ID copied'); };
  const setPrimary = async (a) => {
    setBankSheet(false);
    try { applyMe(await post(`/accounts/${a.id}/primary`)); toast(`Money will now be received in ${a.bankName} - ${a.last4}`); } catch (e) { toast(e.message); }
  };

  const SETTINGS = [
    { icon: 'family_restroom', title: 'Pocket Money', badge: 'New', sub: 'Give your dependents UPI access with UPI Circle — fully under your control', go: () => toast('Pocket Money is not part of this demo') },
    { icon: 'settings', title: 'UPI & Payment Settings', sub: 'UPI PIN, Bank Accounts & more', go: () => go('/upi-settings') },
    { icon: 'autorenew', title: 'Automatic Payments', sub: 'Manage all your UPI Automatic Payments', go: () => toast('No automatic payments set up') },
    { icon: 'shopping_bag', title: 'Orders & Bookings', sub: 'Payments, Recharge, Travel & Others', go: () => go('/history') },
    { icon: 'person', title: 'Profile', sub: 'Privacy, Notification & Language', go: () => go('/settings') },
    { icon: 'group_add', title: 'Refer & Win', sub: `Assured ₹${settings?.referralBonus ?? 400}`, go: () => go('/refer') },
    { icon: 'support_agent', title: 'Help & Support', sub: 'Customer Support, Your Queries & FAQs', go: () => go('/help') },
    { icon: 'send_money', title: 'MyUPI', sub: 'Help for Payments, Mandates & Services', go: () => go('/bank-accounts') },
    { icon: 'contrast', title: 'Appearance', sub: 'Experience Dark Mode (Beta) on select pages, stay tuned for more!', go: () => toast('Dark mode is coming soon') },
    { icon: 'logout', title: 'Sign Out', sub: 'Sign out of this device', go: () => close(() => signOut()) },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', opacity: x }}>
        <Pressable style={{ flex: 1 }} onPress={() => close()} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width, backgroundColor: C.page, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + z(24) }} showsVerticalScrollIndicator={false}>
          <View style={{ height: z(64), justifyContent: 'center', alignItems: 'center' }}>
            <Pressable hitSlop={12} onPress={() => close()} style={{ position: 'absolute', left: z(12), padding: z(4) }}>
              <Sym name="arrow_back" size={28} color="#1D1D1D" />
            </Pressable>
            <Wordmark size={30} />
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: z(20), marginHorizontal: z(14), overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', padding: z(18), gap: z(14) }}>
              <Pressable onPress={() => go('/edit-profile')} style={{ padding: z(3), borderRadius: z(40), borderWidth: 2, borderColor: '#C9B6F2' }}>
                <Avatar user={user} size={64} />
                <View style={{ position: 'absolute', right: -z(2), bottom: z(2), width: z(22), height: z(22), borderRadius: z(11), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD' }}>
                  <Sym name="photo_camera" size={13} color="#555" />
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 21, fontWeight: '700', color: '#1D1D1D' }}>{user.name}</Text>
                <Seal size={22} color="#1D4E9E" />
                <Pressable onPress={copy} style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), marginTop: z(4) }}>
                  <Text style={{ fontSize: 15, color: '#3A3A3A' }} numberOfLines={1}>UPI ID: {user.upiId}</Text>
                  <Sym name="content_copy" size={17} color={C.link} />
                </Pressable>
              </View>
            </View>
            <View style={{ backgroundColor: C.pink, flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(16), paddingVertical: z(14), gap: z(12) }}>
              <View style={{ width: z(36), height: z(36), borderRadius: z(18), backgroundColor: '#E33B3B', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>i</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: '#1D1D1D', lineHeight: 21 }}>Receive money on {appName} from all UPI apps</Text>
              <Pressable onPress={() => toast('Receiving from all UPI apps is enabled')} style={{ backgroundColor: '#0B3D86', borderRadius: z(20), paddingHorizontal: z(12), paddingVertical: z(8) }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Enable now</Text>
              </Pressable>
            </View>
          </View>

          {/* QR in the cyan/navy frame */}
          <View style={{ marginHorizontal: z(14), marginTop: z(14), borderRadius: z(26), overflow: 'hidden', backgroundColor: C.navyText }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: '#00B5F0' }} />
            <View style={{ margin: z(14), backgroundColor: '#fff', borderRadius: z(16), alignItems: 'center', paddingVertical: z(36) }}>
              <QRCode value={upiLink(user)} size={z(240)} color="#000" />
            </View>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: z(18), marginHorizontal: z(14), marginTop: z(14), flexDirection: 'row', alignItems: 'center', padding: z(16), gap: z(12) }}>
            {primary ? <BankLogo account={primary} size={24} /> : <Sym name="account_balance" size={22} color={C.icon} />}
            <Text style={{ flex: 1, fontSize: 17, color: '#1D1D1D' }} numberOfLines={1}>{primary ? `${primary.bankName} - ${primary.last4}` : 'No bank linked'}</Text>
            <Pressable hitSlop={8} onPress={() => (accounts.length > 1 ? setBankSheet(true) : go('/link-bank?from=settings'))}>
              <Text style={{ color: C.link, fontSize: 17, fontWeight: '500' }}>{accounts.length ? 'Change Bank' : 'Add Bank'}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: z(12), marginHorizontal: z(14), marginTop: z(12) }}>
            <Pressable onPress={() => Share.share({ message: `Pay ${user.name} on ${appName}\nUPI ID: ${user.upiId}\n${upiLink(user)}` })} style={{ flex: 1, height: z(52), borderRadius: z(26), backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(8) }}>
              <Sym name="ios_share" size={20} color="#1D1D1D" />
              <Text style={{ fontSize: 17, color: '#1D1D1D' }}>Share</Text>
            </Pressable>
            <Pressable onPress={() => go('/my-qr')} style={{ flex: 1, height: z(52), borderRadius: z(26), backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(8), paddingHorizontal: z(10) }}>
              <Sym name="add_circle" size={20} color="#1D1D1D" />
              <Text style={{ fontSize: 17, color: '#1D1D1D' }} numberOfLines={1}>Add QR to Home</Text>
            </Pressable>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: z(20), marginHorizontal: z(14), marginTop: z(14), paddingHorizontal: z(18), paddingTop: z(16) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: z(4) }}>
              <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: '#1D1D1D' }}>Settings</Text>
              <Pressable hitSlop={10} onPress={() => go('/help')}><Sym name="search" size={28} color="#1D1D1D" /></Pressable>
            </View>
            {SETTINGS.map((r, i) => <SettingRow key={r.title} icon={r.icon} title={r.title} sub={r.sub} badge={r.badge} onPress={r.go} last={i === SETTINGS.length - 1} />)}
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: z(20), marginHorizontal: z(14), marginTop: z(14), flexDirection: 'row', alignItems: 'center', padding: z(18), gap: z(14) }}>
            <Sym name="shield" size={30} color={C.navy} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D1D1D' }}>{appName} Security Shield</Text>
              <Text style={{ fontSize: 13, color: '#7A7A7A', marginTop: z(2) }}>Protect your account</Text>
            </View>
            <Pressable onPress={() => go('/settings')} style={{ backgroundColor: C.blueSoft, borderRadius: z(16), paddingHorizontal: z(12), paddingVertical: z(6) }}>
              <Text style={{ color: C.link, fontSize: 14, fontWeight: '500' }}>Activate</Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', marginTop: z(30) }}>
            <Wordmark size={46} />
            <Text style={{ fontSize: 11, color: '#3A3A3A', fontWeight: '600', marginTop: z(2) }}><Text style={{ color: '#F37021' }}>═</Text> Made with ❤ in India <Text style={{ color: '#0E8E46' }}>═</Text></Text>
            <Text style={{ fontSize: 13, color: '#5A5A5A', textAlign: 'center', marginTop: z(18), paddingHorizontal: z(24), lineHeight: 19 }}>
              Terms & Conditions, Privacy policy, Grievance Redressal Mechanism, <Text style={{ color: C.link }} onPress={() => go('/help')}>See all policies</Text>
            </Text>
            <Text style={{ fontSize: 12, color: '#8A8A8A', marginTop: z(14) }}>{settings?.appVersion || 'v1.0.0'} · Demo app, no real money</Text>
          </View>
        </ScrollView>
      </Animated.View>

      <Sheet visible={bankSheet} onClose={() => setBankSheet(false)} title="Receive money in">
        {accounts.map((a) => (
          <Pressable key={a.id} onPress={() => setPrimary(a)} style={[ui.row, { paddingVertical: z(12) }]}>
            <BankLogo account={a} size={36} />
            <Text style={{ flex: 1, fontSize: 16, color: C.text }}>{a.bankName} - {a.last4}</Text>
            <Sym name={a.primary ? 'radio_button_checked' : 'radio_button_unchecked'} size={24} color={a.primary ? C.navy : C.faint} />
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
