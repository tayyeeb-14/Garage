import { StatusBar } from 'expo-status-bar';
import MobileServiceScreen from './src/services/ServiceScreen';

export default function App() {
  return (
    <>
      <MobileServiceScreen />
      <StatusBar style="auto" />
    </>
  );
}
