import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { loginUser } from '@/services/authService';
import { router } from 'expo-router';
import { auth, googleProvider } from '@/config/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Login Failed';
      if (error.code === 'auth/wrong-password') {
        message = 'The password you entered is incorrect.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found for this email address.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again in a few minutes.';
      } else {
        message = 'Unable to log in. Please check your information and try again.';
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Login</ThemedText>
      </View>

      <View style={styles.form}>
        {errorMsg ? (
          <ThemedText style={styles.errorMsg}>{errorMsg}</ThemedText>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4285F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={handleGoogleLogin}
        >
          <ThemedText style={{ color: '#4285F4', fontWeight: 'bold', marginLeft: 8 }}>
            Sign in with Google
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => router.push('/auth/register')}
        >
          <ThemedText style={styles.linkText}>
            Don't have an account? Register
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  errorMsg: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
}); 