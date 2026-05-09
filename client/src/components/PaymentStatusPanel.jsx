import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { getApiError } from "../api/client.js";
import { initiateTransactionPayment, startOtp, verifyOtp } from "../api/payments.js";
import { connectSocket } from "../api/socket.js";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  processing: "bg-blue-50 text-blue-700 border-blue-100",
  succeeded: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  failed: "bg-red-50 text-red-700 border-red-100",
  cancelled: "bg-gray-50 text-gray-600 border-gray-100",
};

export default function PaymentStatusPanel({ transaction, onPaymentUpdate }) {
  const [paymentState, setPaymentState] = useState(transaction?.raw?.payment || null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const raw = transaction?.raw || transaction;
  const status = paymentState?.status || raw?.status || transaction?.status || "pending";
  const badgeClass = statusStyles[status] || statusStyles.pending;
  const canStartPayment = raw?._id && ["pending", "failed", "cancelled"].includes(raw?.status || "pending");

  useEffect(() => {
    if (!raw?.group?._id && !raw?.group) return undefined;
    const groupId = raw.group?._id || raw.group;
    const socket = connectSocket();
    socket.emit("group:join", groupId);
    const handleUpdate = (payload) => {
      if (String(payload?.transactionId) !== String(raw._id)) return;
      if (payload.payment) setPaymentState(payload.payment);
      onPaymentUpdate?.(payload);
    };
    socket.on("payment:initiated", handleUpdate);
    socket.on("payment:updated", handleUpdate);
    return () => {
      socket.off("payment:initiated", handleUpdate);
      socket.off("payment:updated", handleUpdate);
    };
  }, [onPaymentUpdate, raw?._id, raw?.group]);

  const buttonLabel = useMemo(() => {
    if (isStarting) return "Starting secure checkout";
    if (status === "processing") return "Payment processing";
    if (["completed", "succeeded"].includes(status)) return "Payment confirmed";
    return "Pay with Hyperswitch";
  }, [isStarting, status]);

  const rawId = raw?._id;

  const startPayment = useCallback(async () => {
    if (!rawId) return;
    setIsStarting(true);
    setError("");
    try {
      const data = await initiateTransactionPayment(rawId, { currency: "INR" });
      setPaymentState(data.payment);
      const checkoutUrl = data.checkout?.checkoutUrl;
      if (checkoutUrl) window.location.assign(checkoutUrl);
    } catch (err) {
      setError(getApiError(err, "Could not start payment."));
    } finally {
      setIsStarting(false);
    }
  }, [rawId]);

  const requestOtp = async () => {
    setError("");
    setOtpMessage("");
    try {
      const data = await startOtp(phone);
      setChallengeId(data.challengeId);
      setOtpMessage("Verification code sent.");
    } catch (err) {
      setError(getApiError(err, "Could not send OTP."));
    }
  };

  const submitOtp = async () => {
    setError("");
    try {
      await verifyOtp(challengeId, otp);
      setOtpMessage("Phone verified for payment alerts.");
      setChallengeId("");
      setOtp("");
    } catch (err) {
      setError(getApiError(err, "Could not verify OTP."));
    }
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard size={16} />
            <h3 className="text-sm font-semibold text-black">Secure payment</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Success is applied only after a verified server webhook.
          </p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${badgeClass}`}>
          {status}
        </span>
      </div>

      <button
        type="button"
        onClick={startPayment}
        disabled={!canStartPayment || isStarting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isStarting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        {buttonLabel}
      </button>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2">
          <Smartphone size={15} className="text-gray-400" />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+919876543210"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <button type="button" onClick={requestOtp} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/[0.03]">
          Send OTP
        </button>
      </div>

      {challengeId && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="6-digit code"
            maxLength={6}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none"
          />
          <button type="button" onClick={submitOtp} className="rounded-lg bg-[#A3FDA7] px-3 py-2 text-sm font-medium text-black">
            Verify
          </button>
        </div>
      )}

      {otpMessage && <p className="text-xs text-emerald-700">{otpMessage}</p>}
      {error && (
        <p className="inline-flex items-center gap-2 text-xs text-red-600">
          <XCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
