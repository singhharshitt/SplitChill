import React, { useEffect, useMemo, useRef, useState } from "react";
import AmountInput from "../sections/Split/AmountInput";
import UserContactSelector from "../sections/Split/UserContactSelector";
import PeopleSelector from "../sections/Split/PeopleSelector";
import SplitTypeSelector from "../sections/Split/SplitTypeSelector";
import SplitPreview from "../sections/Split/DynamicSplitPreview";
import AIInsightCard from "../sections/Split/AIInsightCard";
import FairnessIndicator from "../sections/Split/FiarnesIndicator";
import Navbar from "../components/Navbar.jsx";
import DirectChatModal from "../components/DirectChatModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLiveData } from "../context/LiveDataContext.jsx";
import fairimage from '../assets/fairimage.png'
import shopptense from '../assets/shopptense.png'
import api, { getApiError, unwrap } from "../api/client.js";
import { userIdOf } from "../lib/liveDataTransforms.js";
import { isCurrencyInputValid, parseCurrencyInput } from "../lib/currency.js";

const SUPPORTED_RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "application/pdf",
  "application/x-pdf",
]);

const SUPPORTED_RECEIPT_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff", "pdf"]);

function isSupportedReceiptFile(file) {
  if (!file) return false;

  const mimeType = String(file.type || "").toLowerCase();
  if (SUPPORTED_RECEIPT_MIME_TYPES.has(mimeType)) return true;

  const extension = String(file.name || "").split(".").pop().toLowerCase();
  return SUPPORTED_RECEIPT_EXTENSIONS.has(extension);
}

function DoodleIllustration() {
  return (
    <div className="flex justify-center py-8 opacity-80">
      <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
        {/* Character head */}
        <circle cx="70" cy="55" r="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Eyes */}
        <circle cx="63" cy="52" r="2" fill="currentColor" />
        <circle cx="77" cy="52" r="2" fill="currentColor" />
        {/* Smile */}
        <path d="M62 62 Q70 70 78 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Body */}
        <path d="M70 77 L70 125" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        {/* Arms holding beam */}
        <path d="M70 90 Q55 100 85 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 90 Q90 95 110 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Scale beam */}
        <line x1="85" y1="85" x2="165" y2="85" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        {/* Center string */}
        <line x1="125" y1="85" x2="125" y2="65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Left pan (lower / heavier) */}
        <line x1="95" y1="85" x2="90" y2="115" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="95" y1="85" x2="100" y2="115" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M85 115 Q92 125 105 115" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Right pan (higher / lighter) */}
        <line x1="155" y1="85" x2="150" y2="105" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="155" y1="85" x2="160" y2="105" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M145 105 Q152 113 165 105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Legs */}
        <path d="M70 125 L55 150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 125 L85 150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Small mint accent on scale center */}
        <circle cx="125" cy="60" r="4" fill="#A3FDA7" opacity="0.6" />
      </svg>
    </div>
  );
}

function SplitCTA({ disabled, onClick, isSaving }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white shadow-lg shadow-black/5 transition-all duration-300 hover:bg-gray-800 hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-black/20 disabled:shadow-none disabled:hover:scale-100"
    >
      {isSaving ? "Creating..." : "Create Split"}
    </button>
  );
}


export default function Split() {
  const { user } = useAuth();
  const { groups, selectedGroup, selectedGroupId, setSelectedGroupId, addExpense, recommendSplit, onlineUsers, createGroup } = useLiveData();
  const receiptInputRef = useRef(null);
  const [amount, setAmount] = useState("");
  const [extraPeople, setExtraPeople] = useState([]);
  const [removedPeople, setRemovedPeople] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [title, setTitle] = useState("New split");
  const [scanFeedback, setScanFeedback] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [directChatOpen, setDirectChatOpen] = useState(false);
  const groupPeople = useMemo(() => (selectedGroup?.members || []).map((member) => ({
    id: member.id,
    name: member.name,
    initial: member.avatar,
  })), [selectedGroup]);
  const people = useMemo(() => [
    ...groupPeople.filter((person) => !removedPeople.includes(person.id)),
    ...extraPeople,
  ], [extraPeople, groupPeople, removedPeople]);
  const customTotal = useMemo(() => people.reduce((sum, person) => sum + parseCurrencyInput(customShares[person.id]), 0), [customShares, people]);
  const amountValue = parseCurrencyInput(amount);
  const customReady = splitType !== "custom" || Math.abs(customTotal - amountValue) < 0.01;
  const ready = amountValue > 0 && people.length > 0 && customReady;
  const selectedOnlineCount = selectedGroupId ? (onlineUsers[selectedGroupId] || []).length : 0;

  useEffect(() => {
    let cancelled = false;
    async function loadRecommendation() {
      if (!ready || !selectedGroup) {
        setRecommendation(null);
        return;
      }
      try {
        const result = await recommendSplit(selectedGroup.id, {
          amount: amountValue,
          splitType: mapSplitType(splitType),
          participants: buildParticipantsPayload(people, splitType, customShares),
        });
        if (!cancelled) setRecommendation(result);
      } catch {
        if (!cancelled) setRecommendation(null);
      }
    }
    loadRecommendation();
    return () => { cancelled = true; };
  }, [amountValue, customShares, people, ready, recommendSplit, selectedGroup, splitType]);

  const handleAddPerson = (person) => setExtraPeople((p) => [...p, person]);
  const handleRemovePerson = (id) => {
    if (groupPeople.some((person) => person.id === id)) {
      setRemovedPeople((current) => [...current, id]);
      return;
    }
    setExtraPeople((current) => current.filter((person) => person.id !== id));
  };
  const handleCustomChange = (id, val) =>
    setCustomShares((s) => ({ ...s, [id]: val }));

  const openReceiptPicker = () => {
    if (isScanning || !selectedGroup || !receiptInputRef.current) return;
    receiptInputRef.current.value = "";
    receiptInputRef.current.click();
  };

  const handleCreateSplit = async () => {
    if (!user) {
      setFeedback("You must be logged in to create a split.");
      return;
    }

    if (!isCurrencyInputValid(amount) || amountValue <= 0) {
      setFeedback("Enter a valid amount.");
      return;
    }

    if (people.length === 0) {
      setFeedback("Add at least one person to split with.");
      return;
    }

    if (splitType === "custom" && !customReady) {
      setFeedback(`Custom shares must add up to Rs ${amountValue.toLocaleString()}.`);
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      let groupToUse = selectedGroup;

      if (!groupToUse && extraPeople.length > 0) {
        const groupName = `Split - Rs ${amountValue.toLocaleString()} ${new Date().toLocaleDateString()}`;
        const participantIds = extraPeople.map(p => p.id).filter(Boolean);
        const newGroup = await createGroup({
          name: groupName,
          type: "direct",
          memberIds: participantIds,
        });
        if (newGroup && newGroup.group) {
          groupToUse = newGroup.group;
          setSelectedGroupId(newGroup.group.id);
        }
      }

      if (!groupToUse) {
        setFeedback("Please select or create a group first.");
        setIsSaving(false);
        return;
      }

      await addExpense(groupToUse.id, {
        title,
        amount: amountValue,
        paidBy: userIdOf(user),
        splitType: mapSplitType(splitType),
        participants: buildParticipantsPayload(people, splitType, customShares),
      });
      setAmount("");
      setTitle("New split");
      setCustomShares({});
      setScanResult(null);
      setScanFeedback("");
      setExtraPeople([]);
      setFeedback("Split created and synced.");
    } catch (error) {
      setFeedback(error.response?.data?.message || "Could not create split.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceiptScan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isSupportedReceiptFile(file)) {
      setScanResult(null);
      setScanFeedback("Unable to detect a valid bill or receipt.");
      return;
    }

    setIsScanning(true);
    setScanFeedback("Scanning receipt...");
    setScanResult(null);
    try {
      let groupToUse = selectedGroup;

      if (!groupToUse) {
        const groupName = `Scan - ${new Date().toLocaleDateString()}`;
        const newGroup = await createGroup({
          name: groupName,
          type: "direct",
          memberIds: [],
        });
        if (newGroup && newGroup.group) {
          groupToUse = newGroup.group;
          setSelectedGroupId(newGroup.group.id);
        }
      }

      if (!groupToUse) {
        setScanFeedback("Could not create a group for scanning.");
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append("receipt", file);
      const data = unwrap(await api.post(`/groups/${groupToUse.id}/scan-receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }));
      if (data.fields?.total != null && data.fields.total !== "") setAmount(String(data.fields.total));
      if (data.fields?.merchant) setTitle(data.fields.merchant);
      setScanResult(data);
      setScanFeedback(data.fields?.total != null ? "Receipt scanned. Review the amount before creating the split." : "Receipt scanned, but no total was detected.");
    } catch (error) {
      setScanResult(null);
      setScanFeedback(getApiError(error, "Unable to detect a valid bill or receipt."));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">

      <Navbar/>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-10 flex flex-col gap-14">
        <section className="rounded-[24px] bg-white border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">Live Group</p>
              <h2 className="font-serif text-2xl text-black">{selectedGroup?.name || "No group selected"}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedGroup ? `${selectedGroup.members.length} members - ${selectedOnlineCount} online - updates sync instantly` : "Create a group from chat or dashboard first."}
              </p>
            </div>
            <select
              value={selectedGroupId || ""}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              disabled={groups.length === 0}
              className="rounded-2xl border border-black/10 bg-[#FAFAF8] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#A3FDA7]/40"
            >
              {groups.length === 0 && <option value="">No groups</option>}
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </div>
        </section>
        <section>
          <div className="mb-6 rounded-[24px] bg-white border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-5 flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <img src={shopptense} alt="" className="w-20 h-20 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">Receipt Assist</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full bg-transparent font-serif text-2xl text-black outline-none"
                placeholder="Expense title"
              />
              <p className="text-xs text-gray-500 mt-1">Scan a shopping or dining receipt, then review before saving.</p>
              {scanFeedback && <p className="text-xs text-gray-500 mt-2">{scanFeedback}</p>}
            </div>
            <button
              type="button"
              onClick={openReceiptPicker}
              disabled={isScanning}
              aria-busy={isScanning}
              className="shrink-0 rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white cursor-pointer hover:scale-[1.02] transition-transform disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isScanning ? "Scanning..." : "Scan"}
            </button>
            <input ref={receiptInputRef} type="file" accept="image/*,.pdf" onChange={handleReceiptScan} className="hidden" />
            <button
              type="button"
              onClick={() => setDirectChatOpen(true)}
              className="shrink-0 rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-medium text-black hover:shadow-md transition-all"
            >
              Create Chat
            </button>
          </div>
          {scanResult && (
            <div className="mb-6 rounded-[20px] bg-white border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-black">Scan result</p>
                <span className="text-[10px] text-gray-400">{scanResult.provider || "ocr"} · {Math.round((scanResult.confidence || 0) * 100)}%</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-2xl bg-[#FAFAF8] px-3 py-2">
                  <span className="block text-gray-400">Merchant</span>
                  <span className="text-black">{scanResult.fields?.merchant || "Not detected"}</span>
                </div>
                <div className="rounded-2xl bg-[#FAFAF8] px-3 py-2">
                  <span className="block text-gray-400">Total</span>
                  <span className="text-black">{scanResult.fields?.total ? `Rs ${scanResult.fields.total}` : "Not detected"}</span>
                </div>
                <div className="rounded-2xl bg-[#FAFAF8] px-3 py-2">
                  <span className="block text-gray-400">Date</span>
                  <span className="text-black">{scanResult.fields?.date || "Not detected"}</span>
                </div>
              </div>
              {scanResult.fields?.items?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {scanResult.fields.items.slice(0, 5).map((item) => (
                    <span key={`${item.name}-${item.amount}`} className="rounded-full bg-[#A3FDA7]/10 border border-[#A3FDA7]/20 px-3 py-1 text-[11px] text-emerald-800">
                      {item.name}: Rs {item.amount}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <AmountInput value={amount} onChange={setAmount} />
        </section>

        {amountValue > 0 && (
          <section>
            <UserContactSelector
              people={people}
              onAdd={handleAddPerson}
              amountEntered={amountValue > 0}
            />
          </section>
        )}

        <section>
          <PeopleSelector
            people={people}
            onAdd={handleAddPerson}
            onRemove={handleRemovePerson}
            allowAdd={false}
          />
          <p className="text-xs text-gray-400 mt-3">People added to this split.</p>
        </section>
        <section>
          <SplitTypeSelector active={splitType} onSelect={setSplitType} />
        </section>

        {ready && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SplitPreview
              amount={amount}
              people={people}
              splitType={splitType}
              customShares={customShares}
              onCustomChange={handleCustomChange}
              recommendedShares={recommendation?.shares}
            />
          </section>
        )}

        {/* AI Insight */}
        {ready && splitType === "ai" && (
          <section>
            <AIInsightCard visible={splitType === "ai"} />
          </section>
        )}

        {/* Fairness Indicator */}
        {ready && (
          <section>
            <FairnessIndicator people={people} splitType={splitType} />
          </section>
        )}

        {/* CTA */}
        <section>
          <SplitCTA disabled={!ready || isSaving} onClick={handleCreateSplit} isSaving={isSaving} />
          {splitType === "custom" && amountValue > 0 && !customReady && (
            <p className="text-center text-xs text-red-500 mt-3">Custom shares must add up to Rs {amountValue.toLocaleString()}.</p>
          )}
          {feedback && <p className="text-center text-xs text-gray-500 mt-3">{feedback}</p>}
        </section>
        <div className="rounded-[24px] bg-white border border-black/[0.04] shadow-[0_2px_24px_rgba(0,0,0,0.04)] p-5 flex items-center gap-4">
          <img src={fairimage} alt="" className="w-20 h-20 object-contain shrink-0" />
          <p className="text-sm text-gray-600 leading-relaxed">
            Fairness recommendations update from the selected group and sync after the split is created.
          </p>
        </div>
      </main>
      <DirectChatModal open={directChatOpen} onClose={() => setDirectChatOpen(false)} />
    </div>
  );
}

function mapSplitType(type) {
  return {
    ai: "ai-recommended",
    income: "income-based",
    custom: "custom",
    equal: "equal",
  }[type] || "equal";
}

function buildParticipantsPayload(people, splitType, customShares) {
  if (splitType === "custom") {
    return people.map((person) => ({ user: person.id, share: Number(customShares[person.id] || 0) }));
  }
  return people.map((person) => ({ user: person.id }));
}
