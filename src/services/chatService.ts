import { supabase } from "../lib/supabase";
import { Conversation, PrivateMessage, User } from "../types";
import { notificationService } from "./notificationService";

export const chatService = {
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<string> {
    const participants = [user1Id, user2Id].sort();
    
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .contains('participants', participants)
      .single();
    
    if (data) {
      return data.id;
    }

    const { data: newData, error: newError } = await supabase
      .from('conversations')
      .insert([{
        participants,
        last_message: "",
        last_message_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (newError) throw newError;
    return newData.id;
  },

  async sendMessage(conversationId: string, senderId: string, recipientId: string, content: string, senderName: string) {
    const { data: message, error } = await supabase
      .from('private_messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;

    // Update conversation metadata
    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Trigger Pusher event via our API
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          recipientId,
          message: {
            id: message.id,
            senderId,
            content,
            timestamp: message.created_at,
            read: false
          }
        })
      });
    } catch (e) {
      console.error('Failed to trigger Pusher event:', e);
    }

    // Send notification
    await notificationService.sendNotification(
      recipientId,
      'private_message',
      `رسالة جديدة من ${senderName}`,
      content.length > 50 ? content.substring(0, 47) + "..." : content,
      { conversationId, senderId }
    );
  },

  async markAsRead(conversationId: string, userId: string) {
    // In Supabase, we'd update the private_messages table
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  }
};
