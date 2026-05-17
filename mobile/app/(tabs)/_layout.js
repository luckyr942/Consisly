import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

function CustomTabBar({ state, navigation }) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        backgroundColor: theme.card, 
        shadowColor: isDark ? '#000' : '#475569',
      }
    ]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon based on route name
        let iconName = 'home';
        let label = 'Home';
        if (route.name === 'habits') { iconName = 'check-circle'; label = 'Habits'; }
        else if (route.name === 'analytics') { iconName = 'list'; label = 'Routines'; }
        else if (route.name === 'profile') { iconName = 'user'; label = 'Profile'; }

        const color = isFocused ? theme.primary : (isDark ? '#64748b' : '#94a3b8');

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[styles.iconPill, isFocused && { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
              <Feather name={iconName} size={22} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color, fontWeight: isFocused ? '700' : '600' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    height: 80, // generous height ensures no clipping whatsoever
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  iconPill: {
    width: 60,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
  }
});
