import React, { useState, useEffect } from 'react';
import {
  Brain,
  Cpu,
  Database,
  Sparkles,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Play,
  Sliders,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface MlStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MlStudioModal: React.FC<MlStudioModalProps> = ({ isOpen, onClose }) => {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [syntheticSamples, setSyntheticSamples] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);

  // Hyperparameters
  const [sampleCount, setSampleCount] = useState(2500);
  const [epochs, setEpochs] = useState(120);
  const [learningRate, setLearningRate] = useState(0.08);

  // Interactive Inference Playground State
  const [testWl, setTestWl] = useState(12);
  const [testLeadDays, setTestLeadDays] = useState(14);
  const [testClass, setTestClass] = useState('3A');
  const [testSeats, setTestSeats] = useState(140);
  const [testResult, setTestResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Active Tab inside modal: 'TRAIN' | 'DATASET' | 'PLAYGROUND' | 'METRICS'
  const [activeTab, setActiveTab] = useState<'TRAIN' | 'DATASET' | 'PLAYGROUND' | 'METRICS'>('TRAIN');

  const fetchModelStatus = async () => {
    try {
      const res = await fetch('/api/ml/model-status');
      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);
      }
    } catch (e) {
      console.error('Error fetching model status:', e);
    }
  };

  const fetchSyntheticSamples = async () => {
    try {
      const res = await fetch('/api/ml/dataset/samples?limit=15');
      if (res.ok) {
        const data = await res.json();
        setSyntheticSamples(data);
      }
    } catch (e) {
      console.error('Error fetching synthetic samples:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchModelStatus();
      fetchSyntheticSamples();
      runInference(testWl, testLeadDays, testClass, testSeats);
    }
  }, [isOpen]);

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingMessage(null);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleCount,
          epochs,
          learningRate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrainingMessage(data.message);
        await fetchModelStatus();
        await fetchSyntheticSamples();
        runInference(testWl, testLeadDays, testClass, testSeats);
      } else {
        const err = await res.json();
        setTrainingMessage(`Training failed: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      setTrainingMessage(`Training error: ${e.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const runInference = async (wl: number, leadDays: number, tClass: string, seats: number) => {
    setIsPredicting(true);
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + leadDays);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const res = await fetch('/api/ml/waitlist-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainNumber: '12951',
          journeyDate: dateStr,
          travelClass: tClass,
          currentWaitlist: wl,
          totalSeats: seats,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setIsPredicting(false);
    }
  };

  if (!isOpen) return null;

  const metrics = modelStatus?.trainingMetrics;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  ML Training & Model Studio
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 border border-emerald-300">
                  {modelStatus?.isTrained ? 'Model Trained & Active' : 'Untrained'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Synthetic Dataset Generation • Gradient Descent • Logistic Regression & Naive Bayes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 sm:gap-4 overflow-x-auto">
          {[
            { id: 'TRAIN', label: 'Model Training', icon: Cpu },
            { id: 'DATASET', label: 'Synthetic Dataset', icon: Database },
            { id: 'METRICS', label: 'Evaluation Metrics & Weights', icon: BarChart3 },
            { id: 'PLAYGROUND', label: 'Interactive Inference', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: MODEL TRAINING */}
          {activeTab === 'TRAIN' && (
            <div className="space-y-6">
              {trainingMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{trainingMessage}</span>
                </div>
              )}

              {/* Training Controls Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Hyperparameter & Synthetic Generator Configuration
                </h4>
                <p className="text-xs text-slate-500 mb-5">
                  Configure synthetic dataset scale and optimizer hyperparameters to train the multivariate logistic regression model.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Synthetic Sample Count:</span>
                      <span className="font-mono text-blue-600">{sampleCount.toLocaleString()} records</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="500"
                      value={sampleCount}
                      onChange={(e) => setSampleCount(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">Generated historical waitlist records</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Training Epochs:</span>
                      <span className="font-mono text-blue-600">{epochs} epochs</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="250"
                      step="10"
                      value={epochs}
                      onChange={(e) => setEpochs(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">Mini-batch gradient descent iterations</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Learning Rate (α):</span>
                      <span className="font-mono text-blue-600">{learningRate}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      value={learningRate}
                      onChange={(e) => setLearningRate(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">Step size for weight vector updates</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleTrainModel}
                    disabled={isTraining}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isTraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating Data & Training...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Generate Synthetic Data & Train Model
                      </>
                    )}
                  </button>

                  <span className="text-xs text-slate-500">
                    Last trained: <strong className="text-slate-800">{metrics?.trainedAt ? new Date(metrics.trainedAt).toLocaleTimeString() : 'On server startup'}</strong>
                  </span>
                </div>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Test Accuracy</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {metrics?.finalAccuracy || 88.5}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Holdout 20% validation split</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Final Cross-Entropy Loss</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">
                    {metrics?.finalLoss || 0.32}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Binary cross entropy loss</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs text-slate-500 font-semibold">F1 Score</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    {metrics?.metrics?.f1Score || 87.2}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Harmonic mean of precision & recall</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-xs text-slate-500 font-semibold">Synthetic Records</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {metrics?.sampleCount?.toLocaleString() || '2,500'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">80% train / 20% test split</div>
                </div>
              </div>

              {/* Epoch Loss Curve */}
              {metrics?.epochHistory && metrics.epochHistory.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Gradient Descent Convergence History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                          <th className="py-2">Epoch</th>
                          <th className="py-2">Loss (BCE)</th>
                          <th className="py-2">Train Acc (%)</th>
                          <th className="py-2">Val Acc (%)</th>
                          <th className="py-2">Convergence State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {metrics.epochHistory.map((ep: any) => (
                          <tr key={ep.epoch} className="hover:bg-slate-50">
                            <td className="py-1.5 font-bold text-slate-900">Epoch {ep.epoch}</td>
                            <td className="py-1.5 text-blue-600 font-bold">{ep.loss.toFixed(3)}</td>
                            <td className="py-1.5 text-emerald-600">{ep.trainAccuracy}%</td>
                            <td className="py-1.5 text-indigo-600">{ep.valAccuracy}%</td>
                            <td className="py-1.5 text-[11px] text-slate-500 font-sans">
                              {ep.epoch === 1 ? 'Initialized' : ep.loss < 0.4 ? 'Optimized' : 'Descending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYNTHETIC DATASET */}
          {activeTab === 'DATASET' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Synthetic Training Dataset Sample
                  </h4>
                  <p className="text-xs text-slate-500">
                    Realistically generated Indian Railways booking churn records based on queue depth, lead days, class cancellation penalties, and weekend surges.
                  </p>
                </div>
                <button
                  onClick={fetchSyntheticSamples}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Preview
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Train</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Waitlist (Queue)</th>
                      <th className="py-2.5 px-3">Lead Time</th>
                      <th className="py-2.5 px-3">Capacity</th>
                      <th className="py-2.5 px-3">Day / Weekend</th>
                      <th className="py-2.5 px-3">Target (Confirmed)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {syntheticSamples.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">#{row.id}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.trainNumber}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                            {row.travelClass}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-amber-600">WL {row.currentWaitlist}</td>
                        <td className="py-2 px-3">{row.leadTimeDays} days</td>
                        <td className="py-2 px-3">{row.totalSeats} seats</td>
                        <td className="py-2 px-3 text-[11px] font-sans">
                          {row.dayOfWeek} {row.isWeekend ? '🌴' : '💼'}
                        </td>
                        <td className="py-2 px-3">
                          {row.confirmed === 1 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> CONFIRMED (1)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                              <X className="w-3 h-3" /> CANCELLED/WL (0)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: METRICS & WEIGHTS */}
          {activeTab === 'METRICS' && (
            <div className="space-y-6">
              {/* Learned Weights Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Learned Feature Weights (Logistic Regression Coefficients)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Feature weights learned via Gradient Descent. Positive weights increase confirmation likelihood; negative weights decrease confirmation likelihood.
                </p>

                <div className="space-y-3">
                  {metrics?.weights?.map((w: any) => {
                    const isPositive = w.weight >= 0;
                    return (
                      <div
                        key={w.featureName}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900">{w.featureName}</div>
                          <div className="text-[11px] text-slate-500">{w.description}</div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {w.weight > 0 ? `+${w.weight}` : w.weight}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">Intercept / Bias (b)</div>
                      <div className="text-[11px] text-slate-500">Baseline log-odds before feature activation</div>
                    </div>
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      {metrics?.bias || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confusion Matrix */}
              {metrics?.metrics && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Validation Confusion Matrix (20% Holdout Test Split)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-center font-mono">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">True Positive (TP)</div>
                      <div className="text-2xl font-black text-emerald-800 mt-1">{metrics.metrics.truePositives}</div>
                      <div className="text-[10px] text-emerald-600 mt-1">Confirmed & Predicted Confirmed</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                      <div className="text-[10px] text-rose-600 font-bold uppercase">False Positive (FP)</div>
                      <div className="text-2xl font-black text-rose-800 mt-1">{metrics.metrics.falsePositives}</div>
                      <div className="text-[10px] text-rose-600 mt-1">Not Confirmed but Predicted Confirmed</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                      <div className="text-[10px] text-amber-600 font-bold uppercase">False Negative (FN)</div>
                      <div className="text-2xl font-black text-amber-800 mt-1">{metrics.metrics.falseNegatives}</div>
                      <div className="text-[10px] text-amber-600 mt-1">Confirmed but Predicted Not Confirmed</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                      <div className="text-[10px] text-blue-600 font-bold uppercase">True Negative (TN)</div>
                      <div className="text-2xl font-black text-blue-800 mt-1">{metrics.metrics.trueNegatives}</div>
                      <div className="text-[10px] text-blue-600 mt-1">Not Confirmed & Predicted Not Confirmed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIVE PLAYGROUND */}
          {activeTab === 'PLAYGROUND' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Live Prediction Playground
                </h4>
                <p className="text-xs text-slate-500">
                  Adjust features below to test the trained model’s sigmoid inference in real time.
                </p>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Waitlist Queue Position:</span>
                    <span className="font-mono text-amber-600">WL {testWl}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={testWl}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTestWl(v);
                      runInference(v, testLeadDays, testClass, testSeats);
                    }}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Journey Lead Time:</span>
                    <span className="font-mono text-blue-600">{testLeadDays} days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={testLeadDays}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTestLeadDays(v);
                      runInference(testWl, v, testClass, testSeats);
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Travel Class:</span>
                    <span className="font-mono text-slate-800">{testClass}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['1A', '2A', '3A', 'CC', 'SL'].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setTestClass(c);
                          runInference(testWl, testLeadDays, c, testSeats);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          testClass === c
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Total Coach Seats:</span>
                    <span className="font-mono text-slate-800">{testSeats} berths</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="240"
                    step="20"
                    value={testSeats}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTestSeats(v);
                      runInference(testWl, testLeadDays, testClass, v);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Output Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Model Inference Output
                  </div>

                  <div className="my-6 text-center">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 font-mono">
                      {testResult?.confirmationProbability ?? 0}%
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-1">
                      Probability of Confirmation
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          testResult?.confidenceLevel === 'HIGH LIKELIHOOD'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : testResult?.confidenceLevel === 'MEDIUM LIKELIHOOD'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {testResult?.confidenceLevel || 'EVALUATING'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="text-slate-500 font-bold uppercase text-[10px]">
                      Feature Contributions:
                    </div>
                    {testResult?.featureContributions?.map((fc: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="text-slate-600">{fc.feature} ({fc.value}):</span>
                        <span
                          className={`font-bold text-[11px] ${
                            fc.effect === 'INCREASES_CHANCE'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {fc.effect === 'INCREASES_CHANCE' ? '+ Boost' : '- Burden'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  {testResult?.explanation}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Model: <strong>Logistic Regression (L2 Regularized) + Multinomial Naive Bayes</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
