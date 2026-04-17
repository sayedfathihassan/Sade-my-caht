import { supabase } from "../lib/supabase";
import { Task, UserTask, User, Event } from "../types";
import { eventService } from "./eventService";

export const DAILY_TASKS: Task[] = [
  { id: 'task_time', title: 'المستمع الوفي', description: 'ابقَ في الغرفة لمدة 20 دقيقة', target: 20, rewardCoins: 500, rewardXp: 100, type: 'time', frequency: 'daily', isActive: true },
  { id: 'task_chat', title: 'المتفاعل الاجتماعي', description: 'أرسل 10 رسائل في الدردشة', target: 10, rewardCoins: 200, rewardXp: 50, type: 'chat', frequency: 'daily', isActive: true },
  { id: 'task_gift', title: 'الكريم السخي', description: 'أرسل 5 هدايا للأصدقاء', target: 5, rewardCoins: 1000, rewardXp: 200, type: 'gift', frequency: 'daily', isActive: true },
  { id: 'task_mic', title: 'صوت SG', description: 'تحدث في المايك لمدة 10 دقائق', target: 10, rewardCoins: 800, rewardXp: 150, type: 'mic', frequency: 'daily', isActive: true },
  { id: 'task_game', title: 'المنافس القوي', description: 'العب 3 ألعاب مصغرة', target: 3, rewardCoins: 400, rewardXp: 100, type: 'game', frequency: 'daily', isActive: true },
];

export const taskService = {
  async getDailyTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true);
    
    if (data && data.length > 0) {
      return data.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        target: t.target,
        rewardCoins: t.reward_coins,
        rewardXp: t.reward_xp,
        type: t.type,
        frequency: t.frequency,
        isActive: t.is_active
      }));
    }
    return DAILY_TASKS;
  },

  async checkAndResetTasks(userId: string, lastReset: string) {
    const now = new Date();
    const lastResetDate = new Date(lastReset);
    
    if (now.getUTCDate() !== lastResetDate.getUTCDate() || now.getUTCMonth() !== lastResetDate.getUTCMonth() || now.getUTCFullYear() !== lastResetDate.getUTCFullYear()) {
      // Reset daily tasks
      await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', userId);
      
      // Update last reset time
      await supabase
        .from('users')
        .update({ last_task_reset_at: now.toISOString() })
        .eq('id', userId);
      
      return true;
    }
    return false;
  },

  async updateTaskProgress(userId: string, taskType: Task['type'], increment: number = 1) {
    // Use local DAILY_TASKS directly - no DB fetch needed, faster and more reliable
    const relevantTasks = DAILY_TASKS.filter(t => t.type === taskType && t.isActive);
    
    for (const task of relevantTasks) {
      try {
        // First try to get existing progress
        const { data: existing, error: fetchError } = await supabase
          .from('user_tasks')
          .select('id, current_progress, is_claimed')
          .eq('user_id', userId)
          .eq('task_id', task.id)
          .maybeSingle();

        if (existing) {
          // Already claimed or at target - skip
          if (existing.is_claimed || existing.current_progress >= task.target) continue;
          
          const newProgress = Math.min(existing.current_progress + increment, task.target);
          const { error } = await supabase
            .from('user_tasks')
            .update({ current_progress: newProgress })
            .eq('id', existing.id);
          
          if (error) console.error(`Failed to update task ${task.id}:`, error);
          else console.log(`✅ Task ${task.id} progress: ${newProgress}/${task.target}`);
        } else {
          // No record yet - create new
          const { error } = await supabase
            .from('user_tasks')
            .insert([{
              user_id: userId,
              task_id: task.id,
              current_progress: Math.min(increment, task.target),
              is_claimed: false
            }]);
          
          if (error) {
            // Could be a race condition duplicate insert - try update instead
            if (error.code === '23505') {
              await supabase
                .from('user_tasks')
                .update({ current_progress: increment })
                .eq('user_id', userId)
                .eq('task_id', task.id);
            } else {
              console.error(`Failed to insert task ${task.id}:`, error);
            }
          } else {
            console.log(`✅ Task ${task.id} created with progress: ${increment}/${task.target}`);
          }
        }
      } catch (err) {
        console.error(`Error updating task ${task.id}:`, err);
      }
    }

    // Update Event Tasks (keep as-is but wrapped in try/catch)
    try {
      const activeEvents: Event[] = await eventService.getActiveEvents();
      for (const event of activeEvents) {
        const eventTask = event.tasks.find(t => t.type === taskType);
        if (eventTask) {
          await eventService.updateEventTaskProgress(userId, event.id, eventTask.id, increment);
        }
      }
    } catch (e) {
      console.warn("Failed to update event task progress:", e);
    }
  },

  async claimReward(userId: string, taskId: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/task/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId })
      });

      if (!response.ok) {
        console.error("Failed to claim reward", await response.text());
        return null;
      }

      const tasks = await this.getDailyTasks();
      return tasks.find(t => t.id === taskId);
    } catch (e) {
      console.error("Error claiming reward", e);
      return null;
    }
  }
};
