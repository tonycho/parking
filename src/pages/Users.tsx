import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartHandshake, Loader2, MessageSquare, Pencil, Phone, X } from 'lucide-react';
import {
  PageHeader,
  pageBodyScrollClassName,
  pageBodyScrollInnerClassName,
} from '../components/PageHeader/PageHeader';
import SearchBar from '../components/SearchBar';
import {
  SortableTableHeader,
  compareStrings,
  mobileSortDirectionClassName,
  mobileSortSelectClassName,
} from '../components/SortableTableHeader';
import { supabase } from '../lib/supabase';
import { apiFetchJson } from '../lib/apiFetch';
import { formatLicensePlate } from '../lib/formatLicensePlate';
import { AppUser } from '../types';

type ArrivalAlertLog = {
  id: string;
  license_plate: string;
  recipient_phone: string;
  spot_label: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

type RowStatus = { userId: string; type: 'success' | 'error'; message: string };

type UserSortKey = 'name' | 'email' | 'phone' | 'welcomeTeam';
type SortDirection = 'asc' | 'desc';

function mapUserRow(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string | null) ?? null,
    phoneNumber: (row.phone_number as string | null) ?? null,
    isWelcomeTeam: Boolean(row.is_welcome_team),
    createdAt: row.created_at as string,
  };
}

const selectClass =
  'h-[28px] pl-3 pr-8 text-sm border border-weak rounded-xs bg-primary text-primary focus:outline-none focus:border-accent cursor-pointer disabled:opacity-50';

function formatPhone(digits: string | null): string {
  if (!digits) return '-';
  const d = digits.replace(/\D/g, '');
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function UserNameDisplay({
  user,
  currentUserId,
}: {
  user: AppUser;
  currentUserId: string | null;
}) {
  const welcomeTeamTitle = user.isWelcomeTeam
    ? user.phoneNumber
      ? 'Welcome team — receives arrival texts'
      : 'Welcome team — add a phone number to receive texts'
    : undefined;

  return (
    <span className="inline-flex items-center gap-1.5">
      {user.name || <span className="text-secondary">-</span>}
      {user.isWelcomeTeam && welcomeTeamTitle ? (
        <span className="inline-flex" role="img" aria-label={welcomeTeamTitle} title={welcomeTeamTitle}>
          <HeartHandshake
            className={`h-4 w-4 shrink-0 ${user.phoneNumber ? 'text-accent' : 'text-warning'}`}
            aria-hidden
          />
        </span>
      ) : null}
      {user.id === currentUserId && <span className="text-xs text-secondary">(you)</span>}
    </span>
  );
}

function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<ArrivalAlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [rowStatus, setRowStatus] = useState<RowStatus | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: UserSortKey; direction: SortDirection }>({
    key: 'email',
    direction: 'asc',
  });

  const handleSort = (key: UserSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const loadData = useCallback(async () => {
    try {
      const [usersRes, logsRes, authRes] = await Promise.all([
        supabase.from('users').select('id, email, name, phone_number, is_welcome_team, created_at').order('email'),
        supabase
          .from('arrival_alert_logs')
          .select('id, license_plate, recipient_phone, spot_label, status, error_message, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.auth.getUser(),
      ]);
      if (usersRes.error) throw usersRes.error;
      if (logsRes.error) throw logsRes.error;
      setUsers((usersRes.data || []).map(mapUserRow));
      setLogs((logsRes.data || []) as ArrivalAlertLog[]);
      setCurrentUserId(authRes.data.user?.id ?? null);
      setLoadError(null);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateUser = async (userId: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from('users').update(patch).eq('id', userId);
    if (error) throw error;
    await loadData();
  };

  const handleSetWelcomeTeam = async (user: AppUser, isWelcomeTeam: boolean) => {
    setBusyUserId(user.id);
    setRowStatus(null);
    try {
      await updateUser(user.id, { is_welcome_team: isWelcomeTeam });
    } catch (error) {
      setRowStatus({
        userId: user.id,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update',
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSendTest = async (user: AppUser) => {
    if (!user.phoneNumber) return;
    setBusyUserId(user.id);
    setRowStatus(null);
    try {
      await apiFetchJson('/api/notifications/test-sms', {
        method: 'POST',
        body: {
          to: user.phoneNumber,
          message: 'ParkSmart test: you are on the welcome team and will get a text when flagged guests park.',
        },
      });
      setRowStatus({ userId: user.id, type: 'success', message: 'Test text sent' });
    } catch (error) {
      setRowStatus({
        userId: user.id,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send',
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const sortedUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      return (
        user.email.toLowerCase().includes(query) ||
        (user.name ?? '').toLowerCase().includes(query) ||
        (user.phoneNumber ?? '').includes(query)
      );
    });

    const dir = sort.direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort.key) {
        case 'name':
          cmp = compareStrings(a.name ?? '', b.name ?? '');
          break;
        case 'email':
          cmp = compareStrings(a.email, b.email);
          break;
        case 'phone':
          cmp = compareStrings(a.phoneNumber ?? '', b.phoneNumber ?? '');
          break;
        case 'welcomeTeam':
          cmp = Number(a.isWelcomeTeam) - Number(b.isWelcomeTeam);
          break;
      }
      return cmp * dir;
    });
  }, [users, searchQuery, sort]);

  const nameByPhone = new Map(users.filter((u) => u.phoneNumber).map((u) => [u.phoneNumber!, u.name || u.email]));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-secondary">
      <PageHeader
        title="Users"
        subtitle="Manage who can sign in and who is on the welcome team. Welcome team members get a text when a flagged vehicle parks."
      />

      <div className={pageBodyScrollClassName}>
        <div className={pageBodyScrollInnerClassName}>
        <div className="mb-4 shrink-0 sm:mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, phone..." />
        </div>

        {loadError && (
          <div className="mb-4 rounded-sm border border-weak bg-danger-weak p-3 text-sm text-danger">{loadError}</div>
        )}

        <div className="bg-primary border border-weak rounded-sm overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 bg-tertiary rounded-sm animate-pulse" />
              ))}
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-secondary">No users found.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-weak px-4 py-3 md:hidden">
                <span className="text-xs font-medium uppercase tracking-wider text-secondary">Sort by</span>
                <select
                  value={sort.key}
                  onChange={(e) =>
                    setSort((prev) => ({ ...prev, key: e.target.value as UserSortKey }))
                  }
                  className={mobileSortSelectClassName}
                  aria-label="Sort users by"
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="welcomeTeam">Welcome team</option>
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
                {sortedUsers.map((user) => {
                  const isBusy = busyUserId === user.id;
                  const status = rowStatus?.userId === user.id ? rowStatus : null;
                  return (
                    <div key={user.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary">
                            <UserNameDisplay user={user} currentUserId={currentUserId} />
                          </p>
                          <p className="mt-0.5 truncate text-sm text-secondary">{user.email}</p>
                          <p className="mt-1 inline-flex items-center text-sm text-secondary">
                            <Phone className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
                            {formatPhone(user.phoneNumber)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="shrink-0 rounded-xs p-1.5 text-secondary transition-colors hover:bg-hover hover:text-primary"
                          aria-label={`Edit ${user.email}`}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wider text-secondary">Welcome team</p>
                      <select
                        value={user.isWelcomeTeam ? 'yes' : 'no'}
                        disabled={isBusy}
                        onChange={(e) => void handleSetWelcomeTeam(user, e.target.value === 'yes')}
                        className={`${selectClass} w-full max-w-xs`}
                        aria-label={`Welcome team for ${user.email}`}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                      {user.isWelcomeTeam && !user.phoneNumber && (
                        <p className="text-xs text-warning">Add a phone number to receive texts</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {status && (
                          <span
                            className={`text-xs ${status.type === 'success' ? 'text-success' : 'text-danger'}`}
                          >
                            {status.message}
                          </span>
                        )}
                        {user.isWelcomeTeam && user.phoneNumber && (
                          <button
                            type="button"
                            onClick={() => void handleSendTest(user)}
                            disabled={isBusy}
                            className="inline-flex items-center rounded-xs border border-weak px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover disabled:opacity-50"
                          >
                            {isBusy ? (
                              <Loader2 className="mr-1 animate-spin" size={14} />
                            ) : (
                              <MessageSquare className="mr-1" size={14} />
                            )}
                            Send test
                          </button>
                        )}
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
                        label="Name"
                        sortKey="name"
                        activeKey={sort.key}
                        direction={sort.direction}
                        onSort={handleSort}
                      />
                      <SortableTableHeader
                        label="Email"
                        sortKey="email"
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
                        label="Welcome team"
                        sortKey="welcomeTeam"
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
                    {sortedUsers.map((user) => {
                      const isBusy = busyUserId === user.id;
                      const status = rowStatus?.userId === user.id ? rowStatus : null;
                      return (
                        <tr key={user.id} className="transition-colors hover:bg-tertiary">
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-primary lg:px-6">
                            <UserNameDisplay user={user} currentUserId={currentUserId} />
                          </td>
                          <td className="max-w-[12rem] truncate whitespace-nowrap px-4 py-4 text-sm text-secondary lg:max-w-none lg:px-6">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-secondary lg:px-6">
                            <span className="inline-flex items-center">
                              <Phone className="mr-2 h-4 w-4" aria-hidden />
                              {formatPhone(user.phoneNumber)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm lg:px-6">
                            <select
                              value={user.isWelcomeTeam ? 'yes' : 'no'}
                              disabled={isBusy}
                              onChange={(e) => void handleSetWelcomeTeam(user, e.target.value === 'yes')}
                              className={selectClass}
                              aria-label={`Welcome team for ${user.email}`}
                            >
                              <option value="no">No</option>
                              <option value="yes">Yes</option>
                            </select>
                            {user.isWelcomeTeam && !user.phoneNumber && (
                              <p className="mt-1 text-xs text-warning">Add a phone number to receive texts</p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right text-sm lg:px-6">
                            <div className="flex items-center justify-end gap-2">
                              {status && (
                                <span
                                  className={`text-xs ${status.type === 'success' ? 'text-success' : 'text-danger'}`}
                                >
                                  {status.message}
                                </span>
                              )}
                              {user.isWelcomeTeam && user.phoneNumber && (
                                <button
                                  type="button"
                                  onClick={() => void handleSendTest(user)}
                                  disabled={isBusy}
                                  className="inline-flex items-center rounded-xs border border-weak px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-hover disabled:opacity-50"
                                >
                                  {isBusy ? (
                                    <Loader2 className="mr-1 animate-spin" size={14} />
                                  ) : (
                                    <MessageSquare className="mr-1" size={14} />
                                  )}
                                  Send test
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingUser(user)}
                                className="rounded-xs p-1.5 text-secondary transition-colors hover:bg-hover hover:text-primary"
                                aria-label={`Edit ${user.email}`}
                              >
                                <Pencil size={16} />
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

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-primary mb-1 flex items-center">
            <HeartHandshake className="mr-1.5 text-secondary" size={16} aria-hidden />
            Recent arrival alerts
          </h2>
          <p className="text-xs text-secondary mb-4">
            Texts sent to the welcome team when a vehicle marked "Notify welcome team" is parked.
          </p>
          {logs.length === 0 ? (
            <div className="bg-primary border border-weak rounded-sm flex items-center justify-center py-10 text-sm text-secondary">
              No arrival alerts yet.
            </div>
          ) : (
            <div className="bg-primary border border-weak rounded-sm divide-y divide-border-weak">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-primary">
                    {formatLicensePlate(log.license_plate)}
                    {log.spot_label && <span className="text-secondary"> · spot {log.spot_label}</span>}
                    <span className="text-secondary"> → {nameByPhone.get(log.recipient_phone) ?? formatPhone(log.recipient_phone)}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span
                      className={
                        log.status === 'success'
                          ? 'text-success'
                          : log.status === 'error'
                            ? 'text-danger'
                            : 'text-secondary'
                      }
                      title={log.error_message ?? undefined}
                    >
                      {log.status}
                    </span>
                    <span className="text-secondary">{formatDateTime(log.created_at)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (patch) => {
            await updateUser(editingUser.id, patch);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

type EditUserModalProps = {
  user: AppUser;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
};

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phoneNumber ?? '');
  const [isWelcomeTeam, setIsWelcomeTeam] = useState(user.isWelcomeTeam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const phoneInvalid = phone.length > 0 && phone.length !== 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInvalid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim() || null,
        phone_number: phone || null,
        is_welcome_team: isWelcomeTeam,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-xs border border-weak bg-primary px-3 py-2 text-sm text-primary placeholder:text-secondary focus:border-accent focus:outline-none';

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-2 py-4 sm:px-4">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <form
          onSubmit={handleSubmit}
          className="relative w-[calc(100vw-1rem)] rounded-sm border border-weak bg-primary sm:w-full sm:max-w-md"
        >
          <div className="flex items-center justify-between border-b border-weak px-4 py-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">Edit user</h3>
              <p className="text-xs text-secondary mt-0.5">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xs text-secondary hover:bg-hover hover:text-primary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Tony Cho"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Mobile phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={inputClass}
                placeholder="10-digit phone number"
              />
              {phoneInvalid && <p className="mt-1 text-xs text-danger">Phone number must be 10 digits</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Welcome team</label>
              <select
                value={isWelcomeTeam ? 'yes' : 'no'}
                onChange={(e) => setIsWelcomeTeam(e.target.value === 'yes')}
                className={selectClass}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <p className="mt-1 text-xs text-secondary">
                Yes: receives a text when a vehicle marked "Notify welcome team" parks.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-weak px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-primary border border-weak rounded-xs hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || phoneInvalid}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-inverse bg-accent rounded-xs hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 className="mr-2 animate-spin" size={16} />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Users;
