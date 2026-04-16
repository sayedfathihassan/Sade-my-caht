import { supabase } from "../lib/supabase";
import { pusher } from "../lib/pusher";
import { Notification, NotificationType } from "../types";

export const notificationService = {
  async sendNotification(userId: string, type: NotificationType, title: string, message: string, data?: any) {
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;

    // Trigger Pusher event via API
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notification: {
            id: newNotification.id,
            userId,
            type,
            title,
            message,
            data: data || {},
            read: false,
            createdAt: newNotification.created_at
          }
        })
      });
    } catch (e) {
      console.error('Failed to trigger Pusher notification:', e);
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          callback(data.map(this.mapNotification));
        }
      });

    // Subscribe to Pusher channel for real-time
    const channel = pusher.subscribe(`private-${userId}`);
    channel.bind('new-notification', (data: { notification: Notification }) => {
      // Re-fetch or update local state
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            callback(data.map(this.mapNotification));
          }
        });
    });

    return () => {
      pusher.unsubscribe(`private-${userId}`);
    };
  },

  async markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  async deleteNotification(notificationId: string) {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  },

  async markAllAsRead(userId: string, notifications: Notification[]) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  mapNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      read: data.is_read,
      createdAt: data.created_at
    };
  }
};
