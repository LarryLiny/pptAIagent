import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles, Palette, ArrowRightLeft, Play } from 'lucide-react';
import backgroundImage from '../../assets/729a2a8b8759d93ff9184655ef40d8a53dd3585d.png';
import { AIChatPanel } from '../components/AIChatPanel';
import { ResourceModal } from '../components/ResourceModal';

type TabType = 'design' | 'transition' | 'animation' | 'ai';

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('design');
  const [resourceOpen, setResourceOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-100">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${backgroundImage})` }} />

      {/* 返回按钮 */}
      <button onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg shadow-md transition-colors text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" /><span>返回列表</span>
      </button>

      {/* 素材库透明点击区域 — 覆盖在背景图的"素材库"图标上 */}
      <button onClick={() => setResourceOpen(true)}
        className="absolute z-10 bg-transparent hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        style={{ top: '6px', left: '50px', width: '80px', height: '72px' }}
        title="素材库"
      />

      {/* 素材库弹窗 */}
      <ResourceModal open={resourceOpen} onClose={() => setResourceOpen(false)} />

      {/* 右侧面板容器 */}
      <div className="absolute right-0 bottom-0 w-116 flex" style={{ top: '86px' }}>
        <div className="flex flex-col gap-3 pt-4 pr-2">
          <button onClick={() => setActiveTab('design')}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors ${activeTab === 'design' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>
            <Palette className={`w-6 h-6 mb-1 ${activeTab === 'design' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-xs text-gray-700">设计</span>
          </button>
          <button onClick={() => setActiveTab('transition')}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors ${activeTab === 'transition' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>
            <ArrowRightLeft className={`w-6 h-6 mb-1 ${activeTab === 'transition' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-xs text-gray-700">切换</span>
          </button>
          <button onClick={() => setActiveTab('animation')}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors ${activeTab === 'animation' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>
            <Play className={`w-6 h-6 mb-1 ${activeTab === 'animation' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-xs text-gray-700">动画</span>
          </button>
          <button onClick={() => setActiveTab('ai')}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-purple-100' : 'bg-white hover:bg-gray-50'}`}>
            <Sparkles className={`w-6 h-6 mb-1 ${activeTab === 'ai' ? 'text-purple-600' : 'text-gray-600'}`} />
            <span className={`text-xs ${activeTab === 'ai' ? 'text-purple-700' : 'text-gray-700'}`}>AI</span>
          </button>
        </div>
        <div className="flex-1 bg-white shadow-lg overflow-hidden">
          {activeTab === 'ai' ? (
            <AIChatPanel />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center text-gray-400">
                <div className="mb-2">选中画布中的元素</div>
                <div>添加{activeTab === 'design' ? '设计' : activeTab === 'transition' ? '切换' : '动画'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
