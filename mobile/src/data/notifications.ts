export type NotificationIconKey = 'booking' | 'mechanic' | 'offer';

export type NotificationItem = {
  id: string;
  title: string;
  text: string;
  iconKey: NotificationIconKey;
  read: boolean;
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'booking-confirmed',
    title: 'Booking confirmed',
    text: 'Your pickup has been scheduled for tomorrow morning.',
    iconKey: 'booking',
    read: false,
  },
  {
    id: 'mechanic-assigned',
    title: 'Mechanic assigned',
    text: 'A certified technician is on the way to your location.',
    iconKey: 'mechanic',
    read: false,
  },
  {
    id: 'offer-unlocked',
    title: 'Offer unlocked',
    text: 'Enjoy 10% off your next full bike or car service.',
    iconKey: 'offer',
    read: false,
  },
];
