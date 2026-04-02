import { useState } from 'react';
import { X, Search, Play, Music, FileText, Image, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MediaType = '全部' | '视频' | '音频' | '题目' | '图片';
type SourceType = '全部' | '外研社' | '三方';

interface Resource {
  id: string;
  title: string;
  type: MediaType;
  source: '外研社' | '三方';
  thumb: string;
  desc: string;
}

const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Environmental Protection - Lecture Video', type: '视频', source: '外研社', thumb: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300', desc: '环境保护主题讲解视频，时长8分钟' },
  { id: '2', title: 'Climate Change Documentary Clip', type: '视频', source: '三方', thumb: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=300', desc: '气候变化纪录片片段，BBC出品' },
  { id: '3', title: 'Nature Sounds - Forest Ambience', type: '音频', source: '三方', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300', desc: '森林自然环境音效，适合课堂引入' },
  { id: '4', title: 'English Listening - Unit 3', type: '音频', source: '外研社', thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', desc: '外研社配套听力材料，Unit 3' },
  { id: '5', title: 'Subjunctive Mood - Practice Set', type: '题目', source: '外研社', thumb: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300', desc: '虚拟语气专项练习，含20道选择题' },
  { id: '6', title: 'Grammar Quiz - Mixed Tenses', type: '题目', source: '三方', thumb: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300', desc: '混合时态语法测验，适合课堂检测' },
  { id: '7', title: 'Rainforest Aerial View', type: '图片', source: '外研社', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300', desc: '热带雨林航拍图，高清素材' },
  { id: '8', title: 'Global Warming Infographic', type: '图片', source: '三方', thumb: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300', desc: '全球变暖数据信息图' },
  { id: '9', title: 'Vocabulary - Environmental Terms', type: '题目', source: '外研社', thumb: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300', desc: '环保主题词汇练习，含配图' },
  { id: '10', title: 'Recycling Process Animation', type: '视频', source: '外研社', thumb: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300', desc: '垃圾回收流程动画演示' },
  { id: '11', title: 'Ocean Pollution Photos', type: '图片', source: '三方', thumb: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=300', desc: '海洋污染实拍照片集' },
  { id: '12', title: 'Pronunciation Guide - Unit 3', type: '音频', source: '外研社', thumb: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300', desc: '外研社标准发音示范音频' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  '视频': <Play className="w-4 h-4" />,
  '音频': <Music className="w-4 h-4" />,
  '题目': <FileText className="w-4 h-4" />,
  '图片': <Image className="w-4 h-4" />,
};

export function ResourceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('全部');
  const [sourceType, setSourceType] = useState<SourceType>('全部');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = MOCK_RESOURCES.filter(r => {
    if (mediaType !== '全部' && r.type !== mediaType) return false;
    if (sourceType !== '全部' && r.source !== sourceType) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.desc.includes(search)) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-[720px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">外研社素材库</h2>
                <p className="text-xs text-gray-500 mt-0.5">视频、音频、题目、图片等教学素材</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Search + Filter bar */}
            <div className="px-5 py-3 border-b border-gray-100 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索素材..."
                    className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                </div>
                <button onClick={() => setShowFilter(!showFilter)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm transition-colors ${showFilter ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  <Filter className="w-4 h-4" /><span>筛选</span>
                </button>
              </div>

              {/* Media type tabs */}
              <div className="flex gap-1.5">
                {(['全部', '视频', '音频', '题目', '图片'] as MediaType[]).map(t => (
                  <button key={t} onClick={() => setMediaType(t)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${mediaType === t ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Source filter (collapsible) */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-gray-500">素材来源：</span>
                      {(['全部', '外研社', '三方'] as SourceType[]).map(s => (
                        <button key={s} onClick={() => setSourceType(s)}
                          className={`px-2.5 py-0.5 rounded-full text-xs transition-all ${sourceType === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Resource grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm">未找到匹配的素材</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filtered.map(r => (
                    <div key={r.id} className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
                      <div className="relative h-28 bg-gray-100">
                        <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" />
                        {/* Type icon overlay */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs">
                          {TYPE_ICONS[r.type]}<span>{r.type}</span>
                        </div>
                        {/* Source badge */}
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium ${r.source === '外研社' ? 'bg-blue-500 text-white' : 'bg-orange-400 text-white'}`}>
                          {r.source}
                        </div>
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-medium text-gray-900 truncate">{r.title}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">共 {filtered.length} 个素材</div>
              <button onClick={onClose} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">关闭</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
