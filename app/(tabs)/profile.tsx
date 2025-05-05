import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const [connected, setConnected] = React.useState(false);
  const [publicKey, setPublicKey] = React.useState('');

  const connectWallet = async () => {
    // TODO: Implement actual Solana wallet connection
    // This is a placeholder for now
    setConnected(true);
    setPublicKey('7x4Vn...3pLL');
  };

  if (!connected) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.walletContainer}>
          <ThemedText style={styles.title}>Connect Your Wallet</ThemedText>
          <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
            <ThemedText style={styles.connectButtonText}>Connect Wallet</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.walletAddress}>Wallet: {publicKey}</ThemedText>
        <TouchableOpacity style={styles.disconnectButton} onPress={() => setConnected(false)}>
          <ThemedText style={styles.disconnectButtonText}>Disconnect</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsContainer}>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  walletAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  disconnectButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FF4444',
    borderRadius: 20,
  },
  disconnectButtonText: {
    color: '#fff',
    fontWeight: '500',
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
});