import express from "express";
// Vite is imported dynamically only in development to avoid production crashes

import path from "path";
import { fileURLToPath } from "url";
import Pusher from "pusher";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── External Services ────────────────────────────────────────────────────────
const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID   || '',
  key:     process.env.VITE_PUSHER_KEY || '',
  secret:  process.env.PUSHER_SECRET   || '',
  cluster: process.env.VITE_PUSHER_CLUSTER || 'mt1',
  useTLS:  true,
});

// Supabase Admin client (service_role key — never exposed to client)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL          || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY  || '',
  { auth: { persistSession: false } }
);

// ─── Simple In-Memory Rate Limiter ────────────────────────────────────────────
// Tracks: { [userId]: { count, resetAt } }
const rateLimitMap: Record<string, { count: number; resetAt: number }> = {};

function isRateLimited(userId: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  if (!rateLimitMap[userId] || now > rateLimitMap[userId].resetAt) {
    rateLimitMap[userId] = { count: 1, resetAt: now + windowMs };
    return false;
  }
  rateLimitMap[userId].count++;
  return rateLimitMap[userId].count > maxRequests;
}

// ─── JWT Middleware ────────────────────────────────────────────────────────────
// Middleware: verify caller is Super Admin
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  const { data: caller } = await supabaseAdmin
    .from('users').select('is_super_admin, role').eq('id', req.user.id).single();
  if (!caller?.is_super_admin && caller?.role !== 'admin') {
    return res.status(403).json({ error: "ليس لديك صلاحية صاحب الشات" });
  }
  next();
};

const authenticateJWT = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized: Missing header" });

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: "Unauthorized: Invalid token" });

  req.user = user;
  next();
};

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── LiveKit: Generate Token ──────────────────────────────────────────────────
app.get("/api/livekit/token", authenticateJWT, async (req: any, res) => {
  const { room: roomId, identity } = req.query;
  const userId = req.user.id;
  const username = req.user.user_metadata?.username || "مستخدم";

  if (!roomId) return res.status(400).json({ error: "Missing room" });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit not configured" });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: username,
    });

    at.addGrant({
      roomJoin: true,
      room: roomId as string,
      canPublish: true,
      canSubscribe: true,
    });

    res.json({ token: await at.toJwt() });
  } catch (e) {
    console.error("LiveKit token failed:", e);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ─── Pusher Auth ──────────────────────────────────────────────────────────────
app.post("/api/pusher/auth", authenticateJWT, (req, res) => {
  const { socket_id: socketId, channel_name: channel } = req.body;
  if (!socketId) return res.status(400).send("Missing socket_id");

  try {
    const auth = pusher.authenticate(socketId, channel);
    res.send(auth);
  } catch (e) {
    console.error("Pusher auth failed:", e);
    res.status(500).send("Auth failed");
  }
});

// ─── Room: Send Chat Message ──────────────────────────────────────────────────
app.post("/api/room/chat", authenticateJWT, async (req: any, res) => {
  const userId = req.user.id;

  // Rate limit: max 30 messages/minute
  if (isRateLimited(userId, 30, 60_000)) {
    return res.status(429).json({ error: "أرسلت رسائل كثيرة جداً. انتظر قليلاً." });
  }

  const { roomId, message, autoModSettings } = req.body;
  if (!roomId || !message) return res.status(400).json({ error: "Missing roomId or message" });

  // Auto-mod word filter
  let filtered = false;
  if (autoModSettings?.wordFilter?.length > 0) {
    const wordFilter: string[] = autoModSettings.wordFilter;
    for (const word of wordFilter) {
      if (message.content?.toLowerCase().includes(word.toLowerCase())) {
        filtered = true;
        break;
      }
    }
  }

  if (!filtered) {
    console.log(`📡 Triggering Pusher for room ${roomId}: ${message.content}`);
    try {
      await pusher.trigger(`room-${roomId}`, "new-message", { message });
      console.log('✅ Pusher trigger successful');
    } catch (triggerError) {
      console.error('❌ Pusher trigger failed:', triggerError);
    }
  }

  res.json({ success: true, filtered });
});

// ─── Room: Join Room (Secure) ────────────────────────────────────────────────
app.post("/api/room/join", authenticateJWT, async (req: any, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Upsert membership
    await supabaseAdmin.from('room_members').upsert({
      room_id: roomId,
      user_id: userId,
      is_active: true
    });

    // 2. Count active members
    const { count } = await supabaseAdmin
      .from('room_members').select('*', { count: 'exact', head: true })
      .eq('room_id', roomId).eq('is_active', true);

    // 3. Update room member count
    await supabaseAdmin.from('rooms').update({ member_count: count || 0 }).eq('id', roomId);

    // 4. Notify room
    await pusher.trigger(`room-${roomId}`, "member-joined", { 
      userId, 
      count: count || 0 
    });

    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Room: Leave Room (Secure) ───────────────────────────────────────────────
app.post("/api/room/leave", authenticateJWT, async (req: any, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Deactivate membership
    await supabaseAdmin.from('room_members').update({ is_active: false })
      .eq('room_id', roomId).eq('user_id', userId);

    // 2. Count active members
    const { count } = await supabaseAdmin
      .from('room_members').select('*', { count: 'exact', head: true })
      .eq('room_id', roomId).eq('is_active', true);

    // 3. Update room member count
    await supabaseAdmin.from('rooms').update({ member_count: count || 0 }).eq('id', roomId);

    // 4. Notify room
    await pusher.trigger(`room-${roomId}`, "member-left", { 
      userId, 
      count: count || 0 
    });

    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Room: React to Message ───────────────────────────────────────────────────
app.post("/api/room/react", authenticateJWT, async (req: any, res) => {
  const { roomId, messageId, emoji } = req.body;
  const userId = req.user.id;
  try {
    await pusher.trigger(`room-${roomId}`, "new-reaction", { messageId, emoji, userId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});
 
// ─── Room: Create Room (Secure Transaction - 900 Coins) ───────────────────────
app.post("/api/room/create", authenticateJWT, async (req: any, res) => {
  const { name, type } = req.body;
  const userId = req.user.id;
 
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "اسم الغرفة قصير جداً" });
  }
 
  const ROOM_COST = 900;
 
  try {
    // 1. ENSURE USER PROFILE EXISTS (Fixes rooms_owner_id_fkey violation)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('coins, username, email').eq('id', userId).single();
    
    if (userError || !user) {
      console.log(`👤 User profile not found for ${userId}, creating auto-profile...`);
      // Auto-create profile if missing
      const { data: newUser, error: createError } = await supabaseAdmin.from('users').insert({
        id: userId,
        username: req.user.user_metadata?.username || `مستخدم_${Math.floor(Math.random()*1000)}`,
        email: req.user.email || '',
        coins: 1000,
        xp: 0
      }).select().single();
      
      if (createError) throw new Error("فشل إنشاء ملف المستخدم: " + createError.message);
      
      // Use the newly created user for balance check
      if (newUser.coins < ROOM_COST) {
        return res.status(400).json({ error: `رصيد غير كافٍ. تحتاج إلى ${ROOM_COST} عملة.` });
      }
    } else {
      if (user.coins < ROOM_COST) {
        return res.status(400).json({ error: `رصيد غير كافٍ. تحتاج إلى ${ROOM_COST} عملة.` });
      }
    }

    // 2. Generate unique room_uid (random 6 digits) until we add SQL trigger
    const roomUid = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Insert Room
    const { data: newRoom, error: roomError } = await supabaseAdmin
      .from('rooms')
      .insert({
        name: name.trim(),
        owner_id: userId,
        type: type || 'public',
        is_live: false,
        member_count: 1,
        active_pk_id: null,
        active_lucky_box_id: null
        // room_uid will be handled by DB or we can add it here if column exists
      })
      .select()
      .single();
 
    if (roomError || !newRoom) throw new Error("فشل إنشاء الغرفة في قاعدة البيانات");
 
    // 3. Deduct coins
    await supabaseAdmin.from('users')
      .update({ coins: user.coins - ROOM_COST })
      .eq('id', userId);
 
    // 4. Add owner as first member
    await supabaseAdmin.from('room_members')
      .insert({
        room_id: newRoom.id,
        user_id: userId,
        role: 'owner',
        is_active: true
      });
 
    res.json({ success: true, roomId: newRoom.id, newBalance: user.coins - ROOM_COST });
  } catch (err: any) {
    console.error('Room creation failed:', err);
    res.status(500).json({ error: err.message || "فشل إنشاء الغرفة" });
  }
});
 
// ─── Room: Entry Effect ───────────────────────────────────────────────────────
app.post("/api/room/entry", authenticateJWT, async (req: any, res) => {
  const { roomId, effectId, username, avatarUrl, frameId, badgeId } = req.body;
  const userId = req.user.id;
  try {
    await pusher.trigger(`room-${roomId}`, "user-entered", { userId, effectId, username, avatarUrl, frameId, badgeId });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});
 
// ─── Game: Wheel of Fortune Spin (Secure Deduction) ───────────────────────────
app.post("/api/game/wheel/spin", authenticateJWT, async (req: any, res) => {
  const { bet } = req.body;
  const userId = req.user.id;
 
  const betAmount = Number(bet);
  if (isNaN(betAmount) || ![200, 500, 1000].includes(betAmount)) {
    return res.status(400).json({ error: "قيمة الرهان غير صالحة" });
  }
 
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('coins, username').eq('id', userId).single();
    
    if (userError || !user) throw new Error("المستخدم غير موجود");
    if (user.coins < betAmount) return res.status(400).json({ error: "رصيد غير كافٍ" });
 
    // Wheel Rewards Definition (Matches frontend for sync)
    const REWARDS = [
      { id: 'nothing1', value: 0, type: 'nothing', weight: 50 },
      { id: 'c100', value: 0.5, type: 'coins', weight: 30 },
      { id: 'nothing2', value: 0, type: 'nothing', weight: 40 },
      { id: 'c500', value: 2, type: 'coins', weight: 15 },
      { id: 'd1', value: 1, type: 'diamonds', weight: 10 },
      { id: 'x200', value: 200, type: 'xp', weight: 15 },
      { id: 'nothing3', value: 0, type: 'nothing', weight: 30 },
      { id: 'c2000', value: 10, type: 'coins', weight: 3 },
      { id: 'd10', value: 10, type: 'diamonds', weight: 2 },
      { id: 'jackpot', value: 50, type: 'diamonds', weight: 1 },
    ];
 
    // Select reward server-side
    const totalWeight = REWARDS.reduce((acc, r) => acc + r.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedReward = REWARDS[0];
    
    for (const reward of REWARDS) {
      if (random < reward.weight) {
        selectedReward = reward;
        break;
      }
      random -= reward.weight;
    }
 
    // Calculate new values
    let newCoins = user.coins - betAmount;
    let newDiamonds = user.diamonds || 0;
    
    if (selectedReward.type === 'coins') {
       newCoins += Math.floor(betAmount * selectedReward.value);
    } else if (selectedReward.type === 'diamonds') {
       newDiamonds += selectedReward.value;
    }
 
    // Apply to DB
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ coins: newCoins, diamonds: newDiamonds })
      .eq('id', userId);
 
    if (updateError) throw updateError;
 
    res.json({ 
      success: true, 
      reward: selectedReward, 
      newBalance: newCoins 
    });
 
  } catch (err: any) {
    console.error('Wheel spin error:', err);
    res.status(500).json({ error: "حدث خطأ أثناء تشغيل العجلة" });
  }
});

// ─── Game: Trivia Play (Secure Deduction) ────────────────────────────────────
app.post("/api/game/trivia/play", authenticateJWT, async (req: any, res) => {
  const userId = req.user.id;
  const COST = 100;

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('coins').eq('id', userId).single();
    
    if (userError || !user) throw new Error("المستخدم غير موجود");
    if (user.coins < COST) return res.status(400).json({ error: "رصيد غير كافٍ" });

    const { error: updateError } = await supabaseAdmin
      .from('users').update({ coins: user.coins - COST }).eq('id', userId);

    if (updateError) throw updateError;

    res.json({ success: true, newBalance: user.coins - COST });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Room: Settings Update ────────────────────────────────────────────────────
app.post("/api/room/settings/update", authenticateJWT, async (req: any, res) => {
  const { roomId, settings } = req.body;
  const userId = req.user.id;

  // Verify caller is room owner or admin
  const { data: member } = await supabaseAdmin
    .from('room_members').select('role').eq('room_id', roomId).eq('user_id', userId).single();
  const { data: room } = await supabaseAdmin
    .from('rooms').select('owner_id').eq('id', roomId).single();

  const isAuthorized = room?.owner_id === userId || ['owner', 'admin'].includes(member?.role);
  if (!isAuthorized) return res.status(403).json({ error: "غير مصرح" });

  try {
    await pusher.trigger(`room-${roomId}`, "settings-updated", { settings });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Clear Chat ─────────────────────────────────────────────────────────
app.post("/api/room/clear-chat", authenticateJWT, async (req: any, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;

  const { data: member } = await supabaseAdmin
    .from('room_members').select('role').eq('room_id', roomId).eq('user_id', userId).single();
  const { data: room } = await supabaseAdmin
    .from('rooms').select('owner_id').eq('id', roomId).single();

  const isAuthorized = room?.owner_id === userId || ['owner', 'admin', 'moderator'].includes(member?.role);
  if (!isAuthorized) return res.status(403).json({ error: "غير مصرح" });

  try {
    await pusher.trigger(`room-${roomId}`, "clear-chat", {});
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Member Update ──────────────────────────────────────────────────────
app.post("/api/room/member/update", authenticateJWT, async (req: any, res) => {
  const { roomId, memberId, updates } = req.body;
  const userId = req.user.id;

  const { data: member } = await supabaseAdmin
    .from('room_members').select('role').eq('room_id', roomId).eq('user_id', userId).single();
  const { data: room } = await supabaseAdmin
    .from('rooms').select('owner_id').eq('id', roomId).single();

  const isAuthorized = room?.owner_id === userId || ['owner', 'admin'].includes(member?.role);
  if (!isAuthorized) return res.status(403).json({ error: "غير مصرح" });

  try {
    await pusher.trigger(`room-${roomId}`, "member-updated", { memberId, updates });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Lockdown ───────────────────────────────────────────────────────────
app.post("/api/room/lockdown", authenticateJWT, async (req: any, res) => {
  const { roomId, isLockdown } = req.body;
  const userId = req.user.id;
  const { data: room } = await supabaseAdmin.from('rooms').select('owner_id').eq('id', roomId).single();
  if (room?.owner_id !== userId) return res.status(403).json({ error: "غير مصرح" });

  try {
    await pusher.trigger(`room-${roomId}`, "lockdown-updated", { isLockdown });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Slow Mode ──────────────────────────────────────────────────────────
app.post("/api/room/slow-mode", authenticateJWT, async (req: any, res) => {
  const { roomId, delay } = req.body;
  try {
    await pusher.trigger(`room-${roomId}`, "slow-mode-updated", { delay });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Audit Log ─────────────────────────────────────────────────────────
app.post("/api/room/audit-log/add", authenticateJWT, async (req, res) => {
  const { roomId, log } = req.body;
  try {
    await pusher.trigger(`room-${roomId}`, "audit-log-added", { log });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Poll Create ───────────────────────────────────────────────────────
app.post("/api/room/poll/create", authenticateJWT, async (req, res) => {
  const { roomId, poll } = req.body;
  try {
    await pusher.trigger(`room-${roomId}`, "poll-created", { poll });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Gift Goal Update ──────────────────────────────────────────────────
app.post("/api/room/gift-goal/update", authenticateJWT, async (req, res) => {
  const { roomId, goal } = req.body;
  try {
    await pusher.trigger(`room-${roomId}`, "gift-goal-updated", { goal });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Private Chat ─────────────────────────────────────────────────────────────
app.post("/api/chat/send", authenticateJWT, async (req: any, res) => {
  const { recipientId, conversationId, message } = req.body;
  try {
    await pusher.trigger(`private-${recipientId}`, "new-message", { conversationId, message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Pusher failed" }); }
});

// ─── Room: Send Gift (Secure Transaction with 10% Cashback) ───────────────────
app.post("/api/room/gift", authenticateJWT, async (req: any, res) => {
  const { giftId, recipientId, roomId, giftName, giftCost, giftIconUrl, recipientName } = req.body;
  const userId = req.user.id;

  // Check rate limit (10 gifts per minute max to prevent spam)
  if (isRateLimited(userId + "_gift", 10, 60_000)) {
    return res.status(429).json({ error: "الرجاء الانتظار قليلاً قبل إرسال هدية أخرى." });
  }

  const cost = Number(giftCost);
  if (isNaN(cost) || cost <= 0) return res.status(400).json({ error: "بيانات الهدية غير صالحة" });

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('coins, username').eq('id', userId).single();
    
    if (userError || !user) throw new Error("المستخدم غير موجود");
    if (user.coins < cost) return res.status(400).json({ error: "رصيد غير كافٍ" });

    // Deduct coins from sender
    const { error: deductError } = await supabaseAdmin
      .from('users').update({ coins: user.coins - cost }).eq('id', userId);
    if (deductError) throw new Error("فشل خصم الرصيد");

    // Add 10% of the cost to the recipient
    if (recipientId && recipientId !== userId) {
      const cashback = Math.floor(cost * 0.10);
      if (cashback > 0) {
        const { data: recipient } = await supabaseAdmin
          .from('users').select('coins').eq('id', recipientId).single();
        if (recipient) {
          await supabaseAdmin.from('users')
            .update({ coins: recipient.coins + cashback })
            .eq('id', recipientId);
        }
      }
    }

    // Trigger Pusher Event
    await pusher.trigger(`room-${roomId}`, "new-message", {
      message: {
        id: Date.now().toString(),
        userId: userId,
        username: user.username,
        content: `أرسل ${giftName || 'هدية'} ${giftIconUrl || '🎁'} إلى ${recipientName || 'الجميع'}`,
        type: "gift",
        timestamp: new Date().toISOString()
      }
    });

    res.json({ success: true, newBalance: user.coins - cost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Room: Drop Lucky Box (Secure) ────────────────────────────────────────────
app.post("/api/room/lucky-box", authenticateJWT, async (req: any, res) => {
  const { roomId, amount, winners } = req.body;
  const userId = req.user.id;

  const totalAmount = Number(amount);
  const totalWinners = Number(winners);

  if (isNaN(totalAmount) || totalAmount <= 0 || isNaN(totalWinners) || totalWinners <= 0) {
    return res.status(400).json({ error: "قيم غير صالحة للصندوق" });
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('coins, username').eq('id', userId).single();
    if (userError || !user) throw new Error("المستخدم غير موجود");
    if (user.coins < totalAmount) return res.status(400).json({ error: "رصيد غير كافٍ" });

    // Deduct coins
    const { error: deductError } = await supabaseAdmin
      .from('users').update({ coins: user.coins - totalAmount }).eq('id', userId);
    if (deductError) throw new Error("فشل خصم الرصيد");

    // Create Lucky Box in DB
    const { data: luckyBox, error: boxError } = await supabaseAdmin
      .from('lucky_boxes')
      .insert({
        room_id: roomId,
        creator_id: userId,
        total_amount: totalAmount,
        remaining_amount: totalAmount,
        total_winners: totalWinners,
        winners: [],
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (boxError || !luckyBox) throw new Error("فشل إنشاء صندوق الحظ");

    // Update Room
    await supabaseAdmin.from('rooms').update({ active_lucky_box_id: luckyBox.id }).eq('id', roomId);

    // Notify Room
    await pusher.trigger(`room-${roomId}`, "new-message", {
      message: {
        id: Date.now().toString(),
        userId: userId,
        username: user.username,
        content: `ألقى صندوق حظ بقيمة ${totalAmount} عملة! 🎁✨`,
        type: "system",
        timestamp: new Date().toISOString()
      }
    });

    res.json({ success: true, newBalance: user.coins - totalAmount, luckyBox });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Store: Secure Purchase ───────────────────────────────────────────────────
app.post("/api/store/purchase", authenticateJWT, async (req: any, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  // Rate limit: max 5 purchases/minute
  if (isRateLimited(userId + "_purchase", 5, 60_000)) {
    return res.status(429).json({ error: "حاولت الشراء بسرعة كبيرة. انتظر قليلاً." });
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users').select('*').eq('id', userId).single();
    if (userError || !user) throw new Error("User not found");

    const { data: item, error: itemError } = await supabaseAdmin
      .from('store_items').select('*').eq('id', itemId).eq('is_active', true).single();
    if (itemError || !item) throw new Error("العنصر غير موجود أو غير متاح");

    // ✅ FIX: Check if user already owns this item (prevent duplicate purchase)
    const { data: existingOwnership } = await supabaseAdmin
      .from('user_inventory')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (existingOwnership) {
      return res.status(400).json({ error: "أنت تمتلك هذا العنصر بالفعل" });
    }

    // Validate balance
    const currency = item.currency as 'coins' | 'diamonds';
    if (user[currency] < item.price) {
      return res.status(400).json({ error: "رصيد غير كافٍ" });
    }

    // Deduct balance
    const { error: balanceError } = await supabaseAdmin
      .from('users')
      .update({ [currency]: user[currency] - item.price })
      .eq('id', userId);
    if (balanceError) throw balanceError;

    // Add to user_inventory table (dedicated table)
    const { error: inventoryError } = await supabaseAdmin
      .from('user_inventory')
      .insert([{ user_id: userId, item_id: itemId }]);

    // Also keep JSONB inventory for backwards compatibility
    const newInventory = [...(user.inventory || []), { itemId: item.id, purchasedAt: new Date().toISOString() }];
    await supabaseAdmin.from('users').update({ inventory: newInventory }).eq('id', userId);

    if (inventoryError) throw inventoryError;

    res.json({ success: true, newBalance: user[currency] - item.price });
  } catch (error: any) {
    console.error("Purchase failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Tasks & Events: Secure Reward Claim ──────────────────────────────────────
app.post("/api/task/claim", authenticateJWT, async (req: any, res) => {
  const { taskId } = req.body;
  const userId = req.user.id;

  try {
    // We hardcode logic or fetch tasks (using static fallback for performance)
    const { data: activeTasks } = await supabaseAdmin.from('tasks').select('*').eq('is_active', true);
    let task = activeTasks?.find(t => t.id === taskId);
    if (!task) {
      // Fallback for default daily tasks to prevent failure
      const DAILY_TASKS = [
        { id: 'task_time', target: 20, rewardCoins: 500, rewardXp: 100 },
        { id: 'task_chat', target: 10, rewardCoins: 200, rewardXp: 50 },
        { id: 'task_gift', target: 5, rewardCoins: 1000, rewardXp: 200 },
        { id: 'task_mic', target: 10, rewardCoins: 800, rewardXp: 150 },
        { id: 'task_game', target: 3, rewardCoins: 400, rewardXp: 100 },
      ];
      task = DAILY_TASKS.find(t => t.id === taskId);
    }
    if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });

    // Fetch user progress
    const { data: userTask } = await supabaseAdmin
      .from('user_tasks').select('*').eq('user_id', userId).eq('task_id', taskId).single();

    if (!userTask || userTask.current_progress < task.target) {
      return res.status(400).json({ error: "لم تكمل المهمة بعد" });
    }
    if (userTask.is_claimed) {
      return res.status(400).json({ error: "تم استلام الجائزة مسبقاً" });
    }

    // Fetch User
    const { data: user } = await supabaseAdmin.from('users').select('coins, xp').eq('id', userId).single();
    if (!user) throw new Error("المستخدم غير موجود");

    // Service Role Update (bypass RLS)
    await supabaseAdmin.from('user_tasks').update({ is_claimed: true }).eq('id', userTask.id);
    await supabaseAdmin.from('users').update({
      coins: user.coins + (task.reward_coins || task.rewardCoins),
      xp: user.xp + (task.reward_xp || task.rewardXp)
    }).eq('id', userId);

    res.json({ success: true, coins: user.coins + (task.reward_coins || task.rewardCoins) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/event/claim", authenticateJWT, async (req: any, res) => {
  const { eventId, taskId } = req.body;
  const userId = req.user.id;

  try {
    const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (!event || event.status !== 'active') return res.status(400).json({ error: "الفعالية غير متوفرة" });

    const task = (event.tasks || []).find((t: any) => t.id === taskId);
    if (!task) return res.status(400).json({ error: "المهمة غير موجودة" });

    const { data: ut } = await supabaseAdmin
      .from('event_user_tasks').select('*').eq('user_id', userId).eq('event_id', eventId).eq('task_id', taskId).single();

    if (!ut || ut.current_progress < task.target) return res.status(400).json({ error: "المهمة غير مكتملة" });
    if (ut.is_claimed) return res.status(400).json({ error: "مستلمة مسبقاً" });

    const { data: user } = await supabaseAdmin.from('users').select('coins, xp').eq('id', userId).single();
    
    await supabaseAdmin.from('event_user_tasks').update({ is_claimed: true }).eq('id', ut.id);
    await supabaseAdmin.from('users').update({ 
      coins: (user?.coins || 0) + task.rewardCoins, 
      xp: (user?.xp || 0) + task.rewardXp 
    }).eq('id', userId);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── User UID: Only Super Admin Can Change ────────────────────────
// Regular users CANNOT change their UID. Only super admin can assign UIDs.
app.post("/api/admin/user/set-uid", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { targetUserId, newUid } = req.body;

  if (!targetUserId || !newUid) return res.status(400).json({ error: "بيانات ناقصة" });

  // Validate format: 6-9 digits only
  if (!/^[0-9]{6,9}$/.test(String(newUid))) {
    return res.status(400).json({ error: "الـ ID يجب أن يكون من 6 إلى 9 أرقام فقط" });
  }

  const { data: target } = await supabaseAdmin.from('users').select('username').eq('id', targetUserId).single();
  if (!target) return res.status(404).json({ error: "المستخدم غير موجود" });

  const { error } = await supabaseAdmin.from('users').update({
    user_uid: String(newUid)
  }).eq('id', targetUserId);

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: "هذا الـ ID محجوز بالفعل. جرب آخر." });
    return res.status(500).json({ error: "فشل تحديث الـ ID" });
  }

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id, admin_name: 'Super Admin',
    action: 'set_user_uid',
    details: `تعيين ID ${newUid} لـ ${target.username}`
  });

  res.json({ success: true, uid: String(newUid) });
});

// ════════════════════════════════════════════════════════
// ─── SUPER ADMIN: FULL PLATFORM CONTROL ─────────────────
// ════════════════════════════════════════════════════════

// ─── Admin: Add / Deduct Balance ─────────────────────────
app.post("/api/admin/balance", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { targetUserId, currency, amount, reason } = req.body;

  if (!targetUserId || !currency || amount === undefined) {
    return res.status(400).json({ error: "بيانات ناقصة" });
  }
  if (!['coins', 'diamonds'].includes(currency)) {
    return res.status(400).json({ error: "العملة غير صحيحة" });
  }

  const { data: target, error: fetchErr } = await supabaseAdmin
    .from('users').select('coins, diamonds, username').eq('id', targetUserId).single();
  if (fetchErr || !target) return res.status(404).json({ error: "المستخدم غير موجود" });

  const currentBalance = target[currency as 'coins' | 'diamonds'];
  const newBalance = Math.max(0, currentBalance + Number(amount));

  const { error: updateErr } = await supabaseAdmin
    .from('users').update({ [currency]: newBalance }).eq('id', targetUserId);
  if (updateErr) return res.status(500).json({ error: "فشل تحديث الرصيد" });

  // Log the action
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id,
    admin_name: 'Super Admin',
    action: `balance_change`,
    details: `${amount > 0 ? '+' : ''}${amount} ${currency} → ${target.username} | السبب: ${reason || 'لا يوجد'}`
  });

  res.json({ success: true, newBalance, username: target.username });
});

// ─── Admin: Set Room Owner ────────────────────────────────
app.post("/api/admin/room/set-owner", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { roomId, newOwnerId } = req.body;
  if (!roomId || !newOwnerId) return res.status(400).json({ error: "بيانات ناقصة" });

  const { data: room } = await supabaseAdmin.from('rooms').select('name, owner_id').eq('id', roomId).single();
  if (!room) return res.status(404).json({ error: "الغرفة غير موجودة" });

  const { data: newOwner } = await supabaseAdmin.from('users').select('username').eq('id', newOwnerId).single();
  if (!newOwner) return res.status(404).json({ error: "المستخدم الجديد غير موجود" });

  // Update room owner
  await supabaseAdmin.from('rooms').update({ owner_id: newOwnerId }).eq('id', roomId);

  // Update old owner to admin role in room_members
  await supabaseAdmin.from('room_members')
    .update({ role: 'admin' })
    .eq('room_id', roomId).eq('user_id', room.owner_id);

  // Upsert new owner role in room_members
  await supabaseAdmin.from('room_members').upsert({
    room_id: roomId, user_id: newOwnerId, role: 'owner'
  }, { onConflict: 'room_id,user_id' });

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id, admin_name: 'Super Admin',
    action: 'set_room_owner',
    details: `غرفة "${room.name}" → صاحب جديد: ${newOwner.username}`
  });

  // Notify room in real-time
  await pusher.trigger(`room-${roomId}`, 'settings-updated', { owner_id: newOwnerId });

  res.json({ success: true });
});

// ─── Admin: Full Room Control (kick/ban/mute/clear anyone) ────────────────────
app.post("/api/admin/room/action", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { roomId, action, targetUserId, value, reason } = req.body;

  const validActions = ['kick', 'ban', 'unban', 'mute_seat', 'unmute_seat', 'lock_seat', 'clear_chat', 'end_room'];
  if (!roomId || !validActions.includes(action)) {
    return res.status(400).json({ error: "إجراء غير صحيح" });
  }

  try {
    if (action === 'kick') {
      await supabaseAdmin.from('seats').update({ user_id: null, joined_at: null }).eq('room_id', roomId).eq('user_id', targetUserId);
      await pusher.trigger(`room-${roomId}`, 'user-kicked', { userId: targetUserId, reason });
    }
    else if (action === 'ban') {
      const { data: room } = await supabaseAdmin.from('rooms').select('banned_users').eq('id', roomId).single();
      const bannedList = [...(room?.banned_users || []), targetUserId];
      await supabaseAdmin.from('rooms').update({ banned_users: bannedList }).eq('id', roomId);
      await supabaseAdmin.from('seats').update({ user_id: null }).eq('room_id', roomId).eq('user_id', targetUserId);
      await pusher.trigger(`room-${roomId}`, 'user-banned', { userId: targetUserId });
    }
    else if (action === 'unban') {
      const { data: room } = await supabaseAdmin.from('rooms').select('banned_users').eq('id', roomId).single();
      const bannedList = (room?.banned_users || []).filter((id: string) => id !== targetUserId);
      await supabaseAdmin.from('rooms').update({ banned_users: bannedList }).eq('id', roomId);
    }
    else if (action === 'mute_seat') {
      await supabaseAdmin.from('seats').update({ is_muted: true }).eq('room_id', roomId).eq('user_id', targetUserId);
      await pusher.trigger(`room-${roomId}`, 'member-updated', { memberId: targetUserId, updates: { is_muted: true } });
    }
    else if (action === 'unmute_seat') {
      await supabaseAdmin.from('seats').update({ is_muted: false }).eq('room_id', roomId).eq('user_id', targetUserId);
      await pusher.trigger(`room-${roomId}`, 'member-updated', { memberId: targetUserId, updates: { is_muted: false } });
    }
    else if (action === 'lock_seat') {
      await supabaseAdmin.from('seats').update({ is_locked: value ?? true }).eq('room_id', roomId).eq('number', targetUserId);
      await pusher.trigger(`room-${roomId}`, 'seat-updated', { seatNumber: targetUserId, isLocked: value ?? true });
    }
    else if (action === 'clear_chat') {
      await pusher.trigger(`room-${roomId}`, 'clear-chat', {});
    }
    else if (action === 'end_room') {
      await supabaseAdmin.from('rooms').update({ is_live: false }).eq('id', roomId);
      await pusher.trigger(`room-${roomId}`, 'room-ended', { reason: reason || 'أنهى صاحب الشات الغرفة' });
    }

    await supabaseAdmin.from('admin_logs').insert({
      admin_id: req.user.id, admin_name: 'Super Admin',
      action: `room_${action}`,
      details: `غرفة ${roomId}${targetUserId ? ` | هدف: ${targetUserId}` : ''}${reason ? ` | السبب: ${reason}` : ''}`
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Ban / Unban User Platform-Wide ────────────────
app.post("/api/admin/user/ban", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { targetUserId, isBanned, reason } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "بيانات ناقصة" });

  const { data: target } = await supabaseAdmin.from('users').select('username').eq('id', targetUserId).single();
  await supabaseAdmin.from('users').update({ is_banned: isBanned }).eq('id', targetUserId);

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id, admin_name: 'Super Admin',
    action: isBanned ? 'ban_user' : 'unban_user',
    details: `${target?.username} | السبب: ${reason || 'لا يوجد'}`
  });

  res.json({ success: true });
});

// ─── Admin: Update Any User Role/Data ────────────────────
app.post("/api/admin/user/update", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { targetUserId, updates } = req.body;
  if (!targetUserId || !updates) return res.status(400).json({ error: "بيانات ناقصة" });

  // Only allow safe fields to be updated by admin
  const allowedFields = ['username', 'role', 'is_verified', 'is_banned', 'level', 'xp', 'coins', 'diamonds'];
  const safeUpdates: Record<string, any> = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }

  const { error } = await supabaseAdmin.from('users').update(safeUpdates).eq('id', targetUserId);
  if (error) return res.status(500).json({ error: "فشل التحديث" });

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id, admin_name: 'Super Admin',
    action: 'update_user',
    details: `userId: ${targetUserId} | ${JSON.stringify(safeUpdates)}`
  });

  res.json({ success: true });
});

// ─── Admin: Global Announcement ──────────────────────────
app.post("/api/admin/announcement", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { text, author } = req.body;
  if (!text) return res.status(400).json({ error: "نص الإعلان مطلوب" });

  await supabaseAdmin.from('settings').upsert({ id: 'announcement', value: { text, author } });
  res.json({ success: true });
});

// ─── Admin: Get All Rooms (Super Admin View) ──────────────
app.get("/api/admin/rooms", authenticateJWT, requireSuperAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('rooms').select('id, name, owner_id, member_count, is_live, created_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: "فشل جلب الغرف" });
  res.json({ rooms: data });
});

// ─── Admin: Get All Users (Super Admin View) ─────────────
app.get("/api/admin/users", authenticateJWT, requireSuperAdmin, async (req, res) => {
  const search = (req.query.search as string) || '';
  let query = supabaseAdmin.from('users').select('id, username, email, user_uid, role, is_super_admin, is_banned, is_verified, coins, diamonds, level, created_at').order('created_at', { ascending: false }).limit(50);
  if (search) query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,user_uid.eq.${search}`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "فشل جلب المستخدمين" });
  res.json({ users: data });
});

// ─── Admin: Get Audit Logs ────────────────────────────────
app.get("/api/admin/logs", authenticateJWT, requireSuperAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: "فشل جلب السجلات" });
  res.json({ logs: data });
});

// ─── Admin: Delete Room ───────────────────────────────────
app.delete("/api/admin/room/:roomId", authenticateJWT, requireSuperAdmin, async (req: any, res) => {
  const { roomId } = req.params;
  const { data: room } = await supabaseAdmin.from('rooms').select('name').eq('id', roomId).single();
  await pusher.trigger(`room-${roomId}`, 'room-ended', { reason: 'تم حذف الغرفة من قبل الإدارة' });
  await supabaseAdmin.from('rooms').delete().eq('id', roomId);

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: req.user.id, admin_name: 'Super Admin',
    action: 'delete_room',
    details: `حذف غرفة "${room?.name}" (${roomId})`
  });

  res.json({ success: true });
});

// ─── LiveKit: Token ───────────────────────────────────────────────────────────
app.get("/api/livekit/token", authenticateJWT, async (req: any, res) => {
  const roomName = req.query.room as string;
  const identity = req.user.id;

  if (!roomName) return res.status(400).json({ error: "Missing room" });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY    || '',
    process.env.LIVEKIT_API_SECRET || '',
    { identity }
  );

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  res.json({ token: await at.toJwt() });
});

// ─── Static / Vite ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Export for Vercel
export default app;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}
