
// Push notification utility for rent reminders
export const scheduleRentReminders = () => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    // Schedule notifications for the 1st and 5th of each month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Schedule for 1st of month - rent reminder
    const firstOfMonth = new Date(currentYear, currentMonth, 1, 9, 0, 0); // 9 AM
    if (firstOfMonth > now) {
      const timeUntilFirst = firstOfMonth.getTime() - now.getTime();
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Rent Reminder 📅', {
            body: 'Your monthly rent is now due! Pay before the 5th to avoid late fees.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'rent-reminder',
            requireInteraction: true,
            actions: [
              { action: 'pay', title: 'Pay Now' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          });
        }
      }, timeUntilFirst);
    }
    
    // Schedule for 5th of month - final reminder
    const fifthOfMonth = new Date(currentYear, currentMonth, 5, 9, 0, 0); // 9 AM
    if (fifthOfMonth > now) {
      const timeUntilFifth = fifthOfMonth.getTime() - now.getTime();
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Final Rent Reminder ⚠️', {
            body: 'Last day to pay rent without late fees! Pay now to avoid penalties.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'rent-final',
            requireInteraction: true,
            actions: [
              { action: 'pay', title: 'Pay Now' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          });
        }
      }, timeUntilFifth);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('Test Notification 🔔', {
      body: 'Push notifications are working correctly!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test'
    });
  }
};
