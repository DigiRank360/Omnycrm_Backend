const mongoose = require('mongoose')
const { QC_STATUS } = require('../utils/constants')

const checkSchema = new mongoose.Schema(
  {
    point: { type: Number, required: true, min: 1, max: 32 },
    label: { type: String, required: true },
    result: { type: String, enum: ['pass', 'fail'], required: true },
    comment: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const qcSchema = new mongoose.Schema(
  {
    qcId: { type: String, required: true, unique: true },
    batchId: { type: String, required: true, index: true },
    grn: { type: mongoose.Schema.Types.ObjectId, ref: 'Grn' },
    grnNumber: String,

    itemName: { type: String, required: true, trim: true },
    serialNo: { type: String, trim: true },
    serialBody: { type: String, trim: true },
    serialSoft: { type: String, trim: true },

    status: { type: String, enum: Object.values(QC_STATUS), default: QC_STATUS.PENDING, index: true },
    inspectionDate: Date,
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    checks: [checkSchema],
    workingPorts: { type: Number, min: 0 },
    totalPorts: { type: Number, min: 0 },
    summary: { type: String, trim: true },
  },
  { timestamps: true },
)

qcSchema.path('workingPorts').validate(function (v) {
  return this.totalPorts == null || v == null || v <= this.totalPorts
}, 'Working ports cannot exceed total ports')

module.exports = mongoose.model('QcInspection', qcSchema)
