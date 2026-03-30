import { useState } from 'react';
import { useNavigate, Link } from 'react-router';

export default function CoursewareList() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleConvertToOnline = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/editor');
    }, 1000);
  };

  return (
    <div className="w-full h-screen bg-gray-50 overflow-auto">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-semibold text-blue-600">外研社智慧教育平台</div>
            <div className="flex gap-6 text-sm">
              <Link to="/" className="text-gray-600 hover:text-blue-600">工作台</Link>
              <Link to="/" className="text-blue-600 font-medium">我的课件</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600">资源库</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">教师：张老师</div>
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              张
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 标题和操作区 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">我的课件</h1>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            + 新建课件
          </button>
        </div>

        {/* 课件列表表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课件名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  科目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  年级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs mr-3">
                      PPT
                    </div>
                    <div className="text-sm font-medium text-gray-900">Unit 3 Environmental Protection</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  英语
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  高一
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2026-03-28
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-800">编辑</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-blue-600 hover:text-blue-800">预览</button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={handleConvertToOnline}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isLoading ? '加载中...' : '转在线课件'}
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center text-green-600 text-xs mr-3">
                      PPT
                    </div>
                    <div className="text-sm font-medium text-gray-900">Unit 2 Healthy Lifestyle</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  英语
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  高一
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2026-03-25
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-800">编辑</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-blue-600 hover:text-blue-800">预览</button>
                    <span className="text-gray-300">|</span>
                    <button disabled className="text-gray-400 cursor-not-allowed" aria-disabled="true">转在线课件</button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs mr-3">
                      PPT
                    </div>
                    <div className="text-sm font-medium text-gray-900">Unit 1 Cultural Heritage</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  英语
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  高一
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2026-03-20
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-800">编辑</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-blue-600 hover:text-blue-800">预览</button>
                    <span className="text-gray-300">|</span>
                    <button disabled className="text-gray-400 cursor-not-allowed" aria-disabled="true">转在线课件</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading 遮罩 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">正在转换为在线课件...</span>
          </div>
        </div>
      )}
    </div>
  );
}