const Grn = require('../models/Grn')
const QcInspection = require('../models/QcInspection')
const { QC_STATUS } = require('../utils/constants')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

exports.stats = async (_req, res) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [totalGrns, qcCounts, monthly, recentGrns, recentQc] = await Promise.all([
    Grn.countDocuments(),
    QcInspection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Grn.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Grn.find().sort({ createdAt: -1 }).limit(5).select('grnNumber vendor.name items grnDate qc.status createdAt'),
    QcInspection.find({ status: { $ne: QC_STATUS.PENDING } }).sort({ updatedAt: -1 }).limit(5).select('batchId qcId status updatedAt'),
  ])

  const byStatus = Object.fromEntries(qcCounts.map((c) => [c._id, c.count]))
  const passed = byStatus[QC_STATUS.PASSED] || 0
  const rejected = byStatus[QC_STATUS.REJECTED] || 0
  const pending = byStatus[QC_STATUS.PENDING] || 0
  const done = passed + rejected

  const monthlyGrns = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const hit = monthly.find((x) => x._id.y === d.getFullYear() && x._id.m === d.getMonth() + 1)
    return { month: MONTHS[d.getMonth()], year: d.getFullYear(), count: hit?.count || 0 }
  })

  const activity = [
    ...recentGrns.map((g) => ({ text: `${g.grnNumber} created`, type: 'grn', at: g.createdAt })),
    ...recentQc.map((q) => ({ text: `QC ${q.status.toLowerCase()} for ${q.batchId}`, type: q.status, at: q.updatedAt })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)

  res.json({
    success: true,
    stats: {
      totalGrns,
      pendingQc: pending,
      passedQc: passed,
      rejectedQc: rejected,
      passRate: done ? Math.round((passed / done) * 100) : 0,
    },
    monthlyGrns,
    recentGrns: recentGrns.map((g) => ({
      id: g.grnNumber,
      vendor: g.vendor.name,
      items: g.items.length,
      date: g.grnDate,
      status: g.qc.status,
    })),
    activity,
  })
}
