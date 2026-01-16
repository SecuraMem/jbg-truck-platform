import { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TruckList } from './components/TruckList';
import { LoadList } from './components/LoadList';
import { ChatInterface } from './components/ChatInterface';
import { TruckImport } from './components/TruckImport';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialTrucks } from './data/initialTrucks';
import { initialLoads } from './data/initialLoads';
import type { Truck, Load, ChatMessage, Assignment } from './types';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  // Persistent state with localStorage
  const [trucks, setTrucks] = useLocalStorage<Truck[]>('jbg-trucks', initialTrucks);
  const [loads, setLoads] = useLocalStorage<Load[]>('jbg-loads', initialLoads);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('jbg-chat', []);

  // Handle schedule generation results
  const handleScheduleGenerated = useCallback((assignments: Assignment[]) => {
    // Update loads with assignments
    setLoads(prevLoads => {
      const updatedLoads = [...prevLoads];
      for (const assignment of assignments) {
        const loadIndex = updatedLoads.findIndex(l => l.loadId === assignment.loadId);
        if (loadIndex !== -1) {
          // Find the truck by truckId
          const truck = trucks.find(t => t.truckId === assignment.truckId);
          if (truck) {
            updatedLoads[loadIndex] = {
              ...updatedLoads[loadIndex],
              status: 'assigned',
              assignedTruckId: truck.id,
            };
          }
        }
      }
      return updatedLoads;
    });

    // Update truck weekly loads
    setTrucks(prevTrucks => {
      const updatedTrucks = [...prevTrucks];
      for (const assignment of assignments) {
        const truckIndex = updatedTrucks.findIndex(t => t.truckId === assignment.truckId);
        if (truckIndex !== -1) {
          updatedTrucks[truckIndex] = {
            ...updatedTrucks[truckIndex],
            weeklyLoads: updatedTrucks[truckIndex].weeklyLoads + 1,
          };
        }
      }
      return updatedTrucks;
    });
  }, [trucks, setLoads, setTrucks]);

  // Handle adding new loads
  const handleAddLoad = useCallback((loadData: Omit<Load, 'id' | 'loadId' | 'status' | 'assignedTruckId'>) => {
    const newLoadNum = loads.length + 1001;
    const newLoad: Load = {
      id: `load-${newLoadNum}`,
      loadId: `L-${newLoadNum}`,
      ...loadData,
      status: 'unassigned',
      assignedTruckId: null,
    };
    setLoads(prev => [...prev, newLoad]);
  }, [loads.length, setLoads]);

  // Handle new chat messages
  const handleNewMessage = useCallback((message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  }, [setChatHistory]);

  // Handle truck import
  const handleImportTrucks = useCallback((newTrucks: Truck[]) => {
    setTrucks(prev => [...prev, ...newTrucks]);
  }, [setTrucks]);

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            trucks={trucks}
            loads={loads}
            onScheduleGenerated={handleScheduleGenerated}
          />
        );
      case 'trucks':
        return <TruckList trucks={trucks} />;
      case 'loads':
        return (
          <LoadList
            loads={loads}
            trucks={trucks}
            onAddLoad={handleAddLoad}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            trucks={trucks}
            loads={loads}
            chatHistory={chatHistory}
            onNewMessage={handleNewMessage}
          />
        );
      case 'import':
        return (
          <TruckImport
            onImportTrucks={handleImportTrucks}
            existingTrucks={trucks}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
