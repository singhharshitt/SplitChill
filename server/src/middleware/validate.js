const { z } = require("zod");
const AppError = require("../utils/appError");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const positiveMoney = z.coerce.number().positive().max(10000000);

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError("Invalid request payload", 400, result.error.flatten()));
    }
    req[source] = result.data;
    return next();
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    throw new AppError("Missing required fields", 400, { missing });
  }
}

function assertPositiveNumber(value, field) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    throw new AppError(`${field} must be a positive number`, 400);
  }
}

const schemas = {
  register: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(128),
    income: z.coerce.number().min(0).max(100000000).optional().default(0),
  }),
  login: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(128),
  }),
  refresh: z.object({
    refreshToken: z.string().min(20).optional(),
  }),
  createGroup: z.object({
    name: z.string().trim().min(2).max(100),
    type: z.enum(["trip", "rent", "event", "dining", "general", "direct"]).optional(),
    memberIds: z.array(objectId).max(50).optional().default([]),
  }),
  addMember: z.object({
    userId: objectId,
  }),
  directChat: z.object({
    email: z.string().trim().email().toLowerCase(),
  }),
  aiChat: z.object({
    message: z.string().trim().min(1).max(1000),
    context: z.object({
      page: z.string().trim().max(80).optional(),
      groupId: objectId.optional(),
    }).optional().default({}),
  }),
  expense: z.object({
    title: z.string().trim().min(2).max(140),
    amount: positiveMoney,
    paidBy: objectId.optional(),
    splitType: z.enum(["equal", "income-based", "usage-based", "ai-recommended", "custom"]).optional(),
    participants: z.array(z.object({
      user: objectId,
      usage: z.coerce.number().min(0).max(5).optional(),
      share: z.coerce.number().min(0).optional(),
    })).max(50).optional(),
  }),
  recommendSplit: z.object({
    amount: positiveMoney,
    splitType: z.enum(["equal", "income-based", "usage-based", "ai-recommended", "custom"]).optional(),
    participants: z.array(z.object({
      user: objectId,
      usage: z.coerce.number().min(0).max(5).optional(),
      share: z.coerce.number().min(0).optional(),
    })).max(50).optional(),
  }),
  settle: z.object({
    groupId: objectId,
    payer: objectId,
    receiver: objectId,
    amount: positiveMoney,
    note: z.string().trim().max(240).optional(),
    receiverUpiId: z.string().trim().regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}[\w.\-]*$/, "Invalid UPI id").optional(),
  }),
  confirmPayment: z.object({
    status: z.enum(["completed", "cancelled", "failed"]).default("completed"),
    providerReference: z.string().trim().max(120).optional(),
  }),
  initiatePayment: z.object({
    currency: z.string().trim().length(3).toUpperCase().optional().default("INR"),
  }),
  startOtp: z.object({
    phone: z.string().trim().regex(/^\+?\d{10,15}$/, "Valid phone number required"),
  }),
  verifyOtp: z.object({
    challengeId: objectId,
    code: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
  }),
  transactionIdParam: z.object({
    transactionId: objectId,
  }),
  transactionQuery: z.object({
    groupId: objectId.optional(),
  }),
  idParam: z.object({
    id: objectId,
  }),
  chatMessage: z.object({
    text: z.string().trim().min(1).max(1000),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  updateMe: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    income: z.coerce.number().min(0).max(100000000).optional(),
    preferences: z.object({
      defaultSplit: z.enum(["equal", "ai", "custom"]).optional(),
      paymentReminders: z.boolean().optional(),
      fairnessAlerts: z.boolean().optional(),
      groupActivity: z.boolean().optional(),
      keepIncomePrivate: z.boolean().optional(),
      shareInsights: z.boolean().optional(),
      aiPersonalization: z.boolean().optional(),
    }).optional(),
  }),
};

module.exports = {
  assertPositiveNumber,
  objectId,
  positiveMoney,
  requireFields,
  schemas,
  validate,
};
