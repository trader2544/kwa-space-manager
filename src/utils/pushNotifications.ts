
import { supabase } from '@/integrations/supabase/client';

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Send a notification to the user
 * @param {string} title - The notification title
 * @param {string} body - The notification body text
 * @param {object} options - Additional notification options
 * @returns {Notification|null} The notification object or null if failed
 */
export const sendNotification = (title: string, body: string, options: NotificationOptions = {}): Notification | null => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not allowed');
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Use your app icon
      badge: '/favicon.ico',
      ...options
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Set up rent payment reminders on the 1st and 5th day of each month
 */
export const setupRentReminders = async (userId: string): Promise<void> => {
  try {
    // Check if notification permission is granted
    if (Notification.permission !== 'granted') {
      await requestNotificationPermission();
    }

    // Get current day of month
    const today = new Date();
    const currentDay = today.getDate();
    
    // Get user's payment status for the current month
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format
    
    const { data: payment } = await supabase
      .from('rent_payments')
      .select('status')
      .eq('tenant_id', userId)
      .eq('month_year', currentMonth)
      .eq('status', 'paid')
      .maybeSingle();
    
    const hasPaid = !!payment;
    
    // Send notifications based on day of month and payment status
    if (!hasPaid) {
      if (currentDay === 1) {
        sendNotification(
          'Rent Due',
          'Your monthly rent payment is due. Please pay by the 5th to avoid late fees.',
          { tag: 'rent-reminder-1' }
        );
      } else if (currentDay === 5) {
        sendNotification(
          'Last Day for Rent Payment!',
          'Today is the last day to pay your rent without late fees.',
          { tag: 'rent-reminder-5', requireInteraction: true }
        );
      }
    }
  } catch (error) {
    console.error('Error setting up rent reminders:', error);
  }
};
