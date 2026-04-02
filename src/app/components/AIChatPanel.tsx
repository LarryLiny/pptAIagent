import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Paperclip, Wrench, HelpCircle, StopCircle, ChevronDown, X, Lightbulb, Search, FileQuestion, Users, ListChecks, MessageSquareText, Sparkles, Settings2 } from 'lucide-react';
import edisonImg from '../../assets/edison.jpg';
import conflictImg from '../../assets/conflict.jpg';

interface Message { id: string; type: 'user' | 'ai'; content: string; timestamp: Date; buttons?: { label: string; action: string }[]; tool?: string; image?: string; }

// 每个工具的"更多设置"配置
interface SettingItem { key: string; label: string; options: string[]; }
const TOOL_SETTINGS: Record<string, SettingItem[]> = {
  '生成课堂引入': [
    { key: 'introType', label: '导入类型', options: ['情境导入', '问题导入', '案例导入', '时事导入'] },
    { key: 'difficulty', label: '难度', options: ['简单', '适中', '进阶'] },
  ],
  '搜索背景知识': [
    { key: 'sourceType', label: '资料来源', options: ['外研社素材库', '全网搜索', '学术资源'] },
    { key: 'difficulty', label: '内容难度', options: ['初中水平', '高中水平', '大学水平'] },
  ],
  '例题生成': [
    { key: 'qtype', label: '题型', options: ['选择题', '填空题', '判断题', '简答题'] },
    { key: 'difficulty', label: '难度', options: ['基础', '中等', '拔高'] },
    { key: 'count', label: '数量', options: ['1题', '2题', '3题', '5题'] },
  ],
  '互动环节设计': [
    { key: 'form', label: '互动形式', options: ['小组讨论', '角色扮演', '辩论赛', '游戏竞赛'] },
    { key: 'duration', label: '时长', options: ['5分钟', '10分钟', '15分钟', '20分钟'] },
  ],
  '总结要点': [
    { key: 'scope', label: '总结范围', options: ['全部课件', '当前页', '选中内容'] },
    { key: 'format', label: '输出格式', options: ['要点列表', '思维导图', '表格对比'] },
  ],
  '生成演讲稿': [
    { key: 'style', label: '风格', options: ['正式', '轻松活泼', '互动式', '故事型'] },
    { key: 'duration', label: '时长', options: ['3分钟', '5分钟', '10分钟'] },
  ],
};

const TOOL_PLACEHOLDER: Record<string, string> = {
  '生成课堂引入': '请结合近期时事和本节课的内容，设计一段课堂引入',
  '搜索背景知识': '搜索关于爱迪生的英文背景资料',
  '例题生成': '根据本节课的知识点，生成例题',
  '互动环节设计': '设计一个关于团队协作的互动环节',
  '总结要点': '帮我总结一下这份课件的知识要点',
  '生成演讲稿': '请给第1-3页生成一份演讲稿',
};

const TI: Record<string, React.ReactNode> = {
  '生成课堂引入': <Lightbulb className="w-3.5 h-3.5" />, '搜索背景知识': <Search className="w-3.5 h-3.5" />,
  '例题生成': <FileQuestion className="w-3.5 h-3.5" />, '互动环节设计': <Users className="w-3.5 h-3.5" />,
  '总结要点': <ListChecks className="w-3.5 h-3.5" />, '生成演讲稿': <MessageSquareText className="w-3.5 h-3.5" />,
};
const TL = ['生成课堂引入', '搜索背景知识', '例题生成', '互动环节设计', '总结要点', '生成演讲稿'];
const HLP = ['把这段文字难度调低', '再给我生成一页相似题', '给我找一些爱迪生的英文背景资料', '从俄乌冲突引入本节课要学的Russia这个单词'];

export function AIChatPanel() {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [inp, setInp] = useState('');
  const [isRec, setIsRec] = useState(false);
  const [toolMenu, setToolMenu] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [hasSR, setHasSR] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  const add = (m: Partial<Message> & { type: 'user' | 'ai'; content: string }) =>
    setMsgs(p => [...p, { id: (Date.now() + Math.random()).toString(), timestamp: new Date(), ...m } as Message]);

  useEffect(() => {
    const t = setTimeout(() => add({ type: 'ai', content: '老师您好，我是子言，我可以帮您 /n 「搜索优质素材」 /n 「修改课件内容」 /n 「设计课堂活动」等，有什么需要帮忙的，直接告诉我即可。\n\n例如跟我说：请结合近期时事和本节课的内容，设计一段课堂引入。' }), 500);
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const S = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recRef.current = new S(); recRef.current.lang = 'zh-CN'; recRef.current.continuous = false; recRef.current.interimResults = false; setHasSR(true);
      recRef.current.onresult = (e: any) => { setInp(e.results[0][0].transcript); setIsRec(false); };
      recRef.current.onerror = () => setIsRec(false); recRef.current.onend = () => setIsRec(false);
    }
    return () => clearTimeout(t);
  }, []);

  const selectTool = (t: string) => {
    setTool(t); setToolMenu(false); setShowSettings(true);
    // Init default settings (first option of each)
    const defs: Record<string, string> = {};
    TOOL_SETTINGS[t]?.forEach(s => { defs[s.key] = s.options[0]; });
    setSettings(defs);
    setInp(TOOL_PLACEHOLDER[t] || "");
  };
  const clearTool = () => { setTool(null); setShowSettings(false); setSettings({}); };
  const updateSetting = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

  const send = () => {
    if (!inp.trim()) return;
    const txt = inp; const ct = tool; const st = { ...settings };
    add({ type: 'user', content: txt, tool: ct || undefined });
    setInp(''); clearTool();

    setTimeout(() => {
      // 生成课堂引入 — 回复包含文字+图片+插入按钮
      if (ct === '生成课堂引入') {
        const introType = st.introType || '情境导入';
        const diff = st.difficulty || '适中';
        add({
          type: 'ai',
          content: `好的，根据当前PPT的内容，已为您生成「${introType}」风格、「${diff}」难度的课堂引入：\n\n「Good morning, class! Before we begin today\'s lesson on Environmental Protection, let me show you something. Last week, a massive wildfire broke out in Australia, destroying thousands of hectares of forest. What do you think caused this disaster? And more importantly — what can we do about it? Today, we\'ll explore these questions together and learn how to express our ideas about protecting our planet in English.」`,
          image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
          buttons: [{ label: '插入到PPT', action: 'insert' }, { label: '重新生成', action: 'regenerate' }],
        });
        return;
      }
      // 生成演讲稿
      if (ct === '生成演讲稿') {
        add({ type: 'ai', content: '以下是为您生成的课堂演讲稿：\n\n「同学们好，今天我们来学习环境保护这一主题。大家知道，全球变暖正在影响我们的生活。接下来，我们将通过几个案例了解如何用英语表达环保理念，并探讨我们能为地球做些什么。」', buttons: [{ label: '插入到备注', action: 'insert-note' }, { label: '重新生成', action: 'regenerate-speech' }] });
        return;
      }
      // 难度调低
      if (txt.includes('难度调低') || txt.includes('难度降低')) {
        add({ type: 'ai', content: '好的，已根据外研社学生能力标准为您调整文本难度：\n\n「We should protect the environment. Trees give us clean air. We can save water and use less plastic. Small actions can make a big difference. Let\'s work together to keep our Earth clean and green.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-easy' }] });
        return;
      }
      // 相似题
      if (txt.includes('相似题')) {
        add({ type: 'ai', content: '好的，已从外研社题库中为您匹配到一道相似题：\n\nChoose the correct answer:\nIf I ___ more time yesterday, I would have finished the project.\nA. have  B. had had  C. had  D. would have\n\nAnswer: B', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-quiz' }] });
        return;
      }
      // 爱迪生
      if (txt.includes('爱迪生') || txt.includes('Edison')) {
        add({ type: 'ai', content: '为您找到以下资料：\n\n「Thomas Edison (1847–1931) was an American inventor who developed the phonograph, the motion picture camera, and the practical electric light bulb. He held over 1,000 patents. His Menlo Park laboratory was one of the first dedicated research facilities.」', image: edisonImg, buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-edison' }] });
        return;
      }
      // 俄乌
      if (txt.includes('俄乌') || txt.includes('Russia')) {
        add({ type: 'ai', content: '好的，为您生成了一段引入短文：\n\n「Russia is the largest country in the world. Recently, the conflict between Russia and Ukraine has drawn global attention. This event reminds us of the importance of peace and diplomacy. Today, let\'s learn more about Russia — its geography, culture, and the word itself.」', image: conflictImg, buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-russia' }] });
        return;
      }
      // 默认
      if (step === 0) {
        add({ type: 'ai', content: '好的，通过搜索外研社的素材库，推荐插入以下内容：\n\n「In recent years, the importance of environmental protection has become increasingly evident. Scientists and researchers worldwide are working together to develop sustainable solutions for our planet. Education plays a crucial role in raising awareness about environmental issues.」', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate' }] });
        setStep(1);
      } else {
        add({ type: 'ai', content: '好的，通过全网搜索，找到了合适的素材，将为您新建一页，然后插入内容，是否同意？', buttons: [{ label: '同意', action: 'agree' }, { label: '拒绝', action: 'reject' }] });
      }
    }, 1000);
  };

  const onBtn = (a: string) => {
    const R: Record<string, () => void> = {
      'agree': () => setTimeout(() => add({ type: 'ai', content: '已为您创建新的一页PPT并插入内容：\n\n「Thomas Edison, one of the greatest inventors in history, is best known for developing the practical electric light bulb. Born in 1847, Edison held over 1,000 patents.」' }), 800),
      'insert': () => add({ type: 'ai', content: '内容已插入当前页面，还有其他需要帮忙的吗？' }),
      'replace-text': () => add({ type: 'ai', content: '文本已替换到当前页面，还有其他需要帮忙的吗？' }),
      'insert-note': () => add({ type: 'ai', content: '演讲稿已插入到对应页面的备注中，还有其他需要帮忙的吗？' }),
      'reject': () => add({ type: 'ai', content: '好的，已取消操作。还有其他需要帮忙的吗？' }),
      'regenerate-easy': () => add({ type: 'ai', content: '好的，重新生成了更简单的版本：\n\n「Our planet needs help. We can plant trees, save water, and recycle. Walking or riding a bike is good for the air. Let\'s protect our beautiful Earth together.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-easy' }] }),
      'regenerate-quiz': () => add({ type: 'ai', content: '好的，重新生成了一道题目：\n\nI wish I ___ to the party last night.\nA. go  B. went  C. had gone  D. would go\n\nAnswer: C', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-quiz' }] }),
      'regenerate-edison': () => add({ type: 'ai', content: '好的，重新生成了爱迪生资料：\n\n「Edison was a self-taught genius who started working at age 12. His most famous invention, the light bulb, took thousands of experiments. He once said, "I have not failed."」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-edison' }] }),
      'regenerate-russia': () => add({ type: 'ai', content: '好的，重新生成了引入短文：\n\n「The word Russia comes from "Rus," a medieval state. Today, Russia spans Europe and Asia. The ongoing Russia-Ukraine conflict has become a major topic in international news.」', buttons: [{ label: '替换文本', action: 'replace-text' }, { label: '重新生成', action: 'regenerate-russia' }] }),
      'regenerate-speech': () => add({ type: 'ai', content: '好的，我为您重新生成演讲稿：\n\n「各位同学，欢迎来到今天的英语课。本节课我们聚焦环境保护话题，将学习相关词汇与表达。希望大家积极参与讨论。准备好了吗？Let\'s go!」', buttons: [{ label: '插入到备注', action: 'insert-note' }, { label: '重新生成', action: 'regenerate-speech' }] }),
      'regenerate': () => add({ type: 'ai', content: '好的，我为您重新生成内容：\n\n「Climate change represents one of the most pressing challenges of our time. Renewable energy sources offer promising alternatives to fossil fuels.」', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate' }] }),
      'regenerate-single': () => add({ type: 'ai', content: '好的，我为您重新生成内容。', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate-single' }] }),
      'regenerate-multi': () => add({ type: 'ai', content: '好的，我为您重新生成这一页。', buttons: [{ label: '插入', action: 'insert' }, { label: '重新生成', action: 'regenerate-multi' }] }),
    };
    R[a]?.();
  };

  const toolSettings = tool ? TOOL_SETTINGS[tool] : null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm">AI</div>
          <div><div className="font-medium text-gray-900">子言助手</div><div className="text-xs text-gray-500">在线</div></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>{msgs.map(m => <MsgBubble key={m.id} m={m} onBtn={onBtn} />)}</AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Settings panel — slides up above toolbar when open */}
      <AnimatePresence>
        {showSettings && toolSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-gray-200">
            <div className="px-4 py-3 bg-gray-50 max-h-48 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-purple-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />{tool} · 高级配置
                </div>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {toolSettings.map(s => (
                <div key={s.key} className="space-y-1.5">
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.options.map(o => (
                      <button key={o} onClick={() => updateSetting(s.key, o)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-all ${settings[s.key] === o
                          ? 'bg-purple-500 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600'}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar row: upload, tools dropdown, help */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors" title="上传文件"><Paperclip className="w-4 h-4" /></button>
            <div className="relative">
              <button onClick={() => setToolMenu(!toolMenu)} onMouseEnter={() => setToolMenu(true)} onMouseLeave={() => setToolMenu(false)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap">
                <Wrench className="w-3.5 h-3.5" /><span>工具</span><ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>{toolMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  onMouseEnter={() => setToolMenu(true)} onMouseLeave={() => setToolMenu(false)}
                  className="absolute bottom-full left-0 mb-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                  {TL.map(t => (
                    <button key={t} onClick={() => selectTool(t)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <span className="text-gray-400">{TI[t]}</span>{t}
                    </button>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
          </div>
          <div className="relative mr-2">
            <button onClick={() => setHelpOpen(!helpOpen)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap">
              <HelpCircle className="w-3.5 h-3.5" /><span>帮助</span>
            </button>
            <AnimatePresence>{helpOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">示例问题</div>
                  <button onClick={() => setHelpOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  {HLP.map(q => <div key={q} onClick={() => { setInp(q); setHelpOpen(false); }} className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">"{q}"</div>)}
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </div>

      {/* Selected tool tag + "更多设置" — between toolbar and input */}
      {tool && (
        <div className="px-4 py-1.5 bg-white flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-700">
            <Sparkles className="w-3 h-3" />
            <span>{tool}</span>
            <button onClick={clearTool} className="ml-0.5 text-purple-400 hover:text-purple-600"><X className="w-3 h-3" /></button>
          </div>
          <button onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${showSettings ? 'bg-gray-200 text-gray-700' : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}>
            <Settings2 className="w-3 h-3" />
            <span>更多设置</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input type="text" value={inp} onChange={e => setInp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              placeholder={tool ? `输入您的需求，${tool}...` : '输入消息...'}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" />
          </div>
          {hasSR && (
            <button onClick={() => { if (!recRef.current) return; if (isRec) { recRef.current.stop(); setIsRec(false); } else { recRef.current.start(); setIsRec(true); } }}
              className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${isRec ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {isRec ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button onClick={send} disabled={!inp.trim()}
            className="h-10 w-10 flex items-center justify-center bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) { add({ type: 'user', content: `已上传文件：${f.name}` }); setTimeout(() => add({ type: 'ai', content: '我已收到您上传的文件，正在分析内容。请稍等片刻...' }), 500); } }} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
    </div>
  );
}

function MsgBubble({ m, onBtn }: { m: Message; onBtn: (a: string) => void }) {
  const [showBtns, setShowBtns] = useState(m.type === 'user');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${m.type === 'user' ? 'order-2' : ''}`}>
        <div className="flex items-start gap-2">
          {m.type === 'ai' && <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>}
          <div className="flex-1">
            <div className={`rounded-2xl px-4 py-2.5 ${m.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {m.tool && <div className="mb-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full inline-block">{m.tool}</div>}
              <div className="whitespace-pre-wrap text-sm leading-relaxed"><TW text={m.content} isAI={m.type === 'ai'} onComplete={() => setShowBtns(true)} /></div>
              {m.image && <img src={m.image} alt="PPT" className="mt-3 rounded-lg w-full object-cover max-h-48" />}
            </div>
            {showBtns && m.buttons && (
              <div className="flex gap-2 mt-2">{m.buttons.map((b, i) => (
                <button key={i} onClick={() => onBtn(b.action)}
                  className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">{b.label}</button>
              ))}</div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-1 px-2">{m.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </motion.div>
  );
}

function TW({ text, isAI, onComplete }: { text: string; isAI: boolean; onComplete?: () => void }) {
  const [s, setS] = useState(''); const [d, setD] = useState(!isAI); const r = useRef(false);
  useEffect(() => {
    if (!isAI || r.current) { setS(text); setD(true); onComplete?.(); return; }
    r.current = true; setS(''); setD(false); let i = 0;
    const iv = setInterval(() => { if (i < text.length) { setS(text.slice(0, i + 1)); i++; } else { setD(true); clearInterval(iv); onComplete?.(); } }, 30);
    return () => clearInterval(iv);
  }, [text, isAI]);
  return <>{s}{!d && isAI && <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />}</>;
}
