import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Avatar, BankLogo, CategoryChip, goBack, PillBtn, Seal, Sheet, Sym } from './ui';
import { Wordmark } from './Logo';
import { TxnAvatar, categoryOf } from './history';
import { put } from '../lib/api';
import { useApp } from '../lib/store';
import { inrShort, maskUpi, paidAt, rupeesInWords } from '../lib/format';
import { C, z } from '../lib/theme';

export const receiptTitle = (t) => (t.status === 'failed' ? 'Payment Failed' : t.status === 'pending' ? 'Payment Pending'
  : t.direction === 'in' ? 'Money Received' : t.type === 'self' ? 'Transferred Successfully' : 'Sent Successfully');

export function shareReceipt(t, appName) {
  return Share.share({
    message: `${receiptTitle(t)}: ${inrShort(t.amount)}\n${t.direction === 'out' ? 'To' : 'From'}: ${t.counterparty?.name}\n${paidAt(t.createdAt)}\nUPI Ref No: ${t.upiRef}\n\n${appName || 'PayTwin'} demo receipt. No real money was moved.`,
  });
}

const Divider = () => <View style={{ height: 1, backgroundColor: '#EBEBEB', marginVertical: z(18) }} />;

// Person block on a receipt ("To" / "From").
function Party({ label, name, avatar, verified, lines, actions }) {
  return (
    <View>
      <Text style={{ fontSize: 15, color: '#3A3A3A' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(12), marginTop: z(4) }}>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: '#1D1D1D', lineHeight: 29 }}>
          {name}{verified ? ' ' : ''}{verified && <Seal size={22} color="#1DA1F2" />}
        </Text>
        {avatar}
      </View>
      {lines}
      {actions && <View style={{ flexDirection: 'row', gap: z(12), marginTop: z(16) }}>{actions}</View>}
    </View>
  );
}

const Line = ({ children, style }) => <Text style={[{ fontSize: 15, color: '#3A3A3A', marginTop: z(6) }, style]}>{children}</Text>;

export function Receipt({ t, onChanged }) {
  const { user, settings, toast } = useApp();
  const [details, setDetails] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const out = t.direction === 'out';
  const failed = t.status === 'failed';
  const other = t.counterparty || {};
  const ou = other.user;
  const appName = settings?.appName || 'PayTwin';
  const myAcc = out ? t.fromAccount : t.toAccount;
  const theirAcc = out ? t.toAccount : t.fromAccount;
  const bankLine = (acc) => (acc ? `${acc.bankName} - ${acc.last4}` : '');
  const copyRef = async () => { await Clipboard.setStringAsync(String(t.upiRef)); toast('UPI Ref No copied'); };

  const setCategory = async (category) => {
    setCatSheet(false);
    try { const r = await put(`/transactions/${t.id}/category`, { category }); onChanged && onChanged(r.transaction); } catch (e) { toast(e.message); }
  };

  const otherBlock = (
    <Party
      label={out ? 'To' : 'From'}
      name={other.name}
      verified={!!ou}
      avatar={ou ? <Avatar user={ou} size={58} /> : <TxnAvatar t={t} size={58} />}
      lines={<>
        {out ? (!!theirAcc && <Line>{bankLine(theirAcc)}</Line>) : (
          <>
            {!!other.handle && <Line>UPI ID: {maskUpi(other.handle)}</Line>}
            {!!ou && <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(6), marginTop: z(4) }}><Text style={{ fontSize: 15, color: '#3A3A3A' }}>on</Text><Wordmark size={18} /></View>}
          </>
        )}
        {out && !ou && !!other.handle && <Line>{other.handle}</Line>}
      </>}
      actions={ou && t.type === 'p2p' ? [
        <PillBtn key="p" title={out ? 'Pay Again' : 'Pay'} onPress={() => router.push({ pathname: '/pay', params: { userId: ou.id, amount: out ? String(t.amount) : '' } })} />,
        <PillBtn key="h" title="View History" onPress={() => router.push(`/chat/${ou.id}`)} />,
      ] : null}
    />
  );

  const meBlock = (
    <Party
      label={out ? 'From' : 'To'}
      name={user?.name}
      avatar={<Avatar user={user} size={58} />}
      lines={<>
        <Line>UPI ID: {out ? maskUpi(user?.upiId) : user?.upiId}</Line>
        {!!myAcc && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), marginTop: z(6) }}>
            <Text style={{ fontSize: 15, color: '#3A3A3A' }}>{out ? bankLine(myAcc) : 'Bank account linked to'}</Text>
            <BankLogo account={myAcc} size={16} />
          </View>
        )}
      </>}
    />
  );

  const steps = [
    `Payment Started by ${t.fromName || other.name}`,
    `Money transferred from ${t.fromName || other.name}'s ${t.fromAccount ? `${t.fromAccount.bankName} A/c - ${t.fromAccount.last4}` : 'account'}`,
    failed ? `Payment failed: ${t.failureReason || 'declined by bank'}` : `Payment received by ${t.toName}`,
  ];

  return (
    <View>
      <View style={{ marginHorizontal: z(16), borderRadius: z(20), borderWidth: 1, borderColor: '#E6E6E6', backgroundColor: '#fff', padding: z(20) }}>
        <Text style={{ fontSize: 15, color: '#3A3A3A' }}>Amount</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(8), marginTop: z(4) }}>
          <Text style={{ fontSize: 38, fontWeight: '700', color: '#1D1D1D', letterSpacing: -0.5 }}>{inrShort(t.amount)}</Text>
          {failed ? <Sym name="error" fill size={34} color={C.red} /> : t.status === 'pending' ? <Sym name="schedule" fill size={34} color={C.amber} /> : <Seal size={36} color={C.green} />}
        </View>
        <Text style={{ fontSize: 15, color: '#3A3A3A', marginTop: z(6) }}>{rupeesInWords(t.amount)}</Text>
        {failed && !!t.failureReason && (
          <View style={{ flexDirection: 'row', gap: z(8), backgroundColor: C.redSoft, borderRadius: z(10), padding: z(10), marginTop: z(12) }}>
            <Sym name="info" size={18} color={C.red} />
            <Text style={{ flex: 1, color: '#8A1C1F', fontSize: 14 }}>{t.failureReason}. Any money debited will be refunded within 3-5 working days.</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(14), marginTop: z(14) }}>
          <CategoryChip big category={categoryOf(t)} />
          <Pressable hitSlop={8} onPress={() => setCatSheet(true)}><Text style={{ color: C.link, fontSize: 17, fontWeight: '500' }}>Edit</Text></Pressable>
        </View>
        <Divider />
        {otherBlock}
        <Divider />
        {meBlock}
        <Text style={{ fontSize: 15, color: '#3A3A3A', marginTop: z(22) }}>{out ? 'Paid' : 'Received'} at {paidAt(t.createdAt)}</Text>
        <Text style={{ fontSize: 15, color: '#3A3A3A', marginTop: z(6) }}>UPI Ref No: {t.upiRef} <Text onPress={copyRef} style={{ color: C.link, fontWeight: '600' }}>Copy</Text></Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5), marginTop: z(8) }}>
          <Sym name="science" size={13} color="#9A9A9A" />
          <Text style={{ fontSize: 11.5, color: '#9A9A9A' }}>Demo transaction · {appName} college project, no real money moved</Text>
        </View>
        <Pressable onPress={() => setDetails(!details)} style={{ flexDirection: 'row', alignItems: 'center', gap: z(4), marginTop: z(16) }}>
          <Text style={{ color: C.navy, fontSize: 17, fontWeight: '600' }}>Payment Details</Text>
          <Sym name={details ? 'expand_less' : 'expand_more'} size={24} color={C.navy} />
        </Pressable>
        {details && (
          <View style={{ marginTop: z(12) }}>
            {steps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: z(14), paddingBottom: z(16) }}>
                {i < steps.length - 1 && <View style={{ position: 'absolute', left: z(10), top: z(22), bottom: 0, width: 1.5, backgroundColor: '#CFE9DA' }} />}
                <Sym name={failed && i === steps.length - 1 ? 'cancel' : 'check_circle'} fill size={22} color={failed && i === steps.length - 1 ? C.red : C.green} />
                <Text style={{ flex: 1, fontSize: 15.5, color: '#3A3A3A', lineHeight: 22 }}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable onPress={() => toast('Postpaid is not part of this demo')} style={{ marginHorizontal: z(16), marginTop: z(16), borderRadius: z(18), overflow: 'hidden' }}>
        <LinearGradient colors={['#E3F2FD', '#BFE0FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', padding: z(16), alignItems: 'center' }}>
          <View style={{ flex: 1.3 }}>
            <Wordmark size={13} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B2E6B', marginTop: z(6), lineHeight: 21 }}>Up to ₹1 Lakh credit{'\n'}for daily payments</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: z(10), backgroundColor: '#0B3D86', borderRadius: z(14), paddingHorizontal: z(12), paddingVertical: z(6) }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Activate Postpaid Now →</Text>
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: z(14), padding: z(10) }}>
            <Text style={{ fontSize: 13, color: '#0B2E6B', fontWeight: '600' }}>Accepted</Text>
            <Text style={{ fontSize: 26, color: '#1557C0', fontWeight: '700' }}>1.5 CR+</Text>
            <Text style={{ fontSize: 12, color: '#0B2E6B' }}>outlets</Text>
          </View>
        </LinearGradient>
      </Pressable>

      <Pressable onPress={() => toast('Location was not recorded for this payment')} style={{ marginHorizontal: z(16), marginTop: z(16), backgroundColor: '#fff', borderRadius: z(18), borderWidth: 1, borderColor: '#EEE', flexDirection: 'row', alignItems: 'center', padding: z(18), gap: z(14) }}>
        <Sym name="location_on" size={26} color="#1D1D1D" />
        <Text style={{ flex: 1, fontSize: 16, color: '#1D1D1D' }}>View Payment Location</Text>
        <Sym name="chevron_right" size={24} color="#1D1D1D" />
      </Pressable>

      <View style={{ marginHorizontal: z(16), marginTop: z(16), backgroundColor: '#fff', borderRadius: z(18), borderWidth: 1, borderColor: '#EEE', flexDirection: 'row', alignItems: 'center', padding: z(18), gap: z(12) }}>
        <Text style={{ flex: 1, fontSize: 15, color: '#3A3A3A' }}>{feedback ? 'Thanks for your feedback!' : 'Did you find this page useful?'}</Text>
        {!feedback && <>
          <Pressable onPress={() => setFeedback('up')} style={{ backgroundColor: '#FFF4D6', borderRadius: z(8), padding: z(6) }}><Text style={{ fontSize: 18 }}>👍</Text></Pressable>
          <Pressable onPress={() => setFeedback('down')} style={{ backgroundColor: '#FFF4D6', borderRadius: z(8), padding: z(6) }}><Text style={{ fontSize: 18 }}>👎</Text></Pressable>
        </>}
      </View>

      <Sheet visible={catSheet} onClose={() => setCatSheet(false)} title="Choose a category">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: z(10), paddingHorizontal: z(20), paddingBottom: z(8) }}>
          {(settings?.categories || ['Money Transfer', 'Shopping', 'Travel', 'Food', 'Others']).map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} style={{ borderRadius: z(20), borderWidth: 1, borderColor: c === t.category ? C.navy : '#DDD', backgroundColor: c === t.category ? C.blueSoft : '#fff' }}>
              <CategoryChip category={c} big style={{ backgroundColor: 'transparent' }} />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

export function ReceiptHeader({ t, onBack }) {
  const { settings } = useApp();
  const help = () => router.push({ pathname: '/help', params: { txnId: t.id, subject: `Issue with payment of ${inrShort(t.amount)} (${t.upiRef})` } });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: z(64), paddingHorizontal: z(14), gap: z(14) }}>
      <Pressable hitSlop={10} onPress={onBack || goBack}><Sym name="arrow_back" size={28} color="#1D1D1D" /></Pressable>
      <Text style={{ flex: 1, fontSize: 21, fontWeight: '700', color: '#1D1D1D' }} numberOfLines={1}>{receiptTitle(t)}</Text>
      <Pressable hitSlop={8} onPress={() => shareReceipt(t, settings?.appName)}><Text style={{ color: C.navy, fontSize: 17, fontWeight: '600' }}>Share</Text></Pressable>
      <Pressable hitSlop={8} onPress={help}><Text style={{ color: C.navy, fontSize: 17, fontWeight: '600' }}>Help</Text></Pressable>
    </View>
  );
}
