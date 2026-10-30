import { useState } from 'react';
import { api } from '../lib/api';
import { useUI } from '../context/UI';
import { useFetch, Spinner, ErrorBox, Empty, PageHead, Modal } from './UI';

const get = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
const put = (o, path, v) => { const ks = path.split('.'); let c = o; ks.slice(0, -1).forEach((k) => (c = c[k] = c[k] || {})); c[ks.at(-1)] = v; return o; };

// Generic admin list + add/edit/delete form driven by a config.
export default function CrudPage({ title, noun, endpoint, listPath, columns, fields, toForm, fromForm, loadExtras }) {
  const { toast, confirm } = useUI();
  const { data, loading, error, reload } = useFetch(() => api(listPath || endpoint));
  const extras = useFetch(() => (loadExtras ? loadExtras() : Promise.resolve({})), []);
  const [editing, setEditing] = useState(null); // null | 'new' | doc
  const [form, setForm] = useState({});
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);

  const open = (doc) => {
    const base = {};
    fields.forEach((f) => put(base, f.key, f.default ?? (f.type === 'checkbox' ? false : '')));
    setForm(doc ? toForm(doc) : base); setErr(''); setEditing(doc || 'new');
  };
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    for (const f of fields) if (f.required && !String(get(form, f.key) ?? '').trim()) return setErr(`${f.label} is required.`);
    setBusy(true);
    try {
      const body = fromForm ? fromForm(form) : form;
      if (editing === 'new') await api(endpoint, { method: 'POST', body }); else await api(`${endpoint}/${editing._id}`, { method: 'PUT', body });
      toast(`${noun} ${editing === 'new' ? 'added' : 'updated'}.`); setEditing(null); reload();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const del = async (doc) => {
    if (!(await confirm({ title: `Delete this ${noun.toLowerCase()}?`, message: 'This cannot be undone.', confirmText: 'Delete', danger: true }))) return;
    try { await api(`${endpoint}/${doc._id}`, { method: 'DELETE' }); toast(`${noun} deleted.`); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const opts = (f) => (typeof f.options === 'function' ? f.options(extras.data || {}) : f.options);

  return (
    <>
      <PageHead title={title}><button className="btn primary" onClick={() => open(null)}>Add {noun.toLowerCase()}</button></PageHead>
      {loading || extras.loading ? <Spinner /> : error ? <ErrorBox error={error} retry={reload} />
        : !data.length ? <Empty title={`No ${title.toLowerCase()} yet`} text={`Add your first ${noun.toLowerCase()} to get started.`} />
        : (
          <div className="table-wrap"><table>
            <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th /></tr></thead>
            <tbody>{data.map((d) => (
              <tr key={d._id}>{columns.map((c) => <td key={c.label} data-label={c.label}>{c.render(d)}</td>)}
                <td className="actions"><button className="btn ghost small" onClick={() => open(d)}>Edit</button>
                  <button className="btn danger-ghost small" onClick={() => del(d)}>Delete</button></td></tr>))}</tbody>
          </table></div>)}
      {editing && (
        <Modal title={`${editing === 'new' ? 'Add' : 'Edit'} ${noun.toLowerCase()}`} onClose={() => setEditing(null)}>
          <form onSubmit={submit} noValidate className="form-grid">
            {fields.map((f) => (
              <label key={f.key} className={f.wide ? 'wide' : ''}>
                {f.label}
                {f.type === 'textarea' ? <textarea rows={3} value={get(form, f.key) ?? ''} onChange={(e) => setForm((x) => put({ ...x }, f.key, e.target.value))} />
                  : f.type === 'select' ? (
                    <select value={get(form, f.key) ?? ''} onChange={(e) => setForm((x) => put({ ...x }, f.key, e.target.value))}>
                      <option value="">Select…</option>{opts(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>)
                  : f.type === 'checkbox' ? <input type="checkbox" checked={!!get(form, f.key)} onChange={(e) => setForm((x) => put({ ...x }, f.key, e.target.checked))} />
                  : <input type={f.type || 'text'} step={f.step} value={get(form, f.key) ?? ''} onChange={(e) => setForm((x) => put({ ...x }, f.key, e.target.value))} />}
                {f.hint && <small className="muted">{f.hint}</small>}
              </label>))}
            {err && <div className="alert err wide" role="alert">{err}</div>}
            <div className="row end wide"><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>)}
    </>
  );
}
