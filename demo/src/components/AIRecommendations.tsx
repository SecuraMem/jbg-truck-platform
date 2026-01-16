import { useMemo, useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  MapPin,
  CheckCircle,
  Zap
} from 'lucide-react';
import type { Recommendation } from '../types';

interface AIRecommendationsProps {
  recommendations: Recommendation[];
  onAcceptRecommendation?: (rec: Recommendation, index: number) => void;
}

export function AIRecommendations({ recommendations, onAcceptRecommendation }: AIRecommendationsProps) {
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());

  const handleAccept = (rec: Recommendation, index: number) => {
    setAcceptedIndices(prev => new Set([...prev, index]));
    onAcceptRecommendation?.(rec, index);
  };

  const groupedRecs = useMemo(() => {
    return {
      high: recommendations.filter(r => r.priority === 'high'),
      medium: recommendations.filter(r => r.priority === 'medium'),
      low: recommendations.filter(r => r.priority === 'low'),
    };
  }, [recommendations]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'fairness': return TrendingUp;
      case 'efficiency': return MapPin;
      case 'risk': return AlertTriangle;
      case 'cost': return DollarSign;
      default: return Lightbulb;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fairness': return 'text-blue-600 bg-blue-100';
      case 'efficiency': return 'text-green-600 bg-green-100';
      case 'risk': return 'text-red-600 bg-red-100';
      case 'cost': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500 bg-red-50';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-4 border-blue-500 bg-blue-50';
      default: return 'border-l-4 border-gray-300';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-jbg-light rounded-lg">
            <Lightbulb className="text-jbg-primary" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
            <p className="text-sm text-gray-500">Generate a schedule to see intelligent insights</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          The AI will analyze your schedule and provide recommendations for fairness, efficiency, cost savings, and risk mitigation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-jbg-light rounded-lg">
            <Lightbulb className="text-jbg-primary" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
            <p className="text-sm text-gray-500">
              {recommendations.length} insights from logistics AI
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          {groupedRecs.high.length > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              {groupedRecs.high.length} High
            </span>
          )}
          {groupedRecs.medium.length > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              {groupedRecs.medium.length} Medium
            </span>
          )}
          {groupedRecs.low.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {groupedRecs.low.length} Low
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const Icon = getIcon(rec.category);
          return (
            <div
              key={index}
              className={`p-4 rounded-lg ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(rec.category)}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{rec.issue}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                      ${rec.priority === 'high' ? 'bg-red-200 text-red-800' : ''}
                      ${rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : ''}
                      ${rec.priority === 'low' ? 'bg-blue-200 text-blue-800' : ''}
                    `}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Impact:</span> {rec.impact}
                  </p>
                  <p className="text-sm text-gray-900 mb-3">
                    <span className="font-medium">Action:</span> {rec.action}
                  </p>

                  {/* Accept Button */}
                  {onAcceptRecommendation && (
                    <div className="flex justify-end">
                      {acceptedIndices.has(index) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                          <CheckCircle size={16} />
                          Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAccept(rec, index)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-jbg-primary hover:bg-jbg-dark rounded-lg transition-colors"
                        >
                          <Zap size={16} />
                          Accept & Apply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
