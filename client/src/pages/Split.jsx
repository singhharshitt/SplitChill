import React, { useEffect, useMemo, useState } from "react";
import AmountInput from "../sections/Split/AmountInput";
import PeopleSelector from "../sections/Split/PeopleSelector";
import SplitTypeSelector from "../sections/Split/SplitTypeSelector";
import SplitPreview from "../sections/Split/DynamicSplitPreview";
import AIInsightCard from "../sections/Split/AIInsightCard";
import FairnessIndicator from "../sections/Split/FiarnesIndicator";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLiveData } from "../context/LiveDataContext.jsx";
import fairimage from '../assets/fairimage.png'

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
  const { selectedGroup, addExpense, recommendSplit } = useLiveData();
  const [amount, setAmount] = useState("");
  const [extraPeople, setExtraPeople] = useState([]);
  const [removedPeople, setRemovedPeople] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const groupPeople = useMemo(() => (selectedGroup?.members || []).map((member) => ({
    id: member.id,
    name: member.name,
    initial: member.avatar,
  })), [selectedGroup]);
  const people = useMemo(() => [
    ...groupPeople.filter((person) => !removedPeople.includes(person.id)),
    ...extraPeople,
  ], [extraPeople, groupPeople, removedPeople]);
  const customTotal = useMemo(() => people.reduce((sum, person) => sum + Number(customShares[person.id] || 0), 0), [customShares, people]);
  const amountValue = Number(amount);
  const customReady = splitType !== "custom" || Math.abs(customTotal - amountValue) < 0.01;
  const ready = amountValue > 0 && people.length > 0 && customReady;

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
          participants: people.map((person) => ({ user: person.id, share: Number(customShares[person.id] || 0) })),
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

  const handleCreateSplit = async () => {
    if (!selectedGroup || !user) {
      setFeedback("Create or select a group first.");
      return;
    }
    setIsSaving(true);
    setFeedback("");
    try {
      await addExpense(selectedGroup.id, {
        title: "New split",
        amount: amountValue,
        paidBy: user._id,
        splitType: mapSplitType(splitType),
        participants: people.map((person) => ({ user: person.id, share: Number(customShares[person.id] || 0) })),
      });
      setAmount("");
      setFeedback("Split created and synced.");
    } catch (error) {
      setFeedback(error.response?.data?.message || "Could not create split.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans selection:bg-[#A3FDA7]/30">

      <Navbar/>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-10 flex flex-col gap-14">
        {!selectedGroup && (
          <p className="text-center text-sm text-gray-500">Create or select a group before adding a split.</p>
        )}
        <section>
          <AmountInput value={amount} onChange={setAmount} />
        </section>
        <section>
          <PeopleSelector
            people={people}
            onAdd={handleAddPerson}
            onRemove={handleRemovePerson}
            allowAdd={false}
          />
          <p className="text-xs text-gray-400 mt-3">Add new people from a group before including them in a production split.</p>
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
        <img src={fairimage}/>
      </main>
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
