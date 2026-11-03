const Grn = require('../models/Grn')
const QcInspection = require('../models/QcInspection')
const Counter = require('../models/Counter')
const ApiError = require('../utils/ApiError')
const { QC_STATUS } = require('../utils/constants')

const pad = (n) => String(n).padStart(5, '0')
const year = () => new Date().getFullYear()
const counterKey = () => `grn-${year()}`

const filePaths = (files = {}, field) => (files[field] || []).map((f) => `/api/files/${f.filename}`)

exports.nextNumber = async (_req, res) => {
  const seq = await Counter.peek(counterKey())
  res.json({
    success: true,
    grnNumber: `GRN-${year()}-${pad(seq)}`,
    qcBatchId: `BATCH-${year()}-${pad(seq)}`,
  })
}

exports.create = async (req, res) => {
  const d = req.body
  const seq = await Counter.next(counterKey())
  const grnNumber = `GRN-${year()}-${pad(seq)}`
  const batchId = `BATCH-${year()}-${pad(seq)}`

  const grn = new Grn({
    grnNumber,
    vendor: { name: d.vendorName, vendorId: d.vendorId, contactPerson: d.contactPerson },
    invoice: { number: d.invoiceNumber, date: d.invoiceDate },
    lrNumber: d.lrNumber,
    courierPartner: d.courier,
    dispatchDate: d.dispatchDate,
    deliveryDate: d.deliveryDate,
    grnDate: d.grnDate,
    receivedBy: req.user._id,
    warehouse: d.warehouse,
    purchaseOrder: { number: d.poNumber, date: d.poDate },
    items: d.items.map((i) => ({ name: i.name, serialNo: i.serial, qty: i.qty })),
    packaging: { status: d.packagingStatus, remarks: d.damageRemarks },
    attachments: {
      invoice: filePaths(req.files, 'invoice'),
      packagingPhotos: filePaths(req.files, 'packagingPhotos'),
      courierReceipt: filePaths(req.files, 'courierReceipt'),
    },
    qc: { batchId, remarks: d.remarks },
  })

  // Every item row creates its own QC entry
  const qcDocs = grn.items.map((item, i) => ({
    qcId: `${batchId}-${i + 1}`,
    batchId,
    grn: grn._id,
    grnNumber,
    itemName: item.name,
    serialNo: item.serialNo,
    status: QC_STATUS.PENDING,
  }))
  const created = await QcInspection.insertMany(qcDocs)
  grn.items.forEach((item, i) => { item.qcInspection = created[i]._id })

  try {
    await grn.save()
  } catch (err) {
    await QcInspection.deleteMany({ grn: grn._id })
    throw err
  }

  res.status(201).json({ success: true, grn, qcEntries: created })
}

exports.list = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100)
  const { status, search, from, to } = req.query

  const filter = {}
  if (status) filter['qc.status'] = status
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ grnNumber: rx }, { 'vendor.name': rx }, { 'invoice.number': rx }, { 'items.serialNo': rx }]
  }
  if (from || to) {
    filter.grnDate = {}
    if (from) filter.grnDate.$gte = new Date(from)
    if (to) filter.grnDate.$lte = new Date(to)
  }

  const [data, total] = await Promise.all([
    Grn.find(filter).populate('receivedBy', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Grn.countDocuments(filter),
  ])
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

exports.getOne = async (req, res) => {
  const grn = await Grn.findById(req.params.id).populate('receivedBy', 'name email').populate('items.qcInspection', 'qcId status')
  if (!grn) throw ApiError.notFound('GRN not found')
  res.json({ success: true, grn })
}

exports.remove = async (req, res) => {
  const grn = await Grn.findById(req.params.id)
  if (!grn) throw ApiError.notFound('GRN not found')
  const inspected = await QcInspection.countDocuments({ grn: grn._id, status: { $ne: QC_STATUS.PENDING } })
  if (inspected) throw ApiError.conflict('Cannot delete a GRN whose QC inspection has been completed')
  await QcInspection.deleteMany({ grn: grn._id })
  await grn.deleteOne()
  res.json({ success: true, message: 'GRN deleted' })
}
