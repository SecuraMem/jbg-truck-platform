import { useMemo, useState } from 'react';
import {
  Truck,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { Truck as TruckType, Load, FairnessMetrics, Recommendation } from '../types';
import { generateSchedule } from '../services/api';
import { AIRecommendations } from './AIRecommendations';

interface DashboardProps {
  trucks: TruckType[];
  loads: Load[];
  onScheduleGenerated: (assignments: Array<{ loadId: string; truckId: string; reasoning: string }>) => void;
}

export function Dashboard({ trucks, loads, onScheduleGenerated }: DashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastFairnessScore, setLastFairnessScore] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const metrics: FairnessMetrics = useMemo(() => {
    const activeTrucks = trucks.filter(t => t.active);
    const belowQuota = activeTrucks.filter(t => t.weeklyLoads < t.minWeeklyLoads);
    const atQuota = activeTrucks.filter(t => t.weeklyLoads === t.minWeeklyLoads);
    const aboveQuota = activeTrucks.filter(t => t.weeklyLoads > t.minWeeklyLoads);
    const totalLoads = activeTrucks.reduce((sum, t) => sum + t.weeklyLoads, 0);

    return {
      totalTrucks: activeTrucks.length,
      trucksAtQuota: atQuota.length,
      trucksBelowQuota: belowQuota.length,
      trucksAboveQuota: aboveQuota.length,
      fairnessPercentage: activeTrucks.length > 0
        ? Math.round(((atQuota.length + aboveQuota.length) / activeTrucks.length) * 100)
        : 0,
      averageLoadsPerTruck: activeTrucks.length > 0
        ? Math.round((totalLoads / activeTrucks.length) * 10) / 10
        : 0,
    };
  }, [trucks]);

  const unassignedLoads = useMemo(() =>
    loads.filter(l => l.status === 'unassigned'),
    [loads]
  );

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSchedule(trucks, loads, {
        minWeeklyLoads: 3,
        prioritizeUnderQuota: true,
        respectCapacity: true,
      });

      setLastFairnessScore(result.fairnessScore);
      setRecommendations(result.recommendations || []);
      onScheduleGenerated(result.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Daily Scheduling • Weekly Fairness (3 loads/truck/week)</p>
        </div>

        <button
          onClick={handleGenerateSchedule}
          disabled={isGenerating || unassignedLoads.length === 0}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all shadow-lg hover:shadow-xl
            ${isGenerating || unassignedLoads.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-jbg-primary hover:bg-jbg-dark text-white'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating Schedule...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Today's Schedule
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-medium">Schedule Generation Failed</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fairness Score */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-jbg-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Fairness Score</p>
              <p className="text-3xl font-bold text-jbg-primary">
                {metrics.fairnessPercentage}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              metrics.fairnessPercentage >= 80 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <TrendingUp className={
                metrics.fairnessPercentage >= 80 ? 'text-green-600' : 'text-yellow-600'
              } size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Trucks meeting weekly quota
          </p>
        </div>

        {/* Total Trucks */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Trucks</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.totalTrucks}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Truck className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Avg: {metrics.averageLoadsPerTruck} loads/week
          </p>
        </div>

        {/* Trucks Below Quota */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Below Quota</p>
              <p className="text-3xl font-bold text-amber-600">
                {metrics.trucksBelowQuota}
              </p>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Need priority for fairness
          </p>
        </div>

        {/* Unassigned Loads */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unassigned Loads</p>
              <p className="text-3xl font-bold text-gray-900">
                {unassignedLoads.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ready for assignment
          </p>
        </div>
      </div>

      {/* Last AI Result */}
      {lastFairnessScore !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-green-800 font-medium">Schedule Generated Successfully!</p>
            <p className="text-green-600 text-sm">
              AI Fairness Score: {Math.round(lastFairnessScore * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Priority Trucks Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Trucks Needing Priority
          </h3>
          <p className="text-sm text-gray-600">
            These drivers are below their weekly quota and should be assigned first
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weekly Loads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trucks
                .filter(t => t.active && t.weeklyLoads < t.minWeeklyLoads)
                .sort((a, b) => a.weeklyLoads - b.weeklyLoads)
                .slice(0, 10)
                .map((truck) => (
                  <tr key={truck.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {truck.truckId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {truck.contractorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${truck.size === 'large' ? 'bg-purple-100 text-purple-800' :
                          truck.size === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {truck.size} ({truck.capacityTons}T)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-amber-600 font-medium">
                        {truck.weeklyLoads} / {truck.minWeeklyLoads}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        Needs {truck.minWeeklyLoads - truck.weeklyLoads} more
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {metrics.trucksBelowQuota > 10 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
            Showing 10 of {metrics.trucksBelowQuota} trucks below quota
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <AIRecommendations recommendations={recommendations} />
      )}
    </div>
  );
}
