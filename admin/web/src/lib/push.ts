import { ApiClient } from './api';

export class PushNotificationManager {
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  static getPermissionState(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  }

  static async requestAndSubscribe(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Push notifications are not supported on this device/browser',
      };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permission denied. Please allow notifications in browser settings.',
        };
      }

      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to PushManager
      const existingSub = await registration.pushManager.getSubscription();
      let subscription = existingSub;

      if (!subscription) {
        const vapidKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          'BExamplePublicKey_ReplaceWithGeneratedVapidKey...';

        const serverKey = vapidKey ? this.urlBase64ToUint8Array(vapidKey) : undefined;
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: serverKey ? serverKey.buffer.slice(
            serverKey.byteOffset, serverKey.byteOffset + serverKey.byteLength
          ) as ArrayBuffer : undefined,
        });
      }

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      const payload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dh ? this.arrayBufferToBase64(p256dh) : '',
          auth: auth ? this.arrayBufferToBase64(auth) : '',
        },
        deviceName: `${navigator.platform} - ${navigator.userAgent.slice(0, 40)}`,
        userType: 'ADMIN',
      };

      await ApiClient.subscribePush(payload);

      return {
        success: true,
        message: 'Mobile push notifications active! You will receive instant alerts for every new booking.',
      };
    } catch (err: any) {
      console.error('Push registration error:', err);
      return {
        success: false,
        message: err.message || 'Failed to register push notifications',
      };
    }
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Play alert sound in browser for new booking
   */
  static playChime() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }
}
