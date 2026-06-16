import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { BellIcon, HomeIcon, IconProps, ReportsIcon, UserIcon } from './icons';

// Minimal shape of the props expo-router passes to a custom `tabBar`.
// We only read `state` and `navigation`, so we type just those.
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

type TabMeta = { label: string; Icon: (p: IconProps) => React.JSX.Element };

// Maps route names (file names under (tabs)) to label + icon, matching the web BottomNav.
const TABS: Record<string, TabMeta> = {
  index: { label: 'Visits', Icon: HomeIcon },
  reports: { label: 'Reports', Icon: ReportsIcon },
  reminders: { label: 'Reminders', Icon: BellIcon },
  profile: { label: 'Profile', Icon: UserIcon },
};

export function BottomNav({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const color = focused ? Colors.primary : Colors.inkSoft;
          const { Icon } = meta;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab} accessibilityRole="button">
              <Icon size={22} color={color} />
              <Text numberOfLines={1} style={[styles.label, { color }]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  label: { fontSize: 10, fontWeight: '700' },
});
