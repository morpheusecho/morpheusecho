/**
 * =============================================================================
 * MORPHEUS ECHO - COMPLETE BACKEND SERVER
 * =============================================================================
 * A single-file backend containing:
 * - Express.js REST API
 * - MongoDB database operations
 * - Socket.IO real-time communication
 * - JWT authentication
 * - Content moderation
 * - Anonymous identity generation
 * - XP and badge system
 * - Voice confession handling
 * - Anonymous messaging
 * - Radio mode queue
 * =============================================================================
 */

// =============================================================================
// LOAD ENVIRONMENT VARIABLES FROM .env FILE
// =============================================================================
require('dotenv').config();

// Validate that .env file exists and is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: .env file not found or MONGODB_URI not set!');
  console.error('📝 Please create a .env file in the BACKEND directory with:');
  console.error('   MONGODB_URI=mongodb+srv://...');
  console.error('   JWT_SECRET=your_secret_here');
  console.error('   CLOUDINARY_CLOUD_NAME=...');
  console.error('   CLOUDINARY_API_KEY=...');
  console.error('   CLOUDINARY_API_SECRET=...');
  process.exit(1);
}

console.log('✅ Environment variables loaded from .env file');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const { Redis } = require('@upstash/redis');

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const CONFIG = {
  PORT: process.env.PORT || 5000,

  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Redis
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // AI APIs
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Admin Settings
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '79827'
};

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(key => console.error(`   - ${key}`));
  console.error('\n📝 Please add them to your .env file');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// =============================================================================
// GLOBAL RUNTIME STATES
// =============================================================================
let maintenanceMode = false;

// =============================================================================
// ANONYMOUS IDENTITY GENERATION POOLS
// =============================================================================
const IDENTITY_POOLS = {
  // MYTHIC TIER (0.1%) - Primordial & Cosmic Entities
  MYTHIC_CREATURES: [
    { name: 'Aion', origin: 'Greek - God of eternity' },
    { name: 'Ananta Shesha', origin: 'Hindu - Infinite cosmic serpent' },
    { name: 'Yggdrasil', origin: 'Norse - World tree incarnate' },
    { name: 'Khaos', origin: 'Greek - Primordial void entity' },
    { name: 'Amarok', origin: 'Inuit - Great wolf spirit' },
    { name: 'Terra', origin: 'Roman - Living earth embodiment' },
    { name: 'Cosmos', origin: 'Greek - Cosmic order personified' },
    { name: 'Dreamweaver', origin: 'Original - Weaver of realities' },
    { name: 'Echo', origin: 'Greek - Original voice of sound' },
    { name: 'Nyxborn', origin: 'Greek - Child of primordial night' },
    { name: 'Stardrifter', origin: 'Original - Wanderer between galaxies' },
    { name: 'Timeless', origin: 'Original - Unbound by time' },
    { name: 'Voidwalker', origin: 'Original - Walker of empty spaces' },
    { name: 'Morph', origin: 'Original - Shaper of forms' },
    { name: 'Phantasm', origin: 'Original - Living illusion' }
  ],
  MYTHIC_LOCATIONS: [
    'The Void', 'Eternity', 'Dreamscape', 'The In-Between', 'Neverwhen',
    'Aeternum', 'Infinitum', 'Origin Point', 'The Stillness', 'Nowhere',
    'Everywhen', 'The Between', 'Nexus', 'Threshold', 'Zero Point'
  ],
  MYTHIC_COLOURS: [
    'Prismatic', 'Aetherial', 'Null', 'Omni', 'Voidtouched', 'Timeless', 'Infinity', 'Absolute'
  ],

  // LEGENDARY TIER (1%) - Mythological Icons
  LEGENDARY_CREATURES: [
    { name: 'Phoenix', origin: 'Greek/Egyptian - Rebirth from fire' },
    { name: 'Dragon', origin: 'Multiple - Ancient power' },
    { name: 'Griffin', origin: 'Greek - Eagle-lion guardian' },
    { name: 'Kraken', origin: 'Norse - Sea monster' },
    { name: 'Unicorn', origin: 'European - Pure magic' },
    { name: 'Cerberus', origin: 'Greek - Three-headed guardian' },
    { name: 'Hydra', origin: 'Greek - Many-headed serpent' },
    { name: 'Chimera', origin: 'Greek - Hybrid monster' },
    { name: 'Sphinx', origin: 'Egyptian - Riddle keeper' },
    { name: 'Thunderbird', origin: 'Native American - Storm bringer' },
    { name: 'Qilin', origin: 'Chinese - Auspicious omen' },
    { name: 'Roc', origin: 'Arabian - Giant bird' },
    { name: 'Leviathan', origin: 'Hebrew - Sea primordial' },
    { name: 'Fenrir', origin: 'Norse - Monstrous wolf' },
    { name: 'Garuda', origin: 'Hindu/Buddhist - Divine eagle' },
    { name: 'Anzu', origin: 'Mesopotamian - Storm bird' },
    { name: 'Sleipnir', origin: 'Norse - Eight-legged horse' },
    { name: 'Tiamat', origin: 'Babylonian - Saltwater dragon' },
    { name: 'Ammit', origin: 'Egyptian - Soul devourer' },
    { name: 'Bunyip', origin: 'Aboriginal Australian - Swamp creature' },
    { name: 'Wendigo', origin: 'Algonquian - Forest spirit' },
    { name: 'Kitsune', origin: 'Japanese - Nine-tailed fox' },
    { name: 'Tanuki', origin: 'Japanese - Shapeshifting raccoon' },
    { name: 'Nue', origin: 'Japanese - Chimera-like' },
    { name: 'Yuki-onna', origin: 'Japanese - Snow spirit' }
  ],
  LEGENDARY_LOCATIONS: [
    'Avalon', 'Atlantis', 'El Dorado', 'Shangri-La', 'Camelot', 'Olympus',
    'Asgard', 'Nirvana', 'Elysium', 'Shambhala', 'Xanadu', 'Hyperborea',
    'Lemuria', 'Mu', 'Yomi', 'Valhalla', 'Tír na nÓg', 'Elphame', 'Styx', 'Hades'
  ],
  LEGENDARY_COLOURS: [
    'Starfire', 'Moonshadow', 'Sunflare', 'Duskfall', 'Dawnbringer', 'Stormeye', 'Dreamlight', 'Chaosflame'
  ],

  // EXCLUSIVE TIER (3%) - Rare & Mystical
  EXCLUSIVE_CREATURES: [
    'Manticore', 'Hippogriff', 'Wyvern', 'Basilisk', 'Harpy', 'Oni', 'Tengu',
    'Kappa', 'Jorōgumo', 'Rokurokubi', 'Bake-danuki', 'Kamaitachi', 'Baku',
    'Nekomata', 'Isonade', 'Namazu', 'Futakuchi-onna', 'Ushi-oni', 'Dullahan',
    'Banshee', 'Púca', 'Selkie', 'Merrow', 'Kelpie'
  ],
  EXCLUSIVE_LOCATIONS: [
    'Vatican', 'Lhasa', 'Bodh Gaya', 'Uluru', 'Mount Kailash', 'Delphi',
    'Mecca', 'Medina', 'Amritsar', 'Lalibela', 'Stonehenge', 'Petra',
    'Machu Picchu', 'Angkor', 'Teotihuacan', 'Pompeii', 'Troy', 'Carthage',
    'Persepolis', 'Mohenjo-Daro', 'Easter Island', 'Timbuktu', 'Samarkand', 'Constantinople'
  ],
  EXCLUSIVE_COLOURS: [
    'Abyssal', 'Ethereal', 'Spectral', 'Phantasmal', 'Astral', 'Celestial', 'Nebula', 'Cosmic'
  ],

  // RARE TIER (10%)
  RARE_CREATURES: [
    'Panther', 'Tiger', 'Falcon', 'White Whale', 'Snow Leopard', 'Manticore', 'Hippogriff',
    'Wyvern', 'Basilisk', 'Harpy', 'Golden Eagle', 'Arctic Fox', 'Black Wolf', 'Silver Stag'
  ],
  RARE_LOCATIONS: [
    'Kyoto', 'Babylon', 'Alexandria', 'Edinburgh', 'Prague', 'Venice', 'Istanbul',
    'Marrakech', 'Cairo', 'Varanasi', 'Jerusalem', 'Santiago', 'Lalibela', 'Bhutan'
  ],
  RARE_COLOURS: [
    'Crimson', 'Azure', 'Emerald', 'Amber', 'Violet', 'Obsidian', 'Pearl', 'Jade', 'Ruby', 'Sapphire'
  ],

  // UNCOMMON TIER (25%)
  UNCOMMON_CREATURES: [
    'Snow Leopard', 'Manta Ray', 'Orca', 'Lynx', 'Ocelot', 'Octopus', 'Peacock',
    'Swan', 'Arctic Wolf', 'Red Panda', 'Koala', 'Kangaroo', 'Otter', 'Hedgehog'
  ],
  UNCOMMON_LOCATIONS: [
    'Siberia', 'Transylvania', 'Himalayas', 'Amazon', 'Sahara', 'Andes', 'Iceland',
    'Madagascar', 'Patagonia', 'Nepal', 'Bhutan', 'Mongolia', 'Tibet', 'Zanskar'
  ],
  UNCOMMON_COLOURS: [
    'Moss', 'Clay', 'Sand', 'Storm', 'Frost', 'Dawn', 'Dusk', 'Twilight', 'Forest', 'Ocean'
  ],

  // COMMON TIER (60.9%)
  COMMON_CREATURES: [
    'Dog', 'Cat', 'Fox', 'Eagle', 'Wolf', 'Raven', 'Owl', 'Snake', 'Horse',
    'Deer', 'Bear', 'Lion', 'Elephant', 'Dolphin', 'Rabbit', 'Squirrel', 'Hawk', 'Crow'
  ],
  COMMON_LOCATIONS: [
    'Oslo', 'Tokyo', 'Delhi', 'Cairo', 'Paris', 'London', 'New York', 'Sydney',
    'Rio', 'Cape Town', 'Mumbai', 'Bangkok', 'Seoul', 'Singapore', 'Dubai', 'Barcelona',
    'Rome', 'Berlin', 'Moscow', 'Toronto', 'Mexico City', 'Lagos', 'Nairobi', 'Jakarta'
  ],
  COMMON_COLOURS: [
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White',
    'Gray', 'Navy', 'Teal', 'Coral', 'Lavender', 'Maroon', 'Olive', 'Turquoise'
  ]
};

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================
const CATEGORIES = [
  { id: 'adult', name: 'Adult', color: '#8B0000', description: 'Mature themes — desire, obsession, forbidden feelings' },
  { id: 'crime', name: 'Crime', color: '#4A4A4A', description: 'True crime stories, confessions of wrongdoing' },
  { id: 'funny', name: 'Funny', color: '#FFD700', description: 'Humorous, embarrassing, lighthearted confessions' },
  { id: 'romantic', name: 'Romantic Crush', color: '#FF69B4', description: 'Secret feelings, unrequited love, hidden admiration' },
  { id: 'insult', name: 'Insult', color: '#FF8C00', description: 'Venting frustration, calling out others anonymously' },
  { id: 'sorrow', name: 'Sorrow & Grief', color: '#191970', description: 'Loss, sadness, mourning, heartbreak' },
  { id: 'pain', name: 'Pain', color: '#800000', description: 'Physical or emotional suffering and survival stories' },
  { id: 'god', name: 'To The God', color: '#FFD700', description: 'Prayers, spiritual confessions, faith and doubt' },
  { id: 'family', name: 'Dear Family', color: '#8B4513', description: 'Things unsaid to family members' },
  { id: 'opinion', name: 'Unpopular Opinions', color: '#800080', description: 'Controversial takes and taboo thoughts' },
  { id: 'work', name: 'Work & Career', color: '#008080', description: 'Workplace secrets, career regrets, office drama' },
  { id: 'mental', name: 'Mental Health', color: '#90EE90', description: 'Anxiety, depression, inner struggles' }
];

// =============================================================================
// REACTION TYPES
// =============================================================================
const REACTIONS = {
  meToo: { emoji: '🙋', label: 'Me Too' },
  sendingLove: { emoji: '💝', label: 'Sending Love' },
  wow: { emoji: '😮', label: 'Wow' },
  sameLol: { emoji: '😂', label: 'Same Lol' },
  stayStrong: { emoji: '💪', label: 'Stay Strong' },
  respect: { emoji: '🙏', label: 'Respect' }
};

// =============================================================================
// LEVEL & TITLE SYSTEM
// =============================================================================
const LEVEL_SYSTEM = {
  1: { title: 'Whisperer', minXP: 0, maxXP: 2499 },
  26: { title: 'Shadow Voice', minXP: 2500, maxXP: 7499 },
  76: { title: 'Confessor', minXP: 7500, maxXP: 14999 },
  151: { title: 'Void Speaker', minXP: 15000, maxXP: 24999 },
  251: { title: 'Phantom', minXP: 25000, maxXP: 29899 },
  300: { title: 'Legend', minXP: 29900, maxXP: Infinity }
};

const XP_REWARDS = {
  POST_CONFESSION: 10,
  RECEIVE_REACTION: 2,
  RECEIVE_COMMENT: 5,
  DAILY_ACTIVITY: 20,
  STREAK_7: 100,
  STREAK_30: 500,
  LEVEL_UP: 50
};

// =============================================================================
// BADGE SYSTEM
// =============================================================================
const BADGES = {
  creative: { name: 'Creative', color: '#22C55E', condition: '10+ reactions on funny posts' },
  emotional: { name: 'Emotional', color: '#3B82F6', condition: 'Consistent emotional posting' },
  dark: { name: 'Dark', color: '#A855F7', condition: 'High engagement on dark posts' },
  romantic: { name: 'Romantic', color: '#EC4899', condition: 'Popular romantic confessions' },
  spiritual: { name: 'Spiritual', color: '#EAB308', condition: 'Community love on spiritual posts' },
  mythical: { name: 'Mythical', color: '#94A3B8', condition: 'Legendary creature holder' },
  legend: { name: 'Legend', color: 'rainbow', condition: 'Level 300 only' }
};

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================
const app = express();
app.set('trust proxy', true); // For getting real IP behind proxies

const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =============================================================================
// CLOUDINARY SETUP
// =============================================================================
cloudinary.config({
  cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
  api_key: CONFIG.CLOUDINARY_API_KEY,
  api_secret: CONFIG.CLOUDINARY_API_SECRET
});

// =============================================================================
// REDIS SETUP (Optional - only if REDIS_URL is provided)
// =============================================================================
let redis = null;
if (CONFIG.REDIS_URL && CONFIG.REDIS_TOKEN) {
  redis = new Redis({
    url: CONFIG.REDIS_URL,
    token: CONFIG.REDIS_TOKEN
  });
  console.log('✅ Redis connected');
} else {
  console.log('⚠️ Redis not configured - skipping');
}

// =============================================================================
// SOCKET.IO SETUP
// =============================================================================
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('authenticate', (data) => {
    try {
      if (data.token && data.userId) {
        const decoded = jwt.verify(data.token, CONFIG.JWT_SECRET);
        if (decoded.userId === data.userId) {
          socket.join(`user_${data.userId}`);
          console.log(`User ${data.userId} authenticated on socket`);
          if (decoded.isAdmin) {
            socket.join('admin_room');
          }
        }
      }
    } catch (err) {
      console.error('Socket authentication failed');
    }
  });

  socket.on('join_confession', (confessionId) => {
    socket.join(`confession_${confessionId}`);
  });
  socket.on('leave_confession', (confessionId) => {
    socket.leave(`confession_${confessionId}`);
  });

  socket.on('typing_start', (data) => {
    if (data.to && data.from) {
      socket.to(`user_${data.to}`).emit('typing_start', { fromId: data.from });
    }
  });

  socket.on('typing_end', (data) => {
    if (data.to && data.from) {
      socket.to(`user_${data.to}`).emit('typing_end', { fromId: data.from });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// =============================================================================
// MONGOOSE SCHEMAS
// =============================================================================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  anonymousName: { type: String, required: true, unique: true },
  rarity: { type: String, enum: ['COMMON', 'UNCOMMON', 'RARE', 'EXCLUSIVE', 'LEGENDARY', 'MYTHIC'], default: 'COMMON' },
  gender: { type: String, enum: ['male', 'female', 'prefer_not_to_say'], required: true },
  age: { type: Number, min: 18 },
  ageVerified: { type: Boolean, default: false },
  avatarUrl: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  title: { type: String, default: 'Whisperer' },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  badges: [{ type: String }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalConfessions: { type: Number, default: 0 },
  totalReactions: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isShadowbanned: { type: Boolean, default: false },
  lastKnownIp: { type: String },
  ipHistory: [{
    ip: String,
    action: { type: String, enum: ['SIGNUP', 'LOGIN'] },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Confession Schema
const confessionSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authorName: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], required: true },
  content: { type: String },
  audioUrl: { type: String },
  audioDuration: { type: Number },
  transcript: { type: String },
  poll: {
    question: String,
    options: [{ text: String, votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }]
  },
  voiceEffect: { type: String, enum: ['normal', 'whisper', 'deep', 'echo', 'robotic'], default: 'normal' },
  ambientSound: { type: String },
  categories: [{ type: String, index: true }],
  mood: { type: String },
  emotion: { type: String, enum: ['sad', 'angry', 'love', 'funny', 'anxious', 'grateful', 'neutral'] },
  reactions: {
    meToo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sendingLove: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sameLol: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    stayStrong: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    respect: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  views: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  commentCount: { type: Number, default: 0 },
  chainParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Confession', default: null },
  chainChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Confession' }],
  isPartOfSeries: { type: Boolean, default: false },
  seriesNumber: { type: Number },
  expiryDate: { type: Date, index: true },
  isExpired: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false, index: true },
  isFlagged: { type: Boolean, default: false, index: true },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  heatScore: { type: Number, default: 0, index: true },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now, index: true }
});

const Confession = mongoose.model('Confession', confessionSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  confession: { type: mongoose.Schema.Types.ObjectId, ref: 'Confession', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  reactions: {
    meToo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sendingLove: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFlagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
// Index for efficient querying of conversations
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['reaction', 'comment', 'message', 'follow', 'chain', 'streak', 'level', 'mention'], required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

// Admin Log Schema
const adminLogSchema = new mongoose.Schema({
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetConfession: { type: mongoose.Schema.Types.ObjectId, ref: 'Confession' },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});
adminLogSchema.index({ timestamp: -1 });
const AdminLog = mongoose.model('AdminLog', adminLogSchema);

// =============================================================================
// ADMIN ACTION LOGGING HELPER
// =============================================================================
async function logAdminAction(adminUserId, action, details = {}) {
  try {
    await AdminLog.create({ adminUser: adminUserId, action, targetUser: details.targetUserId, targetConfession: details.targetConfessionId, details: details.message });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.isBanned) {
      return res.status(401).json({ error: 'User not found or banned' });
    }
    
    // Attach real IP to the request object for logging purposes
    if (req.ip) {
      user.lastKnownIp = req.ip;
    }

    if (maintenanceMode && !user.isAdmin) {
      return res.status(503).json({ error: 'System is currently under maintenance' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// =============================================================================
// IDENTITY GENERATION FUNCTIONS
// =============================================================================
function generateRarity() {
  const roll = Math.random() * 10000;
  if (roll < 10) return 'MYTHIC';
  if (roll < 110) return 'LEGENDARY';
  if (roll < 410) return 'EXCLUSIVE';
  if (roll < 1410) return 'RARE';
  if (roll < 3910) return 'UNCOMMON';
  return 'COMMON';
}

function selectFromPool(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function getIdentityComponents(rarity) {
  let colour, creature, location;
  switch (rarity) {
    case 'MYTHIC':
      return {
        colour: selectFromPool(IDENTITY_POOLS.MYTHIC_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.MYTHIC_CREATURES).name,
        location: selectFromPool(IDENTITY_POOLS.MYTHIC_LOCATIONS)
      };
    case 'LEGENDARY':
      return {
        colour: selectFromPool(IDENTITY_POOLS.LEGENDARY_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.LEGENDARY_CREATURES).name,
        location: selectFromPool(IDENTITY_POOLS.LEGENDARY_LOCATIONS)
      };
    case 'EXCLUSIVE':
      return {
        colour: selectFromPool(IDENTITY_POOLS.EXCLUSIVE_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.EXCLUSIVE_CREATURES),
        location: selectFromPool(IDENTITY_POOLS.EXCLUSIVE_LOCATIONS)
      };
    case 'RARE':
      return {
        colour: selectFromPool(IDENTITY_POOLS.RARE_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.RARE_CREATURES),
        location: selectFromPool(IDENTITY_POOLS.RARE_LOCATIONS)
      };
    case 'UNCOMMON':
      return {
        colour: selectFromPool(IDENTITY_POOLS.UNCOMMON_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.UNCOMMON_CREATURES),
        location: selectFromPool(IDENTITY_POOLS.UNCOMMON_LOCATIONS)
      };
    default:
      return {
        colour: selectFromPool(IDENTITY_POOLS.COMMON_COLOURS),
        creature: selectFromPool(IDENTITY_POOLS.COMMON_CREATURES),
        location: selectFromPool(IDENTITY_POOLS.COMMON_LOCATIONS)
      };
  }
}

async function generateUniqueIdentity() {
  const MAX_ATTEMPTS = 10;
  
  // Standard Generation (Numbers 1-10)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rarity = generateRarity();
    const { colour, creature, location } = getIdentityComponents(rarity);
    const number = Math.floor(Math.random() * 10) + 1;
    
    const identity = `${colour} ${creature} of ${location} ${number}`;
    const existing = await User.findOne({ anonymousName: identity });
    if (!existing) {
      return { identity, rarity };
    }
  }
  
  // Safe Fallback Generation (Numbers 1-1000)
  for (let attempt = 0; attempt < 5; attempt++) {
    const rarity = generateRarity();
    const { colour, creature, location } = getIdentityComponents(rarity);
    const number = Math.floor(Math.random() * 1000) + 1;
    
    const identity = `${colour} ${creature} of ${location} ${number}`;
    const existing = await User.findOne({ anonymousName: identity });
    if (!existing) {
      return { identity, rarity };
    }
  }
  
  throw new Error('Failed to generate a unique identity after standard and fallback attempts');
}

// =============================================================================
// XP & LEVEL FUNCTIONS
// =============================================================================
function calculateLevel(xp) {
  if (xp >= 29900) return { level: 300, title: 'Legend' };
  if (xp >= 25000) return { level: Math.min(299, 251 + Math.floor((xp - 25000) / 100)), title: 'Phantom' };
  if (xp >= 15000) return { level: 151 + Math.floor((xp - 15000) / 100), title: 'Void Speaker' };
  if (xp >= 7500) return { level: 76 + Math.floor((xp - 7500) / 100), title: 'Confessor' };
  if (xp >= 2500) return { level: 26 + Math.floor((xp - 2500) / 100), title: 'Shadow Voice' };
  return { level: 1 + Math.floor(xp / 100), title: 'Whisperer' };
}

async function awardXP(userId, amount, reason) {
  // Use atomic increment to prevent concurrent XP loss on viral posts
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: amount } },
    { new: true }
  );
  
  if (!user) return null;
  
  // Protect against negative XP bounds from un-reacting
  if (user.xp < 0) {
    user.xp = 0;
    await User.findByIdAndUpdate(userId, { xp: 0 });
  }

  const oldLevel = user.level;
  const levelInfo = calculateLevel(user.xp);
  
  // Only write to the database again if the level actually changed
  if (user.level !== levelInfo.level || user.title !== levelInfo.title) {
    user.level = levelInfo.level;
    user.title = levelInfo.title;
    await User.findByIdAndUpdate(userId, { level: user.level, title: user.title });

    if (user.level > oldLevel) {
      const notification = new Notification({
        recipient: userId,
        type: 'level',
        message: `You reached Level ${user.level} — ${user.title} unlocked!`,
        data: { newLevel: user.level, title: user.title }
      });
      await notification.save();
      
      io.to(`user_${userId}`).emit('level_up', {
        newLevel: user.level,
        title: user.title
      });
    }
  }
  
  return user;
}

// =============================================================================
// HEAT SCORE CALCULATION
// =============================================================================
function calculateHeatScore(confession) {
  const hoursSincePost = Math.max(0, (Date.now() - confession.createdAt.getTime()) / (1000 * 60 * 60));
  
  // Weighted Engagement Score
  const reactionScore = Object.values(confession.reactions).reduce((sum, arr) => sum + arr.length, 0) * 2;
  const commentScore = (confession.commentCount || 0) * 3;
  const viewScore = (confession.views || 0) * 0.1;
  const totalEngagement = reactionScore + commentScore + viewScore;
  
  // Advanced Gravity Algorithm (Diminishing returns on virality + exponential time decay)
  const gravity = 1.8;
  const heatScore = Math.pow(totalEngagement + 1, 0.8) / Math.pow(hoursSincePost + 2, gravity);
  
  return Math.round(heatScore * 1000);
}

// =============================================================================
// CONTENT MODERATION (Basic Implementation)
// =============================================================================
const TOXIC_KEYWORDS = [
  'kill', 'die', 'death', 'murder', 'suicide', 'hurt', 'violence', 'attack',
  'abuse', 'harass', 'threat', 'danger', 'weapon', 'gun', 'knife', 'bomb'
];

function moderateContent(text) {
  const lowerText = text.toLowerCase();
  const toxicCount = TOXIC_KEYWORDS.filter(word => lowerText.includes(word)).length;
  
  if (toxicCount >= 3) return { flagged: true, hidden: true, reason: 'High toxicity detected' };
  if (toxicCount >= 1) return { flagged: true, hidden: false, reason: 'Potential toxicity' };
  
  return { flagged: false, hidden: false, reason: null };
}

function detectEmotion(text) {
  const lowerText = text.toLowerCase();
  
  const emotions = {
    sad: ['sad', 'depressed', 'lonely', 'hurt', 'crying', 'grief', 'loss', 'pain', 'broken'],
    angry: ['angry', 'furious', 'hate', 'rage', 'frustrated', 'annoyed', 'mad', 'pissed'],
    love: ['love', 'crush', 'romantic', 'kiss', 'dating', 'relationship', 'heart', 'adore'],
    funny: ['funny', 'lol', 'haha', 'laugh', 'embarrassing', 'weird', 'hilarious', 'joke'],
    anxious: ['anxious', 'worried', 'scared', 'afraid', 'stress', 'nervous', 'panic', 'fear'],
    grateful: ['thankful', 'grateful', 'blessed', 'appreciate', 'lucky', 'fortunate']
  };
  
  let maxScore = 0;
  let detectedEmotion = 'neutral';
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    const score = keywords.filter(word => lowerText.includes(word)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
    }
  }
  
  return detectedEmotion;
}

// =============================================================================
// ADVANCED AI CONTENT ANALYSIS (Machine Learning via Gemini)
// =============================================================================
async function analyzeContentAI(text) {
  if (!text || text.trim() === '') {
    return { flagged: false, hidden: false, reason: null, emotion: 'neutral' };
  }

  // Fallback to basic algorithms if API key is missing
  if (!CONFIG.GEMINI_API_KEY) {
    const mod = moderateContent(text);
    return { ...mod, emotion: detectEmotion(text) };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{
          text: `Analyze this confession. Return ONLY a valid JSON object without markdown formatting.
Format: {"flagged": boolean, "hidden": boolean, "reason": string or null, "emotion": string}
Hiding rules: True ONLY if it contains severe real-world threats or illegal acts.
Allowed emotions: 'sad', 'angry', 'love', 'funny', 'anxious', 'grateful', 'neutral'.
Confession: "${text}"`
        }] }]
      })
    });

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('AI fallback activated:', error);
    const mod = moderateContent(text);
    return { ...mod, emotion: detectEmotion(text) };
  }
}

// =============================================================================
// AUTH ROUTES
// =============================================================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    if (maintenanceMode) {
      return res.status(503).json({ error: 'Signups disabled during maintenance' });
    }

    const { username, password, gender, age, ageVerified } = req.body;
    
    if (!username || !password || !gender) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (!age || isNaN(age) || age < 18 || !ageVerified) {
      return res.status(400).json({ error: 'Must be 18+ to join' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { identity, rarity } = await generateUniqueIdentity();
    const clientIp = req.ip;
    
    const user = new User({
      username,
      password: hashedPassword,
      anonymousName: identity,
      rarity,
      gender,
      age,
      ageVerified: true,
      xp: 0,
      level: 1,
      title: 'Whisperer',
      streak: 0,
      badges: rarity === 'LEGENDARY' || rarity === 'MYTHIC' ? ['mythical'] : [],
      lastKnownIp: clientIp,
      ipHistory: [{ ip: clientIp, action: 'SIGNUP' }]
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        anonymousName: user.anonymousName,
        rarity: user.rarity,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        xp: user.xp,
        level: user.level,
        title: user.title,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Signup error details:', error);
    res.status(500).json({ error: `Server error: ${error.message || 'Database connection failed'}` });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (maintenanceMode && !user.isAdmin) {
      return res.status(503).json({ error: 'System is currently under maintenance' });
    }
    
    if (user.isBanned) {
      return res.status(403).json({ error: 'Account has been banned' });
    }
    
    const clientIp = req.ip;

    // Daily Activity & Streak Logic
    const lastActiveDate = new Date(user.lastActive || 0);
    const today = new Date();
    lastActiveDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - lastActiveDate) / (1000 * 60 * 60 * 24));
    
    let updatedStreak = user.streak;
    if (diffDays === 1) {
      updatedStreak += 1;
      await awardXP(user._id, XP_REWARDS.DAILY_ACTIVITY, 'DAILY_ACTIVITY');
      if (updatedStreak === 7) await awardXP(user._id, XP_REWARDS.STREAK_7, 'STREAK_7');
      if (updatedStreak === 30) await awardXP(user._id, XP_REWARDS.STREAK_30, 'STREAK_30');
    } else if (diffDays > 1) {
      updatedStreak = 1;
      await awardXP(user._id, XP_REWARDS.DAILY_ACTIVITY, 'DAILY_ACTIVITY');
    } else if (diffDays === 0 && !user.lastActive) {
      updatedStreak = 1;
      await awardXP(user._id, XP_REWARDS.DAILY_ACTIVITY, 'DAILY_ACTIVITY');
    }

    // Optimized: Update streak and lastActive in a single operation
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      streak: updatedStreak,
      lastActive: new Date(),
      lastKnownIp: clientIp,
      $push: { ipHistory: { $each: [{ ip: clientIp, action: 'LOGIN' }], $slice: -20 } } // Keep last 20 IPs
    }, { new: true });
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      CONFIG.JWT_SECRET,
      { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        anonymousName: user.anonymousName,
        rarity: user.rarity,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        xp: updatedUser.xp,
        level: updatedUser.level,
        title: updatedUser.title,
        streak: updatedUser.streak,
        badges: user.badges,
        isAdmin: user.isAdmin,
        totalConfessions: user.totalConfessions,
        totalReactions: user.totalReactions,
        followers: user.followers.length,
        following: user.following.length
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// =============================================================================
// FEED ROUTES
// =============================================================================

// Get Feed
app.get('/api/feed', authenticate, async (req, res) => {
  try {
    const { category, sort = 'trending', search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    
    let query = { 
      isHidden: false, 
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };
    
    if (category && category !== 'all') {
      query.categories = category;
    }

    if (search && search.trim() !== '') {
      // Escape regex operators to prevent ReDoS attacks and server crashes
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$and = [
        {
          $or: [
            { content: searchRegex },
            { authorName: searchRegex }
          ]
        }
      ];
    }
    
    let sortOption = {};
    if (sort === 'trending') {
      sortOption = { isPinned: -1, heatScore: -1, createdAt: -1 };
    } else if (sort === 'new') {
      sortOption = { isPinned: -1, createdAt: -1 };
    } else if (sort === 'following') {
      query.author = { $in: req.user.following };
      sortOption = { isPinned: -1, createdAt: -1 };
    }
    
    let confessions = await Confession.find(query)
      .populate('author', 'anonymousName rarity level title avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();
      
    // Prevent crashing the feed if a user account was deleted
    confessions = confessions.filter(c => c.author != null);
    
    // Optimized: Update heat scores in bulk to prevent N+1 query issue
    const bulkOps = [];
    for (const confession of confessions) {
      const newHeatScore = calculateHeatScore(confession);
      if (Math.abs(newHeatScore - (confession.heatScore || 0)) > 5) {
        bulkOps.push({
          updateOne: { filter: { _id: confession._id }, update: { $set: { heatScore: newHeatScore } } }
        });
        confession.heatScore = newHeatScore;
      }
    }
    if (bulkOps.length > 0) {
      await Confession.bulkWrite(bulkOps);
    }
    
    const total = await Confession.countDocuments(query);
    
    res.json({
      confessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// =============================================================================
// CONFESSION ROUTES
// =============================================================================

// Create Confession
app.post('/api/confessions', authenticate, async (req, res) => {
  try {
    if (req.user.isMuted) {
      return res.status(403).json({ error: 'Your account is currently muted.' });
    }

    const { type, content, audioUrl, audioDuration, voiceEffect, ambientSound, categories, mood, expiry, poll, chainParent } = req.body;
    
    if (!type || !categories || categories.length === 0) {
      return res.status(400).json({ error: 'Type and at least one category required' });
    }
    
    if (type === 'text' && (!content || content.trim().length === 0)) {
      return res.status(400).json({ error: 'Content required for text confession' });
    }

    if (type === 'text' && content && content.trim().split(/\s+/).length > 250) {
      return res.status(400).json({ error: 'Confession exceeds 250 words limit' });
    }
    
    if (type === 'voice' && !audioUrl) {
      return res.status(400).json({ error: 'Audio URL required for voice confession' });
    }
    
    // Advanced AI Content Analysis & Moderation
    const textToModerate = type === 'text' ? content : '';
    const aiAnalysis = await analyzeContentAI(textToModerate);
    const moderation = { flagged: aiAnalysis.flagged, hidden: aiAnalysis.hidden };
    const emotion = aiAnalysis.emotion;
    
    // Calculate expiry
    let expiryDate = null;
    if (expiry === '24h') {
      expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (expiry === '7d') {
      expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Verify chainParent if provided (Thread creation)
    if (chainParent) {
      const parentExists = await Confession.findById(chainParent);
      if (!parentExists || parentExists.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Invalid parent whisper' });
      }
    }

    const confession = new Confession({
      author: req.user._id,
      authorName: req.user.anonymousName,
      type,
      content: content || null,
      audioUrl: audioUrl || null,
      audioDuration: audioDuration || null,
      transcript: type === 'voice' ? '[Echo AI Auto-Transcript] "This is an automatically generated text from the uploaded audio whisper..."' : null,
      poll: poll && poll.options && poll.options.length >= 2 ? poll : undefined,
      chainParent: chainParent || null,
      voiceEffect: voiceEffect || 'normal',
      ambientSound: ambientSound || null,
      categories,
      mood: mood || null,
      emotion,
      isFlagged: moderation.flagged,
      isHidden: moderation.hidden || req.user.isShadowbanned,
      expiryDate,
      heatScore: 0
    });
    
    await confession.save();
    
    // Real-time: Notify clients of a new whisper
    io.emit('new_whisper_in_feed', { category: confession.categories[0] });
    if (moderation.flagged) {
      io.to('admin_room').emit('admin_new_flagged_content', { _id: confession._id, content: content || '[Voice Whisper]', authorName: req.user.anonymousName });
    }

    // Link the child to the parent's record
    if (chainParent) {
      await Confession.findByIdAndUpdate(chainParent, { $push: { chainChildren: confession._id } });
    }

    // Award XP
    await awardXP(req.user._id, XP_REWARDS.POST_CONFESSION, 'POST_CONFESSION');
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalConfessions: 1 } });

    // Real-time: Notify admins of new user signup
    if (user.totalConfessions === 0) { // First post
      io.to('admin_room').emit('admin_new_user', { _id: user._id, username: user.username, anonymousName: user.anonymousName });
    }
    
    // Notify followers asynchronously to prevent blocking the API response
    setImmediate(async () => {
      try {
        const notifications = req.user.followers.map(followerId => ({
          recipient: followerId,
          type: 'follow',
          message: `${req.user.anonymousName} shared a new whisper`,
          data: { confessionId: confession._id }
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          req.user.followers.forEach(followerId => {
            io.to(`user_${followerId}`).emit('notification', { type: 'follow', message: `${req.user.anonymousName} shared a new whisper` });
          });
        }
      } catch (err) {
        console.error('Background notification error:', err);
      }
    });
    
    res.status(201).json({
      message: moderation.flagged ? 'Confession submitted for review' : 'Confession created successfully',
      confession: {
        id: confession._id,
        type: confession.type,
        content: confession.content,
        categories: confession.categories,
        emotion: confession.emotion,
        isFlagged: confession.isFlagged,
        createdAt: confession.createdAt
      }
    });
  } catch (error) {
    console.error('Create confession error:', error);
    res.status(500).json({ error: 'Failed to create confession' });
  }
});

// Get Single Confession
app.get('/api/confessions/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }

    const confession = await Confession.findById(req.params.id)
      .populate('author', 'anonymousName rarity level title avatarUrl')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'anonymousName rarity level avatarUrl' }
      });
    
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }
    
    // Increment views
    await Confession.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    confession.views += 1;
    
    res.json(confession);
  } catch (error) {
    console.error('Get confession error:', error);
    res.status(500).json({ error: 'Failed to load confession' });
  }
});

// Delete Confession
app.delete('/api/confessions/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }

    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }

    if (confession.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this confession' });
    }

    // Cleanup orphaned parent references to prevent dead links in threads
    if (confession.chainParent) {
      await Confession.findByIdAndUpdate(confession.chainParent, {
        $pull: { chainChildren: confession._id }
      });
    }

    // Cleanup Cloudinary storage to prevent storage leaks
    if (confession.type === 'voice' && confession.audioUrl) {
      try {
        const urlParts = confession.audioUrl.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = `morpheus_echo/audio/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (err) {
        console.error('Cloudinary cleanup error:', err);
      }
    }

    await Confession.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalConfessions: -1 } });
    await Comment.deleteMany({ confession: req.params.id });

    res.json({ message: 'Confession deleted successfully' });
  } catch (error) {
    console.error('Delete confession error:', error);
    res.status(500).json({ error: 'Failed to delete confession' });
  }
});

// React to Confession
app.post('/api/confessions/:id/react', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }

    const { reactionType } = req.body;
    
    if (!REACTIONS[reactionType]) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }
    
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }
    
    const isSelfReaction = confession.author.toString() === req.user._id.toString();
    const hasReacted = confession.reactions[reactionType] && confession.reactions[reactionType].includes(req.user._id);
    
    let action;
    if (hasReacted) {
      await Confession.findByIdAndUpdate(req.params.id, { $pull: { [`reactions.${reactionType}`]: req.user._id } });
      action = 'removed';
      
      if (!isSelfReaction) {
        await awardXP(confession.author, -XP_REWARDS.RECEIVE_REACTION, 'REMOVE_REACTION');
        await User.findByIdAndUpdate(confession.author, { $inc: { totalReactions: -1 } });
      }
    } else {
      await Confession.findByIdAndUpdate(req.params.id, { $addToSet: { [`reactions.${reactionType}`]: req.user._id } });
      action = 'added';
      
      if (!isSelfReaction) {
        await awardXP(confession.author, XP_REWARDS.RECEIVE_REACTION, 'RECEIVE_REACTION');
        await User.findByIdAndUpdate(confession.author, { $inc: { totalReactions: 1 } });
        
        const notification = new Notification({
          recipient: confession.author,
          type: 'reaction',
          message: `${req.user.anonymousName} sent you ${REACTIONS[reactionType].label}`,
          data: { confessionId: confession._id, reactionType, from: req.user._id }
        });
        await notification.save();
        io.to(`user_${confession.author}`).emit('reaction_notification', { confessionId: confession._id, type: reactionType, from: req.user.anonymousName });
      }
    }
    
    const updatedConfession = await Confession.findById(req.params.id);
    
    // Real-time: Broadcast reaction updates to clients viewing this confession
    io.to(`confession_${req.params.id}`).emit('reaction_update', { confessionId: req.params.id, reactions: updatedConfession.reactions });

    res.json({
      message: `Reaction ${action}`,
      action,
      reactionType,
      count: updatedConfession.reactions[reactionType].length
    });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
});

// Vote on Anonymous Poll
app.post('/api/confessions/:id/vote', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }
    const { optionIndex } = req.body;
    const confession = await Confession.findById(req.params.id);
    if (!confession || !confession.poll || !confession.poll.options) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Remove existing vote by this user across all options to prevent double-voting
    confession.poll.options.forEach(opt => {
      opt.votes.pull(req.user._id);
    });
    
    // Add new vote to selected option
    if (confession.poll.options[optionIndex]) {
      confession.poll.options[optionIndex].votes.push(req.user._id);
    }
    
    await confession.save();
    res.json({ message: 'Vote recorded', poll: confession.poll });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

// Get Comments
app.get('/api/confessions/:id/comments', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }

    const comments = await Comment.find({ confession: req.params.id, parentComment: null })
      .populate('author', 'anonymousName rarity level avatarUrl')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'anonymousName rarity level avatarUrl' }
      })
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Add Comment
app.post('/api/confessions/:id/comments', authenticate, async (req, res) => {
  try {
    if (req.user.isMuted) {
      return res.status(403).json({ error: 'Your account is currently muted.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid confession ID' });
    }

    const { content, parentComment } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content required' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
    }
    
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }
    
    if (confession.isLocked) {
      return res.status(403).json({ error: 'Comments are locked for this whisper' });
    }
    
    const comment = new Comment({
      confession: req.params.id,
      author: req.user._id,
      authorName: req.user.anonymousName,
      content,
      parentComment: parentComment || null
    });
    
    await comment.save();
    
    // Real-time: Populate author details for the socket payload
    const populatedComment = await Comment.findById(comment._id).populate('author', 'anonymousName rarity avatarUrl');

    // Real-time: Broadcast the new comment to clients viewing this confession
    io.to(`confession_${req.params.id}`).emit('new_comment', populatedComment);

    // Update confession comment count
    confession.comments.push(comment._id);
    confession.commentCount += 1;
    await confession.save();
    
    // If this is a reply, update the parent comment's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, { $push: { replies: comment._id } });
    }

    // Only award XP and notify if they aren't commenting on their own post
    if (confession.author.toString() !== req.user._id.toString()) {
      await awardXP(confession.author, XP_REWARDS.RECEIVE_COMMENT, 'RECEIVE_COMMENT');
      
      const notification = new Notification({
        recipient: confession.author,
        type: 'comment',
        message: `${req.user.anonymousName} commented on your whisper`,
        data: { confessionId: confession._id, commentId: comment._id, from: req.user._id }
      });
      await notification.save();
      
      io.to(`user_${confession.author}`).emit('comment_notification', {
        confessionId: confession._id,
        commenterName: req.user.anonymousName
      });
    }
    
    res.status(201).json({
      message: 'Comment added',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// =============================================================================
// REPORT ROUTES
// =============================================================================

// Report Confession
app.post('/api/confessions/:id/report', authenticate, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    if (!confession) return res.status(404).json({ error: 'Confession not found' });
    
    if (confession.reportedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ error: 'You have already reported this whisper' });
    }
    
    confession.reportedBy.push(req.user._id);
    // Auto-flag if reported by 3 different users
    if (confession.reportedBy.length >= 3) {
      confession.isFlagged = true;
      io.to('admin_room').emit('admin_new_flagged_content', { _id: confession._id, content: confession.content || '[Voice Whisper]', authorName: confession.authorName });
    }
    
    await confession.save();
    res.json({ success: true, message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process report' });
  }
});

// Report Comment
app.post('/api/comments/:id/report', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    if (comment.reportedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }
    
    comment.reportedBy.push(req.user._id);
    if (comment.reportedBy.length >= 3) {
      comment.isFlagged = true;
    }
    
    await comment.save();
    res.json({ success: true, message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process report' });
  }
});

// =============================================================================
// USER ROUTES
// =============================================================================

// Upload Avatar
app.post('/api/users/avatar', authenticate, async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: 'No image data provided' });

    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'morpheus_echo/avatars',
      public_id: `avatar_${req.user._id}`,
      overwrite: true,
      transformation: [{ width: 200, height: 200, crop: 'fill' }]
    });

    await User.findByIdAndUpdate(req.user._id, { avatarUrl: result.secure_url });

    res.json({ avatarUrl: result.secure_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Change Password
app.post('/api/users/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get User Profile
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id)
      .select('-password -username');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = req.user.following.some(id => id.toString() === user._id.toString());
    
    res.json({
      user: {
        id: user._id,
        anonymousName: user.anonymousName,
        rarity: user.rarity,
        avatarUrl: user.avatarUrl,
        level: user.level,
        title: user.title,
        xp: user.xp,
        badges: user.badges,
        totalConfessions: user.totalConfessions,
        totalReactions: user.totalReactions,
        streak: user.streak,
        followers: user.followers.length,
        following: user.following.length,
        joinedAt: user.createdAt,
        isAdmin: user.isAdmin,
        isFollowing,
        isBanned: user.isBanned,
        isMuted: user.isMuted,
        isShadowbanned: user.isShadowbanned,
        lastKnownIp: req.user.isAdmin ? user.lastKnownIp : undefined,
        ipHistory: req.user.isAdmin ? user.ipHistory : undefined
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Get User Confessions
app.get('/api/users/:id/confessions', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    
    const confessions = await Confession.find({ 
      author: req.params.id, 
      isHidden: false 
    })
      .populate('author', 'anonymousName rarity level title avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Confession.countDocuments({ 
      author: req.params.id, 
      isHidden: false 
    });
    
    res.json({
      confessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user confessions error:', error);
    res.status(500).json({ error: 'Failed to load confessions' });
  }
});

// Follow/Unfollow User
app.post('/api/users/:id/follow', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = req.user.following.some(id => id.toString() === req.params.id);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id }
      });
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id }
      });
      
      res.json({ message: 'Unfollowed', following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: req.params.id }
      });
      await User.findByIdAndUpdate(req.params.id, {
        $addToSet: { followers: req.user._id }
      });
      
      // Send notification
      const notification = new Notification({
        recipient: req.params.id,
        type: 'follow',
        message: `${req.user.anonymousName} is now following you`,
        data: { followerId: req.user._id }
      });
      await notification.save();
      
      io.to(`user_${req.params.id}`).emit('follow_notification', {
        followerName: req.user.anonymousName
      });
      
      res.json({ message: 'Following', following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to process follow' });
  }
});

// =============================================================================
// MESSAGE ROUTES
// =============================================================================

// Get Conversations
app.get('/api/messages', authenticate, async (req, res) => {
  try {    // Optimized: Aggregation pipeline with $lookup is more efficient than a separate populate call
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: { $cond: [{ $eq: ["$sender", req.user._id] }, "$recipient", "$sender"] },
          lastMessage: { $first: "$$ROOT" },
          unread: { $sum: { $cond: [{ $and: [{ $eq: ["$recipient", req.user._id] }, { $eq: ["$read", false] }] }, 1, 0] } }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      { $unwind: '$partner' },
      {
        $project: {
          _id: 0,
          lastMessage: 1,
          unread: 1,
          partner: {
            _id: '$partner._id',
            anonymousName: '$partner.anonymousName',
            rarity: '$partner.rarity',
            avatarUrl: '$partner.avatarUrl'
          }
        }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Get Conversation Messages
app.get('/api/messages/:userId', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    })
      .populate('sender', 'anonymousName rarity avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100); // Prevent crashing on huge chat histories
      
    messages.reverse(); // Flip back to chronological order for the UI
    
    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, read: false },
      { read: true }
    );
    
    // Clear global notifications for these specific read messages
    await Notification.updateMany(
      { recipient: req.user._id, type: 'message', 'data.from': req.params.userId, read: false },
      { read: true }
    );
    
    // Notify sender that their messages were read
    io.to(`user_${req.params.userId}`).emit('messages_read', { readBy: req.user._id });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// Send Message
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { to, content } = req.body;
    
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content required' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }
    
    if (to === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot send messages to yourself' });
    }
    
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    const message = new Message({
      sender: req.user._id,
      recipient: to,
      content,
      read: false
    });
    
    await message.save();
    
    // Send notification
    const notification = new Notification({
      recipient: to,
      type: 'message',
      message: `New whisper from ${req.user.anonymousName}`,
      data: { from: req.user._id, messageId: message._id }
    });
    await notification.save();
    
    // Emit via socket
    io.to(`user_${to}`).emit('new_message', {
      from: req.user.anonymousName,
      fromId: req.user._id,
      rarity: req.user.rarity,
      avatarUrl: req.user.avatarUrl,
      content,
      timestamp: message.createdAt,
      messageId: message._id
    });
    
    res.status(201).json({
      message: 'Message sent',
      data: {
        id: message._id,
        content: message.content,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// =============================================================================
// NOTIFICATION ROUTES
// =============================================================================

// Get Notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Mark All as Read
app.patch('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark Single Notification as Read
app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// =============================================================================
// RADIO MODE ROUTES
// =============================================================================

// Get Radio Queue
app.get('/api/radio', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = { 
      type: 'voice', 
      isHidden: false, 
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };
    
    if (category && category !== 'all') {
      query.categories = category;
    }
    
    const confessions = await Confession.find(query)
      .populate('author', 'anonymousName rarity level title avatarUrl')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const validConfessions = confessions.filter(c => c.author != null);

    // Shuffle
    const shuffled = validConfessions.sort(() => Math.random() - 0.5);
    
    res.json({
      queue: shuffled,
      queueLength: shuffled.length
    });
  } catch (error) {
    console.error('Radio error:', error);
    res.status(500).json({ error: 'Failed to load radio queue' });
  }
});

// Get Random Confession for Radio
app.get('/api/confessions/random', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = { 
      type: 'voice', 
      isHidden: false, 
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };
    
    if (category && category !== 'all') {
      query.categories = category;
    }
    
    const count = await Confession.countDocuments(query);
    const random = Math.floor(Math.random() * count);
    
    const confession = await Confession.findOne(query)
      .populate('author', 'anonymousName rarity level title avatarUrl')
      .skip(random);
    
    if (confession) {
      confession.views += 1;
      await confession.save();
    }
    
    res.json(confession);
  } catch (error) {
    console.error('Random confession error:', error);
    res.status(500).json({ error: 'Failed to load confession' });
  }
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Simple in-memory rate limiter for admin passcode attempts
const adminLoginAttempts = new Map();
// Cleanup old entries every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, attempts] of adminLoginAttempts.entries()) {
    if (now - attempts.firstAttempt > 900000) { // 15 mins
      adminLoginAttempts.delete(userId);
    }
  }
}, 60 * 60 * 1000);

// Verify Admin Password & Promote User
app.post('/api/admin/promote', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const now = Date.now();
    const attempts = adminLoginAttempts.get(userId) || { count: 0, firstAttempt: now };

    // Reset attempts after 15 minutes (900000 ms)
    if (now - attempts.firstAttempt > 900000) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    if (attempts.count >= 5) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }

    // Read from header for better security
    const password = req.headers['x-admin-passcode'];
    if (password === CONFIG.ADMIN_PASSWORD) {
      adminLoginAttempts.delete(userId); // Clear attempts on success
      const updatedUser = await User.findByIdAndUpdate(req.user._id, { isAdmin: true }, { new: true });

      const token = jwt.sign(
        { userId: updatedUser._id, username: updatedUser.username, isAdmin: true },
        CONFIG.JWT_SECRET,
        { expiresIn: CONFIG.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Promoted to Admin. Reloading to apply changes...',
        token,
        user: {
          id: updatedUser._id,
          anonymousName: updatedUser.anonymousName,
          rarity: updatedUser.rarity,
          avatarUrl: updatedUser.avatarUrl,
          gender: updatedUser.gender,
          xp: updatedUser.xp,
          level: updatedUser.level,
          title: updatedUser.title,
          streak: updatedUser.streak,
          badges: updatedUser.badges,
          isAdmin: updatedUser.isAdmin,
          totalConfessions: updatedUser.totalConfessions,
          totalReactions: updatedUser.totalReactions,
          followers: updatedUser.followers.length,
          following: updatedUser.following.length
        }
      });
    } else {
      attempts.count += 1;
      adminLoginAttempts.set(userId, attempts);
      res.status(403).json({ error: 'Invalid admin password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Admin promotion failed' });
  }
});

// Get All Users (Admin Only)
app.get('/api/admin/users', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const users = await User.find().select('username anonymousName level isBanned isMuted isShadowbanned createdAt').sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle Ban Status
app.patch('/api/admin/users/:id/ban', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findById(req.params.id);
    user.isBanned = !user.isBanned;
    await user.save();
    await logAdminAction(req.user._id, user.isBanned ? 'BAN_USER' : 'UNBAN_USER', { targetUserId: user._id, message: `User: ${user.username}` });
    res.json({ success: true, isBanned: user.isBanned });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// =============================================================================
// 10 NEW ADMIN FEATURES ENDPOINTS
// =============================================================================

// 1. Global Broadcast
app.post('/api/admin/broadcast', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    io.emit('notification', { type: 'message', message: `📢 SYSTEM: ${req.body.message}` });
    await logAdminAction(req.user._id, 'GLOBAL_BROADCAST', { message: req.body.message });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Broadcast failed' }); }
});

// 2. Maintenance Mode Toggle
app.post('/api/admin/maintenance', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    maintenanceMode = !maintenanceMode;
    if (maintenanceMode) io.emit('notification', { type: 'level', message: '⚠️ SYSTEM ENTERING MAINTENANCE MODE' });
    await logAdminAction(req.user._id, maintenanceMode ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF');
    res.json({ success: true, maintenanceMode });
  } catch (error) { res.status(500).json({ error: 'Failed to toggle maintenance' }); }
});

// 3. Advanced System Diagnostics
app.get('/api/admin/system', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const mem = process.memoryUsage();
    res.json({
      maintenanceMode,
      activeSockets: io.engine.clientsCount,
      uptime: Math.round(process.uptime() / 60) + ' mins',
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB'
        },
        envStatus: {
          MONGODB_URI: !!process.env.MONGODB_URI,
          JWT_SECRET: !!process.env.JWT_SECRET,
          CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
          REDIS_URL: !!process.env.REDIS_URL,
          UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
          ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD
        }
    });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch system stats' }); }
});

// 4. View Flagged Whispers
app.get('/api/admin/whispers/flagged', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = { isFlagged: true };
    const flagged = await Confession.find(query).select('content authorName createdAt type').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Confession.countDocuments(query);

    res.json({
      data: flagged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch flagged whispers' }); }
});

// 5. Mass Purge Flagged Whispers
app.delete('/api/admin/whispers/flagged', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const result = await Confession.deleteMany({ isFlagged: true });
    await logAdminAction(req.user._id, 'PURGE_FLAGGED', { message: `Deleted ${result.deletedCount} whispers.` });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) { res.status(500).json({ error: 'Failed to purge flagged whispers' }); }
});

// 6. Hard Delete User
app.delete('/api/admin/users/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Confession.deleteMany({ author: req.params.id });
    await Comment.deleteMany({ author: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user._id, 'HARD_DELETE_USER', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to hard delete user' }); }
});

// 7. Wipe User History
app.delete('/api/admin/users/:id/whispers', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Confession.deleteMany({ author: req.params.id });
    await User.findByIdAndUpdate(req.params.id, { totalConfessions: 0 });
    await logAdminAction(req.user._id, 'WIPE_USER_HISTORY', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to wipe history' }); }
});

// 8. Grant 1000 XP
app.post('/api/admin/users/:id/xp', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await awardXP(req.params.id, 1000, 'ADMIN_BOOST');
    await logAdminAction(req.user._id, 'GIVE_XP_1000', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to grant XP' }); }
});

// 9. Grant VIP Badge
app.post('/api/admin/users/:id/badge', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await User.findByIdAndUpdate(req.params.id, { $addToSet: { badges: 'Admin VIP' } });
    await logAdminAction(req.user._id, 'GIVE_VIP_BADGE', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to assign badge' }); }
});

// 10. Force Identity Reroll
app.post('/api/admin/users/:id/reroll', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const { identity, rarity } = await generateUniqueIdentity();
    await User.findByIdAndUpdate(req.params.id, { anonymousName: identity, rarity });
    await logAdminAction(req.user._id, 'REROLL_IDENTITY', { targetUserId: req.params.id, message: `New ID: ${identity}` });
    res.json({ success: true, newIdentity: identity });
  } catch (error) { res.status(500).json({ error: 'Failed to reroll identity' }); }
});

// 11. Shadowban User
app.patch('/api/admin/users/:id/shadowban', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findById(req.params.id);
    user.isShadowbanned = !user.isShadowbanned;
    await user.save();
    await logAdminAction(req.user._id, user.isShadowbanned ? 'SHADOWBAN_USER' : 'UNSHADOWBAN_USER', { targetUserId: req.params.id });
    res.json({ success: true, isShadowbanned: user.isShadowbanned });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 12. Mute User
app.patch('/api/admin/users/:id/mute', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const user = await User.findById(req.params.id);
    user.isMuted = !user.isMuted;
    await user.save();
    await logAdminAction(req.user._id, user.isMuted ? 'MUTE_USER' : 'UNMUTE_USER', { targetUserId: req.params.id });
    res.json({ success: true, isMuted: user.isMuted });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 13. Clear Avatar
app.patch('/api/admin/users/:id/avatar', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await User.findByIdAndUpdate(req.params.id, { avatarUrl: null });
    await logAdminAction(req.user._id, 'CLEAR_AVATAR', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 14. Set Rarity
app.patch('/api/admin/users/:id/rarity', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const { rarity } = req.body;
    await User.findByIdAndUpdate(req.params.id, { rarity });
    await logAdminAction(req.user._id, 'SET_RARITY', { targetUserId: req.params.id, message: `Rarity: ${rarity}` });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 15. Reset XP
app.patch('/api/admin/users/:id/reset-xp', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await User.findByIdAndUpdate(req.params.id, { xp: 0, level: 1, title: 'Whisperer' });
    await logAdminAction(req.user._id, 'RESET_XP', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 16. Approve Flagged Whisper
app.patch('/api/admin/whispers/:id/approve', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Confession.findByIdAndUpdate(req.params.id, { isFlagged: false, isHidden: false });
    await logAdminAction(req.user._id, 'APPROVE_WHISPER', { targetConfessionId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 17. Boost Whisper
app.patch('/api/admin/whispers/:id/boost', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Confession.findByIdAndUpdate(req.params.id, { $inc: { heatScore: 5000 } });
    await logAdminAction(req.user._id, 'BOOST_WHISPER', { targetConfessionId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 18. Purge Old Whispers (older than 30 days)
app.delete('/api/admin/whispers/old', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await Confession.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    await logAdminAction(req.user._id, 'PURGE_OLD_WHISPERS', { message: `Deleted ${result.deletedCount} whispers.` });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 19. Send System DM
app.post('/api/admin/users/:id/dm', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const msg = new Message({ sender: req.user._id, recipient: req.params.id, content: `[SYSTEM ALERT] ${req.body.message}` });
    await msg.save();
    await logAdminAction(req.user._id, 'SEND_SYSTEM_DM', { targetUserId: req.params.id, message: req.body.message });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 20. Clear User Badges
app.patch('/api/admin/users/:id/clear-badges', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await User.findByIdAndUpdate(req.params.id, { badges: [] });
    await logAdminAction(req.user._id, 'CLEAR_BADGES', { targetUserId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// 21. Edit Whisper Content
app.patch('/api/admin/whispers/:id/content', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const { content } = req.body;
    await Confession.findByIdAndUpdate(req.params.id, { content });
    await logAdminAction(req.user._id, 'EDIT_WHISPER_CONTENT', { targetConfessionId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to edit content' }); }
});

// 22. Pin/Unpin Whisper
app.patch('/api/admin/whispers/:id/pin', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const confession = await Confession.findById(req.params.id);
    confession.isPinned = !confession.isPinned;
    await confession.save();
    await logAdminAction(req.user._id, confession.isPinned ? 'PIN_WHISPER' : 'UNPIN_WHISPER', { targetConfessionId: req.params.id });
    res.json({ success: true, isPinned: confession.isPinned });
  } catch (err) { res.status(500).json({ error: 'Failed to toggle pin' }); }
});

// 23. Lock/Unlock Comments
app.patch('/api/admin/whispers/:id/lock', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const confession = await Confession.findById(req.params.id);
    confession.isLocked = !confession.isLocked;
    await confession.save();
    await logAdminAction(req.user._id, confession.isLocked ? 'LOCK_COMMENTS' : 'UNLOCK_COMMENTS', { targetConfessionId: req.params.id });
    res.json({ success: true, isLocked: confession.isLocked });
  } catch (err) { res.status(500).json({ error: 'Failed to toggle lock' }); }
});

// 24. Manual Flag Whisper
app.patch('/api/admin/whispers/:id/manual-flag', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Confession.findByIdAndUpdate(req.params.id, { isFlagged: true });
    await logAdminAction(req.user._id, 'MANUAL_FLAG_WHISPER', { targetConfessionId: req.params.id });
    res.json({ success: true, message: 'Whisper has been manually flagged for review.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to flag whisper' });
  }
});

// =============================================================================
// ADMIN CONTENT MODERATION
// =============================================================================

// Get Reported Comments
app.get('/api/admin/comments/reported', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { isFlagged: true },
        { 'reportedBy.0': { $exists: true } }
      ]
    };

    const reportedComments = await Comment.find(query)
    .populate('author', 'anonymousName rarity')
    .populate({
      path: 'confession',
      select: 'content authorName'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Comment.countDocuments(query);

    res.json({
      data: reportedComments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reported comments' });
  }
});

// Admin: Delete Comment
app.delete('/api/admin/comments/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (comment) {
      await Confession.findByIdAndUpdate(comment.confession, { $pull: { comments: comment._id }, $inc: { commentCount: -1 } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Get Admin Action Logs
app.get('/api/admin/logs', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const logs = await AdminLog.find().populate('adminUser', 'username anonymousName').populate('targetUser', 'username anonymousName').sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Admin: Dismiss Comment Report
app.patch('/api/admin/comments/:id/dismiss', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await Comment.findByIdAndUpdate(req.params.id, { reportedBy: [], isFlagged: false });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to dismiss report' }); }
});

// =============================================================================
// ADMIN USER MANAGEMENT
// =============================================================================

// Get Users (with search and pagination)
app.get('/api/admin/users-list', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let query = {};
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      query = { $or: [{ username: searchRegex }, { anonymousName: searchRegex }] };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Bulk User Actions
app.post('/api/admin/users/bulk-action', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const { action, userIds } = req.body;

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    let update = {};
    let logAction = '';

    switch (action) {
      case 'ban':
        update = { isBanned: true };
        logAction = 'BULK_BAN';
        break;
      case 'unban':
        update = { isBanned: false };
        logAction = 'BULK_UNBAN';
        break;
      case 'mute':
        update = { isMuted: true };
        logAction = 'BULK_MUTE';
        break;
      case 'unmute':
        update = { isMuted: false };
        logAction = 'BULK_UNMUTE';
        break;
      case 'delete':
        await Confession.deleteMany({ author: { $in: userIds } });
        await Comment.deleteMany({ author: { $in: userIds } });
        const deleteResult = await User.deleteMany({ _id: { $in: userIds } });
        await logAdminAction(req.user._id, 'BULK_DELETE_USERS', { message: `Deleted ${deleteResult.deletedCount} users.` });
        return res.json({ success: true, message: `Deleted ${deleteResult.deletedCount} users.` });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await User.updateMany({ _id: { $in: userIds } }, { $set: update });
    await logAdminAction(req.user._id, logAction, { message: `Affected ${result.nModified || result.modifiedCount} users.` });

    res.json({ success: true, message: `Updated ${result.nModified || result.modifiedCount} users.` });
  } catch (err) {
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

// Update User Details
app.patch('/api/admin/users/:id/details', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const { username, anonymousName } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { username, anonymousName } },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user details' });
  }
});

// =============================================================================
// EXPORT DATA ROUTES
// =============================================================================

app.get('/api/admin/export/users', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const users = await User.find().select('username anonymousName rarity level xp streak totalConfessions isBanned createdAt').lean();
    const headers = ['ID,Username,Anonymous Name,Rarity,Level,XP,Streak,Total Confessions,Banned,Joined'];
    const rows = users.map(u => `"${u._id}","${u.username}","${u.anonymousName}","${u.rarity}",${u.level},${u.xp},${u.streak},${u.totalConfessions},${u.isBanned},"${new Date(u.createdAt).toISOString()}"`);
    const csv = headers.concat(rows).join('\n');
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: 'Failed to export users' }); }
});

app.get('/api/admin/export/logs', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const logs = await AdminLog.find().populate('adminUser', 'anonymousName').populate('targetUser', 'anonymousName').sort({ timestamp: -1 }).lean();
    const headers = ['ID,Admin,Action,Target,Details,Timestamp'];
    const rows = logs.map(l => {
      const target = l.targetUser?.anonymousName || (l.targetConfession ? l.targetConfession.toString() : 'N/A');
      const details = (l.details || '').replace(/"/g, '""');
      return `"${l._id}","${l.adminUser?.anonymousName || 'System'}","${l.action}","${target}","${details}","${new Date(l.timestamp).toISOString()}"`;
    });
    const csv = headers.concat(rows).join('\n');
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="logs_export.csv"');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: 'Failed to export logs' }); }
});

// =============================================================================
// NEW DEDICATED ADMIN PANEL ENDPOINTS
// =============================================================================

// Dashboard Stats
app.get('/api/admin/dashboard-stats', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Unauthorized' });

    const now = new Date();
    const d24h = new Date(now - 24 * 60 * 60 * 1000);
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      coreStats,
      newUsers24h, newUsers7d, newUsers30d,
      newWhispers24h, newWhispers7d, newWhispers30d,
      categoryDistribution,
      userGrowth,
      whisperGrowth,
      recentFlagged
    ] = await Promise.all([
      // Core Stats
      (async () => {
        const [totalUsers, totalConfessions, activeToday, totalComments] = await Promise.all([
          User.countDocuments(),
          Confession.countDocuments(),
          User.countDocuments({ lastActive: { $gte: d24h } }),
          Comment.countDocuments()
        ]);
        return { totalUsers, totalConfessions, activeToday, totalComments };
      })(),
      // New Users
      User.countDocuments({ createdAt: { $gte: d24h } }),
      User.countDocuments({ createdAt: { $gte: d7 } }),
      User.countDocuments({ createdAt: { $gte: d30 } }),
      // New Whispers
      Confession.countDocuments({ createdAt: { $gte: d24h } }),
      Confession.countDocuments({ createdAt: { $gte: d7 } }),
      Confession.countDocuments({ createdAt: { $gte: d30 } }),
      // Category Distribution
      Confession.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // User Growth (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: d30 } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Whisper Growth (last 30 days)
      Confession.aggregate([
        { $match: { createdAt: { $gte: d30 } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Recently Flagged
      Confession.find({ isFlagged: true }).sort({ createdAt: -1 }).limit(5).select('content authorName')
    ]);

    // Mock Financials
    const financials = {
      projectedRevenue: coreStats.totalUsers * 1.25, // Mock calculation
      serverCosts: 150.75, // Mock static cost
      net: (coreStats.totalUsers * 1.25) - 150.75
    };

    res.json({
      coreStats,
      growth: { users: { d24h: newUsers24h, d7: newUsers7d, d30: newUsers30d }, whispers: { d24h: newWhispers24h, d7: newWhispers7d, d30: newWhispers30d } },
      content: { categoryDistribution, recentFlagged },
      charts: { userGrowth, whisperGrowth },
      financials
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// =============================================================================
// CLOUDINARY UPLOAD ROUTE
// =============================================================================
app.post('/api/upload/audio', authenticate, async (req, res) => {
  try {
    const { audioData } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    
    const result = await cloudinary.uploader.upload(audioData, {
      resource_type: 'video',
      folder: 'morpheus_echo/audio',
      public_id: `confession_${Date.now()}_${req.user._id}`
    });
    
    res.json({
      url: result.secure_url,
      duration: result.duration,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// =============================================================================
// CATEGORY ROUTES
// =============================================================================
app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

// =============================================================================
// STATS ROUTE
// =============================================================================
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConfessions = await Confession.countDocuments();
    const totalVoiceConfessions = await Confession.countDocuments({ type: 'voice' });
    const activeToday = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalUsers,
      totalConfessions,
      totalVoiceConfessions,
      activeToday
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// =============================================================================
// ROOT ROUTE
// =============================================================================
app.get('/', (req, res) => {
  res.json({
    name: 'Morpheus Echo API',
    version: '1.0.0',
    description: 'Anonymous confession platform backend',
    endpoints: {
      auth: ['/api/auth/signup', '/api/auth/login'],
      feed: ['/api/feed'],
      confessions: ['/api/confessions', '/api/confessions/:id', '/api/confessions/:id/react', '/api/confessions/:id/comments'],
      users: ['/api/users/:id', '/api/users/:id/confessions', '/api/users/:id/follow', '/api/users/avatar'],
      messages: ['/api/messages', '/api/messages/:userId'],
      notifications: ['/api/notifications', '/api/notifications/read-all'],
      radio: ['/api/radio', '/api/confessions/random'],
      upload: ['/api/upload/audio'],
      categories: ['/api/categories'],
      stats: ['/api/stats']
    }
  });
});

// =============================================================================
// ERROR HANDLER
// =============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================================================
// DATABASE CONNECTION & SERVER START
// =============================================================================
async function startServer() {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clean up ghost indexes from older schema versions
    try {
      await mongoose.connection.collection('users').dropIndex('anonymousIdentity.full_1');
      console.log('🧹 Cleaned up old anonymousIdentity index');
    } catch (err) {
      // Index might not exist or already be dropped, safely ignore
    }
    
    server.listen(CONFIG.PORT, () => {
      console.log(`🚀 Morpheus Echo server running on port ${CONFIG.PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});