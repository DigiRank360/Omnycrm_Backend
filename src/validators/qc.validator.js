const { z } = require('zod')
const { QC_CHECKLIST } = require('../utils/constants')

const optStr = z.string().trim().optional()
const optNum = z.preprocess((v) => (v === '' || v == null ? undefined : v), z.coerce.number().int().min(0).optional())

const checkSchema = z.object({
  result: z.enum(['pass', 'fail'], { message: 'Pass/Fail required' }),
  comment: z.string().trim().default(''),
})

const base = {
  serialBody: optStr,
  serialSoft: optStr,
  inspectionDate: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional()),
  checks: z
    .array(checkSchema)
    .length(QC_CHECKLIST.length, `Exactly ${QC_CHECKLIST.length} checks required`),
  workingPorts: optNum,
  totalPorts: optNum,
  summary: optStr,
  decision: z.enum(['PASS', 'REJECT']),
}

const refine = (schema) =>
  schema
    .superRefine((d, ctx) => {
      d.checks.forEach((c, i) => {
        if (c.result === 'fail' && !c.comment) {
          ctx.addIssue({ code: 'custom', path: ['checks', i, 'comment'], message: `Comment required for failed point #${i + 1}` })
        }
      })
      if (d.decision === 'PASS' && d.checks.some((c) => c.result === 'fail')) {
        ctx.addIssue({ code: 'custom', path: ['decision'], message: 'Cannot pass an inspection with failed checks' })
      }
      if (d.workingPorts != null && d.totalPorts != null && d.workingPorts > d.totalPorts) {
        ctx.addIssue({ code: 'custom', path: ['workingPorts'], message: 'Working ports cannot exceed total ports' })
      }
    })

// Submit result for an existing (GRN generated) QC entry
exports.submitQcSchema = refine(z.object(base))

// Standalone inspection (not linked to a GRN)
exports.createQcSchema = refine(
  z.object({
    ...base,
    itemName: z.string().trim().min(1, 'Item name required'),
    batchId: z.string().trim().min(1, 'Batch ID required'),
  }),
)
