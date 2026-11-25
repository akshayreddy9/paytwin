import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { BankLogo, Row, Sheet, Sym } from '../../components/ui';
import { PoweredBy } from '../../components/Logo';
import { del, post } from '../../lib/api';
import { useApp } from '../../lib/store';
import { confirmAction } from '../../lib/confirm';
import { inrShort } from '../../lib/format';
import { C, z } from '../../lib/theme';

function Item({ icon, title, sub, right, last, children }) {
  return (
    <View style={{ flexDirection: 'row', gap: z(14), paddingVertical: z(16), marginLeft: z(18), paddingRight: z(18), borderBottomWidth: last ? 0 : 1, borderColor: '#EEEEEE', alignItems: children ? 'flex-start' : 'center' }}>
      <Sym name={icon} size={28} color={C.icon} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, color: '#1D1D1D', fontWeight: '500' }}>{title}</Text>
        {!!sub && <Text style={{ fontSize: 15, color: '#3A3A3A', marginTop: z(4) }}>{sub}</Text>}
        {children}
      </View>
      {right}
    </View>
  );
}

function Detail({ k, v }) {
  return (
    <View style={{ flexDirection: 'row', marginTop: z(12) }}>
      <Text style={{ width: z(100), fontSize: 15, color: '#7A7A7A' }}>{k}</Text>
      <Text style={{ fontSize: 15, color: '#3A3A3A' }}>: {v}</Text>
    </View>
  );
}

// Bank account details: gradient header, default-for-receiving, balance, PIN, account details.
export default function BankDetail() {
  const { id } = useLocalSearchParams();
  const { accounts, requestPin, applyMe, toast } = useApp();
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(null);
  const [menu, setMenu] = useState(false);
  const a = accounts.find((x) => x.id === id);
  if (!a) return <View style={{ flex: 1, backgroundColor: C.page }} />;

  const check = () => requestPin({
    account: a, amount: null, processingText: 'Fetching balance',
    submit: (pin) => post(`/accounts/${a.id}/balance`, { pin }),
    onDone: (r) => { setBalance(r.account.balance); router.back(); },
  });
  const pinRoute = (mode) => ({ pathname: '/set-pin', params: { accountId: a.id, mode, bankName: a.bankName, last4: a.last4 } });
  const makeDefault = async () => { setMenu(false); try { applyMe(await post(`/accounts/${a.id}/primary`)); toast('Default bank updated'); } catch (e) { toast(e.message); } };
  const remove = () => { setMenu(false); confirmAction('Remove bank account?', `${a.bankName} - ${a.last4} will be removed from this app.`, 'Remove', async () => {
    try { applyMe(await del(`/accounts/${a.id}`)); router.back(); toast('Bank account removed'); } catch (e) { toast(e.message); }
  }); };

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <LinearGradient colors={['#00B5F0', '#0A86D8', '#0B5CB5']} style={{ paddingTop: insets.top, borderBottomLeftRadius: z(28), borderBottomRightRadius: z(28), paddingBottom: z(26) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: z(14), paddingTop: z(10) }}>
          <Pressable hitSlop={10} onPress={() => router.back()}><Sym name="arrow_back" size={28} color="#fff" /></Pressable>
          <Pressable hitSlop={10} onPress={() => setMenu(true)}><Sym name="more_vert" size={28} color="#fff" /></Pressable>
        </View>
        <View style={{ alignItems: 'center', marginTop: -z(14) }}>
          <View style={{ width: z(74), height: z(74), borderRadius: z(37), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <BankLogo account={a} size={40} />
          </View>
          <Text style={{ color: '#fff', fontSize: 23, fontWeight: '700', marginTop: z(14) }}>{a.bankName} - {a.last4}</Text>
        </View>
      </LinearGradient>

      <View style={{ backgroundColor: '#fff', borderRadius: z(20), marginHorizontal: z(14), marginTop: z(20) }}>
        <Item icon="account_balance" title={a.primary ? 'Default Bank to receive money' : 'Not your default bank'}
          right={a.primary ? <Sym name="check_circle" fill size={26} color={C.green} /> : <Pressable onPress={makeDefault}><Text style={{ color: C.link, fontSize: 15, fontWeight: '600' }}>Set default</Text></Pressable>} />
        <Item icon="currency_rupee_circle" title="Check balance"
          right={balance != null ? <Text style={{ fontSize: 17, fontWeight: '700', color: '#1D1D1D' }}>{inrShort(balance)}</Text>
            : <Pressable hitSlop={8} onPress={check}><Text style={{ color: C.link, fontSize: 17, fontWeight: '500' }}>Check</Text></Pressable>} />
        <Item icon="pin" title="UPI PIN" sub={a.hasPin ? `${a.pinLength || 4} digit UPI PIN exists` : 'UPI PIN not set'}
          right={<Pressable hitSlop={8} onPress={() => router.push(pinRoute(a.hasPin ? 'change' : 'reset'))}><Text style={{ color: C.link, fontSize: 17, fontWeight: '500' }}>{a.hasPin ? 'Change' : 'Set'}</Text></Pressable>} />
        <Item icon="account_balance" title="Account Details" last>
          <Detail k="A/c No." v={`XX${a.last4}`} />
          <Detail k="IFSC" v={a.ifsc} />
          <Detail k="Type" v={a.type} />
        </Item>
      </View>
      <View style={{ flex: 1 }} />
      <PoweredBy style={{ paddingBottom: insets.bottom + z(12) }} />

      <Sheet visible={menu} onClose={() => setMenu(false)}>
        {!a.primary && <Row icon="check_circle" title="Set as default for receiving money" onPress={makeDefault} />}
        <Row icon="lock_reset" title="Forgot UPI PIN" onPress={() => { setMenu(false); router.push(pinRoute('reset')); }} />
        <Row icon="delete" iconColor={C.red} title="Remove bank account" titleStyle={{ color: C.red }} onPress={remove} />
      </Sheet>
    </View>
  );
}
