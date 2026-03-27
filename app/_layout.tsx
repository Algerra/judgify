import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { initAudio } from '../src/utils/sounds';

export default function RootLayout() {
  useEffect(() => {
    // Initialize audio on app start
    initAudio();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0c0c0c' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="solo" />
          <Stack.Screen name="vs-setup" />
          <Stack.Screen name="vs-play" />
          <Stack.Screen name="judging" />
          <Stack.Screen name="vs-reveal" />
          <Stack.Screen name="result" />
          <Stack.Screen name="history" />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
});
