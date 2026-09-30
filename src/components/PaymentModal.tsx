import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle2, Loader2, ShieldCheck, ArrowRight, ArrowLeft, QrCode, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext.tsx';

interface PaymentModalProps {
  amount: number;
  trainName: string;
  trainNumber: string;
  seatNumber: string;
  journeyDate: string;
  onPaymentSuccess: (paymentMethod: string) => Promise<void>;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  trainName,
  trainNumber,
  seatNumber,
  journeyDate,
  onPaymentSuccess,
  onClose,
}) => {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiApp, setUpiApp] = useState<'Google Pay' | 'PhonePe' | 'Paytm' | 'QR Code'>('Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Code screen state
  const [showQrScreen, setShowQrScreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQrScreen && timeLeft > 0 && !isSuccess) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQrScreen, timeLeft, isSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const upiId = 'smartrailway@upi';
  const upiPayload = `upi://pay?pa=${upiId}&pn=Smart%20Railway&am=${amount}&cu=INR&tn=Booking-${trainNumber}-${seatNumber}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleInitialPayClick = () => {
    if (selectedMethod === 'UPI') {
      // User clicked pay with UPI -> Show the real scannable QR Code screen
      setShowQrScreen(true);
      setTimeLeft(300);
    } else {
      // Direct processing for Card / Net Banking demo
      handleConfirmDonePayment(selectedMethod);
    }
  };

  const handleConfirmDonePayment = async (method: string = 'UPI') => {
    setIsProcessing(true);
    setError(null);
    try {
      await onPaymentSuccess(method);
      setIsSuccess(true);
      setShowQrScreen(false);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 max-h-[92vh] overflow-y-auto">
        {!isSuccess ? (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {showQrScreen && (
                  <button
                    onClick={() => setShowQrScreen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    title={t('backToMethods')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {t('secureCheckout')}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {showQrScreen ? t('scanUpiQrCode') : t('choosePaymentMethod')}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Fare Summary Card */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {trainNumber} {trainName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('seat')}: <span className="font-mono text-blue-700 font-bold">{seatNumber}</span> • {journeyDate}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">{t('totalPayable')}</span>
                <span className="text-2xl font-black text-blue-600">₹ {amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* QR CODE SCREEN VIEW */}
            {showQrScreen ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="text-xs text-slate-600 font-medium">
                    {t('scanQrInstruction')}
                  </div>

                  {/* High Quality Real QR Code */}
                  <div className="inline-block p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    <QRCodeSVG
                      value={upiPayload}
                      size={200}
                      level="H"
                      includeMargin={false}
                      className="mx-auto"
                    />
                  </div>

                  {/* UPI Details & Timer */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-semibold">{t('upiId')}:</span>
                      <span className="font-mono font-bold text-blue-700">{upiId}</span>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2 py-1 rounded-lg bg-slate-50 hover:bg-blue-50"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">{t('copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    {t('qrExpiresIn')}:{' '}
                    <span className="font-mono font-bold text-amber-600">{formatTime(timeLeft)}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* DONE AFTER SCANNING BUTTON */}
                <button
                  type="button"
                  onClick={() => handleConfirmDonePayment('UPI')}
                  disabled={isProcessing}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Confirming Bank Transaction & Locking Seat...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('donePayment')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrScreen(false)}
                  disabled={isProcessing}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  {t('backToMethods')}
                </button>
              </div>
            ) : (
              /* PAYMENT METHOD SELECTION VIEW */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedMethod === 'UPI'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-400/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs font-bold block">{t('upi')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedMethod === 'CARD'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-400/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="text-xs font-bold block">{t('card')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('NET_BANKING')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedMethod === 'NET_BANKING'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-400/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <span className="text-xs font-bold block">{t('netBanking')}</span>
                  </button>
                </div>

                {/* Sub-options for UPI */}
                {selectedMethod === 'UPI' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <span className="text-xs text-slate-500 block font-semibold">{t('selectUpiGateway')}</span>
                    {(['Google Pay', 'PhonePe', 'Paytm', 'QR Code'] as const).map((app) => (
                      <label
                        key={app}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white cursor-pointer text-xs font-medium text-slate-700 border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {app === 'QR Code' ? <QrCode className="w-4 h-4 text-blue-600" /> : <Smartphone className="w-4 h-4 text-emerald-600" />}
                          <span>{app === 'QR Code' ? t('payViaQrCode') : app}</span>
                        </div>
                        <input
                          type="radio"
                          name="upi"
                          checked={upiApp === app}
                          onChange={() => setUpiApp(app)}
                          className="text-blue-600 accent-blue-600"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {/* Sub-options for Card */}
                {selectedMethod === 'CARD' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="text-slate-500 font-medium">Sandbox Test Card Details</div>
                    <input
                      type="text"
                      disabled
                      value="•••• •••• •••• 4242"
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-600"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled
                        value="12/28"
                        className="w-1/2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-600"
                      />
                      <input
                        type="text"
                        disabled
                        value="CVV: 888"
                        className="w-1/2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-600"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-options for Net Banking */}
                {selectedMethod === 'NET_BANKING' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="text-slate-500 block font-medium">Popular Indian Banks</span>
                    <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700">
                      <option>State Bank of India (SBI)</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Bank of Baroda</option>
                    </select>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* Test Mode Note */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Demo Payment Mode:</strong> {t('demoPaymentMode')}
                  </span>
                </div>

                {/* Primary Button */}
                <button
                  type="button"
                  onClick={handleInitialPayClick}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying Payment with Gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>{t('pay')} ₹ {amount.toLocaleString('en-IN')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{t('paymentSuccessful')}</h3>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              {t('paymentSuccessDesc')}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {t('viewTicket')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
