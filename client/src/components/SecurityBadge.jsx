export default function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="text-[10px] text-gray-400 tracking-wide">Secured connection</span>
    </div>
  );
}