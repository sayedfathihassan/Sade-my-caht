import { supabase } from "../lib/supabase";
import { User, StoreItem } from "../types";

export const storeService = {
  async getItems() {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) {
      console.error("Failed to fetch store items:", error);
      return [];
    }
    return data as StoreItem[];
  },

  subscribeToItems(callback: (items: StoreItem[]) => void) {
    // Use a unique channel name on each call to prevent conflicts between Store and Inventory
    const channelName = `store_items_changes_${Math.random().toString(36).slice(2)}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_items' }, () => {
        this.getItems().then(callback);
      })
      .subscribe();

    this.getItems().then(callback);

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  async updateItemPrice(itemId: string, newPrice: number) {
    const { error } = await supabase
      .from('store_items')
      .update({ price: newPrice })
      .eq('id', itemId);
    if (error) throw error;
  },

  async addItem(item: StoreItem) {
    const { error } = await supabase
      .from('store_items')
      .insert([item]);
    if (error) throw error;
  },

  async purchaseItem(user: User, item: StoreItem) {
    // 1. Client-side check for quick feedback
    if (item.currency === 'coins' && user.coins < item.price) {
      throw new Error("رصيد العملات غير كافٍ");
    }
    if (item.currency === 'diamonds' && user.diamonds < item.price) {
      throw new Error("رصيد الألماس غير كافٍ");
    }

    // 2. SERVER-SIDE SECURE PURCHASE
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("يجب تسجيل الدخول للشراء");

    const response = await fetch('/api/store/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ itemId: item.id })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "فشلت عملية الشراء");
    }

    return result;
  },

  async equipItem(userId: string, itemId: string, category: 'frame' | 'entry_effect' | 'chat_bubble' | 'badge') {
    const field = category === 'frame' ? 'active_frame_id' : category === 'entry_effect' ? 'active_entry_effect_id' : category === 'chat_bubble' ? 'active_chat_bubble_id' : 'active_badge_id';
    
    const { error } = await supabase
      .from('users')
      .update({ [field]: itemId })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async unequipItem(userId: string, category: 'frame' | 'entry_effect' | 'chat_bubble' | 'badge') {
    const field = category === 'frame' ? 'active_frame_id' : category === 'entry_effect' ? 'active_entry_effect_id' : category === 'chat_bubble' ? 'active_chat_bubble_id' : 'active_badge_id';
    
    const { error } = await supabase
      .from('users')
      .update({ [field]: null })
      .eq('id', userId);
    
    if (error) throw error;
  }
};
