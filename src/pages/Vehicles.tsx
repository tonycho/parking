import React, { useMemo, useState } from 'react';
import {
  parkingSpotPickerGreenClass,
  parkingSpotPickerOrangeClass,
} from '../constants/parkingSpotPalette';
import { useParking } from '../hooks/useParking';
import { useViolations } from '../hooks/useViolations';
import SearchBar from '../components/SearchBar';
import {
  SortableTableHeader,
  SortDirection,
  compareStrings,
  mobileSortDirectionClassName,
  mobileSortSelectClassName,
} from '../components/SortableTableHeader';
import { formatLicensePlate } from '../lib/formatLicensePlate';
import {
  Car,
  Phone,
  Tag,
  X,
  Trash2,
  Plus,
  ParkingSquare,
  MessageSquare,
  Loader2,
  AlertTriangle,
  BellRing,
} from 'lucide-react';
import VehicleForm from '../components/VehicleForm';
import { apiFetchJson } from '../lib/apiFetch';
import {
  PageHeader,
  pageBodyScrollClassName,
  pageBodyScrollInnerClassName,
} from '../components/PageHeader/PageHeader';

type VehicleSortKey = 'licensePlate' | 'vehicle' | 'contact' | 'phone' | 'spot' | 'violations';

function Vehicles() {
  const { knownVehicles, parkingLot, updateVehicle, removeVehicle, deleteVehicle, vehicles } = useParking();
  const { violations } = useViolations(parkingLot?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof knownVehicles[0] | null>(null);
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<{ licensePlate: string; type: 'success' | 'error'; message: string } | null>(null);
  const [sort, setSort] = useState<{ key: VehicleSortKey; direction: SortDirection }>({
    key: 'licensePlate',
    direction: 'asc',
  });

  const handleSort = (key: VehicleSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const getParkedSpot = (licensePlate: string) => {
    const parkedVehicle = vehicles.find(v => v.licensePlate === licensePlate);
    if (parkedVehicle) {
      const spot = parkingLot.spots.find(s => s.id === parkedVehicle.parkingSpotId);
      return {
        label: spot?.label,
        priority: spot?.priority,
        id: spot?.id
      };
    }
    return null;
  };

  const getVehicleBySpotId = (spotId: string) => {
    return vehicles.find(v => v.parkingSpotId === spotId);
  };

  const allSpots = parkingLot.spots.sort((a, b) => a.order - b.order);

  const handlePark = (vehicle: typeof knownVehicles[0]) => {
    setSelectedVehicle(vehicle);
    setShowParkingModal(true);
  };

  const handleSpotSelect = async (spotId: string) => {
    if (selectedVehicle) {
      // Get the currently parked vehicle data if it exists
      const parkedVehicle = vehicles.find(v => v.licensePlate === selectedVehicle.licensePlate);
      
      // If the vehicle is already parked, include its ID in the update
      const vehicleData = {
        ...selectedVehicle,
        ...(parkedVehicle && { id: parkedVehicle.id }),
        parkingSpotId: spotId,
        timeParked: new Date().toISOString()
      };

      await updateVehicle(vehicleData, spotId);
      setShowParkingModal(false);
      setSelectedVehicle(null);
    }
  };

  const handleDelete = async (licensePlate: string) => {
    try {
      await deleteVehicle(licensePlate);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleAddVehicle = async (vehicleData: any) => {
    try {
      await updateVehicle(vehicleData, '');
      setShowAddVehicleModal(false);
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleEditVehicle = async (vehicleData: any) => {
    try {
      await updateVehicle(vehicleData, '');
      setShowEditModal(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  const handleRemoveFromSpot = async (spotId: string) => {
    try {
      await removeVehicle(spotId);
    } catch (error) {
      console.error('Error removing vehicle from spot:', error);
    }
  };

  const handleSendReminder = async (vehicle: typeof knownVehicles[0]) => {
    if (!vehicle.phoneNumber || vehicle.phoneNumber.length !== 10) {
      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'error', 
        message: 'Valid phone number required' 
      });
      return;
    }

    const parkedSpot = getParkedSpot(vehicle.licensePlate);
    
    setSendingReminder(vehicle.licensePlate);
    setReminderStatus(null);

    try {
      await apiFetchJson('/api/send-reminder', {
        method: 'POST',
        body: {
          phoneNumber: vehicle.phoneNumber,
          contact: vehicle.contact,
          licensePlate: formatLicensePlate(vehicle.licensePlate),
          spotLabel: parkedSpot?.label,
        },
      });

      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'success', 
        message: 'Reminder sent!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setReminderStatus(prev => 
          prev?.licensePlate === vehicle.licensePlate ? null : prev
        );
      }, 3000);
    } catch (error) {
      setReminderStatus({ 
        licensePlate: vehicle.licensePlate, 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send' 
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Silver': '#C0C0C0',
      'Gray': '#808080',
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Brown': '#964B00',
      'Green': '#008000',
      'Beige': '#F5F5DC',
      'Gold': '#FFD700',
      'Orange': '#FFA500',
      'Yellow': '#FFFF00',
      'Purple': '#800080'
    };
    return colorMap[colorName] || '#808080';
  };

  const getViolationCountForVehicle = (licensePlate: string) => {
    return violations.filter(v => 
      v.licensePlate.toLowerCase() === licensePlate.toLowerCase()
    ).length;
  };

  const getViolationSeverityClass = (count: number) => {
    if (count === 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (count <= 2) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = knownVehicles.filter((vehicle) => {
      return (
        vehicle.contact.toLowerCase().includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        vehicle.color.toLowerCase().includes(query) ||
        vehicle.phoneNumber.includes(query)
      );
    });

    const dir = sort.direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case 'licensePlate':
          cmp = compareStrings(a.licensePlate, b.licensePlate);
          break;
        case 'vehicle':
          cmp = compareStrings(`${a.make} ${a.model}`.trim(), `${b.make} ${b.model}`.trim());
          break;
        case 'contact':
          cmp = compareStrings(a.contact || '', b.contact || '');
          break;
        case 'phone':
          cmp = compareStrings(a.phoneNumber || '', b.phoneNumber || '');
          break;
        case 'spot': {
          const spotA = getParkedSpot(a.licensePlate)?.label ?? '';
          const spotB = getParkedSpot(b.licensePlate)?.label ?? '';
          if (!spotA && !spotB) cmp = 0;
          else if (!spotA) cmp = 1;
          else if (!spotB) cmp = -1;
          else cmp = compareStrings(spotA, spotB);
          break;
        }
        case 'violations':
          cmp =
            getViolationCountForVehicle(a.licensePlate) - getViolationCountForVehicle(b.licensePlate);
          break;
      }
      return cmp * dir;
    });
  }, [knownVehicles, searchQuery, sort, violations, vehicles, parkingLot]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-secondary">
      <PageHeader
        title="Vehicles"
        subtitle="Manage the vehicle directory, parking assignments, and SMS reminders."
        rightContent={
            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="inline-flex items-center rounded-sm border border-weak bg-accent px-4 py-2 text-sm font-medium text-inverse hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add vehicle
            </button>
        }
      />

      <div className={pageBodyScrollClassName}>
        <div className={pageBodyScrollInnerClassName}>
        <div className="mb-4 shrink-0 sm:mb-6">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by contact, license plate, make, model..."
          />
        </div>

        <div className="overflow-hidden rounded-sm border border-weak bg-primary">
            {filteredVehicles.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-secondary">
                No vehicles found
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-weak px-4 py-3 md:hidden">
                  <span className="text-xs font-medium uppercase tracking-wider text-secondary">Sort by</span>
                  <select
                    value={sort.key}
                    onChange={(e) =>
                      setSort((prev) => ({ ...prev, key: e.target.value as VehicleSortKey }))
                    }
                    className={mobileSortSelectClassName}
                    aria-label="Sort vehicles by"
                  >
                    <option value="licensePlate">License plate</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="contact">Contact</option>
                    <option value="phone">Phone</option>
                    <option value="spot">Current spot</option>
                    <option value="violations">Violations</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSort((prev) => ({
                        ...prev,
                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                      }))
                    }
                    className={mobileSortDirectionClassName}
                    aria-label={sort.direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
                  >
                    {sort.direction === 'asc' ? 'A → Z' : 'Z → A'}
                  </button>
                </div>

                <div className="divide-y divide-border-weak md:hidden">
                  {filteredVehicles.map((vehicle) => {
                    const parkedSpot = getParkedSpot(vehicle.licensePlate);
                    const colorHex = getColorHex(vehicle.color);
                    const violationCount = getViolationCountForVehicle(vehicle.licensePlate);

                    return (
                      <div key={vehicle.licensePlate} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowEditModal(true);
                            }}
                            className="inline-flex min-w-0 items-center gap-1.5 text-left text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Tag className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                            {formatLicensePlate(vehicle.licensePlate)}
                          </button>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${getViolationSeverityClass(violationCount)}`}
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                            {violationCount}
                          </span>
                        </div>
                        <p className="inline-flex items-center text-sm text-secondary">
                          <Car className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                          {vehicle.make} {vehicle.model}
                          <span
                            className="ml-2 inline-block h-4 w-4 shrink-0 rounded-full"
                            style={{
                              backgroundColor: colorHex,
                              border: vehicle.color === 'White' ? '1px solid #e5e7eb' : 'none',
                            }}
                            title={vehicle.color}
                          />
                        </p>
                        <p className="text-sm text-secondary">
                          {vehicle.contact || '-'}
                          {vehicle.notifyOnArrival && (
                            <BellRing
                              className="ml-2 inline h-4 w-4 text-accent"
                              aria-label="Welcome team alert on"
                              title={vehicle.arrivalNote || 'Welcome team is notified when this vehicle parks'}
                            />
                          )}
                        </p>
                        <p className="inline-flex items-center text-sm text-secondary">
                          <Phone className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                          {vehicle.phoneNumber ? (
                            <a
                              href={`tel:${vehicle.phoneNumber}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {vehicle.phoneNumber}
                            </a>
                          ) : (
                            '-'
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePark(vehicle)}
                            className={`inline-flex items-center rounded-sm border border-weak px-3 py-1.5 text-sm transition-colors ${
                              parkedSpot
                                ? parkedSpot.priority === 2
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <ParkingSquare className="mr-1 h-4 w-4" aria-hidden />
                            {parkedSpot ? `Spot ${parkedSpot.label}` : 'Park vehicle'}
                          </button>
                          {parkedSpot && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFromSpot(parkedSpot.id)}
                              className="inline-flex items-center rounded-xs p-1.5 text-secondary hover:text-primary"
                              title="Remove from spot"
                              aria-label="Remove from spot"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {vehicle.phoneNumber && vehicle.phoneNumber.length === 10 && (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(vehicle)}
                              disabled={sendingReminder === vehicle.licensePlate}
                              className="inline-flex items-center rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sendingReminder === vehicle.licensePlate ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="mr-1 h-4 w-4" />
                              )}
                              {sendingReminder === vehicle.licensePlate ? 'Sending…' : 'Remind'}
                            </button>
                          )}
                          {reminderStatus?.licensePlate === vehicle.licensePlate && (
                            <span
                              className={`text-xs ${
                                reminderStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {reminderStatus.message}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(vehicle.licensePlate)}
                            className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-border-weak">
                    <thead className="sticky top-0 z-10 border-b border-weak bg-primary">
                      <tr>
                        <SortableTableHeader
                          label="License Plate"
                          sortKey="licensePlate"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Vehicle"
                          sortKey="vehicle"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Contact"
                          sortKey="contact"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Phone"
                          sortKey="phone"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Current Spot"
                          sortKey="spot"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Violations"
                          sortKey="violations"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <th
                          scope="col"
                          className="bg-primary px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-weak">
                      {filteredVehicles.map((vehicle) => {
                        const parkedSpot = getParkedSpot(vehicle.licensePlate);
                        const colorHex = getColorHex(vehicle.color);

                        return (
                          <tr key={vehicle.licensePlate} className="bg-primary transition-colors hover:bg-tertiary">
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 lg:px-6">
                              <div className="flex items-center">
                                <Tag className="mr-2 h-4 w-4 text-gray-400" aria-hidden />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVehicle(vehicle);
                                    setShowEditModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  {formatLicensePlate(vehicle.licensePlate)}
                                </button>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 lg:px-6">
                              <div className="flex items-center">
                                <Car className="mr-2 h-4 w-4 text-gray-400" aria-hidden />
                                {vehicle.make} {vehicle.model}
                                <div
                                  className="ml-2 h-4 w-4 rounded-full"
                                  style={{
                                    backgroundColor: colorHex,
                                    border: vehicle.color === 'White' ? '1px solid #e5e7eb' : 'none',
                                  }}
                                  title={vehicle.color}
                                />
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 lg:px-6">
                              <div className="flex items-center">
                                {vehicle.contact || '-'}
                                {vehicle.notifyOnArrival && (
                                  <span
                                    title={
                                      vehicle.arrivalNote ||
                                      'Welcome team is notified when this vehicle parks'
                                    }
                                  >
                                    <BellRing
                                      className="ml-2 h-4 w-4 text-accent"
                                      aria-label="Welcome team alert on"
                                    />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 lg:px-6">
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-gray-400" aria-hidden />
                                {vehicle.phoneNumber ? (
                                  <a
                                    href={`tel:${vehicle.phoneNumber}`}
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {vehicle.phoneNumber}
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 lg:px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handlePark(vehicle)}
                                  className={`inline-flex items-center rounded-sm border border-weak px-3 py-1.5 transition-colors ${
                                    parkedSpot
                                      ? parkedSpot.priority === 2
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  <ParkingSquare className="mr-1 h-4 w-4" />
                                  {parkedSpot ? `Spot ${parkedSpot.label}` : 'Park Vehicle'}
                                </button>
                                {parkedSpot && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromSpot(parkedSpot.id)}
                                    className="inline-flex items-center text-gray-500 transition-colors hover:text-gray-700"
                                    title="Remove from spot"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm lg:px-6">
                              {(() => {
                                const violationCount = getViolationCountForVehicle(vehicle.licensePlate);
                                return (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getViolationSeverityClass(violationCount)}`}
                                  >
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    {violationCount}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium lg:px-6">
                              <div className="flex items-center justify-end space-x-2">
                                {vehicle.phoneNumber && vehicle.phoneNumber.length === 10 && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSendReminder(vehicle)}
                                      disabled={sendingReminder === vehicle.licensePlate}
                                      className="inline-flex items-center rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Send move reminder SMS"
                                    >
                                      {sendingReminder === vehicle.licensePlate ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      ) : (
                                        <MessageSquare className="mr-1 h-4 w-4" />
                                      )}
                                      {sendingReminder === vehicle.licensePlate ? 'Sending...' : 'Remind'}
                                    </button>
                                    {reminderStatus?.licensePlate === vehicle.licensePlate && (
                                      <span
                                        className={`text-xs ${
                                          reminderStatus.type === 'success'
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }`}
                                      >
                                        {reminderStatus.message}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowDeleteConfirm(vehicle.licensePlate)}
                                  className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
                                >
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowAddVehicleModal(false)}
              />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <VehicleForm
                spot={{ id: '', label: '', status: 'available', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, priority: 1, order: 0 }}
                onSave={handleAddVehicle}
                onCancel={() => setShowAddVehicleModal(false)}
                knownVehicles={knownVehicles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:px-4 sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                }}
              />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <VehicleForm
                spot={{ id: '', label: '', status: 'available', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, priority: 1, order: 0 }}
                existingVehicle={{
                  id: '',
                  ...selectedVehicle,
                  parkingSpotId: '',
                  timeParked: new Date().toISOString()
                }}
                onSave={handleEditVehicle}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedVehicle(null);
                }}
                knownVehicles={knownVehicles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Parking Spot Selection Modal */}
      {showParkingModal && selectedVehicle && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowParkingModal(false)}
              />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-primary">
                        Select parking spot
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowParkingModal(false)}
                        className="text-secondary hover:text-primary rounded-sm p-1 hover:bg-tertiary"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-secondary mb-4">
                        Vehicle: {selectedVehicle.make} {selectedVehicle.model} (
                        {formatLicensePlate(selectedVehicle.licensePlate)})
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {allSpots.map(spot => {
                          const occupyingVehicle = getVehicleBySpotId(spot.id);
                          const isOccupied = spot.status === 'occupied';
                          const isCurrentVehicleSpot = occupyingVehicle?.licensePlate === selectedVehicle.licensePlate;
                          
                          return (
                            <button
                              type="button"
                              key={spot.id}
                              onClick={() => !isOccupied && handleSpotSelect(spot.id)}
                              disabled={isOccupied && !isCurrentVehicleSpot}
                              className={`p-4 text-center rounded-sm border-2 transition-colors relative ${
                                isOccupied
                                  ? isCurrentVehicleSpot
                                    ? 'border-blue-600 bg-blue-100'
                                    : 'border-red-600 bg-red-100 cursor-not-allowed'
                                  : spot.priority === 2
                                    ? parkingSpotPickerGreenClass
                                    : parkingSpotPickerOrangeClass
                              }`}
                            >
                              <div>{spot.label}</div>
                              {isOccupied && !isCurrentVehicleSpot && (
                                <div className="text-xs mt-1 text-red-600 font-medium">
                                  {occupyingVehicle?.contact || 'Occupied'}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none align-bottom overflow-hidden rounded-sm border border-weak bg-primary text-left transform transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-weak sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-danger" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary">
                      Delete vehicle
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-secondary">
                        Are you sure you want to delete this vehicle? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-tertiary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-weak">
                <button
                  type="button"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="w-full inline-flex justify-center rounded-sm border border-transparent px-4 py-2 bg-danger text-base font-medium text-inverse hover:bg-danger-hover focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-sm border border-weak px-4 py-2 bg-primary text-base font-medium text-primary hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
