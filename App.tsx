import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>Vén</Text>
        <Text style={styles.tagline}>Vén khéo dòng tiền của bạn</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Phase 0.1 — Scaffold Expo + TypeScript</Text>
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E7E4DD',
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0F6E5B',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#E4F1EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#0F6E5B',
    fontSize: 13,
    fontWeight: '600',
  },
});

