const demoService = require("../services/demo.service");
const asyncHandler = require("../utils/asyncHandler");

const status = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: demoService.getDemoConfig() });
});

const setup = asyncHandler(async (_req, res) => {
  const result = await demoService.ensureDemoSetup();
  res.json({
    success: true,
    data: {
      users: result.users.map((user) => user.toSafeObject()),
      group: result.group,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await demoService.demoLogin(req.body.persona);
  res.json({
    success: true,
    data: {
      user: result.user,
      token: result.token,
    },
  });
});

module.exports = { login, setup, status };
