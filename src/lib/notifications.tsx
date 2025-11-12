import { supabase } from './supabase';
import toast from 'react-hot-toast';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface SystemNotification {
  title: string;
  message: string;
  severity: NotificationSeverity;
  user_id?: string;
}

export async function createNotification(notification: SystemNotification) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        type: 'custom',
        subject: notification.title,
        content: notification.message
      }]);

    if (error) throw error;

    // Show toast notification
    switch (notification.severity) {
      case 'error':
        toast.error(notification.message);
        break;
      case 'success':
        toast.success(notification.message);
        break;
      case 'warning':
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-yellow-50 p-4 rounded-lg shadow-lg`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">{notification.title}</h3>
                <div className="mt-2 text-sm text-yellow-700">{notification.message}</div>
              </div>
            </div>
          </div>
        ));
        break;
      default:
        toast(notification.message);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}