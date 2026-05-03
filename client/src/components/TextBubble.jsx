export default function TextBubble({ message }) {
  return (
    <div className={`flex ${message.self ? "justify-end" : "justify-start"}`}>
      <div className={`
        max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed
        ${message.self
          ? "bg-black text-white rounded-br-md"
          : "bg-white text-black border border-black/[0.04] rounded-bl-md shadow-sm"}
      `}>
        <p>{message.text}</p>
        <span className={`block text-[10px] mt-1.5 ${message.self ? "text-white/50" : "text-gray-400"}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}
