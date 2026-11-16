import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from './Text';
import { Avatar, BankLogo, CategoryChip, Sym } from './ui';
import { inrShort, monthKey, rowDate } from '../lib/format';
import { C, z } from '../lib/theme';

const TYPE_ICON = { bill: 'receipt_long', recharge: 'smartphone', admin: 'request_quote', cashback: 'redeem', refund: 'currency_exchange', self: 'account_balance', bank_transfer: 'account_balance' };

// Money that left the user's accounts to someone else (self transfers don't count as spending).
export const isSpend = (t) => t.direction === 'out' && t.status === 'success' && t.type !== 'self';

// [{ key: 'November 2026', total, items: [...] }] in the order given (newest first).
export function groupByMonth(list) {
  const groups = [];
  for (const t of list) {
    const key = monthKey(t.createdAt);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, total: 0, items: [] }; groups.push(g); }
    g.items.push(t);
    if (isSpend(t)) g.total += t.amount;
  }
  return groups;
}

export function categoryOf(t) {
  if (t.direction === 'in' && (t.category === 'Money Transfer' || !t.category) && t.type === 'p2p') return 'Money Received';
  return t.category || 'Others';
}

export function TxnAvatar({ t, size = 48 }) {
  const u = t.counterparty?.user;
  if (u) return <Avatar user={u} size={size} />;
  const icon = TYPE_ICON[t.type] || 'payments';
  return (
    <View style={{ width: z(size), height: z(size), borderRadius: z(size / 2), backgroundColor: '#E5F3FB', alignItems: 'center', justifyContent: 'center' }}>
      <Sym name={icon} size={size * 0.48} color={C.icon} />
    </View>
  );
}

export function MonthHeader({ month, total, onPress, rounded }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F5F8', paddingHorizontal: z(18), paddingVertical: z(12), borderTopLeftRadius: rounded ? z(18) : 0, borderTopRightRadius: rounded ? z(18) : 0 }}>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1D1D1D' }}>{month}</Text>
      <View style={{ alignItems: 'flex-end', marginRight: z(10) }}>
        <Text style={{ fontSize: 13, color: '#5A5A5A' }}>Total Spent</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1D1D1D' }}>{inrShort(total)}</Text>
      </View>
      <View style={{ width: z(26), height: z(26), borderRadius: z(13), backgroundColor: '#DCE9F8', alignItems: 'center', justifyContent: 'center' }}>
        <Sym name="chevron_right" size={18} color={C.link} />
      </View>
    </Pressable>
  );
}

export function TxnRow({ t }) {
  const out = t.direction === 'out';
  const failed = t.status === 'failed';
  const pending = t.status === 'pending';
  const acc = out ? t.fromAccount : t.toAccount;
  return (
    <Pressable onPress={() => router.push(`/txn/${t.id}`)} android_ripple={{ color: '#eee' }} style={{ flexDirection: 'row', paddingHorizontal: z(18), paddingVertical: z(14), gap: z(14) }}>
      <TxnAvatar t={t} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15.5, color: '#1D1D1D', lineHeight: 21 }} numberOfLines={3}>
          {t.counterparty?.name}{t.note && t.type === 'p2p' && t.counterparty?.user?.isMerchant ? ` - ${t.note}` : ''}
        </Text>
        <Text style={{ fontSize: 13, color: '#7A7A7A', marginTop: z(4) }}>{rowDate(t.createdAt)}</Text>
        <CategoryChip category={categoryOf(t)} style={{ marginTop: z(6) }} />
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: !failed && !out ? C.green : '#1D1D1D' }}>
          {failed || pending ? '' : out ? '- ' : '+ '}{inrShort(t.amount)}
        </Text>
        {failed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(4), marginTop: z(4) }}>
            <Text style={{ fontSize: 13, color: C.red }}>Failed</Text>
            <Sym name="error" fill size={14} color={C.red} />
          </View>
        ) : pending ? (
          <Text style={{ fontSize: 13, color: C.amber, marginTop: z(4) }}>Pending</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5), marginTop: z(4) }}>
            <Text style={{ fontSize: 13, color: '#7A7A7A' }}>{out ? 'From' : 'To'}</Text>
            {acc ? <BankLogo account={acc} size={14} /> : <Sym name="account_balance_wallet" size={14} color={C.icon} />}
          </View>
        )}
      </View>
    </Pressable>
  );
}
