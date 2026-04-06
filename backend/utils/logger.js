const winston = require("winston");

const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    // common circular / huge fields (axios/express)
    if (
      key === "req" ||
      key === "res" ||
      key === "request" ||
      key === "response" ||
      key === "socket"
    ) {
      return `[${key}]`;
    }
    return value;
  });
};

const isProd = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack, ...rest }) => {
            const extra = Object.keys(rest).length ? " " + safeStringify(rest) : "";
            return `${timestamp} ${level}: ${stack || message}${extra}`;
          }),
        ),
  ),
  transports: [
    new winston.transports.Console(),
    ...(isProd
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

module.exports = logger;