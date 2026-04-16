import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search as SearchIcon, User as UserIcon, Hash, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Room, User } from '../types';
import { UserAvatar } from './UserAvatar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
  onSelectUser: (userId: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectRoom, onSelectUser }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'users'>('rooms');
  const [roomResults, setRoomResults] = useState<Room[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setRoomResults([]);
      setUserResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim());
      } else {
        setRoomResults([]);
        setUserResults([]);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);

      // Search Rooms
      let roomDbQuery = supabase.from('rooms').select('*').limit(20);
      if (isUUID) {
        roomDbQuery = roomDbQuery.eq('id', searchQuery);
      } else {
        roomDbQuery = roomDbQuery.ilike('name', `%${searchQuery}%`);
      }
      const { data: rooms } = await roomDbQuery;

      // Search Users
      let userDbQuery = supabase.from('users').select('*').limit(20);
      if (isUUID) {
        userDbQuery = userDbQuery.eq('id', searchQuery);
      } else {
        userDbQuery = userDbQuery.ilike('username', `%${searchQuery}%`);
      }
      const { data: users } = await userDbQuery;

      setRoomResults((rooms as Room[]) || []);
      setUserResults((users as User[]) || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 sm:pt-20" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header & Search Input */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو المعرف (ID)..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pr-12 pl-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-2xl text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'rooms' ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <Hash className="w-4 h-4" />
                الغرف ({roomResults.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'users' ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                المستخدمين ({userResults.length})
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : query.trim() === '' ? (
              <div className="text-center py-12 text-neutral-500 flex flex-col items-center">
                <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
                <p>اكتب شيئاً للبحث...</p>
              </div>
            ) : activeTab === 'rooms' ? (
              <div className="space-y-2">
                {roomResults.length > 0 ? (
                  roomResults.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => onSelectRoom(room.id)}
                      className="w-full flex items-center gap-4 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-2xl transition-all text-right group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-neutral-700 overflow-hidden shrink-0 relative">
                        {room.coverUrl ? (
                          <img src={room.coverUrl} alt={room.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-500">
                            <Hash className="w-6 h-6" />
                          </div>
                        )}
                        {room.isLive && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate group-hover:text-amber-500 transition-colors">{room.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.memberCount} / {room.maxSeats}
                          </span>
                          <span className="truncate opacity-50">ID: {room.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    لا توجد غرف مطابقة لبحثك
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {userResults.length > 0 ? (
                  userResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onSelectUser(user.id)}
                      className="w-full flex items-center gap-4 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-2xl transition-all text-right group"
                    >
                      <UserAvatar 
                        src={user.avatarUrl} 
                        username={user.username} 
                        size="md" 
                        level={user.level} 
                        frameUrl={user.active_frame_id}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate group-hover:text-amber-500 transition-colors">{user.username}</h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                          <span className="text-amber-500 font-bold">مستوى {user.level}</span>
                          <span className="opacity-50 truncate">ID: {user.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    لا يوجد مستخدمين مطابقين لبحثك
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
