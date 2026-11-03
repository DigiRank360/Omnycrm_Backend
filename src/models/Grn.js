const mongoose = require('mongoose')
const { COURIERS, PACKAGING_STATUS, QC_STATUS } = require('../utils/constants')

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    serialNo: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    qcInspection: { type: mongoose.Schema.Types.ObjectId, ref: 'QcInspection' },
  },
  { _id: true },
)

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true },

    vendor: {
      name: { type: String, required: true, trim: true },
      vendorId: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
    },
    invoice: {
      number: { type: String, required: true, trim: true },
      date: Date,
    },
    lrNumber: { type: String, trim: true },
    courierPartner: { type: String, enum: [...COURIERS, ''] },
    dispatchDate: Date,
    deliveryDate: { type: Date, default: Date.now },

    grnDate: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    warehouse: { type: String, required: true, trim: true },
    purchaseOrder: { number: { type: String, trim: true }, date: Date },

    items: {
      type: [itemSchema],
      validate: [(v) => v.length > 0, 'At least one item is required'],
    },

    packaging: {
      status: { type: String, enum: PACKAGING_STATUS, required: true },
      remarks: { type: String, trim: true },
    },

    attachments: {
      invoice: [String],
      packagingPhotos: [String],
      courierReceipt: [String],
    },

    qc: {
      status: { type: String, enum: Object.values(QC_STATUS), default: QC_STATUS.PENDING },
      assignedTo: { type: String, default: 'Auto Logic' },
      deadline: { type: String, default: '24–48 hours' },
      batchId: { type: String, required: true },
      remarks: { type: String, trim: true },
    },
  },
  { timestamps: true },
)

grnSchema.index({ 'vendor.name': 1 })
grnSchema.index({ 'items.serialNo': 1 })
grnSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Grn', grnSchema)
