import { useState } from 'react';
import {
  Upload,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  X
} from 'lucide-react';
import type { Truck, TruckSize } from '../types';

interface TruckImportProps {
  onImportTrucks: (trucks: Truck[]) => void;
  existingTrucks: Truck[];
}

type TabType = 'csv' | 'manual';

interface ParsedTruck {
  contractorName: string;
  size: TruckSize;
  capacityTons: number;
  weeklyLoads: number;
  active: boolean;
}

export function TruckImport({ onImportTrucks, existingTrucks }: TruckImportProps) {
  const [activeTab, setActiveTab] = useState<TabType>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTruck[] | null>(null);

  // Manual add form state
  const [manualTrucks, setManualTrucks] = useState<Array<Omit<Truck, 'id' | 'truckId' | 'minWeeklyLoads'>>>([
    {
      contractorName: '',
      size: 'medium',
      capacityTons: 10,
      weeklyLoads: 0,
      active: true,
    }
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setCsvFile(file);
      setError(null);
      setParsedData(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setError(null);
      setParsedData(null);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleParseCSV = async () => {
    if (!csvFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await csvFile.text();
      
      const response = await fetch('/api/parse-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvText: text,
          dataType: 'trucks',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse CSV');
      }

      const result = await response.json();
      setParsedData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    const nextTruckNum = existingTrucks.length + 1;
    const newTrucks: Truck[] = parsedData.map((truck, index) => {
      const truckNum = String(nextTruckNum + index).padStart(3, '0');
      return {
        id: `truck-${truckNum}`,
        truckId: `T-${truckNum}`,
        contractorName: truck.contractorName,
        size: truck.size,
        capacityTons: truck.capacityTons,
        weeklyLoads: truck.weeklyLoads,
        minWeeklyLoads: 3,
        active: truck.active,
      };
    });

    onImportTrucks(newTrucks);
    setCsvFile(null);
    setParsedData(null);
    setError(null);
  };

  const handleAddManualRow = () => {
    setManualTrucks([
      ...manualTrucks,
      {
        contractorName: '',
        size: 'medium',
        capacityTons: 10,
        weeklyLoads: 0,
        active: true,
      }
    ]);
  };

  const handleRemoveManualRow = (index: number) => {
    if (manualTrucks.length > 1) {
      setManualTrucks(manualTrucks.filter((_, i) => i !== index));
    }
  };

  const handleManualTruckChange = (index: number, field: string, value: any) => {
    const updated = [...manualTrucks];
    updated[index] = { ...updated[index], [field]: value };
    setManualTrucks(updated);
  };

  const handleSaveManualTrucks = () => {
    // Validate all trucks have contractor names
    const invalid = manualTrucks.some(t => !t.contractorName.trim());
    if (invalid) {
      setError('All trucks must have a contractor name');
      return;
    }

    const nextTruckNum = existingTrucks.length + 1;
    const newTrucks: Truck[] = manualTrucks.map((truck, index) => {
      const truckNum = String(nextTruckNum + index).padStart(3, '0');
      return {
        id: `truck-${truckNum}`,
        truckId: `T-${truckNum}`,
        contractorName: truck.contractorName,
        size: truck.size,
        capacityTons: truck.capacityTons,
        weeklyLoads: truck.weeklyLoads,
        minWeeklyLoads: 3,
        active: truck.active,
      };
    });

    onImportTrucks(newTrucks);
    
    // Reset form
    setManualTrucks([{
      contractorName: '',
      size: 'medium',
      capacityTons: 10,
      weeklyLoads: 0,
      active: true,
    }]);
    setError(null);
  };

  const downloadTemplate = () => {
    const template = `Contractor Name,Truck Size,Capacity (Tons),Current Weekly Loads,Active,On-Time Rate,Preferred Regions,Availability Notes
Winston Campbell Trucking,Large,18,4,Yes,0.92,"Kingston;Spanish Town",Available Mon-Fri
Brown Brothers Haulage,Large,20,3,Yes,0.88,"Montego Bay;Ocho Rios",Weekend availability limited
Marlon Williams Transport,Medium,12,2,Yes,0.95,"Kingston;Mandeville",Full availability
Davis & Sons Logistics,Small,6,1,Yes,0.90,Kingston,Prefers short routes`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truck-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Import Trucks</h2>
        <p className="text-gray-600">Add trucks to your fleet via CSV upload or manual entry</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('csv')}
            className={`
              px-4 py-2 border-b-2 font-medium transition-colors
              ${activeTab === 'csv'
                ? 'border-jbg-primary text-jbg-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} />
              CSV Upload
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`
              px-4 py-2 border-b-2 font-medium transition-colors
              ${activeTab === 'manual'
                ? 'border-jbg-primary text-jbg-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Plus size={18} />
              Manual Entry
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* CSV Upload Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-800 font-medium mb-1">Need a template?</p>
                <p className="text-blue-600 text-sm">
                  Download our CSV template with the correct format and sample data
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download Template
              </button>
            </div>
          </div>

          {/* Upload Area */}
          {!parsedData && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center
                transition-colors cursor-pointer
                ${csvFile
                  ? 'border-jbg-primary bg-jbg-light'
                  : 'border-gray-300 hover:border-jbg-primary hover:bg-gray-50'
                }
              `}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className={`mx-auto mb-4 ${csvFile ? 'text-jbg-primary' : 'text-gray-400'}`} size={48} />
                {csvFile ? (
                  <>
                    <p className="text-lg font-medium text-jbg-primary mb-2">
                      {csvFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Click to change file or drag another file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drop your CSV file here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse from your computer
                    </p>
                  </>
                )}
              </label>
            </div>
          )}

          {/* Parse Button */}
          {csvFile && !parsedData && (
            <div className="flex justify-center">
              <button
                onClick={handleParseCSV}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-jbg-primary text-white rounded-lg hover:bg-jbg-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    AI is Parsing Your CSV...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={20} />
                    Parse with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                  <div>
                    <p className="text-green-800 font-medium">
                      Successfully parsed {parsedData.length} trucks
                    </p>
                    <p className="text-green-600 text-sm">
                      Review the data below and confirm to add to your fleet
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contractor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Capacity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Weekly Loads</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.slice(0, 10).map((truck, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{truck.contractorName}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="capitalize">{truck.size}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">{truck.capacityTons} tons</td>
                          <td className="px-4 py-3 text-sm">{truck.weeklyLoads}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              truck.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {truck.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
                    Showing 10 of {parsedData.length} trucks
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setParsedData(null);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-jbg-primary text-white rounded-lg hover:bg-jbg-dark transition-colors"
                >
                  Confirm & Import {parsedData.length} Trucks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              Manually add up to 5 trucks at a time. For bulk imports, use the CSV Upload tab.
            </p>
          </div>

          <div className="space-y-4">
            {manualTrucks.map((truck, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Truck #{index + 1}</h3>
                  {manualTrucks.length > 1 && (
                    <button
                      onClick={() => handleRemoveManualRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contractor Name *
                    </label>
                    <input
                      type="text"
                      value={truck.contractorName}
                      onChange={(e) => handleManualTruckChange(index, 'contractorName', e.target.value)}
                      placeholder="e.g., Campbell Transport"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Truck Size *
                    </label>
                    <select
                      value={truck.size}
                      onChange={(e) => handleManualTruckChange(index, 'size', e.target.value as TruckSize)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity (Tons) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={truck.capacityTons}
                      onChange={(e) => handleManualTruckChange(index, 'capacityTons', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Weekly Loads
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={truck.weeklyLoads}
                      onChange={(e) => handleManualTruckChange(index, 'weeklyLoads', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jbg-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${index}`}
                      checked={truck.active}
                      onChange={(e) => handleManualTruckChange(index, 'active', e.target.checked)}
                      className="w-4 h-4 text-jbg-primary border-gray-300 rounded focus:ring-jbg-primary"
                    />
                    <label htmlFor={`active-${index}`} className="ml-2 text-sm text-gray-700">
                      Truck is active
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {manualTrucks.length < 5 && (
            <button
              onClick={handleAddManualRow}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-jbg-primary hover:bg-jbg-light transition-colors w-full justify-center"
            >
              <Plus size={20} />
              Add Another Truck
            </button>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setManualTrucks([{
                  contractorName: '',
                  size: 'medium',
                  capacityTons: 10,
                  weeklyLoads: 0,
                  active: true,
                }]);
                setError(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSaveManualTrucks}
              className="px-6 py-2 bg-jbg-primary text-white rounded-lg hover:bg-jbg-dark transition-colors"
            >
              Save {manualTrucks.length} {manualTrucks.length === 1 ? 'Truck' : 'Trucks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
