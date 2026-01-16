import { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface SettingsProps {
  onClearAllData: () => void;
  trucksCount: number;
  loadsCount: number;
}

export function Settings({ onClearAllData, trucksCount, loadsCount }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = () => {
    setIsClearing(true);
    // Small delay for UX feedback
    setTimeout(() => {
      onClearAllData();
      setIsClearing(false);
      setShowConfirm(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your data and application settings</p>
      </div>

      {/* Current Data Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Current Data</h3>
            <p className="text-sm text-gray-500">Data stored in your browser</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-3xl font-bold text-gray-900">{trucksCount}</p>
            <p className="text-sm text-gray-500">Trucks</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-3xl font-bold text-gray-900">{loadsCount}</p>
            <p className="text-sm text-gray-500">Loads</p>
          </div>
        </div>
      </div>

      {/* Clear Data Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Clear All Data</h3>
            <p className="text-sm text-gray-500 mt-1">
              Remove all trucks, loads, and chat history. This will reset the application
              to a clean state so you can import your own data.
            </p>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Clear All Data
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 mb-3">
              <AlertTriangle size={20} />
              <span className="font-medium">Are you sure?</span>
            </div>
            <p className="text-sm text-red-700 mb-4">
              This will permanently delete:
            </p>
            <ul className="text-sm text-red-700 mb-4 list-disc list-inside">
              <li>{trucksCount} trucks</li>
              <li>{loadsCount} loads</li>
              <li>All chat history</li>
              <li>All assignment data</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Yes, Clear Everything
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">After Clearing Data</h4>
        <p className="text-sm text-blue-800">
          Once cleared, you can use the <strong>Import Trucks</strong> tab to upload your
          real truck fleet data via CSV. Then add loads through the <strong>Loads</strong>
          tab or future CSV import feature.
        </p>
      </div>
    </div>
  );
}
