import { supabase } from "../lib/supabase";
import { Event, EventUserTask, Task } from "../types";

export const eventService = {
  async getActiveEvents(): Promise<Event[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .lte('start_at', now)
      .gte('end_at', now);

    if (error) throw error;
    return (data || []).map((row: any) => this.mapEvent(row));
  },

  async getEventUserTasks(userId: string, eventId: string): Promise<EventUserTask[]> {
    const { data, error } = await supabase
      .from('event_user_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
    return data as EventUserTask[];
  },

  async updateEventTaskProgress(userId: string, eventId: string, taskId: string, increment: number = 1) {
    // First check if task exists in event
    const { data: event } = await supabase
      .from('events')
      .select('tasks')
      .eq('id', eventId)
      .single();

    if (!event) return;
    const task = (event.tasks as Task[]).find(t => t.id === taskId);
    if (!task) return;

    const { data: existing } = await supabase
      .from('event_user_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('task_id', taskId)
      .single();

    if (existing) {
      if (existing.is_claimed || existing.current >= task.target) return;
      
      await supabase
        .from('event_user_tasks')
        .update({ 
          current: Math.min(existing.current + increment, task.target),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('event_user_tasks')
        .insert([{
          user_id: userId,
          event_id: eventId,
          task_id: taskId,
          current: Math.min(increment, task.target)
        }]);
    }
  },

  async claimEventReward(userId: string, eventId: string, taskId: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("No authentication token found");

    const response = await fetch('/api/event/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ eventId, taskId })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to claim event reward");
    }
  },

  async createEvent(event: Partial<Event>) {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: event.title,
        description: event.description,
        banner_url: event.bannerUrl,
        start_at: event.startAt,
        end_at: event.endAt,
        tasks: event.tasks,
        is_active: event.isActive
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapEvent(data);
  },

  mapEvent(row: any): Event {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      bannerUrl: row.banner_url,
      startAt: row.start_at,
      endAt: row.end_at,
      tasks: row.tasks,
      isActive: row.is_active,
      createdAt: row.created_at
    };
  }
};
