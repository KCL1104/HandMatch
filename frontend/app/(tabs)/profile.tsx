import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getCurrentUser, logoutUser } from '@/services/authService';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [connected, setConnected] = React.useState(false);
  const [publicKey, setPublicKey] = React.useState('');
  const user = getCurrentUser();

  const connectWallet = async () => {
    // TODO: Implement actual Solana wallet connection
    setConnected(true);
    setPublicKey('7x4Vn...3pLL');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert('Logged Out', 'You have successfully logged out!');
      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.walletContainer}>
          <ThemedText style={styles.title}>Not Logged In</ThemedText>
          <TouchableOpacity style={styles.connectButton} onPress={() => router.replace('/auth/login')}>
            <ThemedText style={styles.connectButtonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.profileImage}
          source={{ uri: user.photoURL || 'https://picsum.photos/200' }}
        />
        <ThemedText style={styles.username}>{user.displayName || 'Unnamed User'}</ThemedText>
        <ThemedText style={styles.walletAddress}>{user.email}</ThemedText>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>12</ThemedText>
            <ThemedText style={styles.statLabel}>Listed</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>8</ThemedText>
            <ThemedText style={styles.statLabel}>Rented</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>4.9</ThemedText>
            <ThemedText style={styles.statLabel}>Rating</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="account-circle" size={24} color="#666" />
          <ThemedText style={styles.settingText}>Edit Profile</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#666" />
          <ThemedText style={styles.settingText}>Wallet Settings</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="history" size={24} color="#666" />
          <ThemedText style={styles.settingText}>Transaction History</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="notifications" size={24} color="#666" />
          <ThemedText style={styles.settingText}>Notifications</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="help" size={24} color="#666" />
          <ThemedText style={styles.settingText}>Help & Support</ThemedText>
          <MaterialIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, styles.disconnectItem]} 
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#FF4444" />
          <ThemedText style={[styles.settingText, styles.disconnectText]}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  walletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  connectButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#000',
  },
  disconnectItem: {
    marginTop: 16,
  },
  disconnectText: {
    color: '#FF4444',
  },
});
