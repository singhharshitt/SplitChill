export default function SmartActionBubble({ actions, context }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex flex-col gap-2">
        {context && <span className="text-[10px] text-gray-400 ml-1">{context}</span>}
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-medium hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-md shadow-black/5"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
