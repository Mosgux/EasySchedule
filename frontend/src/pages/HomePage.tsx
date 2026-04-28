import { useState } from 'react';
import { CreateScheduleForm } from '@/components/CreateScheduleForm';
import { ScheduleSuccess } from '@/components/ScheduleSuccess';

export function HomePage() {
  const [createdSchedule, setCreatedSchedule] = useState<{
    id: string;
    title: string;
    shareUrl: string;
  } | null>(null);

  const handleScheduleCreated = (schedule: {
    id: string;
    title: string;
    shareUrl: string;
  }) => {
    setCreatedSchedule(schedule);
  };

  const handleCreateAnother = () => {
    setCreatedSchedule(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">EasySchedule</h1>
            </div>
            <div className="text-sm text-gray-600">多人时间协商可视化系统</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!createdSchedule ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                轻松协调多人时间安排
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                创建时间协商表，分享链接给参与者，收集大家的可用时间，快速找到最佳安排。
                无需注册，简单易用。
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">快速创建</h3>
                <p className="text-sm text-gray-600">
                  几秒钟内创建时间协商表，设置时间范围和基本信息
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">分享链接</h3>
                <p className="text-sm text-gray-600">
                  生成安全的分享链接，参与者无需注册即可填写时间
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">可视化分析</h3>
                <p className="text-sm text-gray-600">
                  自动分析重叠时间，用颜色直观显示最佳时间段
                </p>
              </div>
            </div>

            {/* Create Form */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  创建新的时间协商表
                </h3>
              </div>
              <div className="p-6">
                <CreateScheduleForm onSuccess={handleScheduleCreated} />
              </div>
            </div>
          </div>
        ) : (
          <ScheduleSuccess
            schedule={createdSchedule}
            onCreateAnother={handleCreateAnother}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 EasySchedule. 简单易用的多人时间协商工具</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
