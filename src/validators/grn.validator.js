const { z } = require('zod')
const { COURIERS, PACKAGING_STATUS } = require('../utils/constants')

const optDate = z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional())
const optStr = z.string().trim().optional()

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name required'),
  serial: z.string().trim().min(1, 'Serial number required'),
  qty: z.coerce.number().int().min(1, 'Qty must be at least 1'),
})

exports.createGrnSchema = z.object({
  vendorName: z.string().trim().min(1, 'Vendor name required'),
  vendorId: optStr,
  contactPerson: optStr,
  invoiceNumber: z.string().trim().min(1, 'Invoice number required'),
  invoiceDate: optDate,
  lrNumber: optStr,
  courier: z.preprocess((v) => (v === '' ? undefined : v), z.enum(COURIERS).optional()),
  dispatchDate: optDate,
  deliveryDate: optDate,
  grnDate: optDate,
  warehouse: z.string().trim().min(1, 'Warehouse required'),
  poNumber: optStr,
  poDate: optDate,
  items: z.array(itemSchema).min(1, 'At least one item row is required'),
  packagingStatus: z.enum(PACKAGING_STATUS, { message: 'Select packaging status' }),
  damageRemarks: optStr,
  remarks: optStr,
}).refine(
  (d) => d.packagingStatus === 'Intact' || (d.damageRemarks && d.damageRemarks.length > 0),
  { path: ['damageRemarks'], message: 'Remarks required when packaging is damaged or tampered' },
)
