const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const requestLogger = require("./middleware/requestLogger");
const correlationId = require("./middleware/correlationId");
const { getConfiguredOrigins, isAllowedOrigin } = require("./config/corsOrigins");

const app = express();
const allowedOrigins = getConfiguredOrigins();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
}));
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    if (req.originalUrl?.startsWith("/api/webhooks")) {
      req.rawBody = buf.toString("utf8");
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(correlationId);
app.use(requestLogger);

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
