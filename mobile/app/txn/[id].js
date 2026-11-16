import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { goBack, Loading, Screen } from '../../components/ui';
import { PoweredBy } from '../../components/Logo';
import { Receipt, ReceiptHeader } from '../../components/receipt';
import { get } from '../../lib/api';
import { useApp, useLive } from '../../lib/store';
import { z } from '../../lib/theme';

// Full receipt for one payment ("Sent Successfully" / "Money Received").
export default function TxnDetail() {
  const { id } = useLocalSearchParams();
  const { toast } = useApp();
  const [t, setT] = useState(null);
  useLive(() => { get(`/transactions/${id}`).then((r) => setT(r.transaction)).catch((e) => { toast(e.message); goBack(); }); }, [id]);
  if (!t) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      <ReceiptHeader t={t} />
      <ScrollView contentContainerStyle={{ paddingTop: 4 }}>
        <Receipt t={t} onChanged={setT} />
        <PoweredBy bank={t.fromAccount?.bankShort ? `${t.fromAccount.bankShort} BANK` : ''} style={{ marginTop: z(12) }} />
      </ScrollView>
    </Screen>
  );
}
