import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import { Send, CheckCircle2 } from 'lucide-react';
import { complaintsService } from '../../services/complaints.service';
import { feedbackService } from '../../services/feedback.service';

const PassengerComplaintsPage = () => {
  const [category, setCategory] = useState('Cleanliness');
  const [pnr, setPnr] = useState('8429104821');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const loadComplaints = async () => { try { setComplaints((await complaintsService.getUserComplaints()).data); } catch (requestError) { setError(requestError.message); } };
  useEffect(() => { loadComplaints(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try { const response = await complaintsService.submitComplaint({ category, pnr, description }); setSuccess(`${response.message}. ID: ${response.data.id}`); setDescription(''); loadComplaints(); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  const columns = [
    { header: 'ID', accessor: 'id', cell: (row) => <span className="font-mono text-xs font-bold text-cyan-400">{row.id}</span> },
    { header: 'PNR', accessor: 'pnr', cell: (row) => <span className="font-mono text-xs">{row.pnr}</span> },
    { header: 'Category', accessor: 'category' },
    { header: 'Description', accessor: 'description', className: 'max-w-xs truncate' },
    { header: 'Status', cell: (row) => <Badge variant={row.status === 'RESOLVED' ? 'success' : 'warning'}>{row.status}</Badge> },
    { header: 'Date', accessor: 'date' }
  ];
  const submitFeedback = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    try { const response = await feedbackService.submitFeedback({ rating: Number(rating), comment: feedback }); setSuccess(response.message); setFeedback(''); }
    catch (requestError) { setError(requestError.message); }
  };

  return (
    <DashboardLayout type="passenger">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Passenger Support & Grievance Redressal</h1>
          <p className="text-xs text-slate-400">File complaints, track resolution status, and submit service feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submit Complaint Form */}
          <div className="lg:col-span-5">
            <Card title="Register New Complaint" subtitle="Report coach, catering, or journey issues">
              {success && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              )}
              {error && <p role="alert" className="mb-4 text-xs text-rose-300">{error}</p>}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <Input
                  label="PNR Number (Optional)"
                  placeholder="8429104821"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Complaint Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input rounded-xl text-sm py-2.5 px-3.5 bg-slate-900/80 cursor-pointer"
                  >
                    <option value="Cleanliness">Cleanliness & Sanitization</option>
                    <option value="Electrical & AC">Electrical & AC Maintenance</option>
                    <option value="Food & Catering">Food & Catering Quality</option>
                    <option value="Staff Behavior">Staff & Conductor Behavior</option>
                    <option value="Delay">Train Delay & Operations</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="glass-input rounded-xl text-sm p-3.5 bg-slate-900/80 focus:border-cyan-400 outline-none"
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="md" icon={Send} isLoading={loading} className="mt-2">
                  Submit Complaint
                </Button>
              </form>
            </Card>
          </div>

          {/* Complaints Track Table */}
          <div className="lg:col-span-7">
            <Card title="Grievance History & Status" subtitle="Live tracking of submitted issues">
              <Table columns={columns} data={complaints} />
            </Card>
          </div>
        </div>
        <Card title="Journey Feedback" subtitle="Help improve future passenger experiences">
          <form onSubmit={submitFeedback} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1.5"><label className="text-xs text-slate-300">Rating</label><select value={rating} onChange={(event) => setRating(event.target.value)} className="glass-input rounded-xl p-2.5"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></div>
            <div className="flex-1"><Input label="Comment (optional)" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Tell us about your journey" /></div>
            <Button type="submit" variant="outline" size="md">Save Feedback</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PassengerComplaintsPage;
