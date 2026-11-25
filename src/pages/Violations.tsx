import React, { useMemo, useState } from 'react';
import { AlertTriangle, Car, Plus, Tag, Trash2, X } from 'lucide-react';
import { useParking } from '../hooks/useParking';
import { useViolations } from '../hooks/useViolations';
import {
  PageHeader,
  pageBodyScrollClassName,
  pageBodyScrollInnerClassName,
} from '../components/PageHeader/PageHeader';
import SearchBar from '../components/SearchBar';
import ViolationRecordForm from '../components/ViolationRecordForm';
import {
  SortableTableHeader,
  SortDirection,
  compareStrings,
  mobileSortDirectionClassName,
  mobileSortSelectClassName,
} from '../components/SortableTableHeader';
import { Violation } from '../types';
import { formatLicensePlate } from '../lib/formatLicensePlate';

type ViolationSortKey = 'licensePlate' | 'vehicle' | 'count' | 'latest' | 'contact';

type GroupedViolation = {
  licensePlate: string;
  make?: string;
  model?: string;
  color?: string;
  contact?: string;
  phoneNumber?: string;
  violations: Violation[];
  latestViolation: string;
};

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getViolationSeverityClass(count: number) {
  if (count === 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  if (count <= 2) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
  return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
}

function Violations() {
  const { knownVehicles, parkingLot } = useParking();
  const { violations, loading, recordViolation, deleteViolation } = useViolations(parkingLot?.id || null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLicensePlate, setHistoryLicensePlate] = useState('');
  const [sort, setSort] = useState<{ key: ViolationSortKey; direction: SortDirection }>({
    key: 'latest',
    direction: 'desc',
  });

  const handleSort = (key: ViolationSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'latest' || key === 'count' ? 'desc' : 'asc' }
    );
  };

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
    }
  };

  const handleViewHistory = (licensePlate: string) => {
    setHistoryLicensePlate(licensePlate);
    setShowHistoryModal(true);
  };

  const sortedGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = violations.filter((violation) => {
      return (
        violation.licensePlate.toLowerCase().includes(query) ||
        (violation.contact && violation.contact.toLowerCase().includes(query)) ||
        (violation.make && violation.make.toLowerCase().includes(query)) ||
        (violation.model && violation.model.toLowerCase().includes(query)) ||
        (violation.phoneNumber && violation.phoneNumber.includes(query))
      );
    });

    const grouped = filtered.reduce(
      (acc, violation) => {
        const plateKey = violation.licensePlate.toLowerCase();
        if (!acc[plateKey]) {
          acc[plateKey] = {
            licensePlate: formatLicensePlate(violation.licensePlate),
            make: violation.make,
            model: violation.model,
            color: violation.color,
            contact: violation.contact,
            phoneNumber: violation.phoneNumber,
            violations: [],
            latestViolation: violation.violationTime,
          };
        }
        acc[plateKey].violations.push(violation);

        if (new Date(violation.violationTime) > new Date(acc[plateKey].latestViolation)) {
          acc[plateKey].latestViolation = violation.violationTime;
          acc[plateKey].make = violation.make || acc[plateKey].make;
          acc[plateKey].model = violation.model || acc[plateKey].model;
          acc[plateKey].color = violation.color || acc[plateKey].color;
          acc[plateKey].contact = violation.contact || acc[plateKey].contact;
          acc[plateKey].phoneNumber = violation.phoneNumber || acc[plateKey].phoneNumber;
        }

        return acc;
      },
      {} as Record<string, GroupedViolation>
    );

    const dir = sort.direction === 'asc' ? 1 : -1;

    return Object.values(grouped).sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case 'licensePlate':
          cmp = compareStrings(a.licensePlate, b.licensePlate);
          break;
        case 'vehicle':
          cmp = compareStrings(
            `${a.make ?? ''} ${a.model ?? ''}`.trim(),
            `${b.make ?? ''} ${b.model ?? ''}`.trim()
          );
          break;
        case 'count':
          cmp = a.violations.length - b.violations.length;
          break;
        case 'latest':
          cmp = new Date(a.latestViolation).getTime() - new Date(b.latestViolation).getTime();
          break;
        case 'contact':
          cmp = compareStrings(a.contact ?? '', b.contact ?? '');
          break;
      }
      return cmp * dir;
    });
  }, [violations, searchQuery, sort]);

  const historyViolations = violations
    .filter((v) => v.licensePlate.toLowerCase() === historyLicensePlate.toLowerCase())
    .sort((a, b) => new Date(b.violationTime).getTime() - new Date(a.violationTime).getTime());

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-secondary">
      <PageHeader
        title="Violations"
        subtitle="Loading zone violation tracking and repeat offender management."
        rightContent={
          <button
            type="button"
            onClick={() => setShowRecordModal(true)}
            className="inline-flex items-center rounded-sm border border-weak bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Violation
          </button>
        }
      />

      <div className={pageBodyScrollClassName}>
        <div className={pageBodyScrollInnerClassName}>
          <div className="mb-4 shrink-0 sm:mb-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search plate, contact, vehicle..."
            />
          </div>

          <div className="overflow-hidden rounded-sm border border-weak bg-primary">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-sm bg-tertiary" />
                ))}
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-secondary">
                <AlertTriangle className="mb-4 h-12 w-12 opacity-50" aria-hidden />
                <p className="text-sm">No violations found.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b border-weak px-4 py-3 md:hidden">
                  <span className="text-xs font-medium uppercase tracking-wider text-secondary">Sort by</span>
                  <select
                    value={sort.key}
                    onChange={(e) =>
                      setSort((prev) => ({ ...prev, key: e.target.value as ViolationSortKey }))
                    }
                    className={mobileSortSelectClassName}
                    aria-label="Sort violations by"
                  >
                    <option value="latest">Latest violation</option>
                    <option value="licensePlate">License plate</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="count">Violation count</option>
                    <option value="contact">Contact</option>
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
                  {sortedGroups.map((group) => {
                    const totalCount = group.violations.length;
                    return (
                      <div key={group.licensePlate} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewHistory(group.licensePlate)}
                            className="inline-flex min-w-0 items-center gap-1.5 text-left text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Tag className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                            {formatLicensePlate(group.licensePlate)}
                          </button>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${getViolationSeverityClass(totalCount)}`}
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                            {totalCount}
                          </span>
                        </div>
                        {(group.make || group.model) && (
                          <p className="inline-flex items-center text-sm text-secondary">
                            <Car className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                            {group.make} {group.model}
                            {group.color && (
                              <span className="ml-1 text-secondary">({group.color})</span>
                            )}
                          </p>
                        )}
                        <p className="text-sm text-secondary">
                          Latest: {formatDateTime(group.latestViolation)}
                        </p>
                        {group.contact && (
                          <p className="text-sm text-secondary">{group.contact}</p>
                        )}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleViewHistory(group.licensePlate)}
                            className="inline-flex items-center rounded-xs border border-weak px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover"
                          >
                            View history
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
                          label="Violations"
                          sortKey="count"
                          activeKey={sort.key}
                          direction={sort.direction}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Latest"
                          sortKey="latest"
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
                        <th
                          scope="col"
                          className="bg-primary px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-weak">
                      {sortedGroups.map((group) => {
                        const totalCount = group.violations.length;
                        return (
                          <tr
                            key={group.licensePlate}
                            className="bg-primary transition-colors hover:bg-tertiary"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium lg:px-6">
                              <div className="flex items-center">
                                <Tag className="mr-2 h-4 w-4 text-secondary" aria-hidden />
                                <button
                                  type="button"
                                  onClick={() => handleViewHistory(group.licensePlate)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  {formatLicensePlate(group.licensePlate)}
                                </button>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-secondary lg:px-6">
                              <div className="flex items-center">
                                <Car className="mr-2 h-4 w-4 text-secondary" aria-hidden />
                                {group.make || group.model ? (
                                  <>
                                    {group.make} {group.model}
                                    {group.color && <span className="ml-1">({group.color})</span>}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm lg:px-6">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getViolationSeverityClass(totalCount)}`}
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                                {totalCount}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-secondary lg:px-6">
                              {formatDateTime(group.latestViolation)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-secondary lg:px-6">
                              {group.contact || '-'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm lg:px-6">
                              <button
                                type="button"
                                onClick={() => handleViewHistory(group.licensePlate)}
                                className="inline-flex items-center rounded-xs border border-weak px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover"
                              >
                                View history
                              </button>
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

      {showRecordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:p-0 sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowRecordModal(false)} />
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none transform overflow-visible rounded-sm border border-weak bg-primary text-left align-bottom transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
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

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:px-4">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowHistoryModal(false)} />
            </div>

            <div className="inline-block w-[calc(100vw-1rem)] max-w-none transform overflow-hidden rounded-sm border border-weak bg-primary text-left align-bottom transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
              <div className="border-b border-weak bg-accent px-4 py-4 text-inverse">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center text-lg font-semibold">
                      <AlertTriangle className="mr-2" size={20} />
                      Violation History
                    </h3>
                    <p className="mt-0.5 text-sm opacity-90">
                      License Plate: {formatLicensePlate(historyLicensePlate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="rounded-sm p-1 text-inverse hover:opacity-80"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Total Violations: {historyViolations.length}
                  </p>
                </div>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {historyViolations.map((violation, index) => (
                    <div key={violation.id} className="rounded-md border border-border-weak bg-tertiary p-3">
                      <div className="mb-2 flex items-start justify-between">
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
                          {violation.color && <span> ({violation.color})</span>}
                        </p>
                      )}

                      {violation.contact && (
                        <p className="text-sm text-secondary">Contact: {violation.contact}</p>
                      )}

                      {violation.phoneNumber && (
                        <p className="text-sm text-secondary">Phone: {violation.phoneNumber}</p>
                      )}

                      {violation.notes && (
                        <p className="mt-2 rounded border border-border-weak bg-primary p-2 text-sm text-secondary">
                          Notes: {violation.notes}
                        </p>
                      )}

                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleDeleteViolation(violation.id)}
                          className="inline-flex items-center rounded-xs p-1.5 text-red-600 hover:bg-danger-weak dark:text-red-400"
                          aria-label={`Delete violation ${historyViolations.length - index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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