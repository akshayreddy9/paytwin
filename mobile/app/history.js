import { useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, TextInput } from '../components/Text';
import { goBack, Loading, Screen, Sym } from '../components/ui';
import { PoweredBy } from '../components/Logo';
import { categoryOf, groupByMonth, MonthHeader, TxnRow } from '../components/history';
import { get } from '../lib/api';
import { useApp, useLive } from '../lib/store';
import { C, z } from '../lib/theme';

const FILTERS = [
  ['all', 'All'], ['out', 'Paid'], ['in', 'Received'], ['failed', 'Failed'], ['bills', 'Bills & Recharge'], ['30', 'Last 30 days'],
];

// Full payment history, grouped by month with sticky "Total Spent" headers.
export default function History() {
  const params = useLocalSearchParams();
  const { toast } = useApp();
  const [txns, setTxns] = useState(null);
  const [searching, setSearching] = useState(params.search === '1');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(params.filter === '1');

  useLive(() => { get('/transactions').then((r) => setTxns(r.transactions)).catch((e) => toast(e.message)); }, []);

  const sections = useMemo(() => {
    if (!txns) return [];
    const needle = q.trim().toLowerCase();
    const since = Date.now() - 30 * 86400000;
    const list = txns.filter((t) => {
      if (filter === 'out' && (t.direction !== 'out' || t.status !== 'success')) return false;
      if (filter === 'in' && (t.direction !== 'in' || t.status !== 'success')) return false;
      if (filter === 'failed' && t.status !== 'failed') return false;
      if (filter === 'bills' && !['bill', 'recharge'].includes(t.type)) return false;
      if (filter === '30' && t.createdAt < since) return false;
      if (needle && !`${t.counterparty?.name} ${t.note} ${t.upiRef} ${categoryOf(t)} ${t.amount}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    let groups = groupByMonth(list);
    // Opened from a month header: start the list at that month.
    if (params.month && !needle && filter === 'all') {
      const i = groups.findIndex((g) => g.key === params.month);
      if (i > 0) groups = groups.slice(i);
    }
    return groups.map((g) => ({ title: g.key, total: g.total, data: g.items }));
  }, [txns, q, filter, params.month]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: z(60), paddingHorizontal: z(12), gap: z(12) }}>
        <Pressable hitSlop={10} onPress={() => (searching ? (setSearching(false), setQ('')) : goBack())}><Sym name="arrow_back" size={28} color="#1D1D1D" /></Pressable>
        {searching ? (
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search by name, amount or UPI Ref" placeholderTextColor={C.faint}
            style={{ flex: 1, fontSize: 17, color: C.text, paddingVertical: z(6) }} />
        ) : <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: '#1D1D1D' }}>Payment History</Text>}
        {searching && !!q && <Pressable hitSlop={8} onPress={() => setQ('')}><Sym name="close" size={24} color={C.muted} /></Pressable>}
        <Pressable hitSlop={8} onPress={() => setShowFilters(!showFilters)}><Sym name="tune" size={24} color={filter !== 'all' ? C.navy : C.link} /></Pressable>
        {!searching && <Pressable hitSlop={8} onPress={() => setSearching(true)}><Sym name="search" size={26} color={C.link} /></Pressable>}
      </View>
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: z(14), paddingBottom: z(10), gap: z(8) }}>
          {FILTERS.map(([k, l]) => (
            <Pressable key={k} onPress={() => setFilter(k)} style={{ borderRadius: z(18), borderWidth: 1, borderColor: filter === k ? C.navy : '#DADADA', backgroundColor: filter === k ? C.blueSoft : '#fff', paddingHorizontal: z(14), height: z(36), justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, color: filter === k ? C.navy : '#3A3A3A', fontWeight: filter === k ? '600' : '400' }}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {!txns ? <Loading /> : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => <MonthHeader month={section.title} total={section.total} />}
          renderItem={({ item }) => <TxnRow t={item} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.muted, marginTop: z(60) }}>No payments found</Text>}
          ListFooterComponent={<PoweredBy style={{ marginTop: z(8) }} />}
        />
      )}
    </Screen>
  );
}
