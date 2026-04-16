# هيكلية قاعدة البيانات ونظام الربط (Database Schema & Integration)

هذا الملف مخصص لمساعدة المطورين أو أنظمة الذكاء الاصطناعي (مثل AI Cody) على فهم هيكلية قاعدة البيانات والعلاقات بين الجداول في تطبيق الشات الصوتي.

## 1. الجداول الأساسية (Database Tables)

### جدول المستخدمين `users`
يخزن بيانات الحساب، الرصيد، والمستويات.
- `id`: UUID (Primary Key) - معرف فريد للمستخدم.
- `username`: String - اسم المستخدم.
- `email`: String - البريد الإلكتروني.
- `avatar_url`: String - رابط الصورة الشخصية.
- `coins`: Integer - رصيد العملات (يستخدم للألعاب والهدايا).
- `diamonds`: Integer - رصيد الألماس.
- `level`: Integer - مستوى المستخدم.
- `xp`: Integer - نقاط الخبرة الحالية.
- `next_level_xp`: Integer - النقاط المطلوبة للمستوى التالي.
- `role`: String ('user', 'admin') - رتبة المستخدم.
- `is_banned`: Boolean - حالة الحظر العام.
- `inventory`: JSONB - قائمة العناصر المملوكة (إطارات، فقاعات شات، إلخ).

### جدول الغرف `rooms`
يخزن بيانات غرف الدردشة.
- `id`: UUID (Primary Key).
- `owner_id`: UUID (Foreign Key -> users.id) - صاحب الغرفة.
- `name`: String - اسم الغرفة.
- `description`: String - وصف الغرفة.
- `type`: String ('public', 'private', 'vip') - نوع الغرفة.
- `password`: String - كلمة مرور الغرف الخاصة.
- `max_seats`: Integer - عدد المقاعد المتاحة.
- `cover_url`: String - صورة غلاف الغرفة.
- `announcement`: Text - الإعلان المثبت داخل الغرفة.
- `banned_users`: UUID[] (Array) - قائمة معرفات المستخدمين المحظورين من الغرفة.
- `is_pk_enabled`: Boolean - تفعيل أو تعطيل تحديات الـ PK في الغرفة.
- `auto_mod_settings`: JSONB - إعدادات الرقابة الآلية (فلتر الكلمات، مكافحة السبام).
- `welcome_message`: Text - رسالة ترحيب تظهر عند دخول الغرفة.
- `background_url`: String - رابط خلفية الغرفة المخصصة.
- `background_music_url`: String - رابط موسيقى الخلفية.
- `seat_names`: JSONB - أسماء مخصصة للمقاعد.
- `is_lockdown`: Boolean - وضع الإغلاق لمنع دخول مستخدمين جدد.
- `slow_mode_delay`: Integer - تأخير إرسال الرسائل بالثواني.
- `member_count`: Integer - عدد المتواجدين حالياً.
- `total_gifts`: BigInt - إجمالي الهدايا المرسلة في الغرفة.

### جدول أعضاء الغرفة `room_members`
يدير الأدوار والصلاحيات داخل كل غرفة.
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `user_id`: UUID (Foreign Key -> users.id).
- `role`: String ('owner', 'admin', 'moderator', 'observer', 'listener') - رتبة العضو (مشرف، مراقب، إلخ).
- `is_active`: Boolean - هل المستخدم متواجد حالياً في الغرفة.
- `is_stealth`: Boolean - وضع التخفي للمشرفين.
- `is_shadow_banned`: Boolean - الحظر الخفي للمستخدمين المزعجين.
- `joined_at`: Timestamp.

### جدول المقاعد `seats`
يدير حالة المايكات والجلوس داخل الغرف.
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `number`: Integer - رقم المقعد (1-12).
- `user_id`: UUID (Foreign Key -> users.id, Nullable) - المستخدم الجالس حالياً.
- `is_locked`: Boolean - هل المقعد مقفل من قبل الإدارة.
- `is_muted`: Boolean - هل المايك مكتوم.

### جدول الهدايا `gifts`
- `id`: UUID (Primary Key).
- `name`: String.
- `icon_url`: String.
- `animation_url`: String.
- `cost`: Integer - تكلفة الهدية بالعملات.
- `category`: String.

### جدول المتجر `store_items`
- `id`: UUID (Primary Key).
- `name`: String.
- `price`: Integer.
- `category`: String ('frame', 'badge', 'chat_bubble', etc).
- `image_url`: String.

### جدول المهام `tasks`
يخزن المهام اليومية والأسبوعية المتاحة لجميع المستخدمين.
- `id`: UUID (Primary Key).
- `title`: String - عنوان المهمة.
- `description`: String - وصف المهمة.
- `target`: Integer - الرقم المستهدف (مثلاً 20 رسالة).
- `reward_coins`: Integer - العملات الممنوحة عند الإكمال.
- `reward_xp`: Integer - نقاط الخبرة الممنوحة.
- `type`: String ('chat', 'gift', 'time', 'mic', 'game') - نوع النشاط المطلوب.
- `frequency`: String ('daily', 'weekly') - تكرار المهمة.
- `is_active`: Boolean - هل المهمة متاحة حالياً.

### جدول تقدم المهام `user_tasks`
يخزن تقدم كل مستخدم في المهام.
- `id`: UUID (Primary Key).
- `user_id`: UUID (Foreign Key -> users.id).
- `task_id`: UUID (Foreign Key -> tasks.id).
- `current_progress`: Integer - التقدم الحالي للمستخدم.
- `is_claimed`: Boolean - هل تم استلام المكافأة.
- `updated_at`: Timestamp.

### جدول قواعد المكافآت `reward_rules`
يستخدم لتحديد قواعد الاسترداد (Cashback) أو مكافآت الإنجاز.
- `id`: UUID (Primary Key).
- `name`: String - اسم القاعدة (مثلاً: استرداد 10%).
- `type`: String ('spending_cashback', 'gift_milestone') - نوع القاعدة.
- `trigger_value`: Integer - القيمة المطلوبة لتفعيل المكافأة (مثلاً إنفاق 1000 عملة).
- `reward_value`: Integer - القيمة الممنوحة (عملات أو ألماس).
- `reward_item_id`: UUID (Nullable) - في حال كانت المكافأة عنصراً من المتجر أو هدية معينة.
- `is_active`: Boolean.

### جدول إعدادات النظام `system_settings`
يخزن الإعدادات العامة التي تتحكم في سلوك التطبيق.
- `key`: String (Primary Key) - مفتاح الإعداد (مثلاً `welcome_message`, `min_withdrawal`).
- `value`: JSONB - قيمة الإعداد.
- `description`: String - وصف الإعداد للإدارة.

### جدول تحديات الـ PK `pk_challenges`
يدير تحديات الهدايا بين المستخدمين في الغرف.
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `user1_id`: UUID (Foreign Key -> users.id).
- `user2_id`: UUID (Foreign Key -> users.id).
- `user1_points`: Integer - نقاط المتحدي الأول.
- `user2_points`: Integer - نقاط المتحدي الثاني.
- `status`: String ('active', 'completed').
- `winner_id`: UUID (Nullable).
- `ends_at`: Timestamp - وقت انتهاء التحدي.

### جدول صناديق الحظ `lucky_boxes`
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `creator_id`: UUID (Foreign Key -> users.id).
- `total_amount`: Integer - إجمالي العملات في الصندوق.
- `remaining_amount`: Integer - العملات المتبقية.
- `total_winners`: Integer - عدد الفائزين المستهدف.
- `winners`: UUID[] - قائمة المعرفات التي استلمت الجائزة.
- `status`: String ('active', 'distributed').

### جدول اشتراكات الـ VIP `vip_subscriptions`
- `user_id`: UUID (Primary Key, Foreign Key -> users.id).
- `tier`: String ('silver', 'gold', 'diamond').
- `expires_at`: Timestamp.
- `perks`: JSONB - قائمة المميزات المفعلة.

### جدول التحذيرات `room_warnings`
يخزن التحذيرات الموجهة للمستخدمين داخل الغرفة.
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `user_id`: UUID (Foreign Key -> users.id).
- `admin_id`: UUID (Foreign Key -> users.id).
- `reason`: Text - سبب التحذير.
- `created_at`: Timestamp.

### جدول دردشة الطاقم `room_staff_messages`
يخزن الرسائل الخاصة بين طاقم إدارة الغرفة.
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `user_id`: UUID (Foreign Key -> users.id).
- `username`: String.
- `content`: Text.
- `created_at`: Timestamp.

### جدول سجل العمليات `room_audit_logs`
- `id`: UUID (Primary Key).
- `room_id`: UUID (Foreign Key -> rooms.id).
- `admin_id`: UUID (Foreign Key -> users.id).
- `action`: String (kick, ban, warn, etc).
- `target_id`: UUID (Nullable).
- `details`: Text.
- `created_at`: Timestamp.

---

## 2. نظام الربط والعمليات (Integration Logic)

### نظام الرسائل اللحظي (Real-time Messaging)
التطبيق يستخدم **Pusher** لإرسال واستقبال البيانات لحظياً:
1. **قنوات الغرف (`room-{id}`)**: تستخدم لإرسال رسائل الشات، التفاعلات (Reactions)، وتحديثات حالة المقاعد.
2. **قنوات خاصة (`private-{user_id}`)**: تستخدم للإشعارات الخاصة والرسائل المباشرة.
3. **الخادم (Server.ts)**: يعمل كوسيط (Proxy) لتوقيع طلبات Pusher (Auth) وإطلاق الأحداث (Triggers) لضمان الأمان.

### نظام المهام والمكافآت (Tasks & Rewards Logic)
1. **تتبع النشاط**: عند قيام المستخدم بنشاط (إرسال رسالة، فتح مايك)، يتم استدعاء `taskService.updateTaskProgress`.
2. **التحقق من الإكمال**: يتم مقارنة `current_progress` مع `tasks.target`.
3. **المكافآت التلقائية**: في حال وجود قاعدة في `reward_rules` من نوع `spending_cashback` بإنفاق 1000 عملة، يقوم النظام تلقائياً بإعادة النسبة المحددة للمستخدم.
4. **المهام الأسبوعية**: يتم تصفير التقدم في `user_tasks` للمهام التي نوعها `weekly` كل يوم أحد.

### لوحة الإدارة (Admin Control)
1. **الإدارة العامة**: تملك صلاحية تعديل `system_settings` و `tasks` و `reward_rules`.
2. **إدارة صاحب الغرفة**: يملك صلاحية تعديل إعدادات غرفته الخاصة (`rooms.announcement`, `rooms.type`, `seats.is_locked`).

### منطق الألعاب والخصم (Gaming & Balance Logic)
1. **عجلة الحظ (Wheel of Fortune)**:
   - قبل البدء: يتم التحقق من `users.coins >= betAmount`.
   - عند البدء: يتم خصم المبلغ فوراً من `users.coins` عبر Supabase.
   - عند الفوز: يتم إضافة الجائزة إلى `users.coins` أو `users.diamonds`.
2. **تحدي العباقرة (Trivia Game)**:
   - تكلفة الدخول ثابتة (مثلاً 100 عملة).
   - يتم الخصم عند الضغط على "ابدأ" عبر استدعاء `onPlay`.

### العلاقات (Relationships)
- **User <-> Room**: علاقة (One-to-Many) حيث يملك المستخدم عدة غرف.
- **Room <-> Seat**: علاقة (One-to-Many) كل غرفة لها مجموعة مقاعد ثابتة.
- **User <-> Seat**: علاقة (One-to-One) في لحظة معينة، المستخدم يجلس على مقعد واحد فقط.
- **Task <-> UserTask**: علاقة (One-to-Many) لتتبع تقدم كل مستخدم في كل مهمة.

---

## 3. ملاحظات للمطور (Notes for AI Cody)
- عند التعامل مع الخصم، استخدم دائماً `supabase.from('users').update({ coins: newBalance }).eq('id', userId)`.
- لتحديث الشات لحظياً، استخدم `pusher.trigger()` من جهة الخادم (Backend) بعد التأكد من صحة البيانات.
- جميع العمليات الحساسة (مثل خصم الرصيد) يجب أن تتم مع التحقق من الهوية (Auth).
