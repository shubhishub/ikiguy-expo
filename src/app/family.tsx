import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlusUsersIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/screen-header';
import { StatusChip } from '@/components/status-chip';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { familyMembers, statusLabel } from '@/lib/mock';

// Family / shared health accounts.
export default function FamilyScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Family" back="/profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.intro}>
          Care for the people you love. Each member keeps their own private health log.
        </Text>

        <View style={{ gap: 12 }}>
          {familyMembers.map((m) => (
            <View key={m.id} style={[styles.card, Shadow]}>
              <View style={styles.avatar}>
                <Text style={styles.initials}>{m.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.meta}>
                  {m.relation} · {m.handle}
                </Text>
              </View>
              <StatusChip status={m.status} label={statusLabel[m.status]} />
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
          <PlusUsersIcon size={20} color={Colors.primary} />
          <Text style={styles.addText}>Add family member</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  intro: { fontSize: 13, lineHeight: 19, color: Colors.inkSoft, marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    padding: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  name: { fontSize: 15.5, fontWeight: '700', color: Colors.ink },
  meta: { fontSize: 12.5, color: Colors.inkSoft, marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.input,
    paddingVertical: 14,
  },
  addText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
