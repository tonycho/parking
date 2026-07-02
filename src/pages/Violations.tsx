import React, { useState } from 'react';
import { AlertTriangle, Plus, Tag, Trash2, X } from 'lucide-react';
import { useParking } from '../hooks/useParking';
import { useViolations } from '../hooks/useViolations';
import { PageHeader } from '../components/PageHeader/PageHeader';
import SearchBar from '../components/SearchBar';
import ViolationRecordForm from '../components/ViolationRecordForm';
import { Violation } from '../types';

function Violations() {
  const { knownVehicles, parkingLot } = useParking();
  const { violations, loading, recordViolation, deleteViolation } = useViolations(parkingLot?.id || null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLicensePlate, setHistoryLicensePlate] = useState('');

  const handleRecordViolation = async (violationData: {
    licensePlate: string;
    make?: string;
    model?: string;
    color?: string;
    notes?: string;
  }) => {
    if (!parkingLot?.id) return;

    await recordViolation({
      licensePlate: violationData.licensePlate,
      make: violationData.make,
      model: violationData.model,
      color: violationData.color,
      notes: violationData.notes,
      parkingLotId: parkingLot.id,
    });

    setShowRecordModal(false);
  };

  const handleDeleteViolation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this violation record?')) {
      await deleteViolation(id);
      setSelectedViolation(null);
    }
  };

  const handleViewHistory = (licensePlate: string) => {
    setHistoryLicensePlate(licensePlate);
    setShowHistoryModal(true);
  };

  const getViolationCountByPlate = (licensePlate: string) => {
    return violations.filter(v => 
      v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
    ).length;
  };

  const filteredViolations = violations.filter(violation => {
    const query = searchQuery.toLowerCase();
    return (
      violation.licensePlate.toLowerCase().includes(query) ||
      (violation.contact && violation.contact.toLowerCase().includes(query)) ||
      (violation.make && violation.make.toLowerCase().includes(query)) ||
      (violation.model && violation.model.toLowerCase().includes(query)) ||
      (violation.phoneNumber && violation.phoneNumber.includes(query))
    );
  });

  // Group violations by license plate
  const groupedViolations = filteredViolations.reduce((acc, violation) => {
    const plate = violation.licensePlate.toLowerCase();
    if (!acc[plate]) {
      acc[plate] = {
        licensePlate: violation.licensePlate,
        make: violation.make,
        model: violation.model,
        color: violation.color,
        violations: [],
        latestViolation: violation.violationTime,
      };
    }
    acc[plate].violations.push(violation);
    
    // Update to most recent violation time and vehicle info
    if (new Date(violation.violationTime) > new Date(acc[plate].latestViolation)) {
      acc[plate].latestViolation = violation.violationTime;
      acc[plate].make = violation.make || acc[plate].make;
      acc[plate].model = violation.model || acc[plate].model;
      acc[plate].color = violation.color || acc[plate].color;
    }
    
    return acc;
  }, {} as Record<string, { 
    licensePlate: string; 
    make?: string; 
    model?: string; 
    color?: string; 
    violations: Violation[]; 
    latestViolation: string;
  }>);

  // Convert to array and sort by most recent violation
  const groupedViolationsArray = Object.values(groupedViolations).sort((a, b) => 
    new Date(b.latestViolation).getTime() - new Date(a.latestViolation).getTime()
  );

  const historyViolations = violations.filter(v => 
    v.licensePlate.toLowerCase() === historyLicensePlate.toLowerCase()
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getViolationSeverity = (count: number) => {
    if (count === 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (count <= 2) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-secondary">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
        <PageHeader
          title="Violations"
          subtitle="Loading zone violation tracking and repeat offender management."
          icon={AlertTriangle}
          rightContent={
            <button
              type="button"
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center rounded-sm border border-weak bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Violation
            </button>
          }
        />

        <div className="mb-6 shrink-0">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by license plate, contact, make, model..."
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-primary border border-weak rounded-sm overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-secondary">Loading violations...</div>
              </div>
            ) : groupedViolationsArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-secondary">
                <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No violations recorded</p>
                <p className="text-sm mt-2">Click "Record Violation" to add a new violation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedViolationsArray.map((group) => {
                  const totalCount = group.violations.length;
                  
                  return (
                    <div key={group.licensePlate} className="bg-primary border border-border-weak rounded-sm p-4 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      {/* License Plate - Header */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-weak">
                        <button
                          onClick={() => handleViewHistory(group.licensePlate)}
                          className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-lg hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Tag className="h-5 w-5 mr-2" />
                          {group.licensePlate}
                        </button>
                        <button
                          onClick={() => handleViewHistory(group.licensePlate)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getViolationSeverity(totalCount)}`}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {totalCount} {totalCount === 1 ? 'violation' : 'violations'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Vehicle Info */}
                        {(group.make || group.model) && (
                          <div>
                            <span className="text-xs text-secondary uppercase">Vehicle</span>
                            <p className="text-sm text-primary">
                              {group.make} {group.model}
                              {group.color && <span className="text-gray-500 dark:text-gray-400"> ({group.color})</span>}
                            </p>
                          </div>
                        )}
                        
                        {/* Latest Violation Time */}
                        <div>
                          <span className="text-xs text-secondary uppercase">Latest Violation</span>
                          <p className="text-sm text-primary">{formatDateTime(group.latestViolation)}</p>
                        </div>
                      </div>
                      
                      {/* Individual Violations List */}
                      <div className="mt-3 pt-3 border-t border-border-weak">
                        <span className="text-xs text-secondary uppercase mb-2 block">All Violations</span>
                        <div className="space-y-1">
                          {group.violations
                            .sort((a, b) => new Date(b.violationTime).getTime() - new Date(a.violationTime).getTime())
                            .map((violation, idx) => (
                              <div key={violation.id} className="flex items-center justify-between text-xs text-secondary py-1">
                                <span>{idx + 1}. {formatDateTime(violation.violationTime)}</span>
                                <button
                                  onClick={() => handleDeleteViolation(violation.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Violation Modal */}
      {showRecordModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowRecordModal(false)}
              />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible">
              <ViolationRecordForm
                onSubmit={handleRecordViolation}
                onCancel={() => setShowRecordModal(false)}
                knownVehicles={knownVehicles}
                violations={violations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Violation History Modal */}
      {showHistoryModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowHistoryModal(false)}
              />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
              <div className="bg-accent border-b border-weak px-4 py-4 text-inverse">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <AlertTriangle className="mr-2" size={20} />
                      Violation History
                    </h3>
                    <p className="text-sm opacity-90 mt-0.5">License Plate: {historyLicensePlate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="text-inverse hover:opacity-80 rounded-sm p-1"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Total Violations: {historyViolations.length}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historyViolations.map((violation, index) => (
                    <div 
                      key={violation.id}
                      className="p-3 border border-border-weak rounded-md bg-tertiary"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-primary">
                          Violation #{historyViolations.length - index}
                        </span>
                        <span className="text-xs text-secondary">
                          {formatDateTime(violation.violationTime)}
                        </span>
                      </div>
                      
                      {(violation.make || violation.model) && (
                        <p className="text-sm text-secondary">
                          Vehicle: {violation.make} {violation.model}
                          {violation.color && <span className="text-gray-500"> ({violation.color})</span>}
                        </p>
                      )}
                      
                      {violation.contact && (
                        <p className="text-sm text-secondary">
                          Contact: {violation.contact}
                        </p>
                      )}
                      
                      {violation.phoneNumber && (
                        <p className="text-sm text-secondary">
                          Phone: {violation.phoneNumber}
                        </p>
                      )}
                      
                      {violation.notes && (
                        <p className="text-sm text-secondary mt-2 p-2 bg-primary rounded border border-border-weak">
                          Notes: {violation.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Violations;
