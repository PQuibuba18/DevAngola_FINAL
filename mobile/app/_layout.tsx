import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthContext, useAuthState } from '../hooks/useAuth';

export default function RootLayout() {
  const authState = useAuthState();
  const router    = useRouter();
  const segments  = useSegments();

  useEffect(() => {
    if (authState.loading) return;
    const inAuth   = segments[0] === 'auth';
    const loggedIn = !!authState.token;
    if (!loggedIn && !inAuth) router.replace('/auth/login');
    else if (loggedIn && inAuth) router.replace('/tabs/feed');
  }, [authState.loading, authState.token, segments]);

  return (
    <AuthContext.Provider value={authState}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login"    />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="tabs"          />
        <Stack.Screen name="post/[id]"     />
        <Stack.Screen name="quiz/index"    options={{ presentation: 'modal' }} />
      </Stack>
    </AuthContext.Provider>
  );
}
