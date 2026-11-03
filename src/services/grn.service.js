const Grn = require('../models/Grn')
const QcInspection = require('../models/QcInspection')
const { QC_STATUS } = require('../utils/constants')

// Re-computes the GRN level QC status from its item level inspections
exports.syncGrnQcStatus = async (grnId) => {
  if (!grnId) return
  const list = await QcInspection.find({ grn: grnId }).select('status')
  let status = QC_STATUS.PENDING
  if (list.length && list.every((q) => q.status !== QC_STATUS.PENDING)) {
    status = list.some((q) => q.status === QC_STATUS.REJECTED) ? QC_STATUS.REJECTED : QC_STATUS.PASSED
  }
  await Grn.updateOne({ _id: grnId }, { 'qc.status': status })
}
