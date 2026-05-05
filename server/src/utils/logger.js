const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = levels[process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug")] ?? 2;

function write(level, message, meta = {}) {
  if (levels[level] > activeLevel) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

module.exports = {
  debug: (message, meta) => write("debug", message, meta),
  error: (message, meta) => write("error", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
};
