const AuditLog = require("../models/AuditLog");

async function writeAudit({ actor, action, resourceType, resourceId, group, req, metadata = {} }) {
  return AuditLog.create({
    actor,
    action,
    resourceType,
    resourceId,
    group,
    ip: req?.ip,
    userAgent: req?.headers?.["user-agent"],
    metadata,
  }).catch(() => null);
}

module.exports = { writeAudit };
