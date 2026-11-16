import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/Text';
import { router } from 'expo-router';
import { BankLogo, Header, MI, Row, Screen, Sheet, s } from '../components/ui';
import { del, post } from '../lib/api';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';
import { confirmAction } from '../lib/confirm';

export default function BankAccounts() {
  const { accounts, applyMe, toast } = useApp();
  const [sel, setSel] = useState(null);

  const pinParams = (a, mode) => ({ pathname: '/set-pin', params: { accountId: a.id, mode, bankName: a.bankName, last4: a.last4 } });

  return (
    <Screen>
      <Header title="Bank accounts" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {accounts.map((a) => (
          <View key={a.id} style={[s.card, { padding: 16, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <BankLogo account={a} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: C.text }}>{a.bankName}</Text>
                <Text style={{ fontSize: 13, color: C.muted }}>{a.type} account ••{a.last4}</Text>
                <Text style={{ fontSize: 12, color: C.muted }}>IFSC {a.ifsc}</Text>
              </View>
              <MI name="more-vert" size={24} color={C.muted} onPress={() => setSel(a)} />
            </View>
            {a.primary && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: C.greenSoft, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <MI name="check-circle" size={14} color={C.green} />
                <Text style={{ color: C.green, fontSize: 12, fontWeight: '600' }}>Primary account for receiving money</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable onPress={() => router.push('/balance')} style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: '#D3E3FD', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 13, color: '#0B57D0', fontWeight: '500' }} numberOfLines={1}>Check balance</Text>
              </Pressable>
              <Pressable onPress={() => router.push(pinParams(a, 'change'))} style={{ flex: 1, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#747775', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 13, color: '#0B57D0', fontWeight: '500' }} numberOfLines={1}>Change UPI PIN</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable onPress={() => router.push({ pathname: '/link-bank', params: { from: 'settings' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4 }}>
          <MI name="add" size={20} color="#0B57D0" />
          <Text style={{ fontSize: 15, color: '#0B57D0', fontWeight: '500' }}>Add bank account</Text>
        </Pressable>
      </ScrollView>

      <Sheet visible={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.bankName} ••${sel.last4}` : ''}>
        {sel && (
          <>
            {!sel.primary && <Row icon="star-outline" title="Make primary account" onPress={async () => { applyMe(await post(`/accounts/${sel.id}/primary`)); setSel(null); toast('Primary account updated'); }} />}
            <Row icon="lock-reset" title="Change UPI PIN" onPress={() => { setSel(null); router.push(pinParams(sel, 'change')); }} />
            <Row icon="lock-question" title="Forgot UPI PIN" onPress={() => { setSel(null); router.push(pinParams(sel, 'reset')); }} />
            <Row icon="delete-outline" title="Remove account" iconColor={C.red} titleStyle={{ color: C.red }} onPress={() => {
              const a = sel;
              setSel(null);
              confirmAction('Remove bank account?', `${a.bankName} ••${a.last4} will be unlinked from PayTwin.`, 'Remove', async () => { try { applyMe(await del(`/accounts/${a.id}`)); toast('Account removed'); } catch (e) { toast(e.message); } });
            }} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
