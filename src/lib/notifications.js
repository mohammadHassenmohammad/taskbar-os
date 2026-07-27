import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
  async requestPermissions() {
    try {
      // Capacitor check
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        try {
          await LocalNotifications.createChannel({
            id: 'tactical-alerts',
            name: 'Tactical Alerts',
            description: 'Mission critical updates and reminders',
            importance: 5, // 5 = High importance (heads up)
            visibility: 1, // 1 = Public
            vibration: true,
          });
        } catch (err) {
          console.warn('Channel creation failed or not supported', err);
        }
        return true;
      }
    } catch (e) {
      // Web fallback
      if ('Notification' in window) {
        const webPerm = await Notification.requestPermission();
        return webPerm === 'granted';
      }
    }
    return false;
  },

  async scheduleTacticalAlert({ id, title, body, date, sound = 'default', extra = {} }) {
    try {
      // LocalNotifications schedule
      const notification = {
        title,
        body,
        id: typeof id === 'number' ? id : Math.floor(Math.random() * 1000000),
        channelId: 'tactical-alerts',
        extra
      };
      
      if (date) {
        notification.schedule = { at: date };
      }

      await LocalNotifications.schedule({ notifications: [notification] });
    } catch (e) {
      // Web fallback (one-time timeout if the tab is open)
      const now = new Date();
      const delay = date ? date.getTime() - now.getTime() : 0;
      if (delay >= 0 && 'Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
          new Notification(title, { body, ...extra });
        }, delay);
      }
    }
  },

  async fireImmediate({ id, title, body }) {
    await this.scheduleTacticalAlert({ id, title, body, date: null });
  },

  async cancelAll() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } catch (e) {
      console.warn('Failed to cancel notifications', e);
    }
  }
};
