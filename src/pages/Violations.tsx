import React, { useState } from 'react';
import { AlertTriangle, Plus, Tag, Phone, User, Trash2, Search, X } from 'lucide-react';
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
    contact?: string;
    notes?: string;
  }) => {
    if (!parkingLot?.id) return;

    await recordViolation({
      licensePlate: violationData.licensePlate,
      make: violationData.make,
      model: violationData.model,
      color: violationData.color,
      contact: violationData.contact,
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

      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
        <div className="mb-6 shrink-0">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by license plate, contact, make, model..."
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-primary border border-weak rounded-sm overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-secondary">Loading violations...</div>
              </div>
            ) : filteredViolations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-secondary">
                <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No violations recorded</p>
                <p className="text-sm mt-2">Click "Record Violation" to add a new violation</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border-weak">
                <thead className="sticky top-0 z-10 border-b border-weak bg-primary">
                  <tr>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Violation Time
                    </th>
                    <th className="bg-primary px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Total Count
                    </th>
                    <th className="bg-primary px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-weak">
                  {filteredViolations.map((violation) => {
                    const totalCount = getViolationCountByPlate(violation.licensePlate);
                    
                    return (
                      <tr key={violation.id} className="bg-primary hover:bg-tertiary transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            <button
                              onClick={() => handleViewHistory(violation.licensePlate)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              {violation.licensePlate}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          {violation.make && violation.model ? (
                            <div className="flex items-center">
                              {violation.make} {violation.model}
                              {violation.color && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  ({violation.color})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            {violation.contact || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            {violation.phoneNumber ? (
                              <a 
                                href={`tel:${violation.phoneNumber}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                {violation.phoneNumber}
                              </a>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                          {formatDateTime(violation.violationTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewHistory(violation.licensePlate)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getViolationSeverity(totalCount)}`}
                          >
                            {totalCount} {totalCount === 1 ? 'violation' : 'violations'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteViolation(violation.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <ViolationRecordForm
                onSubmit={handleRecordViolation}
                onCancel={() => setShowRecordModal(false)}
                knownVehicles={knownVehicles}
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
