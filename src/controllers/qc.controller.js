const QcInspection = require('../models/QcInspection')
const Counter = require('../models/Counter')
const ApiError = require('../utils/ApiError')
const { QC_CHECKLIST, QC_STATUS } = require('../utils/constants')
const { syncGrnQcStatus } = require('../services/grn.service')

const buildChecks = (checks) =>
  checks.map((c, i) => ({ point: i + 1, label: QC_CHECKLIST[i], result: c.result, comment: c.comment }))

const applyResult = (doc, d, userId) => {
  doc.serialBody = d.serialBody
  doc.serialSoft = d.serialSoft
  doc.inspectionDate = d.inspectionDate || new Date()
  doc.inspectedBy = userId
  doc.checks = buildChecks(d.checks)
  doc.workingPorts = d.workingPorts
  doc.totalPorts = d.totalPorts
  doc.summary = d.summary
  doc.status = d.decision === 'PASS' ? QC_STATUS.PASSED : QC_STATUS.REJECTED
}

exports.checklist = (_req, res) => {
  res.json({ success: true, checklist: QC_CHECKLIST })
}

exports.list = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100)
  const { status, batchId, search } = req.query

  const filter = {}
  if (status) filter.status = status
  if (batchId) filter.batchId = batchId
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ qcId: rx }, { itemName: rx }, { serialNo: rx }, { grnNumber: rx }]
  }

  const [data, total] = await Promise.all([
    QcInspection.find(filter).populate('inspectedBy', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    QcInspection.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

exports.getOne = async (req, res) => {
  const qc = await QcInspection.findById(req.params.id).populate('inspectedBy', 'name')
  if (!qc) throw ApiError.notFound('QC inspection not found')
  res.json({ success: true, qc })
}

// Standalone inspection (no GRN)
exports.create = async (req, res) => {
  const d = req.body
  const seq = await Counter.next('qc-standalone')
  const qc = new QcInspection({
    qcId: `${d.batchId}-S${seq}`,
    batchId: d.batchId,
    itemName: d.itemName,
  })
  applyResult(qc, d, req.user._id)
  await qc.save()
  res.status(201).json({ success: true, qc })
}

// Submit result for a QC entry created from a GRN
exports.submit = async (req, res) => {
  const qc = await QcInspection.findById(req.params.id)
  if (!qc) throw ApiError.notFound('QC inspection not found')
  if (qc.status !== QC_STATUS.PENDING) throw ApiError.conflict('This inspection has already been completed')

  applyResult(qc, req.body, req.user._id)
  await qc.save()
  await syncGrnQcStatus(qc.grn)
  res.json({ success: true, qc })
}
