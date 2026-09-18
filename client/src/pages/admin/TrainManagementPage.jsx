import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { trainsService } from '../../services/trains.service';

const empty = { trainNumber: '', trainName: '', trainType: 'Superfast Express', totalCoaches: 16, isActive: true };
const TrainManagementPage = () => {
  const [trains, setTrains] = useState([]); const [form, setForm] = useState(empty); const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const load = async () => { try { setTrains((await trainsService.list()).data); } catch (requestError) { setError(requestError.message); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { if (editing) await trainsService.update(form.trainNumber, form); else await trainsService.create(form); setOpen(false); load(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
  const remove = async (trainNumber) => { if (!window.confirm(`Delete train ${trainNumber}? Schedules may also be removed.`)) return; try { await trainsService.remove(trainNumber); load(); } catch (requestError) { setError(requestError.message); } };
  const columns = [{ header: 'Number', cell: (row) => <span className="font-mono text-cyan-400">#{row.trainNumber}</span> }, { header: 'Train Name', accessor: 'trainName', className: 'font-bold text-white' }, { header: 'Type', cell: (row) => <Badge variant="info">{row.trainType}</Badge> }, { header: 'Coaches', accessor: 'totalCoaches' }, { header: 'Status', cell: (row) => <Badge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> }, { header: 'Actions', cell: (row) => <div className="flex gap-2"><Button variant="ghost" size="sm" icon={Edit} onClick={() => { setForm(row); setEditing(true); setOpen(true); }}>Edit</Button><Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(row.trainNumber)}>Delete</Button></div> }];
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <DashboardLayout type="admin"><div className="flex flex-col gap-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white">Train Fleet Management</h1><p className="text-xs text-slate-400">Manage trains, coach composition, and operating status</p></div><Button variant="primary" size="md" icon={Plus} onClick={() => { setForm(empty); setEditing(false); setOpen(true); }}>Add New Train</Button></div>{error && <p className="text-xs text-rose-300">{error}</p>}<Card><Table columns={columns} data={trains} /></Card><Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit Train' : 'Register New Express Train'}><form onSubmit={submit} className="flex flex-col gap-4"><Input label="Train Number" value={form.trainNumber} disabled={editing} onChange={(event) => set('trainNumber', event.target.value)} required /><Input label="Train Name" value={form.trainName} onChange={(event) => set('trainName', event.target.value)} required /><select value={form.trainType} onChange={(event) => set('trainType', event.target.value)} className="glass-input rounded-xl p-2.5"><option>Vande Bharat</option><option>Rajdhani</option><option>Shatabdi</option><option>Superfast Express</option><option>Mail Express</option></select><Input label="Total Coaches" type="number" min="1" value={form.totalCoaches} onChange={(event) => set('totalCoaches', event.target.value)} required /><label className="text-xs text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => set('isActive', event.target.checked)} /> Active for booking</label><div className="flex justify-end gap-3"><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" isLoading={saving}>Save Train</Button></div></form></Modal></div></DashboardLayout>;
};
export default TrainManagementPage;
