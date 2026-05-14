const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Group = require("../models/Group");
const authService = require("./auth.service");
const groupService = require("./group.service");
const AppError = require("../utils/appError");

const DEMO_USERS = {
  a: {
    key: "a",
    name: "Demo Aditi",
    email: "demo.aditi@splitchill.local",
    income: 90000,
  },
  b: {
    key: "b",
    name: "Demo Kabir",
    email: "demo.kabir@splitchill.local",
    income: 65000,
  },
};

const DEMO_GROUP_NAME = "SplitChill Live Demo";
const DEMO_GROUP_KEY = "demo:two-account-chat";
const DEMO_PASSWORD = "DemoOnly!ChangeViaBackend";

function isDemoEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEMO_AUTH_ENABLED !== "false";
}

function assertDemoEnabled() {
  if (!isDemoEnabled()) throw new AppError("Demo login is disabled", 404);
}

async function ensureDemoUser(config) {
  const email = config.email.toLowerCase();
  let user = await User.findOne({ email });
  if (user) return user;

  const passwordHash = await bcrypt.hash(`${DEMO_PASSWORD}:${config.key}`, 12);
  try {
    user = await User.create({
      name: config.name,
      email,
      passwordHash,
      income: config.income,
      stats: {
        participationScore: 1,
        paymentConsistency: 1,
      },
    });
    return user;
  } catch (error) {
    if (error?.code === 11000) {
      return User.findOne({ email });
    }
    throw error;
  }
}

async function ensureDemoSetup() {
  assertDemoEnabled();
  const demoA = await ensureDemoUser(DEMO_USERS.a);
  const demoB = await ensureDemoUser(DEMO_USERS.b);

  let group = await Group.findOne({ directKey: DEMO_GROUP_KEY });
  if (!group) {
    group = await Group.create({
      name: DEMO_GROUP_NAME,
      type: "general",
      directKey: DEMO_GROUP_KEY,
      owner: demoA._id,
      members: [
        {
          user: demoA._id,
          role: "owner",
          incomeSnapshot: demoA.income || 0,
          participationScore: 1,
          paymentConsistency: 1,
        },
        {
          user: demoB._id,
          role: "member",
          incomeSnapshot: demoB.income || 0,
          participationScore: 1,
          paymentConsistency: 1,
        },
      ],
      fairnessHistory: [{ score: 100, imbalance: 0, calculatedAt: new Date() }],
    });
  }

  return {
    users: [demoA, demoB],
    group: await groupService.getGroupById(group._id, demoA._id),
  };
}

async function demoLogin(persona) {
  assertDemoEnabled();
  const key = String(persona || "").toLowerCase();
  const config = DEMO_USERS[key];
  if (!config) throw new AppError("Unknown demo account", 400);
  await ensureDemoSetup();
  const user = await User.findOne({ email: config.email }).select("+refreshTokenHash +refreshTokenExpiresAt");
  return authService.issueSession(user);
}

function getDemoConfig() {
  return {
    enabled: isDemoEnabled(),
    accounts: Object.values(DEMO_USERS).map(({ key, name, email }) => ({ key, name, email })),
    groupName: DEMO_GROUP_NAME,
  };
}

module.exports = {
  demoLogin,
  ensureDemoSetup,
  getDemoConfig,
  isDemoEnabled,
};
