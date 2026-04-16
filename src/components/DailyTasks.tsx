import { useState, useEffect } from "react";
import { User, Task, UserTask, Event, EventUserTask } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { DAILY_TASKS, taskService } from "@/src/services/taskService";
import { eventService } from "@/src/services/eventService";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, Coins, Star, X, Trophy, Timer, MessageSquare, Gift, Mic, Calendar } from "lucide-react";
import { formatNumber, cn } from "@/src/lib/utils";

export function DailyTasks({ user, onClose }: { user: User, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'daily' | 'events'>('daily');
  const [userTasks, setUserTasks] = useState<Record<string, UserTask>>({});
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [eventUserTasks, setEventUserTasks] = useState<Record<string, EventUserTask[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for reset
    taskService.checkAndResetTasks(user.id, user.lastTaskResetAt);

    const fetchData = async () => {
      // Fetch Daily Tasks
      const { data: dailyData } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id);
      
      if (dailyData) {
        const tasks: Record<string, UserTask> = {};
        dailyData.forEach(d => {
          tasks[d.task_id] = {
            taskId: d.task_id,
            currentProgress: d.current_progress,
            isClaimed: d.is_claimed,
            updatedAt: d.last_updated_at
          };
        });
        setUserTasks(tasks);
      }

      // Fetch Events
      try {
        const events: Event[] = await eventService.getActiveEvents();
        setActiveEvents(events);

        const eventTasksMap: Record<string, EventUserTask[]> = {};
        for (const event of events) {
          const tasks = await eventService.getEventUserTasks(user.id, event.id);
          eventTasksMap[event.id] = tasks;
        }
        setEventUserTasks(eventTasksMap);
      } catch (e) {
        console.error("Failed to fetch events:", e);
      }

      setLoading(false);
    };

    fetchData();

    const dailySub = supabase
      .channel(`user_tasks_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_tasks', filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe();

    const eventSub = supabase
      .channel(`event_user_tasks_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_user_tasks', filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(dailySub);
      supabase.removeChannel(eventSub);
    };
  }, [user.id, user.lastTaskResetAt]);

  const handleClaim = async (taskId: string) => {
    const reward = await taskService.claimReward(user.id, taskId);
    if (reward) {
      // Success
    }
  };

  const handleClaimEventReward = async (eventId: string, taskId: string) => {
    try {
      await eventService.claimEventReward(user.id, eventId, taskId);
    } catch (e) {
      console.error("Failed to claim event reward:", e);
    }
  };

  const getIcon = (type: Task['type']) => {
    switch (type) {
      case 'time': return <Timer className="w-5 h-5 text-blue-500" />;
      case 'chat': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'gift': return <Gift className="w-5 h-5 text-rose-500" />;
      case 'mic': return <Mic className="w-5 h-5 text-amber-500" />;
      case 'game': return <Trophy className="w-5 h-5 text-amber-500" />;
      default: return <Star className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="bg-neutral-900 border border-white/5 w-full max-w-md rounded-[32px] overflow-hidden flex flex-col max-h-[80vh]">
        <header className="p-6 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-bold">المهام والفعاليات</h2>
                <p className="text-[10px] text-neutral-500">أكمل المهام واحصل على الجوائز</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('daily')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'daily' ? "bg-amber-500 text-black shadow-lg" : "text-neutral-500 hover:text-white"
              )}
            >
              <Timer className="w-4 h-4" />
              المهام اليومية
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'events' ? "bg-amber-500 text-black shadow-lg" : "text-neutral-500 hover:text-white"
              )}
            >
              <Calendar className="w-4 h-4" />
              الفعاليات {activeEvents.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'daily' ? (
            DAILY_TASKS.map((task) => {
              const progress = userTasks[task.id] || { currentProgress: 0, isClaimed: false };
              const isComplete = progress.currentProgress >= task.target;
              const percentage = Math.min((progress.currentProgress / task.target) * 100, 100);

              return (
                <div key={task.id} className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                        {getIcon(task.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{task.title}</h3>
                        <p className="text-[10px] text-neutral-500">{task.description}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-neutral-400">{progress.currentProgress}/{task.target}</span>
                    </div>
                  </div>

                  <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn(
                        "h-full transition-all",
                        isComplete ? "bg-green-500" : "bg-amber-500"
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Coins className="w-3 h-3" />
                        {task.rewardCoins}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                        <Star className="w-3 h-3" />
                        {task.rewardXp} XP
                      </div>
                    </div>

                    <button
                      disabled={!isComplete || progress.isClaimed}
                      onClick={() => handleClaim(task.id)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                        progress.isClaimed 
                          ? "bg-neutral-900 text-neutral-600 cursor-default"
                          : isComplete
                            ? "bg-amber-500 text-black hover:bg-amber-400"
                            : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      )}
                    >
                      {progress.isClaimed ? "تم الاستلام" : isComplete ? "استلام الجائزة" : "قيد التنفيذ"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-6">
              {activeEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-neutral-700 mx-auto mb-4 opacity-20" />
                  <p className="text-neutral-500 font-bold">لا توجد فعاليات نشطة حالياً</p>
                </div>
              ) : (
                activeEvents.map(event => (
                  <div key={event.id} className="space-y-4">
                    <div className="relative h-24 rounded-2xl overflow-hidden border border-white/10">
                      <img 
                        src={event.bannerUrl || "https://picsum.photos/seed/event/800/400"} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                        <h3 className="font-black text-white text-lg">{event.title}</h3>
                        <p className="text-[10px] text-white/60">{event.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {event.tasks.map(task => {
                        const progress = eventUserTasks[event.id]?.find(ut => ut.taskId === task.id) || { current: 0, isClaimed: false };
                        const isComplete = progress.current >= task.target;
                        const percentage = Math.min((progress.current / task.target) * 100, 100);

                        return (
                          <div key={task.id} className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
                                  {getIcon(task.type)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm">{task.title}</h3>
                                  <p className="text-[10px] text-neutral-500">{task.description}</p>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-bold text-neutral-400">{progress.current}/{task.target}</span>
                              </div>
                            </div>

                            <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={cn(
                                  "h-full transition-all",
                                  isComplete ? "bg-green-500" : "bg-amber-500"
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                  <Coins className="w-3 h-3" />
                                  {task.rewardCoins}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                                  <Star className="w-3 h-3" />
                                  {task.rewardXp} XP
                                </div>
                              </div>

                              <button
                                disabled={!isComplete || progress.isClaimed}
                                onClick={() => handleClaimEventReward(event.id, task.id)}
                                className={cn(
                                  "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                  progress.isClaimed 
                                    ? "bg-neutral-900 text-neutral-600 cursor-default"
                                    : isComplete
                                      ? "bg-amber-500 text-black hover:bg-amber-400"
                                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                )}
                              >
                                {progress.isClaimed ? "تم الاستلام" : isComplete ? "استلام الجائزة" : "قيد التنفيذ"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
