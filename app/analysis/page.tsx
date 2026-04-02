'use client';

import { useMastery } from '../../hooks/useMastery';
import NavBar from '../../components/NavBar';
import MasteryGrid from '../../components/MasteryGrid';

export default function AnalysisPage() {
  const { mastery, ready } = useMastery();

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6">
        <div className="font-semibold text-gray-900 mb-4">语法掌握度</div>
        <MasteryGrid mastery={mastery} />
      </div>
    </div>
  );
}
