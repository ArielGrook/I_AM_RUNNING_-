'use client';

import { useEffect, useState } from 'react';

interface NotesSettings {
  enabledForUsers: boolean;
  tenantMode: boolean;
}

export default function NotesAdminPage() {
  const [settings, setSettings] = useState<NotesSettings>({ enabledForUsers: false, tenantMode: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/notes-settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => undefined);
  }, []);

  async function save(next: NotesSettings) {
    setSaving(true);
    const res = await fetch('/api/admin/notes-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (res.ok) setSettings(next);
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">Notes Settings</h1>
        <p className="mt-2 text-sm text-white/70">
          Toggle Notes access for client users and switch storage base to tenant mode (`/workspace/notes/{'{user_id}'}/`).
        </p>

        <label className="mt-6 flex items-center justify-between rounded-lg border border-white/15 px-4 py-3">
          <span>Enable Notes for users</span>
          <input
            type="checkbox"
            checked={settings.enabledForUsers}
            onChange={(e) => setSettings((prev) => ({ ...prev, enabledForUsers: e.target.checked }))}
          />
        </label>

        <label className="mt-3 flex items-center justify-between rounded-lg border border-white/15 px-4 py-3">
          <span>Tenant mode storage</span>
          <input
            type="checkbox"
            checked={settings.tenantMode}
            onChange={(e) => setSettings((prev) => ({ ...prev, tenantMode: e.target.checked }))}
          />
        </label>

        <button
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={saving}
          onClick={() => save(settings)}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

