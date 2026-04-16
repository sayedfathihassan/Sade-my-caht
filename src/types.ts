export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  // Custom unique ID (like a @handle)
  userUid?: string;
  activeFrameId?: string;
  activeEntryEffectId?: string;
  activeChatBubbleId?: string;
  activeBadgeId?: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  diamonds: number;
  inventory: UserInventoryItem[];
  isVerified: boolean;
  isBanned: boolean;
  isSuperAdmin?: boolean;
  role: 'admin' | 'user';
  followerCount: number;
  followingCount: number;
  lastTaskResetAt: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  type: 'time' | 'gift' | 'mic' | 'chat' | 'game';
  frequency: 'daily' | 'weekly';
  isActive: boolean;
}

export interface RewardRule {
  id: string;
  name: string;
  type: 'spending_cashback' | 'gift_milestone';
  triggerValue: number;
  rewardValue: number;
  rewardItemId?: string;
  isActive: boolean;
}

export interface SystemSetting {
  key: string;
  value: any;
  description: string;
}

export interface UserTask {
  taskId: string;
  currentProgress: number;
  isClaimed: boolean;
  updatedAt: string;
}

export interface EventTask extends Task {
  eventId: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerUrl?: string;
  startAt: string;
  endAt: string;
  tasks: Task[];
  isActive: boolean;
  createdAt: string;
}

export interface EventUserTask {
  id: string;
  userId: string;
  eventId: string;
  taskId: string;
  current: number;
  isClaimed: boolean;
  updatedAt: string;
}

export interface Room {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverUrl?: string;
  type: 'public' | 'private' | 'vip';
  password?: string;
  maxSeats: number;
  isLive: boolean;
  backgroundTheme: string;
  memberCount: number;
  totalGifts: number;
  announcement?: string;
  bannedUsers?: string[]; // Array of user IDs
  autoModSettings?: {
    wordFilter: string[];
    antiSpam: boolean;
    kickIdlers: boolean;
  };
  welcomeMessage?: string;
  backgroundUrl?: string;
  backgroundMusicUrl?: string;
  seatNames?: Record<number, string>;
  isLockdown?: boolean;
  slowModeDelay?: number;
  createdAt: string;
  isPKEnabled: boolean;
  activePKChallengeId?: string;
  activeLuckyBoxId?: string;
}

export interface RoomPoll {
  id: string;
  roomId: string;
  creatorId: string;
  question: string;
  options: string[];
  status: 'active' | 'closed';
  endsAt?: string;
  createdAt: string;
  votes?: RoomPollVote[];
}

export interface RoomPollVote {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  createdAt: string;
}

export interface RoomAuditLog {
  id: string;
  roomId: string;
  adminId: string;
  action: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface RoomGiftGoal {
  id: string;
  roomId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomWaitlistEntry {
  id: string;
  roomId: string;
  userId: string;
  createdAt: string;
}

export interface RoomWarning {
  id: string;
  roomId: string;
  userId: string;
  adminId: string;
  reason: string;
  createdAt: string;
}

export interface RoomStaffMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface PKChallenge {
  id: string;
  roomId: string;
  user1Id: string;
  user2Id: string;
  user1Points: number;
  user2Points: number;
  status: 'active' | 'completed';
  winnerId?: string;
  duration: number;
  startedAt: string;
  endsAt: string;
}

export interface LuckyBox {
  id: string;
  roomId: string;
  creatorId: string;
  totalAmount: number;
  remainingAmount: number;
  totalWinners: number;
  winners: string[];
  status: 'active' | 'distributed';
  createdAt: string;
}

export interface VIPSubscription {
  userId: string;
  tier: 'silver' | 'gold' | 'diamond';
  startedAt: string;
  expiresAt: string;
  perks: string[];
}

export interface UserQuestProgress {
  questId: string;
  current: number;
  isClaimed: boolean;
  updatedAt: string;
}

export interface Seat {
  id: string;
  roomId: string;
  number: number;
  userId: string | null;
  isLocked: boolean;
  isMuted: boolean;
  joinedAt?: string;
  lastActivityAt?: string;
}

export interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  animationUrl: string;
  category: 'gifts' | 'romance' | 'flags' | 'special';
  cost: number;
  isActive: boolean;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'observer' | 'vip' | 'listener';
  joinedAt: string;
  isActive: boolean;
  isStealth?: boolean;
  isShadowBanned?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'gift' | 'system';
  timestamp: string;
  giftId?: string;
  quantity?: number;
  reactions?: Record<string, string[]>;
  activeChatBubbleId?: string;
  activeBadgeId?: string;
  activeFrameId?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
  otherUser?: User; // Populated client-side
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  userFrameId?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
}

export type StoreItemCategory = 'frame' | 'entry_effect' | 'badge' | 'gift' | 'chat_bubble';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'diamonds';
  category: StoreItemCategory;
  imageUrl: string;
  previewUrl?: string; // For entry effects (animation)
}

export interface UserInventoryItem {
  itemId: string;
  purchasedAt: string;
}

export type NotificationType = 'private_message' | 'room_announcement' | 'gift_arrival' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}
