const { COURIERS, WAREHOUSES, PACKAGING_STATUS, QC_CHECKLIST } = require('../utils/constants')

// Dropdown options used by the GRN / QC forms
exports.options = (_req, res) => {
  res.json({ success: true, couriers: COURIERS, warehouses: WAREHOUSES, packagingStatus: PACKAGING_STATUS, qcChecklist: QC_CHECKLIST })
}
