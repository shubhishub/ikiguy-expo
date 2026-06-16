import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { VisitCard } from '@/components/visit-card';
import { Colors } from '@/constants/theme';
import { profile, visits } from '@/lib/mock';

export default function VisitsScreen() {
  const firstName = profile.name.split(' ')[0];

  return (
    <View style={styles.screen}>
      <AppHeader />
      <FlatList
        data={visits}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => <VisitCard visit={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.title}>{firstName}, your visit log</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { paddingHorizontal: 20, paddingBottom: 140, gap: 16 },
  intro: { paddingTop: 20, paddingBottom: 8 },
  welcome: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4, marginTop: 2 },
});
