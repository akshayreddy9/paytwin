import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Avatar, Sym } from '../components/ui';
import { BrandUpi, Wordmark } from '../components/Logo';
import { useApp, useLive } from '../lib/store';
import { C, screenWidth, shadow, z } from '../lib/theme';

const soonMsg = (toast, what) => toast(`${what} is not part of this demo`);

// One icon + label cell used in every service grid.
function Cell({ icon, label, onPress, badge, iconColor = C.icon, width = '25%' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width, alignItems: 'center', paddingVertical: z(8) }, pressed && { opacity: 0.6 }]}>
      <View style={{ height: z(40), justifyContent: 'center' }}>
        <Sym name={icon} size={32} color={iconColor} duo={iconColor === C.icon ? true : iconColor + "33"} />
        {!!badge && (
          <View style={{ position: 'absolute', top: -z(10), alignSelf: 'center', backgroundColor: C.badge, borderRadius: z(4), paddingHorizontal: z(4), paddingVertical: z(1) }}>
            <Text style={{ fontSize: 10, color: '#3A2E00', fontWeight: '500' }} numberOfLines={1}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 14, color: '#2B2B2B', textAlign: 'center', marginTop: z(6), lineHeight: 18 }} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, onViewAll, children, style }) {
  return (
    <View style={[{ backgroundColor: '#fff', borderRadius: z(20), marginHorizontal: z(14), marginTop: z(14), paddingTop: z(18), paddingBottom: z(12) }, style]}>
      {!!title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(18), marginBottom: z(8) }}>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: '#1D1D1D', letterSpacing: -0.3 }}>{title}</Text>
          {onViewAll && (
            <Pressable hitSlop={8} onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
              <Text style={{ color: C.link, fontSize: 17, fontWeight: '500' }}>View All</Text>
              <Sym name="arrow_forward" size={18} color={C.link} />
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

// Countdown for the "Exclusive offer" card: 87d : 00h : 34m : 53s
function useCountdown(endsAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, (endsAt || 0) - now);
  if (!endsAt || left <= 0) return '';
  const s = Math.floor(left / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${Math.floor(s / 86400)}d : ${p(Math.floor((s % 86400) / 3600))}h : ${p(Math.floor((s % 3600) / 60))}m : ${p(s % 60)}s`;
}

// Header line that alternates between the brand and the admin-set promo (₹100 off on VISA cards).
function HeaderBrand({ settings }) {
  const y = useRef(new Animated.Value(0)).current;
  const [promo, setPromo] = useState(false);
  const hasPromo = !!settings?.headerPromoTitle;
  useEffect(() => {
    if (!hasPromo) return undefined;
    const t = setInterval(() => {
      Animated.timing(y, { toValue: -1, duration: 220, useNativeDriver: true }).start(() => {
        setPromo((p) => !p);
        y.setValue(1);
        Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      });
    }, 4500);
    return () => clearInterval(t);
  }, [hasPromo, y]);
  return (
    <View style={{ flex: 1, height: z(44), overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: y.interpolate({ inputRange: [-1, 1], outputRange: [-z(30), z(30)] }) }], opacity: y.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }) }}>
        {promo && hasPromo ? (
          <Pressable onPress={() => router.push('/bills')}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.navyText }}>
              <Text style={{ color: '#E5484D' }}>{settings.headerPromoTitle.split(' ')[0]}</Text> {settings.headerPromoTitle.split(' ').slice(1).join(' ')}
            </Text>
            <Text style={{ fontSize: 12, color: '#333', marginTop: z(1) }}>{settings.headerPromoSubtitle} <Text style={{ color: C.link }}>❯</Text></Text>
          </Pressable>
        ) : <BrandUpi />}
      </Animated.View>
    </View>
  );
}

function SearchBar({ style }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/search', params: { mode: 'all' } })}
      style={[{ height: z(52), borderRadius: z(26), backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(16), gap: z(12) }, style]}>
      <Sym name="search" size={26} color="#2B2B2B" />
      <Text style={{ fontSize: 18, color: '#8A8A8A' }} numberOfLines={1}>Search for contacts to pay</Text>
    </Pressable>
  );
}

function BigAction({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width: '25%', alignItems: 'center' }, pressed && { opacity: 0.7 }]}>
      <View style={{ width: z(56), height: z(56), borderRadius: z(28), backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
        <Sym name={icon} size={30} color="#fff" />
      </View>
      <Text style={{ fontSize: 14.5, color: '#1D1D1D', textAlign: 'center', marginTop: z(8), lineHeight: 19 }}>{label}</Text>
    </Pressable>
  );
}

// Banner carousel (admin-managed "Home banners").
function Banners({ banners }) {
  const w = screenWidth() - z(28);
  const [i, setI] = useState(0);
  if (!banners?.length) return null;
  return (
    <View style={{ marginTop: z(14) }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginHorizontal: z(14), borderRadius: z(16) }}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / w))}>
        {banners.map((b) => (
          <Pressable key={b.id} onPress={() => router.push('/offers')} style={{ width: w, height: z(150), backgroundColor: b.color || '#E8F4FD', borderRadius: z(16), flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(16) }}>
            <View style={{ flex: 1.2, paddingRight: z(8) }}>
              <Wordmark size={13} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B2E6B', marginTop: z(6), lineHeight: 21 }}>{b.title}</Text>
              {!!b.cta && (
                <View style={{ alignSelf: 'flex-start', marginTop: z(10), backgroundColor: '#0B2E6B', borderRadius: z(14), paddingHorizontal: z(12), paddingVertical: z(5), flexDirection: 'row', alignItems: 'center', gap: z(4) }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{b.cta}</Text>
                  <Sym name="arrow_forward" size={14} color="#fff" />
                </View>
              )}
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              {!!b.subtitle && <Text style={{ fontSize: 11, fontWeight: '600', color: '#0B2E6B', textAlign: 'center' }}>{b.subtitle}</Text>}
              <Text style={{ fontSize: 40, fontWeight: '700', color: '#1557C0', letterSpacing: -1.5 }} numberOfLines={1} adjustsFontSizeToFit>{b.emoji}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {banners.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: z(4), marginTop: z(8) }}>
          {banners.map((b, k) => <View key={b.id} style={{ width: k === i ? z(14) : z(5), height: z(5), borderRadius: z(3), backgroundColor: k === i ? '#555' : '#CFCFCF' }} />)}
        </View>
      )}
    </View>
  );
}

function FreeToolCard({ bg, title, onPress, children }) {
  return (
    <Pressable onPress={onPress} style={{ width: z(118), height: z(150), borderRadius: z(14), backgroundColor: bg, padding: z(10), marginRight: z(8), overflow: 'hidden' }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#1D1D1D', lineHeight: 17 }}>{title}</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>{children}</View>
    </Pressable>
  );
}

function Chip({ icon, label, onPress, emoji }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), backgroundColor: '#fff', borderRadius: z(24), height: z(46), paddingHorizontal: z(16), marginRight: z(10) }}>
      {emoji ? <Text style={{ fontSize: 18 }}>{emoji}</Text> : <Sym name={icon} size={22} color={C.icon} duo />}
      <Text style={{ fontSize: 16, color: '#2B2B2B' }}>{label}</Text>
    </Pressable>
  );
}

export default function Home() {
  const { user, settings, home, refreshHome, toast } = useApp();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const pill = useRef(new Animated.Value(1)).current;
  const idle = useRef(null);
  const [rcPage, setRcPage] = useState(0);
  const countdown = useCountdown(settings?.offerEndsAt);
  const hs = settings?.homeSections || {};
  const show = (k) => hs[k] !== false;
  const soon = (w) => soonMsg(toast, w);

  useLive(() => { refreshHome(); }, [user?.id]);

  // Android back on Home leaves the app (no stack below).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => false);
    return () => sub.remove();
  }, []);

  // The Scan QR pill shrinks to a round button while the page scrolls.
  const setScrolling = (on) => {
    clearTimeout(idle.current);
    if (on) Animated.timing(pill, { toValue: 0, duration: 160, useNativeDriver: false }).start();
    else idle.current = setTimeout(() => Animated.timing(pill, { toValue: 1, duration: 220, useNativeDriver: false }).start(), 350);
  };

  // Header: brand row fades out and the search bar slides up beside the avatar.
  const brandOpacity = scrollY.interpolate({ inputRange: [0, z(50)], outputRange: [1, 0], extrapolate: 'clamp' });
  const compactOpacity = scrollY.interpolate({ inputRange: [z(40), z(70)], outputRange: [0, 1], extrapolate: 'clamp' });

  const RC = [
    { icon: 'mobile_charge', label: 'Mobile\nRecharge', go: () => router.push('/recharge') },
    { icon: 'credit_card', label: 'Credit Card\nBill', go: () => router.push({ pathname: '/bills', params: { category: 'creditcard' } }) },
    { icon: 'lightbulb', label: 'Electricity\nBill', badge: 'Get ₹20', go: () => router.push({ pathname: '/bills', params: { category: 'electricity' } }) },
    { icon: 'featured_video', label: 'FASTag\nRecharge', go: () => router.push({ pathname: '/bills', params: { category: 'fastag' } }) },
    { icon: 'satellite_alt', label: 'DTH\nRecharge', go: () => router.push({ pathname: '/bills', params: { category: 'dth' } }) },
    { icon: 'router', label: 'Broadband\nBill', go: () => router.push({ pathname: '/bills', params: { category: 'broadband' } }) },
    { icon: 'water_drop', label: 'Water\nBill', go: () => router.push({ pathname: '/bills', params: { category: 'water' } }) },
    { icon: 'propane_tank', label: 'Book\nCylinder', go: () => router.push({ pathname: '/bills', params: { category: 'gas' } }) },
  ];
  const cellW = (screenWidth() - z(28)) / 4;

  return (
    <View style={{ flex: 1, backgroundColor: C.page, paddingTop: insets.top }}>
      {/* Fixed compact header (avatar + search) that appears after scrolling */}
      <Animated.View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 10, backgroundColor: C.page, opacity: compactOpacity, flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(14), paddingVertical: z(10), gap: z(12) }}>
        <Pressable onPress={() => router.push('/profile')}><Avatar user={user} size={50} /></Pressable>
        <SearchBar style={{ flex: 1 }} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        onScrollBeginDrag={() => setScrolling(true)}
        onScrollEndDrag={() => setScrolling(false)}
        onMomentumScrollEnd={() => setScrolling(false)}
        contentContainerStyle={{ paddingBottom: z(110) }}
      >
        <Animated.View style={{ opacity: brandOpacity, flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(14), paddingTop: z(10), gap: z(12) }}>
          <Pressable onPress={() => router.push('/profile')}><Avatar user={user} size={50} /></Pressable>
          <HeaderBrand settings={settings} />
          <Pressable hitSlop={10} onPress={() => router.push('/notifications')} style={{ padding: z(6) }}>
            <Sym name="notifications" size={30} color="#1D1D1D" />
            {!!home?.unreadNotifications && <View style={{ position: 'absolute', right: z(6), top: z(5), width: z(11), height: z(11), borderRadius: z(6), backgroundColor: '#E5484D', borderWidth: 1.5, borderColor: C.page }} />}
          </Pressable>
        </Animated.View>

        <SearchBar style={{ marginHorizontal: z(14), marginTop: z(18) }} />

        {!!settings?.announcement && (
          <View style={{ marginHorizontal: z(14), marginTop: z(12), backgroundColor: '#FFF5D6', borderRadius: z(12), padding: z(12), flexDirection: 'row', gap: z(8) }}>
            <Sym name="campaign" size={20} color="#8A6100" />
            <Text style={{ flex: 1, fontSize: 13, color: '#5C4100' }}>{settings.announcement}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', marginTop: z(22), paddingHorizontal: z(6) }}>
          <BigAction icon="qr_code_scanner" label={'Scan any\nQR'} onPress={() => router.push('/scan')} />
          <BigAction icon="contact_page" label={'Pay\nAnyone'} onPress={() => router.push({ pathname: '/search', params: { mode: 'contacts' } })} />
          <BigAction icon="account_balance" label={'To Bank &\nSelf A/c'} onPress={() => router.push('/transfer')} />
          <BigAction icon="receipt_long" label={'Balance &\nHistory'} onPress={() => router.push('/balance')} />
        </View>

        {show('recharge') && (
          <Section title="Recharge & Bills" onViewAll={() => router.push('/bills')} style={{ marginTop: z(26) }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cellW * 4} decelerationRate="fast"
              onScroll={(e) => setRcPage(e.nativeEvent.contentOffset.x > cellW ? 1 : 0)} scrollEventThrottle={32}>
              {RC.map((r) => <Cell key={r.label} icon={r.icon} label={r.label} badge={r.badge} onPress={r.go} width={cellW} />)}
            </ScrollView>
            <View style={{ alignSelf: 'center', flexDirection: 'row', marginTop: z(8), backgroundColor: '#E6E6E6', borderRadius: z(3), width: z(30), height: z(5) }}>
              <View style={{ width: z(15), height: z(5), borderRadius: z(3), backgroundColor: '#666', marginLeft: rcPage ? z(15) : 0 }} />
            </View>
          </Section>
        )}

        {show('offer') && (
          <Pressable onPress={() => router.push('/rewards')} style={{ marginHorizontal: z(14), marginTop: z(14), backgroundColor: C.offer, borderRadius: z(20), flexDirection: 'row', alignItems: 'center', paddingHorizontal: z(16), height: z(82), gap: z(14) }}>
            <Text style={{ fontSize: 44 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1D1D1D' }}>{settings?.offerTitle || 'Exclusive offer for You!'}</Text>
              <Text style={{ fontSize: 14, color: '#3A3A3A', marginTop: z(4) }}>{countdown || 'Claim your cashback now'}</Text>
            </View>
            <Sym name="chevron_right" size={28} color="#1D1D1D" />
          </Pressable>
        )}

        {show('tiles') && (
          <>
            <View style={{ flexDirection: 'row', marginHorizontal: z(14), marginTop: z(14), gap: z(12) }}>
              <Pressable onPress={() => soon('Stocks & MTF')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: z(20), padding: z(18) }}>
                <Sym name="currency_rupee_circle" size={34} color="#8A8A8A" />
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1D1D1D', marginTop: z(14) }}>{(settings?.appName || 'PayTwin')} Money</Text>
                <Text style={{ fontSize: 14, color: '#6B6B6B', marginTop: z(4), lineHeight: 20 }}>Get 4X leverage at 7.99% p.a. with MTF</Text>
              </Pressable>
              <View style={{ flex: 1, gap: z(12) }}>
                <Pressable onPress={() => soon('Margin Trading')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: z(20), padding: z(16), flexDirection: 'row', alignItems: 'center', gap: z(12) }}>
                  <Sym name="change_history" size={32} color="#8A8A8A" />
                  <Text style={{ flex: 1, fontSize: 17, color: '#1D1D1D', lineHeight: 22 }}>MTF @{'\n'}7.99% p.a.</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/bills')} style={{ flex: 1, backgroundColor: '#fff', borderRadius: z(20), padding: z(16), flexDirection: 'row', alignItems: 'center', gap: z(12) }}>
                  <Sym name="receipt" size={32} color="#8A8A8A" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, color: '#1D1D1D' }}>Pay Bills</Text>
                    <Text style={{ fontSize: 13, color: '#6B6B6B', marginTop: z(2) }}>₹100 Off | VISA</Text>
                  </View>
                </Pressable>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: z(14), marginTop: z(14) }}>
              <Chip emoji="🎁" label={`Refer & Win ₹${settings?.referralBonus ?? 400}`} onPress={() => router.push('/refer')} />
              <Chip icon="redeem" label="Cashback & Offers" onPress={() => router.push('/offers')} />
              {settings?.features?.upiLite !== false && <Chip icon="bolt" label="UPI Lite" onPress={() => router.push('/upi-lite')} />}
              <Chip icon="qr_code_2" label="Receive Money" onPress={() => router.push('/my-qr')} />
            </ScrollView>
          </>
        )}

        {show('banners') && <Banners banners={home?.banners} />}

        {show('travel') && (
          <Section title="Travel & Tickets">
            <View style={{ flexDirection: 'row', paddingHorizontal: z(4) }}>
              <Cell icon="flight" label="Flight" badge="Sale" onPress={() => soon('Flight booking')} />
              <Cell icon="directions_bus" label="Bus" onPress={() => soon('Bus tickets')} />
              <Cell icon="train" label="Train" onPress={() => soon('Train tickets')} />
              <Cell icon="apartment" label="Hotels" onPress={() => soon('Hotel booking')} />
            </View>
            <View style={{ flexDirection: 'row', gap: z(10), paddingHorizontal: z(14), marginTop: z(8) }}>
              {[['flight_takeoff', '15% OFF* on flights'], ['directions_bus', '15% OFF on Bus']].map(([ic, t]) => (
                <Pressable key={t} onPress={() => router.push('/offers')} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(6), backgroundColor: '#F4F5F7', borderRadius: z(22), height: z(42) }}>
                  <Sym name={ic} size={18} color={C.icon} />
                  <Text style={{ fontSize: 14, color: '#2B2B2B' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        )}

        {show('gold') && (
          <Section title="Gold & Silver">
            <View style={{ flexDirection: 'row', paddingHorizontal: z(4) }}>
              <Cell icon="event_repeat" label={'Save Gold\nDaily'} onPress={() => router.push('/balance')} />
              <Cell icon="diamond" label={'Save Silver\nDaily'} onPress={() => soon('Digital silver')} />
              <Cell icon="savings" label="Save in Gold" onPress={() => router.push('/balance')} />
              <Cell icon="currency_exchange" label={'Gold\nRound-Up'} onPress={() => soon('Gold round-up')} />
            </View>
          </Section>
        )}

        {show('financial') && (
          <Section title="Financial Services" onViewAll={() => soon('Financial services')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: z(4) }}>
              <Cell icon="payments" label="Loan" onPress={() => soon('Loans')} />
              <Cell icon="monitoring" label="Mutual Fund" badge="SIP @ ₹21" onPress={() => soon('Mutual funds')} />
              <Cell icon="directions_car" label={'Car\nInsurance'} onPress={() => router.push({ pathname: '/bills', params: { category: 'insurance' } })} />
              <Cell icon="two_wheeler" label={'Bike\nInsurance'} onPress={() => router.push({ pathname: '/bills', params: { category: 'insurance' } })} />
              <Cell icon="account_balance_wallet" label={`${settings?.appName || 'PayTwin'}\nPostpaid`} onPress={() => soon('Postpaid')} />
              <Cell icon="trending_up" label="Stocks" onPress={() => soon('Stocks')} />
              <Cell icon="credit_card" label={'Get Credit\nCard'} onPress={() => soon('Credit cards')} />
              <Cell icon="cardiology" iconColor="#E5484D" label={'Health\nInsurance'} onPress={() => router.push({ pathname: '/bills', params: { category: 'insurance' } })} />
            </View>
          </Section>
        )}

        {show('freeTools') && (
          <Section title="Free Tools">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: z(14), paddingTop: z(4) }}>
              <FreeToolCard bg="#DDF5EE" title={'Check Your\nCredit Score'} onPress={() => soon('Credit score')}>
                <View style={{ width: z(76), height: z(76), borderRadius: z(38), borderWidth: z(9), borderColor: '#2BB673', borderLeftColor: '#F4C430', borderBottomColor: '#E6E6E6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4E9E' }}>820</Text>
                </View>
              </FreeToolCard>
              <FreeToolCard bg="#DCEBFB" title={'Track Your\nExternal MFs'} onPress={() => soon('MF tracker')}>
                <View style={{ backgroundColor: '#fff', borderRadius: z(10), padding: z(10), alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#1D4E9E' }}>MF</Text>
                  <Sym name="donut_large" size={28} color="#2BB673" />
                </View>
              </FreeToolCard>
              <FreeToolCard bg="#FFF2C9" title={'Set Gold\nPrice Alerts'} onPress={() => soon('Gold price alerts')}>
                <Text style={{ fontSize: 46 }}>🪙</Text>
              </FreeToolCard>
            </ScrollView>
          </Section>
        )}

        {show('doMore') && (
          <Section title={`Do More with ${settings?.appName || 'PayTwin'}`}>
            <View style={{ flexDirection: 'row', paddingHorizontal: z(4) }}>
              <Cell icon="sell" label={'Claim\nDeals'} onPress={() => router.push('/offers')} />
              <Cell icon="card_giftcard" label={'Gift\nVouchers'} onPress={() => soon('Gift vouchers')} />
              <Cell icon="redeem" label={'Cashback\n& Offers'} onPress={() => router.push('/rewards')} />
              <Cell icon="apps" label={'See All\nServices'} onPress={() => router.push('/bills')} />
            </View>
            <Pressable onPress={() => router.push('/offers')} style={{ alignSelf: 'flex-start', marginLeft: z(14), marginTop: z(6), flexDirection: 'row', alignItems: 'center', gap: z(8), backgroundColor: '#F4F5F7', borderRadius: z(20), paddingHorizontal: z(12), height: z(38) }}>
              <View style={{ width: z(20), height: z(20), borderRadius: z(10), backgroundColor: '#1D1D1D', alignItems: 'center', justifyContent: 'center' }}><Sym name="sports_esports" size={13} color="#F9D540" /></View>
              <Text style={{ fontSize: 13, color: '#2B2B2B' }}>BGMI Official | 10% Off</Text>
            </Pressable>
          </Section>
        )}

        {show('promoted') && (
          <Section title="Promoted">
            <View style={{ flexDirection: 'row', paddingHorizontal: z(4) }}>
              <Cell icon="shield_person" iconColor="#B5122B" label={'Life\nInsurance'} onPress={() => router.push({ pathname: '/bills', params: { category: 'insurance' } })} />
              <Cell icon="local_fire_department" iconColor="#F26B21" label={'Bank\nCard'} onPress={() => soon('Credit cards')} />
              <Cell icon="hexagon" iconColor="#DB0011" label={'Rewards\nCard'} onPress={() => soon('Credit cards')} />
              <Cell icon="self_improvement" iconColor="#7A7A7A" label={'Meditation\nApp'} onPress={() => soon('Meditation app')} />
            </View>
          </Section>
        )}

        {show('refer') && (
          <Pressable onPress={() => router.push('/refer')} style={{ alignItems: 'center', marginTop: z(26) }}>
            <Text style={{ fontSize: 64 }}>🎁</Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: '#1D1D1D', marginTop: z(4) }}>Refer & Win</Text>
            <Text style={{ fontSize: 15, color: '#5A5A5A', marginTop: z(4) }}>Assured ₹{settings?.referralBonus ?? 400} Cashback →</Text>
          </Pressable>
        )}
      </Animated.ScrollView>

      {/* Floating Scan QR pill: collapses to a circle while scrolling */}
      {settings?.features?.scan !== false && (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + z(18), alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/scan')}>
            <Animated.View style={{ borderRadius: z(30), overflow: 'hidden', borderWidth: 2, borderColor: '#3D7BD4', ...shadow, elevation: 6, shadowOpacity: 0.25,
              width: pill.interpolate({ inputRange: [0, 1], outputRange: [z(62), z(218)] }), height: z(62) }}>
              <LinearGradient colors={['#1166C2', '#0A3E86', C.navyDeep]} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(10) }}>
                <Sym name="qr_code_scanner" size={30} color="#fff" />
                <Animated.View style={{ opacity: pill, maxWidth: pill.interpolate({ inputRange: [0, 1], outputRange: [0, z(130)] }), overflow: 'hidden' }}>
                  <Text style={{ color: '#fff', fontSize: 23, fontWeight: '600' }} numberOfLines={1}>Scan QR</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
