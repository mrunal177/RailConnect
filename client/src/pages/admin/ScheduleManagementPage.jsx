import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { schedulesService } from '../../services/schedules.service';

const empty = { trainNumber: '', sourceStationCode: 'NDLS', destinationStationCode: 'CSMT', departureTime: '06:00', arrivalTime: '14:30', distanceKm: 0, totalSeatsAc: 0, totalSeatsSleeper: 0, fareAc: 0, fareSleeper: 0, runningDays: 'Daily' };
const ScheduleManagementPage = () => {
  const [items, setItems] = useState([]), [form, setForm] = useState(empty), [editing, setEditing] = useState(false), [open, setOpen] = useState(false), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const load = async () => { try { setItems((await schedulesService.list()).data); } catch (requestError) { setError(requestError.message); } };
  useEffect(() => { load(); }, []);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { if (editing) await schedulesService.update(form.scheduleId, form); else await schedulesService.create(form); setOpen(false); load(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
  const remove = async (id) => { if (!window.confirm('Delete this schedule?')) return; try { await schedulesService.remove(id); load(); } catch (requestError) { setError(requestError.message); } };
  const columns = [{ header: 'ID', cell: (row) => <span className="font-mono text-cyan-400">SCH_{row.scheduleId}</span> }, { header: 'Train', cell: (row) => <span className="font-bold text-white">{row.trainName} (#{row.trainNumber})</span> }, { header: 'Route', cell: (row) => `${row.sourceStationCode} → ${row.destinationStationCode}` }, { header: 'Departure', accessor: 'departureTime' }, { header: 'Arrival', accessor: 'arrivalTime' }, { header: 'Days', accessor: 'runningDays' }, { header: 'Actions', cell: (row) => <div className="flex gap-2"><Button variant="ghost" size="sm" icon={Edit} onClick={() => { setForm(row); setEditing(true); setOpen(true); }}>Edit</Button><Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(row.scheduleId)}>Delete</Button></div> }];
  const fields = [['Train number', 'trainNumber'], ['Source station code', 'sourceStationCode'], ['Destination station code', 'destinationStationCode'], ['Departure time', 'departureTime', 'time'], ['Arrival time', 'arrivalTime', 'time'], ['Distance (km)', 'distanceKm', 'number'], ['AC seats', 'totalSeatsAc', 'number'], ['Sleeper seats', 'totalSeatsSleeper', 'number'], ['AC fare', 'fareAc', 'number'], ['Sleeper fare', 'fareSleeper', 'number'], ['Running days', 'runningDays']];
  return <DashboardLayout type="admin"><div className="flex flex-col gap-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white">Schedule & Timetable Manager</h1><p className="text-xs text-slate-400">Configure route, timing, capacity, and fares</p></div><Button variant="primary" size="md" icon={Plus} onClick={() => { setForm(empty); setEditing(false); setOpen(true); }}>Create Schedule</Button></div>{error && <p className="text-xs text-rose-300">{error}</p>}<Card><Table columns={columns} data={items} /></Card><Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit Schedule' : 'Create Schedule'}><form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(([label, key, type = 'text']) => <Input key={key} label={label} type={type} min={type === 'number' ? '0' : undefined} value={form[key]} onChange={(event) => set(key, event.target.value)} required />)}<div className="sm:col-span-2 flex justify-end gap-3"><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" isLoading={saving}>Save Schedule</Button></div></form></Modal></div></DashboardLayout>;
};
export default ScheduleManagementPage;
