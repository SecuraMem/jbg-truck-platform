import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Truck as TruckIcon,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Star
} from 'lucide-react';
import type { Truck } from '../types';

interface TruckListProps {
  trucks: Truck[];
}

type SortField = 'truckId' | 'contractorName' | 'weeklyLoads' | 'size';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'below' | 'at' | 'above';

export function TruckList({ trucks }: TruckListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('weeklyLoads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showInactive, setShowInactive] = useState(false);

  const filteredAndSortedTrucks = useMemo(() => {
    let result = [...trucks];

    // Filter by active status
    if (!showInactive) {
      result = result.filter(t => t.active);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.truckId.toLowerCase().includes(term) ||
        t.contractorName.toLowerCase().includes(term)
      );
    }

    // Filter by quota status
    if (filterStatus !== 'all') {
      result = result.filter(t => {
        if (filterStatus === 'below') return t.weeklyLoads < t.minWeeklyLoads;
        if (filterStatus === 'at') return t.weeklyLoads === t.minWeeklyLoads;
        if (filterStatus === 'above') return t.weeklyLoads > t.minWeeklyLoads;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'truckId':
          comparison = a.truckId.localeCompare(b.truckId);
          break;
        case 'contractorName':
          comparison = a.contractorName.localeCompare(b.contractorName);
          break;
        case 'weeklyLoads':
          comparison = a.weeklyLoads - b.weeklyLoads;
          break;
        case 'size':
          const sizeOrder = { small: 0, medium: 1, large: 2 };
          comparison = sizeOrder[a.size] - sizeOrder[b.size];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [trucks, searchTerm, sortField, sortDirection, filterStatus, showInactive]);

  // Fairness statistics
  const fairnessStats = useMemo(() => {
    const active = trucks.filter(t => t.active);
    const below = active.filter(t => t.weeklyLoads < t.minWeeklyLoads);
    const at = active.filter(t => t.weeklyLoads === t.minWeeklyLoads);
    const above = active.filter(t => t.weeklyLoads > t.minWeeklyLoads);
    return {
      total: active.length,
      below: below.length,
      at: at.length,
      above: above.length,
      fairnessPercent: active.length > 0
        ? Math.round(((at.length + above.length) / active.length) * 100)
        : 0,
    };
  }, [trucks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const getStatusColor = (truck: Truck) => {
    if (!truck.active) return 'bg-gray-100 text-gray-500';
    if (truck.weeklyLoads < truck.minWeeklyLoads) return 'bg-amber-100 text-amber-800';
    if (truck.weeklyLoads === truck.minWeeklyLoads) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (truck: Truck) => {
    if (!truck.active) return 'Inactive';
    if (truck.weeklyLoads < truck.minWeeklyLoads) return 'Below Quota';
    if (truck.weeklyLoads === truck.minWeeklyLoads) return 'At Quota';
    return 'Above Quota';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Management</h2>
          <p className="text-gray-600">
            {filteredAndSortedTrucks.length} trucks
            {filterStatus !== 'all' && ` (${filterStatus} quota)`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TruckIcon className="text-jbg-primary" size={20} />
          <span className="font-medium">{trucks.filter(t => t.active).length} Active</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{trucks.filter(t => !t.active).length} Inactive</span>
        </div>
      </div>

      {/* Fairness Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Below Quota - Red */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-sm font-medium text-gray-600">Below Quota</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fairnessStats.below}</p>
          <p className="text-xs text-gray-500">Need more loads</p>
        </div>

        {/* At Quota - Yellow/Green */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={18} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">At Quota</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{fairnessStats.at}</p>
          <p className="text-xs text-gray-500">Meeting target</p>
        </div>

        {/* Above Quota - Green */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm font-medium text-gray-600">Above Quota</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fairnessStats.above}</p>
          <p className="text-xs text-gray-500">Exceeding target</p>
        </div>

        {/* Fairness Score */}
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-jbg-primary">
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} className="text-jbg-primary" />
            <span className="text-sm font-medium text-gray-600">Fairness</span>
          </div>
          <p className="text-2xl font-bold text-jbg-primary">{fairnessStats.fairnessPercent}%</p>
          <p className="text-xs text-gray-500">Trucks at/above quota</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by truck ID or contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="below">Below Quota</option>
              <option value="at">At Quota</option>
              <option value="above">Above Quota</option>
            </select>
          </div>

          {/* Show Inactive Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-jbg-primary focus:ring-jbg-primary"
            />
            <span className="text-sm text-gray-600">Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('truckId')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Truck ID
                    <SortIcon field="truckId" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('contractorName')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Contractor
                    <SortIcon field="contractorName" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('size')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Size
                    <SortIcon field="size" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th
                  onClick={() => handleSort('weeklyLoads')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Weekly Loads
                    <SortIcon field="weeklyLoads" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedTrucks.map((truck) => (
                <tr
                  key={truck.id}
                  className={`hover:bg-gray-50 ${!truck.active ? 'opacity-60' : ''}`}
                >
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
                      {truck.size.charAt(0).toUpperCase() + truck.size.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {truck.capacityTons} tons
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            truck.weeklyLoads >= truck.minWeeklyLoads
                              ? 'bg-green-500'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min((truck.weeklyLoads / truck.minWeeklyLoads) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className={
                        truck.weeklyLoads < truck.minWeeklyLoads
                          ? 'text-amber-600 font-medium'
                          : 'text-gray-600'
                      }>
                        {truck.weeklyLoads}/{truck.minWeeklyLoads}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {truck.onTimeRate !== undefined ? (
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${truck.onTimeRate >= 0.9 ? 'bg-green-100 text-green-800' :
                          truck.onTimeRate >= 0.75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}
                      `}>
                        {Math.round(truck.onTimeRate * 100)}% On-Time
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No data</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(truck)}`}>
                      {getStatusText(truck)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedTrucks.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <TruckIcon className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No trucks match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
