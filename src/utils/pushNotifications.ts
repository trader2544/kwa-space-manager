
// Register service worker and request notification permission
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

// Send immediate notification
export const sendNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }
};

// Send rent reminder notification
export const sendRentReminder = (dueDate: string, amount: number) => {
  if (Notification.permission === 'granted') {
    new Notification('Rent Reminder', {
      body: `Your rent of KSh ${amount.toLocaleString()} is due on ${dueDate}. Pay now to avoid late fees.`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }
};

// Check if today is rent reminder date and send notification
export const checkAndSendRentReminders = async (userAssignment: any) => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Send reminders on 1st and 5th of each month
  if ((dayOfMonth === 1 || dayOfMonth === 5) && userAssignment?.house) {
    const rentAmount = userAssignment.house.price;
    const dueDate = dayOfMonth === 1 ? '5th' : 'today';
    
    if (dayOfMonth === 1) {
      sendRentReminder(dueDate, rentAmount);
    } else if (dayOfMonth === 5) {
      // Check if rent is already paid for this month
      const currentMonth = today.toISOString().slice(0, 7);
      const { data: payment } = await supabase
        .from('rent_payments')
        .select('id')
        .eq('tenant_id', userAssignment.tenant_id)
        .eq('month_year', currentMonth)
        .eq('status', 'paid')
        .maybeSingle();
      
      if (!payment) {
        sendNotification(
          'Final Rent Notice',
          `Your rent is due today! Pay KSh ${rentAmount.toLocaleString()} now to avoid late fees.`
        );
      }
    }
  }
};

// Schedule rent reminders (to be called when user logs in)
export const scheduleRentReminders = (userAssignment: any) => {
  // Check immediately
  checkAndSendRentReminders(userAssignment);
  
  // Set up daily check at 9 AM
  const now = new Date();
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  const timeUntil9AM = tomorrow9AM.getTime() - now.getTime();
  
  setTimeout(() => {
    checkAndSendRentReminders(userAssignment);
    // Then check daily
    setInterval(() => {
      checkAndSendRentReminders(userAssignment);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntil9AM);
};
