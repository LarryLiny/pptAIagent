import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Wrench, 
  HelpCircle, 
  StopCircle,
  ChevronDown,
  X,
  Lightbulb,
  Search,
  FileQuestion,
  Users,
  ListChecks,
  MessageSquareText
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  buttons?: { label: string; action: string }[];
  tool?: string;
  image?: string;
}

// 工具模板配置
const TOOL_TEMPLATES: Record<string, string> = {
  '生成课堂引入': '结合「近期时事」和本节课的核心内容「环境保护」，设计一段「3」分钟的课堂引入。',
  '搜索背景知识': '搜索关于「爱迪生」的「英文背景资料」，要求内容难度为「高中水平」。',
  '例题生成': '根据本节课的知识点「虚拟语气」，生成「2」道例题，要求题型是「选择题」，题目主题是「校园生活」。',
  '互动环节设计': '设计一个关于「团队协作」的互动环节，形式是「小组讨论」，时长约「10」分钟。',
  '总结要点': '帮我总结一下这份课件的知识要点',
  '生成演讲稿': '请给第「1-3」页生成一份演讲稿。',
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  '生成课堂引入': <Lightbulb className="w-3.5 h-3.5 text-gray-400" />,
  '搜索背景知识': <Search className="w-3.5 h-3.5 text-gray-400" />,
  '例题生成': <FileQuestion className="w-3.5 h-3.5 text-gray-400" />,
  '互动环节设计': <Users className="w-3.5 h-3.5 text-gray-400" />,
  '总结要点': <ListChecks className="w-3.5 h-3.5 text-gray-400" />,
  '生成演讲稿': <MessageSquareText className="w-3.5 h-3.5 text-gray-400" />,
};

export function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showWhatCanDo, setShowWhatCanDo] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [conversationStep, setConversationStep] = useState(0);
  const [editedParts, setEditedParts] = useState<Set<number>>(new Set());
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始欢迎消息
  useEffect(() => {
    const timer = setTimeout(() => {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '老师您好，我是子言，我可以帮您「搜索优质素材」、「修改课件内容」等，有什么需要帮忙的，直接告诉我即可。  例如跟我说：请结合近期时事和本节课的内容，设计一段课堂引入。',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }, 500);

    // 初始化语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      setHasSpeechRecognition(true);

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => timer;
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      tool: selectedTool || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // 根据选择的工具生成不同回复
    setTimeout(() => {
      // AI生成单页
      if (selectedTool === 'AI生成单页') {
        const singlePageResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '给您查找到了以下信息，是否插入新的PPT页面？\n\n「商务展示的核心要素」\n\n在现代商务环境中，专业的演示能力是成功沟通的关键。有效的商务展示不仅需要清晰的逻辑结构，还需要视觉化的内容呈现，帮助听众更好地理解和记忆关键信息。',
          timestamp: new Date(),
          image: 'https://images.unsplash.com/photo-1758691736545-5c33b6255dca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByZXNlbnRhdGlvbiUyMG1lZXRpbmd8ZW58MXx8fHwxNzc0NTY5Mjg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
          buttons: [
            { label: '插入', action: 'insert' },
            { label: '重新生成', action: 'regenerate-single' }
          ]
        };
        setMessages(prev => [...prev, singlePageResponse]);
        setSelectedTool(null);
        return;
      }
      
      // AI生成多页
      if (selectedTool === 'AI生成多页') {
        // 生成第一页
        const page1: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '「第1页：技术创新与数字化转型」\n\n数字化技术正在改变我们的工作方式，人工智能和大数据分析为企业带来了前所未有的机遇。创新不仅是技术的进步，更是思维方式的转变。',
          timestamp: new Date(),
          image: 'https://images.unsplash.com/photo-1573757056004-065ad36e2cf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbiUyMGRpZ2l0YWx8ZW58MXx8fHwxNzc0NTk3NDc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
          buttons: [
            { label: '插入', action: 'insert' },
            { label: '重新生成', action: 'regenerate-multi' }
          ]
        };
        setMessages(prev => [...prev, page1]);
        
        // 生成第二页
        setTimeout(() => {
          const page2: Message = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: '「第2页：教育的力量」\n\n教育是塑造未来的关键。通过优质的教育资源和创新的教学方法，我们能够培养出具有批判性思维和创造力的新一代人才。',
            timestamp: new Date(),
            image: 'https://images.unsplash.com/photo-1759922378123-a1f4f1e39bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjbGFzc3Jvb20lMjBsZWFybmluZ3xlbnwxfHx8fDE3NzQ1OTg4OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
            buttons: [
              { label: '插入', action: 'insert' },
              { label: '重新生成', action: 'regenerate-multi' }
            ]
          };
          setMessages(prev => [...prev, page2]);
        }, 800);
        
        // 生成第三页
        setTimeout(() => {
          const page3: Message = {
            id: (Date.now() + 3).toString(),
            type: 'ai',
            content: '「第3页：团队协作的重要性」\n\n成功的项目离不开高效的团队协作。跨部门沟通、资源共享和共同目标是构建卓越团队的三大支柱。',
            timestamp: new Date(),
            image: 'https://images.unsplash.com/photo-1739298061740-5ed03045b280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtd29yayUyMGNvbGxhYm9yYXRpb24lMjBvZmZpY2V8ZW58MXx8fHwxNzc0NDkzNDQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
            buttons: [
              { label: '插入', action: 'insert' },
              { label: '重新生成', action: 'regenerate-multi' }
            ]
          };
          setMessages(prev => [...prev, page3]);
        }, 1600);
        
        // 生成第四页
        setTimeout(() => {
          const page4: Message = {
            id: (Date.now() + 4).toString(),
            type: 'ai',
            content: '「第4页：持续学习与成长」\n\n在快速变化的时代，持续学习是保持竞争力的关键。拥抱变化、勇于尝试、从失败中学习，这些品质将帮助我们不断进步。',
            timestamp: new Date(),
            buttons: [
              { label: '插入', action: 'insert' },
              { label: '重新生成', action: 'regenerate-multi' }
            ]
          };
          setMessages(prev => [...prev, page4]);
        }, 2400);
        
        setSelectedTool(null);
        return;
      }
      
      // 生成演讲稿
      if (selectedTool === '生成演讲稿') {
        const speechResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '以下是为您生成的课堂演讲稿：\n\n「同学们好，今天我们来学习环境保护这一主题。大家知道，全球变暖正在影响我们的生活。接下来，我们将通过几个案例了解如何用英语表达环保理念，并探讨我们能为地球做些什么。」',
          timestamp: new Date(),
          buttons: [
            { label: '插入到备注', action: 'insert-note' },
            { label: '重新生成', action: 'regenerate-speech' }
          ]
        };
        setMessages(prev => [...prev, speechResponse]);
        setSelectedTool(null);
        return;
      }
      
      // 其他对话逻辑
      let aiResponse: Message;
      
      if (conversationStep === 0) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '好的，通过搜索外研社的素材库，推荐插入以下内容：\n\n「In recent years, the importance of environmental protection has become increasingly evident. Scientists and researchers worldwide are working together to develop sustainable solutions for our planet. Through innovative technologies and collaborative efforts, we can make a significant difference in preserving Earth\'s natural resources for future generations. Education plays a crucial role in raising awareness about environmental issues.」',
          timestamp: new Date(),
          buttons: [
            { label: '插入', action: 'insert' },
            { label: '重新生成', action: 'regenerate' }
          ]
        };
        setConversationStep(1);
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '好的，通过全网搜索，找到了合适的素材，将为您新建一页，然后插入内容，是否同意？',
          timestamp: new Date(),
          buttons: [
            { label: '同意', action: 'agree' },
            { label: '拒绝', action: 'reject' }
          ]
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputValue('');
    if (selectedTool !== 'AI生成单页' && selectedTool !== 'AI生成多页') {
      setSelectedTool(null);
    }
  };

  const handleButtonClick = (action: string) => {
    if (action === 'agree') {
      // 模拟创建新页面
      setTimeout(() => {
        const newPageMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: '已为您创建新的一页PPT并插入内容：\n\n「Thomas Edison, one of the greatest inventors in history, is best known for developing the practical electric light bulb. Born in 1847, Edison held over 1,000 patents and made significant contributions to modern technology. His famous quote, "Genius is one percent inspiration and ninety-nine percent perspiration," reflects his dedication to hard work and innovation. Edison\'s inventions, including the phonograph and motion picture camera, revolutionized communication and entertainment. His research laboratory in Menlo Park became a model for modern research facilities. Edison\'s legacy continues to inspire inventors and entrepreneurs worldwide, demonstrating the power of persistence, creativity, and systematic experimentation in solving complex problems.」',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newPageMessage]);
      }, 800);
    } else if (action === 'insert') {
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '内容已插入当前页面，还有其他需要帮忙的吗？',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
    } else if (action === 'insert-note') {
      const noteMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '演讲稿已插入到对应页面的备注中，还有其他需要帮忙的吗？',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, noteMessage]);
    } else if (action === 'regenerate-speech') {
      const speechMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '好的，我为您重新生成演讲稿：\n\n「各位同学，欢迎来到今天的英语课。本节课我们聚焦环境保护话题，将学习相关词汇与表达。希望大家积极参与讨论，一起思考如何用实际行动守护我们的家园。准备好了吗？Let\'s go!」',
        timestamp: new Date(),
        buttons: [
          { label: '插入到备注', action: 'insert-note' },
          { label: '重新生成', action: 'regenerate-speech' }
        ]
      };
      setMessages(prev => [...prev, speechMessage]);
    } else if (action === 'regenerate-single') {
      // 重新生成单页内容
      const regenerateSingle: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '好的，我为您重新生成内容：\n\n「创业与创新」\n\n在充满挑战的商业环境中，创新思维和坚持不懈是成功的关键。从初创企业到行业领导者，每一步成长都需要战略规划和团队协作。成功不是一蹴而就的，而是持续努力的结果。',
        timestamp: new Date(),
        image: 'https://images.unsplash.com/photo-1758876019673-704b039d405c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwZ3Jvd3RoJTIwc3VjY2Vzc3xlbnwxfHx8fDE3NzQ1ODIxMTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        buttons: [
          { label: '插入', action: 'insert' },
          { label: '重新生成', action: 'regenerate-single' }
        ]
      };
      setMessages(prev => [...prev, regenerateSingle]);
    } else if (action === 'regenerate-multi') {
      // 重新生成多页内容中的单个页面
      const regenerateMulti: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '好的，我为您重新生成这一页：\n\n「全球化与互联互通」\n\n在数字时代，地理距离不再是障碍。通过互联网和通信技术，全球各地的人们可以即时交流合作，共同推动社会进步和经济发展。',
        timestamp: new Date(),
        image: 'https://images.unsplash.com/photo-1761292630740-d821dc203975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbG9iYWwlMjBjb21tdW5pY2F0aW9uJTIwbmV0d29ya3xlbnwxfHx8fDE3NzQ1OTg5NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        buttons: [
          { label: '插入', action: 'insert' },
          { label: '重新生成', action: 'regenerate-multi' }
        ]
      };
      setMessages(prev => [...prev, regenerateMulti]);
    } else if (action === 'regenerate') {
      const regenerateMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '好的，我为您重新生成内容：\n\n「Climate change represents one of the most pressing challenges of our time. Global warming, caused by greenhouse gas emissions, threatens ecosystems and human societies alike. Renewable energy sources such as solar and wind power offer promising alternatives to fossil fuels. International cooperation and individual actions are both essential in addressing this crisis.」',
        timestamp: new Date(),
        buttons: [
          { label: '插入', action: 'insert' },
          { label: '重新生成', action: 'regenerate' }
        ]
      };
      setMessages(prev => [...prev, regenerateMessage]);
    } else if (action === 'reject') {
      const rejectMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: '好的，已取消操作。还有其他需要帮忙的吗？',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, rejectMessage]);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    const template = TOOL_TEMPLATES[tool];
    if (template) {
      setInputValue(template);
      setEditedParts(new Set()); // 重置编辑状态
    }
    setShowToolMenu(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `已上传文件：${file.name}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, uploadMessage]);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '我已收到您上传的文件，正在分析内容。请稍等片刻...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 500);
    }
  };

  const handleHelpItemClick = (text: string) => {
    setInputValue(text);
    setShowWhatCanDo(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm">
            AI
          </div>
          <div>
            <div className="font-medium text-gray-900">子言助手</div>
            <div className="text-xs text-gray-500">在线</div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : ''}`}>
                <div className="flex items-start gap-2">
                  {message.type === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs flex-shrink-0">
                      AI
                    </div>
                  )}
                  <div className="flex-1">
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.tool && (
                        <div className="mb-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full inline-block">
                          {message.tool}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        <TypewriterText text={message.content} isAI={message.type === 'ai'} />
                      </div>
                      {message.image && (
                        <img 
                          src={message.image} 
                          alt="PPT content" 
                          className="mt-3 rounded-lg w-full object-cover max-h-48"
                        />
                      )}
                    </div>
                    
                    {message.buttons && (
                      <div className="flex gap-2 mt-2">
                        {message.buttons.map((button, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleButtonClick(button.action)}
                            className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          >
                            {button.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷功能 */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 relative">
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleFileUpload}
              className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              title="上传文件"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowToolMenu(!showToolMenu)}
                onMouseEnter={() => setShowToolMenu(true)}
                onMouseLeave={() => setShowToolMenu(false)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>工具</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              <AnimatePresence>
                {showToolMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onMouseEnter={() => setShowToolMenu(true)}
                    onMouseLeave={() => setShowToolMenu(false)}
                    className="absolute bottom-full left-0 mb-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10"
                  >
                    {['生成课堂引入', '搜索背景知识', '例题生成', '互动环节设计', '总结要点', '生成演讲稿'].map((tool) => (
                      <button
                        key={tool}
                        onClick={() => handleToolSelect(tool)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        {TOOL_ICONS[tool]}
                        {tool}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="relative mr-2">
            <button
              onClick={() => setShowWhatCanDo(!showWhatCanDo)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>帮助</span>
            </button>
            
            <AnimatePresence>
              {showWhatCanDo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">示例问题</div>
                    <button onClick={() => setShowWhatCanDo(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div onClick={() => handleHelpItemClick('把这段文字难度调低')} className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                      "把这段文字难度调低"
                    </div>
                    <div onClick={() => handleHelpItemClick('再给我生成一页相似题')} className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                      "再给我生成一页相似题"
                    </div>
                    <div onClick={() => handleHelpItemClick('给我找一些爱迪生的英文背景资料')} className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                      "给我找一些爱迪生的英文背景资料"
                    </div>
                    <div onClick={() => handleHelpItemClick('从俄乌冲突引入本节课要学的Russia这个单词')} className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                      "从俄乌冲突引入本节课要学的Russia这个单词"
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            {selectedTool && (
              <div className="absolute top-0 left-0 right-0 -translate-y-full mb-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-t-lg flex items-center justify-between">
                <span>示例</span>
                <button onClick={() => { setSelectedTool(null); setInputValue(''); }} className="text-purple-500 hover:text-purple-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {selectedTool && TOOL_TEMPLATES[selectedTool] ? (
              <HighlightedInput
                value={inputValue}
                onChange={setInputValue}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息..."
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            )}
          </div>
          
          {hasSpeechRecognition && (
            <button
              onClick={toggleRecording}
              className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-10 w-10 flex items-center justify-center bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
      />
    </div>
  );
}

// 打字机效果组件
function TypewriterText({ text, isAI }: { text: string; isAI: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(!isAI);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isAI || hasAnimated.current) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    hasAnimated.current = true;
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, isAI]);

  return (
    <>
      {displayedText}
      {!isComplete && isAI && <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />}
    </>
  );
}

// 高亮输入框组件
function HighlightedInput({ value, onChange, onKeyDown }: { value: string; onChange: (value: string) => void; onKeyDown: (e: React.KeyboardEvent) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (divRef.current && isFirstRender) {
      divRef.current.focus();
      // 将光标移到最后
      const range = document.createRange();
      const sel = window.getSelection();
      if (divRef.current.childNodes.length > 0) {
        range.selectNodeContents(divRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setIsFirstRender(false);
    }
  }, [isFirstRender]);

  // 解析文本，将「」包裹的内容渲染为蓝色
  const renderHighlightedText = () => {
    const parts = value.split(/([「」])/);
    const result: JSX.Element[] = [];
    let isBlue = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '「') {
        isBlue = true;
      } else if (part === '」') {
        isBlue = false;
      } else if (part) {
        if (isBlue) {
          result.push(
            <span key={i} className="text-blue-600 font-medium">
              {part}
            </span>
          );
        } else {
          result.push(<span key={i}>{part}</span>);
        }
      }
    }
    return result;
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    onChange(text);
  };

  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onKeyDown(e);
    }
  };

  return (
    <div
      ref={divRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDownCapture}
      suppressContentEditableWarning
      className="w-full min-h-[40px] max-h-20 overflow-y-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
      style={{ wordBreak: 'break-word' }}
    >
      {renderHighlightedText()}
    </div>
  );
}