import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import ParticipantPage from '@/pages/ParticipantPage';
import { OwnerView } from '@/pages/OwnerView';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/share/:token" element={<ParticipantPage />} />
          <Route path="/schedule/:scheduleId" element={<OwnerView />} />
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    页面未找到
                  </h1>
                  <p className="text-gray-600">请检查链接是否正确</p>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
