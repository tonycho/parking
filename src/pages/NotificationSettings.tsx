import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { CHURCH_NOTIFICATION_TIMEZONE } from '../lib/churchNotification';
import { supabase } from '../lib/supabase';
import { apiFetchJson } from '../lib/apiFetch';
import type { NotificationJobLogRow, NotificationSettingsRow, RecurrenceType } from '../types';
import { PageHeader } from '../components/PageHeader/PageHeader';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultRow = (): Omit<NotificationSettingsRow, 'id' | 'created_at' | 'updated_at' | 'last_fired_at' | 'last_fired_key'> => ({
  enabled: false,
  spot_prefix: 'B',
  message_template:
    'Hi {{contact}}! Reminder from ParkSmart: your vehicle ({{license_plate}}) in spot {{spot}}. Second service starts soon. Thank you!',
  send_time: '10:45:00',
  timezone: CHURCH_NOTIFICATION_TIMEZONE,
  days_of_week: [0],
  recurrence_type: 'weekly',
  cron_expression: null,
  ringcentral_from_number: null,
  parking_lot_id: null,
});

function timeInputValue(sendTime: string): string {
  const parts = sendTime.split(':');
  const h = parts[0] || '10';
  const m = parts[1] || '45';
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function toSendTime(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return `${(h || '10').padStart(2, '0')}:${(m || '45').padStart(2, '0')}:00`;
}

type RingCentralUiStatus = 'loading' | 'not_configured' | 'checking' | 'verified' | 'invalid';

function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultRow);
  const [logs, setLogs] = useState<NotificationJobLogRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [usingJwtEnv, setUsingJwtEnv] = useState(false);
  const [rcUiStatus, setRcUiStatus] = useState<RingCentralUiStatus>('loading');
  const [rcUiDetail, setRcUiDetail] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ count: number } | null>(null);

  const fetchRingCentralValidation = useCallback(
    () =>
      apiFetchJson<{ ok: boolean; error?: string }>('/api/notifications/validate-ringcentral', {
        method: 'POST',
        body: '{}',
      }),
    []
  );

  const loadLogs = useCallback(
    async (sid: string) => {
      const { data } = await supabase
        .from('notification_job_logs')
        .select('*')
        .eq('notification_setting_id', sid)
        .order('created_at', { ascending: false })
        .limit(25);
      setLogs((data as NotificationJobLogRow[]) || []);
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setRcUiStatus('loading');
    setRcUiDetail(null);
    try {
      const { data: row, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!row) {
        const ins = { ...defaultRow() };
        const { data: created, error: cErr } = await supabase
          .from('notification_settings')
          .insert(ins)
          .select('*')
          .single();
        if (cErr) throw cErr;
        const r = created as NotificationSettingsRow;
        setSettingId(r.id);
        setForm({
          enabled: r.enabled,
          spot_prefix: r.spot_prefix,
          message_template: r.message_template,
          send_time: r.send_time,
          timezone: CHURCH_NOTIFICATION_TIMEZONE,
          days_of_week: r.days_of_week || [0],
          recurrence_type: r.recurrence_type as RecurrenceType,
          cron_expression: r.cron_expression,
          ringcentral_from_number: null,
          parking_lot_id: r.parking_lot_id,
        });
        await loadLogs(r.id);
      } else {
        const r = row as NotificationSettingsRow;
        setSettingId(r.id);
        setForm({
          enabled: r.enabled,
          spot_prefix: r.spot_prefix,
          message_template: r.message_template,
          send_time: r.send_time,
          timezone: CHURCH_NOTIFICATION_TIMEZONE,
          days_of_week: r.days_of_week || [0],
          recurrence_type: r.recurrence_type as RecurrenceType,
          cron_expression: r.cron_expression,
          ringcentral_from_number: null,
          parking_lot_id: r.parking_lot_id,
        });
        await loadLogs(r.id);
      }

      try {
        const j = await apiFetchJson<{ connected: boolean; usingJwtEnv?: boolean }>('/api/ringcentral/status');
        const isConnected = Boolean(j.connected);
        setConnected(isConnected);
        setUsingJwtEnv(Boolean(j.usingJwtEnv));
        if (!isConnected) {
          setRcUiStatus('not_configured');
        } else {
          setRcUiStatus('checking');
          void (async () => {
            try {
              const v = await fetchRingCentralValidation();
              if (v.ok) {
                setRcUiStatus('verified');
                setRcUiDetail(null);
              } else {
                setRcUiStatus('invalid');
                setRcUiDetail(v.error || 'RingCentral rejected the token request.');
              }
            } catch (e) {
              setRcUiStatus('invalid');
              setRcUiDetail(e instanceof Error ? e.message : 'Could not reach RingCentral validation.');
            }
          })();
        }
      } catch {
        setConnected(false);
        setUsingJwtEnv(false);
        setRcUiStatus('not_configured');
        setRcUiDetail('Could not load connection status from the API.');
      }
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, [fetchRingCentralValidation, loadLogs]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!settingId) return;
    setSaving(true);
    setBanner(null);
    try {
      const payload = {
        enabled: form.enabled,
        spot_prefix: form.spot_prefix.trim() || 'B',
        message_template: form.message_template,
        send_time: form.send_time,
        timezone: CHURCH_NOTIFICATION_TIMEZONE,
        days_of_week: form.days_of_week,
        recurrence_type: form.recurrence_type,
        cron_expression: form.recurrence_type === 'cron' ? form.cron_expression : null,
        ringcentral_from_number: null,
        parking_lot_id: form.parking_lot_id,
      };
      const { error } = await supabase.from('notification_settings').update(payload).eq('id', settingId);
      if (error) throw error;
      setBanner({ type: 'success', text: 'Settings saved.' });
      await loadLogs(settingId);
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const validateRc = async () => {
    setBusy('validate');
    setBanner(null);
    setRcUiStatus('checking');
    setRcUiDetail(null);
    try {
      const j = await fetchRingCentralValidation();
      if (j.ok) {
        setRcUiStatus('verified');
        setRcUiDetail(null);
        setBanner({ type: 'success', text: 'RingCentral credentials OK.' });
      } else {
        setRcUiStatus('invalid');
        setRcUiDetail(j.error || 'Validation failed');
        setBanner({ type: 'error', text: j.error || 'Validation failed' });
      }
    } catch (e) {
      setRcUiStatus('invalid');
      const msg = e instanceof Error ? e.message : 'Validate failed';
      setRcUiDetail(msg);
      setBanner({ type: 'error', text: msg });
    } finally {
      setBusy(null);
    }
  };

  const testSms = async () => {
    if (!testPhone.trim()) {
      setBanner({ type: 'error', text: 'Enter a test phone number (10 digits).' });
      return;
    }
    setBusy('test');
    setBanner(null);
    try {
      const digits = testPhone.replace(/\D/g, '');
      const j = await apiFetchJson<{
        success?: boolean;
        id?: string;
        messageStatus?: string | null;
        toE164?: string;
      }>('/api/notifications/test-sms', {
        method: 'POST',
        body: { to: digits },
      });
      setRcUiStatus('verified');
      setRcUiDetail(null);
      const status = j.messageStatus || 'unknown';
      const idPart = j.id ? `, message id ${j.id}` : '';
      const toPart = j.toE164 ? `, to ${j.toE164}` : '';
      setBanner({
        type: 'success',
        text: `RingCentral accepted the SMS (status: ${status}${idPart}${toPart}). That only means it is queued with RingCentral; your phone may still filter or delay it. In RingCentral Admin open Message Store and search this message id to see Delivered, DeliveryFailed, or carrier errors.`,
      });
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Test SMS failed' });
    } finally {
      setBusy(null);
    }
  };

  const runPreview = async () => {
    setBusy('preview');
    try {
      const j = await apiFetchJson<{ count: number }>('/api/notifications/preview', {
        method: 'POST',
        body: {
          spotPrefix: form.spot_prefix,
          parkingLotId: form.parking_lot_id,
        },
      });
      setPreview({ count: j.count });
      setBanner({ type: 'success', text: `Preview: ${j.count} recipient(s).` });
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Preview failed' });
    } finally {
      setBusy(null);
    }
  };

  const runJob = async (dryRun: boolean) => {
    if (!settingId) return;
    setBusy(dryRun ? 'dry' : 'run');
    setBanner(null);
    try {
      const j = await apiFetchJson<{ results?: unknown }>('/api/notifications/run', {
        method: 'POST',
        body: {
          runNow: true,
          dryRun,
          settingId,
        },
      });
      setBanner({
        type: 'success',
        text: dryRun ? `Dry run complete. See logs below.` : `Sent. ${JSON.stringify(j.results)}`,
      });
      await loadLogs(settingId);
    } catch (e) {
      setBanner({ type: 'error', text: e instanceof Error ? e.message : 'Run failed' });
    } finally {
      setBusy(null);
    }
  };

  const toggleDay = (d: number) => {
    setForm((f) => {
      const set = new Set(f.days_of_week);
      if (set.has(d)) set.delete(d);
      else set.add(d);
      return { ...f, days_of_week: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const timeValue = useMemo(() => timeInputValue(form.send_time), [form.send_time]);

  if (loading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-secondary">
      <PageHeader
        title="Notification settings"
        subtitle="RingCentral SMS, schedules, and job logs for church reminders."
        icon={Bell}
      />

      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {banner && (
          <div
            className={`rounded-sm border px-4 py-3 text-sm ${
              banner.type === 'success'
                ? 'border-success bg-success-weak text-success'
                : 'border-danger bg-danger-weak text-danger'
            }`}
          >
            {banner.text}
          </div>
        )}

        <section className="c3-card">
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0" aria-hidden />
            RingCentral
          </h2>
          <p className="text-xs text-secondary mb-4">Connection status and quick validation for outbound SMS.</p>

          <div
            className={`rounded-lg border p-4 mb-4 ${
              rcUiStatus === 'verified'
                ? 'border-green-200 bg-green-50'
                : rcUiStatus === 'invalid'
                  ? 'border-red-200 bg-red-50'
                  : rcUiStatus === 'not_configured'
                    ? 'border-amber-200 bg-amber-50'
                    : rcUiStatus === 'checking'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex gap-3">
              {rcUiStatus === 'verified' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600" aria-hidden />
              ) : rcUiStatus === 'invalid' ? (
                <XCircle className="w-6 h-6 shrink-0 text-red-600" aria-hidden />
              ) : rcUiStatus === 'not_configured' ? (
                <AlertCircle className="w-6 h-6 shrink-0 text-amber-600" aria-hidden />
              ) : rcUiStatus === 'checking' ? (
                <Loader2 className="w-6 h-6 shrink-0 text-blue-600 animate-spin" aria-hidden />
              ) : (
                <Loader2 className="w-6 h-6 shrink-0 text-gray-400 animate-spin" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {rcUiStatus === 'verified' && 'Configured and working'}
                  {rcUiStatus === 'invalid' && 'Not working'}
                  {rcUiStatus === 'not_configured' && 'Not configured'}
                  {rcUiStatus === 'checking' && 'Checking…'}
                  {rcUiStatus === 'loading' && 'Loading…'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {rcUiStatus === 'verified' &&
                    'The API can obtain a RingCentral access token and call the account API.'}
                  {rcUiStatus === 'invalid' &&
                    'Credentials are present on the server but RingCentral did not accept them, or the check failed.'}
                  {rcUiStatus === 'not_configured' &&
                    'The API does not see JWT env or stored tokens. Add RINGCENTRAL_JWT (and client id/secret) to the server environment and restart the API.'}
                  {rcUiStatus === 'checking' && 'Verifying token exchange with RingCentral…'}
                  {rcUiStatus === 'loading' && 'Loading connection status…'}
                </p>
                {rcUiDetail && rcUiStatus === 'invalid' && (
                  <p className="text-xs text-red-800 mt-2 font-mono break-words">{rcUiDetail}</p>
                )}
                {rcUiDetail && rcUiStatus === 'not_configured' && (
                  <p className="text-xs text-amber-900 mt-2">{rcUiDetail}</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Credentials:{' '}
            {connected ? (
              <span className="text-gray-700">
                {usingJwtEnv ? (
                  <>
                    <code className="bg-gray-100 px-1 rounded">RINGCENTRAL_JWT</code> is set on the server
                  </>
                ) : (
                  <>stored refresh token in the database (no JWT in env)</>
                )}
              </span>
            ) : (
              <span className="text-amber-800 font-medium">none detected on the server</span>
            )}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void validateRc()}
              disabled={busy !== null}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === 'validate' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Validate connection
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Test phone (10 digits)</label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-44"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5551234567"
              />
            </div>
            <button
              type="button"
              onClick={() => void testSms()}
              disabled={busy !== null}
              className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {busy === 'test' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send test SMS
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 max-w-xl leading-relaxed">
            A <strong>200</strong> from RingCentral means the message was accepted, not that your phone received it. If
            nothing arrives: wait a few minutes, check spam/blocked senders, use a mobile line (not landline / VoIP that
            blocks SMS), and in RingCentral <strong>Admin Portal → Message Store</strong> open the outbound message to
            see <strong>SendingFailed</strong>, <strong>DeliveryFailed</strong>, or carrier errors (10DLC / A2P
            registration is often required for US local numbers).
          </p>
        </section>

        <section className="c3-card space-y-4">
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-accent shrink-0" aria-hidden />
            Scheduled SMS
          </h2>
          <p className="text-xs text-secondary mb-4">When and how reminders are sent for prefixed spots.</p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-800">Enable scheduled job</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spot prefix</label>
            <input
              className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={form.spot_prefix}
              onChange={(e) => setForm((f) => ({ ...f, spot_prefix: e.target.value }))}
              maxLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message template</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px]"
              value={form.message_template}
              onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Placeholders: {'{{contact}}'}, {'{{license_plate}}'}, {'{{spot}}'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Send time (Pacific)
            </label>
            <input
              type="time"
              className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={timeValue}
              onChange={(e) => setForm((f) => ({ ...f, send_time: toSendTime(e.target.value) }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Times are interpreted in <strong>US Pacific</strong> ({CHURCH_NOTIFICATION_TIMEZONE}) for this church.
            </p>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Days of week (weekly)
            </span>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                    form.days_of_week.includes(i)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={form.recurrence_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recurrence_type: e.target.value as RecurrenceType }))
                }
              >
                <option value="weekly">Weekly (selected days + time)</option>
                <option value="daily">Daily (time only)</option>
                <option value="cron">Custom cron (UTC, 6-field: sec min hour dom mon dow)</option>
              </select>
            </div>
          </div>

          {form.recurrence_type === 'cron' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cron expression (UTC)</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                value={form.cron_expression || ''}
                onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value || null }))}
                placeholder="0 45 15 * * 0"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save settings
            </button>
            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={busy !== null}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Preview recipient count
            </button>
            {preview !== null && (
              <span className="text-sm text-gray-600 self-center">Current preview: {preview.count}</span>
            )}
            <button
              type="button"
              onClick={() => void runJob(true)}
              disabled={busy !== null}
              className="inline-flex items-center px-4 py-2 rounded-md border border-amber-300 text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100"
            >
              {busy === 'dry' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Dry run
            </button>
            <button
              type="button"
              onClick={() => void runJob(false)}
              disabled={busy !== null}
              className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Run now
            </button>
          </div>
        </section>

        <section className="c3-card">
          <h2 className="text-sm font-semibold text-primary mb-1">Recent job logs</h2>
          <p className="text-xs text-secondary mb-4">Latest runs from the notification worker.</p>
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full divide-y divide-border-weak">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Phone</th>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Spot</th>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-weak">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-4 whitespace-nowrap text-gray-800">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{log.recipient_phone}</td>
                      <td className="py-2 pr-4">{log.spot_name || '—'}</td>
                      <td className="py-2 pr-4">{log.status}</td>
                      <td className="py-2 text-red-600 max-w-xs truncate">{log.error_message || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NotificationSettings;
