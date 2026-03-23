import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

type Tab = 'chats' | 'contacts' | 'archive' | 'settings';

interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
  voice?: boolean;
  duration?: string;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  online: boolean;
}

const CHATS: Chat[] = [
  { id: 1, name: 'Алина Морозова', avatar: '🌸', lastMsg: 'Окей, увидимся в 7!', time: '14:32', unread: 3, online: true },
  { id: 2, name: 'Дмитрий Козлов', avatar: '🎯', lastMsg: 'Презентация готова, отправлю', time: '13:15', unread: 0, online: true },
  { id: 3, name: 'Команда Pulse', avatar: '⚡', lastMsg: 'Новая версия задеплоена!', time: '12:00', unread: 7, online: false },
  { id: 4, name: 'Мария Петрова', avatar: '🦋', lastMsg: 'Голосовое сообщение', time: '11:48', unread: 0, online: false },
  { id: 5, name: 'Иван Волков', avatar: '🔥', lastMsg: 'Спасибо за помощь!', time: 'Вчера', unread: 0, online: true },
  { id: 6, name: 'Саша Белов', avatar: '🎸', lastMsg: 'Репетиция в субботу?', time: 'Вчера', unread: 1, online: false },
  { id: 7, name: 'Катя Новикова', avatar: '🌿', lastMsg: 'Выглядит отлично!', time: 'Пн', unread: 0, online: true },
];

const ARCHIVE_CHATS: Chat[] = [
  { id: 8, name: 'Старый проект', avatar: '📦', lastMsg: 'Проект завершён', time: '15 мар', unread: 0, online: false },
  { id: 9, name: 'Анна Синева', avatar: '🌊', lastMsg: 'До встречи!', time: '10 мар', unread: 0, online: false },
];

const CONTACTS: Contact[] = [
  { id: 1, name: 'Алина Морозова', avatar: '🌸', phone: '+7 900 123-45-67', online: true },
  { id: 2, name: 'Анна Синева', avatar: '🌊', phone: '+7 916 234-56-78', online: false },
  { id: 3, name: 'Дмитрий Козлов', avatar: '🎯', phone: '+7 925 345-67-89', online: true },
  { id: 4, name: 'Иван Волков', avatar: '🔥', phone: '+7 903 456-78-90', online: true },
  { id: 5, name: 'Катя Новикова', avatar: '🌿', phone: '+7 917 567-89-01', online: true },
  { id: 6, name: 'Мария Петрова', avatar: '🦋', phone: '+7 921 678-90-12', online: false },
  { id: 7, name: 'Саша Белов', avatar: '🎸', phone: '+7 909 789-01-23', online: false },
];

const AUTO_REPLIES: Record<number, string[]> = {
  1: ['Отлично! 😊', 'Договорились!', 'Жду тебя!', 'Увидимся 🌸'],
  2: ['Понял, принял!', 'Отлично, смотрю...', 'Спасибо! 👍', 'Супер работа!'],
  3: ['👍', 'Ок, разбираемся', 'Хорошо, спасибо!', 'Понял тебя ⚡'],
  4: ['Хорошо 🦋', 'Договорились!', 'Окей!', 'Спасибо за сообщение'],
  5: ['Всегда пожалуйста! 🔥', 'Обращайся!', 'Рад помочь!'],
  6: ['Да, в субботу! 🎸', 'Ок!', 'Буду!'],
  7: ['Спасибо! 🌿', 'Рада слышать!', 'Отлично!'],
};

const INITIAL_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 1, text: 'Привет! Как дела?', time: '14:20', out: false },
    { id: 2, text: 'Всё отлично! Готовлюсь к встрече 😊', time: '14:21', out: true },
    { id: 3, text: '', time: '14:22', out: false, voice: true, duration: '0:15' },
    { id: 4, text: 'Буду в 7 вечера', time: '14:25', out: true },
    { id: 5, text: 'Окей, увидимся в 7!', time: '14:32', out: false },
  ],
  2: [
    { id: 1, text: 'Привет! Презентацию доделал?', time: '13:00', out: true },
    { id: 2, text: 'Да, почти готово!', time: '13:10', out: false },
    { id: 3, text: 'Отлично, жду 🎯', time: '13:12', out: true },
    { id: 4, text: 'Презентация готова, отправлю', time: '13:15', out: false },
  ],
  3: [
    { id: 1, text: 'Когда деплой?', time: '11:50', out: true },
    { id: 2, text: 'Сегодня в обед', time: '11:55', out: false },
    { id: 3, text: 'Новая версия задеплоена!', time: '12:00', out: false },
  ],
};

const SETTINGS_ITEMS = [
  { icon: 'Bell', label: 'Уведомления', desc: 'Звуки, вибрация, баннеры' },
  { icon: 'Shield', label: 'Конфиденциальность', desc: 'Блокировка, защита данных' },
  { icon: 'Palette', label: 'Оформление', desc: 'Тема, шрифт, фон чата' },
  { icon: 'Wifi', label: 'Данные и хранилище', desc: 'Автозагрузка медиа' },
  { icon: 'HelpCircle', label: 'Помощь', desc: 'FAQ, обратная связь' },
  { icon: 'Info', label: 'О приложении', desc: 'Версия 2.4.1' },
];

interface IndexProps {
  user: { name: string; avatar: string; contact: string; username?: string };
  onLogout: () => void;
}

interface SearchResult {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

export default function Index({ user, onLogout }: IndexProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [calling, setCalling] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>(INITIAL_MESSAGES);
  const [chatList, setChatList] = useState<Chat[]>(CHATS);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const displayChats = activeTab === 'archive' ? ARCHIVE_CHATS : chatList;
  const filteredChats = displayChats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentMessages = selectedChat ? (chatMessages[selectedChat.id] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, typing]);

  // Поиск по username при вводе в разделе контактов
  useEffect(() => {
    if (activeTab !== 'contacts') return;
    const q = search.trim().replace(/^@/, '');
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('pulse_token') || '';
        const res = await fetch(`https://functions.poehali.dev/a0016401-413c-4a73-828c-7a130682f4ae?action=search&q=${encodeURIComponent(q)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const getNow = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    const newMsg: Message = {
      id: Date.now(),
      text: message.trim(),
      time: getNow(),
      out: true,
    };
    const chatId = selectedChat.id;
    setChatMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMsg],
    }));
    setChatList(prev => prev.map(c =>
      c.id === chatId ? { ...c, lastMsg: message.trim(), time: getNow(), unread: 0 } : c
    ));
    setMessage('');

    // Auto-reply
    const replies = AUTO_REPLIES[chatId];
    if (replies) {
      setTyping(true);
      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          text: replies[Math.floor(Math.random() * replies.length)],
          time: getNow(),
          out: false,
        };
        setChatMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), reply],
        }));
        setChatList(prev => prev.map(c =>
          c.id === chatId ? { ...c, lastMsg: reply.text, time: getNow() } : c
        ));
        setTyping(false);
      }, 1200 + Math.random() * 800);
    }
  };

  const navItems = [
    { id: 'chats' as Tab, icon: 'MessageCircle', label: 'Чаты', badge: 11 },
    { id: 'contacts' as Tab, icon: 'Users', label: 'Контакты', badge: 0 },
    { id: 'archive' as Tab, icon: 'Archive', label: 'Архив', badge: 0 },
    { id: 'settings' as Tab, icon: 'Settings', label: 'Настройки', badge: 0 },
  ];

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden relative">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(265,85%,65%) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(185,90%,55%) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(320,85%,65%) 0%, transparent 70%)' }} />
      </div>

      {/* Sidebar Navigation */}
      <nav className="relative z-10 w-20 flex flex-col items-center py-6 gap-1 border-r border-border/50 flex-shrink-0"
        style={{ background: 'hsl(220,20%,7%)' }}>
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))' }}>
            P
          </div>
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSelectedChat(null); setSearch(''); }}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              activeTab === item.id
                ? 'text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
            style={activeTab === item.id ? {
              background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(320,85%,65%))',
              boxShadow: '0 4px 20px rgba(147,89,245,0.4)'
            } : {}}
            title={item.label}
          >
            <Icon name={item.icon} size={20} />
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'hsl(320,85%,65%)' }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Profile avatar */}
        <button
          onClick={() => { setActiveTab('settings'); setSelectedChat(null); }}
          className="mt-3 w-10 h-10 rounded-2xl flex items-center justify-center text-lg cursor-pointer ring-2 ring-border hover:ring-primary/50 transition-all"
          style={{ background: 'hsl(220,16%,14%)' }}
          title={user.name}
        >
          {user.avatar}
        </button>
      </nav>

      {/* Left Panel */}
      <div className="relative z-10 w-80 flex flex-col border-r border-border/50 flex-shrink-0"
        style={{ background: 'hsl(220,19%,9%)' }}>

        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-xl text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {activeTab === 'chats' && 'Чаты'}
              {activeTab === 'contacts' && 'Контакты'}
              {activeTab === 'archive' && 'Архив'}
              {activeTab === 'settings' && 'Настройки'}
            </h1>
            {activeTab === 'chats' && (
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <Icon name="Plus" size={18} />
              </button>
            )}
          </div>

          {(activeTab === 'chats' || activeTab === 'contacts' || activeTab === 'archive') && (
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">

          {(activeTab === 'chats' || activeTab === 'archive') && (
            <div className="flex flex-col gap-1">
              {filteredChats.map((chat, i) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-150 animate-fade-in ${
                    selectedChat?.id === chat.id ? 'bg-white/8' : 'hover:bg-white/4'
                  }`}
                  style={{ animationDelay: `${i * 40}ms`, backgroundColor: selectedChat?.id === chat.id ? 'rgba(255,255,255,0.07)' : undefined }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: 'hsl(220,14%,18%)' }}>
                      {chat.avatar}
                    </div>
                    {chat.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
                        style={{ background: 'hsl(185,90%,55%)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground truncate">{chat.name}</span>
                      <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{chat.lastMsg}</span>
                      {chat.unread > 0 && (
                        <span className="ml-2 flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(320,85%,65%))' }}>
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredChats.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">Ничего не найдено</div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="flex flex-col gap-1">
              {/* Подсказка */}
              {!search && (
                <div className="px-3 py-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Icon name="AtSign" size={13} />
                  Введите @username чтобы найти пользователя
                </div>
              )}

              {/* Индикатор загрузки */}
              {searchLoading && (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Поиск...
                </div>
              )}

              {/* Результаты поиска по username */}
              {search.length >= 2 && !searchLoading && searchResults.map((r, i) => (
                <div key={r.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all animate-fade-in cursor-pointer hover:bg-white/5"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'hsl(220,14%,18%)' }}>
                    {r.avatar || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{r.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'hsl(265,85%,70%)' }}>@{r.username}</div>
                  </div>
                  <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                    <Icon name="MessageCircle" size={16} />
                  </button>
                </div>
              ))}

              {/* Нет результатов */}
              {search.length >= 2 && !searchLoading && searchResults.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-6 animate-fade-in">
                  <div className="text-2xl mb-2">🔍</div>
                  Пользователь @{search.replace('@', '')} не найден
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-2">
              <div className="p-4 rounded-2xl mb-2 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(147,89,245,0.15), rgba(34,211,238,0.08))', border: '1px solid rgba(147,89,245,0.2)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'hsl(220,14%,18%)' }}>
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate">{user.name}</div>
                  {user.username && (
                    <div className="text-xs font-mono mb-0.5" style={{ color: 'hsl(265,85%,70%)' }}>@{user.username}</div>
                  )}
                  <div className="text-sm text-muted-foreground truncate">{user.contact}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'hsl(185,90%,55%)' }}>В сети</div>
                </div>
              </div>

              {SETTINGS_ITEMS.map((item, i) => (
                <button key={i}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-left animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'hsl(220,14%,18%)' }}>
                    <Icon name={item.icon} size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </button>
              ))}

              {/* Logout */}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-500/10 transition-all text-left mt-2 animate-fade-in"
                style={{ animationDelay: '350ms', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Icon name="LogOut" size={18} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-400">Выйти из аккаунта</div>
                  <div className="text-xs text-muted-foreground">{user.contact}</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-border/50 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'hsl(220,14%,18%)' }}>
                  {selectedChat.avatar}
                </div>
                {selectedChat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background"
                    style={{ background: 'hsl(185,90%,55%)' }} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">{selectedChat.name}</div>
                <div className="text-xs" style={{ color: selectedChat.online ? 'hsl(185,90%,55%)' : 'hsl(var(--muted-foreground))' }}>
                  {selectedChat.online ? 'в сети' : 'был(а) недавно'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalling(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Icon name="Phone" size={18} />
                </button>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                  <Icon name="MoreHorizontal" size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-xs text-muted-foreground px-2">Сегодня</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {currentMessages.map((msg, i) => (
                <div key={msg.id}
                  className={`flex animate-fade-in ${msg.out ? 'justify-end' : 'justify-start'}`}
                  style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${msg.out ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-foreground'}`}
                    style={msg.out
                      ? { background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(320,85%,65%))' }
                      : { background: 'hsl(220,14%,18%)' }
                    }>
                    {msg.voice ? (
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: msg.out ? 'rgba(255,255,255,0.2)' : 'rgba(147,89,245,0.3)' }}>
                          <Icon name="Play" size={14} className="text-white" />
                        </button>
                        <div className="flex items-end gap-0.5 h-5">
                          {Array.from({ length: 18 }).map((_, j) => (
                            <div key={j} className="w-0.5 rounded-full"
                              style={{
                                height: `${[6,10,14,8,16,12,6,14,10,16,8,12,6,10,14,8,12,6][j]}px`,
                                background: msg.out ? 'rgba(255,255,255,0.6)' : 'rgba(147,89,245,0.7)',
                              }} />
                          ))}
                        </div>
                        <span className="text-xs opacity-70">{msg.duration}</span>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${msg.out ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] opacity-50">{msg.time}</span>
                      {msg.out && <Icon name="CheckCheck" size={12} className="opacity-60" />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start animate-fade-in">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                    style={{ background: 'hsl(220,14%,18%)' }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: 'hsl(265,85%,65%)',
                          animation: `wave 1.2s ease-in-out infinite`,
                          animationDelay: `${j * 0.15}s`,
                          display: 'inline-block',
                        }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-6 py-4 flex-shrink-0 border-t border-border/50"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-end gap-3">
                <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex-shrink-0">
                  <Icon name="Paperclip" size={20} />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Сообщение..."
                    rows={1}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', maxHeight: '120px' }}
                  />
                </div>
                <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex-shrink-0">
                  <Icon name="Smile" size={20} />
                </button>
                {message.trim() ? (
                  <button
                    onClick={sendMessage}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))', boxShadow: '0 4px 20px rgba(147,89,245,0.4)' }}>
                    <Icon name="Send" size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => setRecording(!recording)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                    style={recording
                      ? { background: 'linear-gradient(135deg, hsl(0,84%,60%), hsl(320,85%,65%))', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)' }
                    }>
                    {recording ? (
                      <span className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(j => (
                          <span key={j} className="wave-bar" style={{ color: 'white', background: 'white' }} />
                        ))}
                      </span>
                    ) : (
                      <Icon name="Mic" size={20} className="text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(147,89,245,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(147,89,245,0.2)' }}>
              💬
            </div>
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Montserrat, sans-serif', background: 'linear-gradient(135deg, hsl(265,85%,65%), hsl(185,90%,55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pulse Messenger
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Выберите чат слева, чтобы начать общение. Быстро, безопасно и стильно.
            </p>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
              <Icon name="Shield" size={14} />
              <span>Сквозное шифрование</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block" />
              <Icon name="Zap" size={14} />
              <span>Мгновенная доставка</span>
            </div>
          </div>
        )}
      </div>

      {/* Calling Overlay */}
      {calling && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-scale-in"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col items-center gap-6 text-center p-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
                style={{ background: 'hsl(265,85%,65%)' }} />
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl relative z-10"
                style={{ background: 'linear-gradient(135deg, rgba(147,89,245,0.3), rgba(34,211,238,0.2))', border: '2px solid rgba(147,89,245,0.4)' }}>
                {selectedChat?.avatar}
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl text-foreground mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{selectedChat?.name}</div>
              <div className="text-muted-foreground text-sm flex items-center gap-2 justify-center">
                <span className="flex gap-1">
                  <span className="wave-bar" style={{ background: 'hsl(265,85%,65%)' }} />
                  <span className="wave-bar" style={{ background: 'hsl(265,85%,65%)' }} />
                  <span className="wave-bar" style={{ background: 'hsl(265,85%,65%)' }} />
                </span>
                Вызов...
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon name="MicOff" size={20} />
              </button>
              <button
                className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ background: 'hsl(0,84%,60%)', boxShadow: '0 4px 24px rgba(239,68,68,0.5)' }}
                onClick={() => setCalling(false)}>
                <Icon name="PhoneOff" size={24} />
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon name="Volume2" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}