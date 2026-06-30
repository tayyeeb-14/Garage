import { StatusBar } from 'expo-status-bar';
import BookingScreen from './src/booking/BookingScreen';
import BookingHistoryScreen from './src/booking/BookingHistoryScreen';

export default function App() {
  return (
    <>
      <BookingScreen />
      <BookingHistoryScreen />
      <StatusBar style="auto" />
    </>
  );
}
