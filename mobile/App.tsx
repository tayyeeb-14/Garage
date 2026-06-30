import { StatusBar } from 'expo-status-bar';
import BookingScreen from './src/booking/BookingScreen';
import BookingHistoryScreen from './src/booking/BookingHistoryScreen';
import OrderListScreen from './src/orders/OrderListScreen';

export default function App() {
  return (
    <>
      <BookingScreen />
      <BookingHistoryScreen />
      <OrderListScreen />
      <StatusBar style="auto" />
    </></>
  );
}
