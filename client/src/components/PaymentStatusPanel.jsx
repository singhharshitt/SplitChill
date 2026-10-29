import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, QrCode, ShieldAlert, Smartphone, XCircle, CheckCircle } from "lucide-react";
import { getApiError } from "../api/client.js";
import { reportSettlementPaid, confirmSettlement, cancelSettlement } from "../api/payments.js";
import { getSocket } from "../api/socket.js";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  reported_paid: "bg-blue-50 text-blue-700 border-blue-100",
  recipient_confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  failed: "bg-red-50 text-red-700 border-red-100",
  cancelled: "bg-gray-50 text-gray-600 border-gray-100",
};

const statusLabels = {
  pending: "Awaiting payment",
  reported_paid: "Payer reported payment (unverified)",
  recipient_confirmed: "Confirmed by receiver",
  completed: "Settled (manual)",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function PaymentStatusPanel({ transaction, currentUserId }) {
  const [latest, setLatest] = useState(null);
  // `latest` is always a raw server transaction document.
  const raw = latest || transaction?.raw || transaction;
  const status = raw?.status || transaction?.status || "pending";
  const upi = raw?.upi || transaction?.upi || {};
  const payerId = String(raw?.payer?._id || raw?.payer || "");
  const receiverId = String(raw?.receiver?._id || raw?.receiver || "");
  const isPayer = payerId === String(currentUserId || "");
  const isReceiver = receiverId === String(currentUserId || "");
  const isActionable = ["pending", "reported_paid"].includes(status);

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Listen for settlement updates made by the other party in realtime.
  useEffect(() => {
    if (!raw?.group?._id && !raw?.group) return undefined;
    const groupId = raw.group?._id || raw.group;
    const socket = getSocket();
    socket.emit("group:join", groupId);
    const handleUpdate = (payload) => {
      if (String(payload?.transaction?._id) === String(raw._id)) {
        setLatest(payload.transaction);
      }
    };
    socket.on("transaction:updated", handleUpdate);
    return () => {
      socket.off("transaction:updated", handleUpdate);
    };
  }, [currentUserId, raw?._id, raw?.group]);

  const act = useCallback(async (action, payload = {}) => {
    setBusy(action);
    setError("");
    try {
      let data;
      if (action === "report") data = await reportSettlementPaid(raw._id, payload);
      if (action === "confirm") data = await confirmSettlement(raw._id, payload);
      if (action === "cancel") data = await cancelSettlement(raw._id, payload);
      if (data?.transaction) setLatest(data.transaction);
      setNotice(
        action === "report"
          ? "Marked as paid. Waiting for the receiver to confirm receipt."
          : action === "confirm"
          ? "Receipt confirmed — balances updated."
          : "Settlement cancelled.",
      );
    } catch (errInner) {
      setError(getApiError(errInner, "Could not update the settlement."));
    } finally {
      setBusy("");
    }
  }, [raw._id]);

  const payee = useMemo(() => {
    const vpa = raw?.upi?.payeeVpa;
    if (!vpa) return null;
    return { name: raw?.upi?.payeeName || "Receiver", vpa };
  }, [raw]);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <h3 className="text-sm font-semibold text-black">UPI settlement</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isActionable
              ? "Balances change only after the receiver confirms receipt."
              : "This settlement is recorded in group history."}
          </p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full border font-medium ${statusStyles[status] || statusStyles.pending}`}>
          {statusLabels[status] || status}
        </span>
      </div>

      {payee && (
        <div className="rounded-xl bg-[#FAFAF8] border border-black/[0.04] p-3 text-xs text-gray-600 flex flex-col gap-1">
          <p>Payee: <span className="font-medium text-black">{payee.name}</span></p>
          <p>UPI ID: <span className="font-mono text-black">{payee.vpa}</span></p>
          <p>Amount: <span className="font-medium text-black">₹{Number(raw?.amount || transaction?.amount || 0).toFixed(2)}</span></p>
        </div>
      )}

      {isActionable && payee?.vpa && (
        <div className="flex items-center gap-3">
          {upi.qrDataUrl ? (
            <img src={upi.qrDataUrl} alt="UPI QR code" className="w-32 h-32 rounded-xl border border-black/10" />
          ) : (
            <div className="w-32 h-32 rounded-xl border border-black/10 flex items-center justify-center text-gray-400"><QrCode size={28} /></div>
          )}
          <div className="flex flex-col gap-2 text-xs text-gray-500">
            <p>Scan with any UPI app, or open the payment link on a phone.</p>
            {upi.deepLink && (
              <a
                href={upi.deepLink}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white w-fit"
              >
                <Smartphone size={16} />
                Open UPI app
              </a>
            )}
          </div>
        </div>
      )}

      {isActionable && isPayer && (
        <button
          type="button"
          onClick={() => act("report")}
          disabled={busy !== ""}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "report" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {status === "reported_paid" ? "Already reported as paid" : "I have sent the payment"}
        </button>
      )}

      {isActionable && isReceiver && (
        <button
          type="button"
          onClick={() => act("confirm")}
          disabled={busy !== ""}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A3FDA7] px-4 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "confirm" ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
          I received the payment (settles balances)
        </button>
      )}

      {isActionable && (
        <button
          type="button"
          onClick={() => act("cancel")}
          disabled={busy !== ""}
          className="text-xs text-gray-500 underline underline-offset-2 w-fit disabled:opacity-50"
        >
          {busy === "cancel" ? "Cancelling..." : "Cancel settlement"}
        </button>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        SplitChill cannot verify real bank transfers. The payment status is user-confirmed, not bank-verified: only the
        receiver can finalize this settlement.
      </p>

      {notice && <p className="text-xs text-emerald-700">{notice}</p>}
      {error && (
        <p className="inline-flex items-center gap-2 text-xs text-red-600">
          <XCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
