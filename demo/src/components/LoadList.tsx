import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Package,
  MapPin,
  Clock,
  Truck,
  X,
  LayoutGrid,
  Map
} from 'lucide-react';
import type { Load, LoadPriority, Truck as TruckType } from '../types';
import { getRegion, groupByRegion, REGION_CONFIG, type JamaicaRegion } from '../utils/regions';

interface LoadListProps {
  loads: Load[];
  trucks: TruckType[];
  onAddLoad: (load: Omit<Load, 'id' | 'loadId' | 'status' | 'assignedTruckId'>) => void;
}

type FilterPriority = 'all' | LoadPriority;
type FilterAssignment = 'all' | 'unassigned' | 'assigned';
type ViewMode = 'grid' | 'region';

export function LoadList({ loads, trucks, onAddLoad }: LoadListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterAssignment, setFilterAssignment] = useState<FilterAssignment>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // New load form state
  const [newLoad, setNewLoad] = useState({
    sizeTons: 5,
    destination: '',
    origin: 'JBG Kingston Depot',
    priority: 'normal' as LoadPriority,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const filteredLoads = useMemo(() => {
    let result = [...loads];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.loadId.toLowerCase().includes(term) ||
        l.destination.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term)
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter(l => l.priority === filterPriority);
    }

    // Assignment filter
    if (filterAssignment !== 'all') {
      result = result.filter(l =>
        filterAssignment === 'unassigned'
          ? l.status === 'unassigned'
          : l.status !== 'unassigned'
      );
    }

    // Sort by priority then deadline
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    result.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return result;
  }, [loads, searchTerm, filterPriority, filterAssignment]);

  // Group loads by region for regional view
  const groupedLoads = useMemo(() => {
    return groupByRegion(filteredLoads);
  }, [filteredLoads]);

  // Region stats for summary
  const regionStats = useMemo(() => {
    const stats: Record<JamaicaRegion, { total: number; unassigned: number }> = {
      'Kingston Metro': { total: 0, unassigned: 0 },
      'Western': { total: 0, unassigned: 0 },
      'North Coast': { total: 0, unassigned: 0 },
      'Central': { total: 0, unassigned: 0 },
      'Eastern': { total: 0, unassigned: 0 },
    };
    for (const load of loads) {
      const region = getRegion(load.destination);
      stats[region].total++;
      if (load.status === 'unassigned') {
        stats[region].unassigned++;
      }
    }
    return stats;
  }, [loads]);

  const getTruckForLoad = (load: Load): TruckType | undefined => {
    if (!load.assignedTruckId) return undefined;
    return trucks.find(t => t.id === load.assignedTruckId);
  };

  const getPriorityColor = (priority: LoadPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-600';
    }
  };

  const handleAddLoad = () => {
    if (!newLoad.destination.trim()) return;
    onAddLoad(newLoad);
    setNewLoad({
      sizeTons: 5,
      destination: '',
      origin: 'JBG Kingston Depot',
      priority: 'normal',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
    });
    setShowAddModal(false);
  };

  const unassignedCount = loads.filter(l => l.status === 'unassigned').length;
  const assignedCount = loads.filter(l => l.status !== 'unassigned').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Load Management</h2>
          <p className="text-gray-600">
            {unassignedCount} unassigned, {assignedCount} assigned
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-jbg-primary text-white rounded-lg hover:bg-jbg-dark transition-colors"
        >
          <Plus size={20} />
          Add Load
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by load ID, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Assignment Filter */}
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value as FilterAssignment)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
          >
            <option value="all">All Loads</option>
            <option value="unassigned">Unassigned Only</option>
            <option value="assigned">Assigned Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-jbg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('region')}
              className={`px-3 py-2 flex items-center gap-1 ${
                viewMode === 'region'
                  ? 'bg-jbg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Regional View"
            >
              <Map size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Region Summary Bar */}
      {viewMode === 'region' && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(REGION_CONFIG) as JamaicaRegion[]).map(region => {
            const info = REGION_CONFIG[region];
            const stats = regionStats[region];
            if (stats.total === 0) return null;
            return (
              <div
                key={region}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${info.bgColor} ${info.color} border ${info.borderColor}`}
              >
                {region}: {stats.unassigned}/{stats.total} unassigned
              </div>
            );
          })}
        </div>
      )}

      {/* Loads Display - Grid or Regional */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoads.map((load) => {
          const assignedTruck = getTruckForLoad(load);
          return (
            <div
              key={load.id}
              className={`
                bg-white rounded-xl shadow-md p-5 border-l-4
                ${load.status === 'unassigned' ? 'border-amber-500' : 'border-green-500'}
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{load.loadId}</h3>
                  <p className="text-sm text-gray-500">{load.sizeTons} tons</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(load.priority)}`}>
                  {load.priority}
                </span>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin size={16} className="flex-shrink-0" />
                <span className="text-sm">{load.destination}</span>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <Clock size={16} className="flex-shrink-0" />
                <span className="text-sm">Due: {new Date(load.deadline).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              {load.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {load.description}
                </p>
              )}

              {/* Assignment Status */}
              <div className={`
                mt-3 pt-3 border-t border-gray-100
                flex items-center gap-2
                ${load.status === 'unassigned' ? 'text-amber-600' : 'text-green-600'}
              `}>
                {load.status === 'unassigned' ? (
                  <>
                    <Package size={16} />
                    <span className="text-sm font-medium">Awaiting Assignment</span>
                  </>
                ) : (
                  <>
                    <Truck size={16} />
                    <span className="text-sm font-medium">
                      Assigned to {assignedTruck?.truckId || 'Unknown'}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* Regional View */
        <div className="space-y-6">
          {(Object.keys(REGION_CONFIG) as JamaicaRegion[]).map(region => {
            const regionLoads = groupedLoads[region];
            if (regionLoads.length === 0) return null;
            const info = REGION_CONFIG[region];

            return (
              <div key={region} className={`rounded-xl border-2 ${info.borderColor} overflow-hidden`}>
                {/* Region Header */}
                <div className={`px-4 py-3 ${info.bgColor} ${info.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Map size={20} />
                    <h3 className="font-semibold">{region}</h3>
                  </div>
                  <span className="text-sm">
                    {regionLoads.filter(l => l.status === 'unassigned').length} unassigned / {regionLoads.length} total
                  </span>
                </div>

                {/* Region Loads */}
                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regionLoads.map(load => {
                    const assignedTruck = getTruckForLoad(load);
                    return (
                      <div
                        key={load.id}
                        className={`
                          rounded-lg p-3 border
                          ${load.status === 'unassigned'
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-green-300 bg-green-50'}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{load.loadId}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(load.priority)}`}>
                            {load.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          <MapPin size={14} className="inline mr-1" />
                          {load.destination} • {load.sizeTons}T
                        </div>
                        <div className={`text-xs font-medium ${
                          load.status === 'unassigned' ? 'text-amber-700' : 'text-green-700'
                        }`}>
                          {load.status === 'unassigned'
                            ? 'Awaiting Assignment'
                            : `→ ${assignedTruck?.truckId || 'Assigned'}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredLoads.length === 0 && (
        <div className="bg-white rounded-xl shadow-md px-6 py-12 text-center text-gray-500">
          <Package className="mx-auto mb-4 text-gray-300" size={48} />
          <p>No loads match your filters</p>
        </div>
      )}

      {/* Add Load Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Load</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination *
                </label>
                <input
                  type="text"
                  value={newLoad.destination}
                  onChange={(e) => setNewLoad(l => ({ ...l, destination: e.target.value }))}
                  placeholder="e.g., Kingston, Montego Bay"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size (tons)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newLoad.sizeTons}
                  onChange={(e) => setNewLoad(l => ({ ...l, sizeTons: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newLoad.priority}
                  onChange={(e) => setNewLoad(l => ({ ...l, priority: e.target.value as LoadPriority }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                >
                  <option value="high">High (KFC, Hotels, Resorts)</option>
                  <option value="normal">Normal (Supermarkets)</option>
                  <option value="low">Low (Small Retailers)</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newLoad.deadline}
                  onChange={(e) => setNewLoad(l => ({ ...l, deadline: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newLoad.description}
                  onChange={(e) => setNewLoad(l => ({ ...l, description: e.target.value }))}
                  placeholder="e.g., KFC Kingston - Cross Roads"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLoad}
                disabled={!newLoad.destination.trim()}
                className={`
                  flex-1 px-4 py-2 rounded-lg transition-colors
                  ${newLoad.destination.trim()
                    ? 'bg-jbg-primary text-white hover:bg-jbg-dark'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Add Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
