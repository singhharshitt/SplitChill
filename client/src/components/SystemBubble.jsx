export default function SystemBubble({ text }) {
  return (
    <div className="flex justify-center">
      <span className="text-[11px] text-gray-400 bg-black/[0.02] px-4 py-1.5 rounded-full tracking-wide">
        {text}
      </span>
    </div>
  );
}
