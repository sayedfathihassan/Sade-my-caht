import { StoreItem } from "../types";

export const STORE_ITEMS: StoreItem[] = [
  // Frames
  {
    id: "frame_king_gold",
    name: "إطار الملك الذهبي",
    description: "إطار ملكي مرصع بالذهب مع تاج فخم",
    price: 15000,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/crown.png", // We will style this to look like a frame
  },
  {
    id: "frame_royal_ribbon",
    name: "إطار الوسام الملكي",
    description: "إطار ذهبي مع شريط ملكي في الأعلى",
    price: 250,
    currency: "diamonds",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/medal.png",
  },
  {
    id: "frame_sun_gold",
    name: "إطار الشمس الذهبية",
    description: "إطار مشع بتصميم شمس ذهبية",
    price: 12000,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/sun.png",
  },
  {
    id: "frame_luxury_ring",
    name: "إطار الخاتم الفاخر",
    description: "إطار دائري ذهبي كلاسيكي فخم",
    price: 5000,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/wedding-ring.png",
  },
  {
    id: "frame_pink_wings",
    name: "إطار الأجنحة الوردية",
    description: "إطار وردي جذاب مع أجنحة ملائكية",
    price: 1000,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/angel-wings.png",
  },
  {
    id: "frame_ocean_blue",
    name: "إطار المحيط الأزرق",
    description: "إطار أزرق منعش مع فقاعات مائية",
    price: 1500,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/water-element.png",
  },
  {
    id: "frame_fire_dragon",
    name: "إطار التنين الناري",
    description: "إطار ناري ملتهب مع قرون التنين",
    price: 2000,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/dragon.png",
  },
  {
    id: "frame_neon_cyber",
    name: "إطار النيون السايبر",
    description: "إطار مستقبلي بإضاءة نيون خضراء",
    price: 1200,
    currency: "coins",
    category: "frame",
    imageUrl: "https://img.icons8.com/fluency/240/cyber-security.png",
  },
  
  // Entry Effects
  {
    id: "entry_thunder",
    name: "دخول الرعد",
    description: "تأثير برق ورعد عند دخولك الغرفة",
    price: 200,
    currency: "diamonds",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/thunderstorm.png",
  },
  {
    id: "entry_stars",
    name: "دخول النجوم",
    description: "تتساقط النجوم عند حضورك",
    price: 3000,
    currency: "coins",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/star.png",
  },
  {
    id: "entry_king",
    name: "دخول الملك",
    description: "موسيقى ملكية وسجادة حمراء",
    price: 500,
    currency: "diamonds",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/crown.png",
  },
  {
    id: "entry_fire",
    name: "دخول النيران",
    description: "تأثير نيران ملتهبة عند دخولك",
    price: 3500,
    currency: "coins",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/fire-element.png",
  },
  {
    id: "entry_ice",
    name: "دخول الجليد",
    description: "تأثير عاصفة ثلجية باردة",
    price: 250,
    currency: "diamonds",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/snow.png",
  },
  {
    id: "entry_portal",
    name: "البوابة الزمنية",
    description: "دخول أسطوري من بوابة سحرية",
    price: 600,
    currency: "diamonds",
    category: "entry_effect",
    imageUrl: "https://img.icons8.com/fluency/96/portal.png",
  },
  
  // Chat Bubbles
  {
    id: "bubble_royal_gold",
    name: "فقاعة الملك الذهبية",
    description: "فقاعة محادثة ذهبية فخمة مع تاج",
    price: 14000,
    currency: "coins",
    category: "chat_bubble",
    imageUrl: "https://img.icons8.com/fluency/96/chat-message.png",
  },
  {
    id: "bubble_starry_purple",
    name: "فقاعة النجوم البنفسجية",
    description: "فقاعة محادثة بنفسجية مع نجوم متلألئة",
    price: 14000,
    currency: "coins",
    category: "chat_bubble",
    imageUrl: "https://img.icons8.com/fluency/96/chat-message.png",
  },
  {
    id: "bubble_neon_gamer",
    name: "فقاعة النيون للألعاب",
    description: "فقاعة محادثة بألوان النيون وتصميم الألعاب",
    price: 14000,
    currency: "coins",
    category: "chat_bubble",
    imageUrl: "https://img.icons8.com/fluency/96/chat-message.png",
  },
  {
    id: "bubble_pink_hearts",
    name: "فقاعة القلوب الوردية",
    description: "فقاعة محادثة وردية لطيفة مع قلوب",
    price: 14000,
    currency: "coins",
    category: "chat_bubble",
    imageUrl: "https://img.icons8.com/fluency/96/chat-message.png",
  },

  // Rides (Entry Effects)
  {
    id: 'effect_sports_car',
    name: 'سيارة رياضية',
    description: 'دخول فخم بسيارة رياضية سريعة',
    price: 15000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204065.png'
  },
  {
    id: 'effect_pegasus',
    name: 'حصان مجنح',
    description: 'دخول أسطوري على ظهر حصان مجنح',
    price: 20000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3698/3698000.png'
  },
  {
    id: 'effect_magic_carpet',
    name: 'بساط الريح',
    description: 'دخول سحري على بساط الريح',
    price: 100,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/867/867084.png'
  },
  {
    id: 'effect_dragon',
    name: 'تنين ناري',
    description: 'دخول مرعب على ظهر تنين ينفث النار',
    price: 250,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3093/3093121.png'
  },
  {
    id: 'effect_helicopter',
    name: 'هليكوبتر خاصة',
    description: 'دخول كبار الشخصيات بطائرة هليكوبتر خاصة',
    price: 30000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/287/287224.png'
  },
  {
    id: 'effect_ufo',
    name: 'صحن طائر',
    description: 'دخول فضائي غامض بصحن طائر متطور',
    price: 500,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png'
  },
  {
    id: 'effect_phoenix',
    name: 'طائر الفينيق',
    description: 'دخول أسطوري من بين ألسنة اللهب مع طائر الفينيق',
    price: 1000,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2619/2619234.png'
  },
  {
    id: 'effect_supercar_gold',
    name: 'سيارة ذهبية',
    description: 'دخول فخم جداً بسيارة رياضية مطلية بالذهب',
    price: 50000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204065.png'
  },
  {
    id: 'effect_rocket',
    name: 'دخول الصاروخ',
    description: 'دخول سريع كالصاروخ',
    price: 5000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://img.icons8.com/fluency/96/rocket.png'
  },
  {
    id: 'effect_butterfly',
    name: 'دخول الفراشات',
    description: 'دخول هادئ مع فراشات ملونة',
    price: 200,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://img.icons8.com/fluency/96/butterfly.png'
  },
  {
    id: 'effect_lightning',
    name: 'دخول البرق',
    description: 'دخول خاطف كالبرق',
    price: 8000,
    currency: 'coins',
    category: 'entry_effect',
    imageUrl: 'https://img.icons8.com/fluency/96/lightning-bolt.png'
  },
  {
    id: 'effect_ghost',
    name: 'دخول الشبح',
    description: 'دخول غامض كالشبح',
    price: 300,
    currency: 'diamonds',
    category: 'entry_effect',
    imageUrl: 'https://img.icons8.com/fluency/96/ghost.png'
  },

  // Badges
  {
    id: 'badge_vip',
    name: 'VIP',
    description: 'وسام كبار الشخصيات',
    price: 5000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/6956/6956855.png'
  },
  {
    id: 'badge_king',
    name: 'الملك',
    description: 'وسام الملك',
    price: 10000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135783.png'
  },
  {
    id: 'badge_star',
    name: 'النجم',
    description: 'وسام النجم الساطع',
    price: 2000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png'
  },
  {
    id: 'badge_heart',
    name: 'المحب',
    description: 'وسام المحبة',
    price: 1500,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/833/833472.png'
  },
  {
    id: 'badge_golden_wings',
    name: 'الأجنحة الذهبية',
    description: 'وسام الأجنحة الذهبية الملكية',
    price: 15000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/5406/5406830.png'
  },
  {
    id: 'badge_billionaire_100',
    name: '100 بليونير',
    description: 'وسام الثراء الفاحش',
    price: 50000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583118.png'
  },
  {
    id: 'badge_egypt_star',
    name: 'نجم مصر',
    description: 'وسام نجم مصر',
    price: 5000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/323/323301.png'
  },
  {
    id: 'badge_ksa_star',
    name: 'نجم السعودية',
    description: 'وسام نجم السعودية',
    price: 5000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/323/323281.png'
  },
  {
    id: 'badge_super_admin',
    name: 'الداعم الأكبر',
    description: 'وسام الداعم الأكبر للغرفة',
    price: 25000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/7656/7656409.png'
  },
  {
    id: 'badge_mic_star',
    name: 'نجم المايك',
    description: 'وسام نجم المايك الذهبي',
    price: 10000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3059/3059437.png'
  },
  {
    id: 'badge_lion',
    name: 'الأسد',
    description: 'وسام الأسد الشجاع',
    price: 20000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2619/2619081.png'
  },
  {
    id: 'badge_forever_love',
    name: 'حب للأبد',
    description: 'وسام الحب الأبدي',
    price: 15000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1056/1056244.png'
  },
  {
    id: 'badge_6th_anniversary',
    name: 'الذكرى السادسة',
    description: 'وسام الذكرى السادسة',
    price: 20000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/5619/5619396.png'
  },
  {
    id: 'badge_jungle_king',
    name: 'ملك الغابة',
    description: 'وسام ملك الغابة',
    price: 12000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2619/2619081.png'
  },
  {
    id: 'badge_200_billionaire',
    name: '200 بليونير',
    description: 'وسام الثراء الفاحش جداً',
    price: 100000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/2583/2583118.png'
  },
  {
    id: 'badge_helicopter_star',
    name: 'نجم الهليكوبتر',
    description: 'وسام نجم الهليكوبتر',
    price: 30000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135783.png'
  },
  {
    id: 'badge_algeria_star',
    name: 'نجم الجزائر',
    description: 'وسام نجم الجزائر',
    price: 5000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/323/323301.png'
  },
  {
    id: 'badge_tunisia_star',
    name: 'نجم تونس',
    description: 'وسام نجم تونس',
    price: 5000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/323/323281.png'
  },
  {
    id: 'badge_palestine_star',
    name: 'نجم فلسطين',
    description: 'وسام نجم فلسطين',
    price: 5000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/323/323301.png'
  },
  {
    id: 'badge_forever_love_queen',
    name: 'ملكة الحب',
    description: 'وسام ملكة الحب الأبدي',
    price: 15000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/6956/6956855.png'
  },
  {
    id: 'badge_forever_love_king',
    name: 'ملك الحب',
    description: 'وسام ملك الحب الأبدي',
    price: 15000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135783.png'
  },
  {
    id: 'badge_tomato_star',
    name: 'نجم الطماطم',
    description: 'وسام نجم الطماطم',
    price: 2000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png'
  },
  {
    id: 'badge_supporters',
    name: 'الداعمين',
    description: 'وسام الداعمين',
    price: 8000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/7656/7656409.png'
  },
  {
    id: 'badge_kiss_star',
    name: 'نجم القبلة',
    description: 'وسام نجم القبلة',
    price: 4000,
    currency: 'coins',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/833/833472.png'
  },
  {
    id: 'badge_ferrari_star',
    name: 'نجم الفيراري',
    description: 'وسام نجم الفيراري',
    price: 40000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/5406/5406830.png'
  },
  {
    id: 'badge_titanic_star',
    name: 'نجم التايتانيك',
    description: 'وسام نجم التايتانيك',
    price: 35000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/1056/1056244.png'
  },
  {
    id: 'badge_plane_star',
    name: 'نجم الطائرة',
    description: 'وسام نجم الطائرة',
    price: 25000,
    currency: 'diamonds',
    category: 'badge',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/5619/5619396.png'
  }
];
