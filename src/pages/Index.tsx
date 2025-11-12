import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import MessageContent from '@/components/MessageContent';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const API_URL = 'https://functions.poehali.dev/e73a5174-1a2d-4a7c-bad6-7b61d1486b08';

const Index = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat?.messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [],
      createdAt: new Date()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  };

  const exportChatAsJSON = (chat: Chat) => {
    const dataStr = JSON.stringify(chat, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${chat.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Экспорт выполнен', description: 'Чат сохранён в JSON' });
  };

  const exportChatAsText = (chat: Chat) => {
    let text = `${chat.title}\n`;
    text += `Создан: ${new Date(chat.createdAt).toLocaleString('ru-RU')}\n\n`;
    text += '='.repeat(50) + '\n\n';
    
    chat.messages.forEach(msg => {
      text += `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}:\n`;
      text += `${msg.content}\n\n`;
      text += '-'.repeat(50) + '\n\n';
    });
    
    const dataBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${chat.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Экспорт выполнен', description: 'Чат сохранён в TXT' });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    let chatToUpdate = currentChat;

    if (!chatToUpdate) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date()
      };
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat.id);
      chatToUpdate = newChat;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    const updatedMessages = [...(chatToUpdate?.messages || []), userMessage];

    if (updatedMessages.length === 1) {
      const title = inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : '');
      setChats(prevChats => prevChats.map(chat => 
        chat.id === chatToUpdate!.id ? { ...chat, title, messages: updatedMessages } : chat
      ));
    } else {
      setChats(prevChats => prevChats.map(chat => 
        chat.id === chatToUpdate!.id ? { ...chat, messages: updatedMessages } : chat
      ));
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const messagesToSend = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesToSend })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении ответа');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setChats(prevChats => prevChats.map(chat => 
        chat.id === chatToUpdate!.id 
          ? { ...chat, messages: [...chat.messages, assistantMessage] } 
          : chat
      ));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось получить ответ от AI',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  return (
    <div className="flex h-screen bg-background dark">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div 
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 w-64 md:w-64 transition-transform duration-300 bg-sidebar border-r border-sidebar-border flex flex-col h-full`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <Button 
            onClick={createNewChat}
            className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Новый чат
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between p-3 mb-1 rounded-lg cursor-pointer transition-colors ${
                currentChatId === chat.id 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
              }`}
              onClick={() => {
                setCurrentChatId(chat.id);
                setSidebarOpen(false);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="MessageSquare" size={16} className="flex-shrink-0" />
                <span className="text-sm truncate">{chat.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="Trash2" size={14} className="text-destructive hover:text-destructive/80" />
              </button>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex-shrink-0"
            >
              <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={20} />
            </Button>
            <h1 className="text-base md:text-lg font-semibold truncate">
              {currentChat?.title || 'AI Ассистент'}
            </h1>
          </div>
          
          {currentChat && currentChat.messages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="Download" size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportChatAsJSON(currentChat)}>
                  <Icon name="FileJson" size={16} className="mr-2" />
                  Экспорт в JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChatAsText(currentChat)}>
                  <Icon name="FileText" size={16} className="mr-2" />
                  Экспорт в TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon name="MessageCircle" size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Начните новый диалог</h2>
              <p className="text-muted-foreground max-w-md">
                Задайте любой вопрос или начните беседу. Все диалоги сохраняются в истории.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {currentChat.messages.map((message) => (
                <div key={message.id} className="fade-in">
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <Icon name="Bot" size={18} className="text-primary-foreground" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-[85%] md:max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card text-card-foreground border border-border'
                    }`}>
                      {message.role === 'assistant' ? (
                        <MessageContent content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={18} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start fade-in">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Icon name="Bot" size={18} className="text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-card text-card-foreground border border-border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 md:p-4 border-t border-border safe-area-bottom">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-card border-input text-base"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                className="bg-primary hover:bg-primary/90 flex-shrink-0"
                disabled={!inputValue.trim() || isLoading}
              >
                <Icon name="Send" size={18} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;