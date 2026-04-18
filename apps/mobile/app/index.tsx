import { Redirect } from 'expo-router';

// Root redirects to login; auth logic will live in _layout once MSAL is wired up
export default function Index() {
  return <Redirect href="/login" />;
}
