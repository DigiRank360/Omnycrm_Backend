// End-to-end smoke test using an in-memory MongoDB. Run: npm test
process.env.NODE_ENV = 'test'
const assert = require('assert')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const app = require('../src/app')
const User = require('../src/models/User')
const { ROLES, QC_CHECKLIST } = require('../src/utils/constants')

;(async () => {
  const mongod = await MongoMemoryServer.create()
  await connectDB(mongod.getUri())
  await User.create({ name: 'Admin', email: 'admin@omnyx.com', password: 'admin123', role: ROLES.ADMIN })
  await User.create({ name: 'QC Dept', email: 'qc@omnyx.com', password: 'qc12345', role: ROLES.QC })

  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body, token, raw) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body && !raw && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: raw ? body : body && JSON.stringify(body),
    })
    return { status: res.status, json: await res.json() }
  }

  let r = await call('GET', '/grns')
  assert.equal(r.status, 401, 'no token -> 401')

  r = await call('POST', '/auth/login', { email: 'admin@omnyx.com', password: 'bad' })
  assert.equal(r.status, 401, 'bad password -> 401')

  r = await call('POST', '/auth/login', { email: 'admin@omnyx.com', password: 'admin123' })
  assert.equal(r.status, 200)
  const token = r.json.token
  assert.ok(!r.json.user.password)

  r = await call('POST', '/auth/login', { email: 'admin@omnyx.com', password: 'admin123', role: 'qc' })
  assert.equal(r.status, 401, 'wrong role tab -> 401')

  // QC department: QC + dashboard only
  r = await call('POST', '/auth/login', { email: 'qc@omnyx.com', password: 'qc12345', role: 'qc' })
  assert.equal(r.status, 200)
  assert.equal(r.json.user.role, 'qc')
  const qcToken = r.json.token
  for (const [m, p] of [['GET', '/grns'], ['POST', '/grns'], ['GET', '/grns/next-number'], ['GET', '/users'], ['POST', '/users']]) {
    r = await call(m, p, m === 'POST' ? {} : null, qcToken)
    assert.equal(r.status, 403, `qc blocked from ${m} ${p}`)
  }
  for (const p of ['/qc', '/qc/checklist', '/dashboard/stats', '/meta/options']) {
    r = await call('GET', p, null, qcToken)
    assert.equal(r.status, 200, `qc allowed on ${p}`)
  }

  // Admin user management
  r = await call('POST', '/users', { name: 'QC 2', email: 'qc2@omnyx.com', password: 'secret1', role: 'qc' }, token)
  assert.equal(r.status, 201)
  assert.ok(!r.json.user.password)
  r = await call('POST', '/users', { name: 'QC 2', email: 'qc2@omnyx.com', password: 'secret1', role: 'qc' }, token)
  assert.equal(r.status, 409, 'duplicate email')
  r = await call('PATCH', `/users/${r.json.user?._id || (await User.findOne({ email: 'qc2@omnyx.com' }))._id}`, { isActive: false }, token)
  assert.equal(r.status, 200)
  r = await call('POST', '/auth/login', { email: 'qc2@omnyx.com', password: 'secret1' })
  assert.equal(r.status, 401, 'disabled user cannot login')
  const me = await call('GET', '/auth/me', null, token)
  r = await call('PATCH', `/users/${me.json.user._id}`, { isActive: false }, token)
  assert.equal(r.status, 400, 'admin cannot disable self')

  r = await call('GET', '/grns/next-number', null, token)
  assert.match(r.json.grnNumber, /^GRN-\d{4}-00001$/)

  // GRN via multipart with a file
  const fd = new FormData()
  const fields = {
    vendorName: 'Dell India', invoiceNumber: 'INV-1', warehouse: 'Warehouse 1', packagingStatus: 'Intact',
    items: JSON.stringify([{ name: 'Latitude 5420', serial: 'SN1', qty: 1 }, { name: 'Latitude 5420', serial: 'SN2', qty: 1 }]),
  }
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  fd.append('invoice', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'inv.pdf')
  r = await call('POST', '/grns', fd, token, true)
  assert.equal(r.status, 201, JSON.stringify(r.json))
  assert.equal(r.json.qcEntries.length, 2, 'one QC entry per item row')
  assert.equal(r.json.grn.attachments.invoice.length, 1)
  const grnId = r.json.grn._id
  const [qc1, qc2] = r.json.qcEntries

  const fileRes = await fetch(`http://127.0.0.1:${server.address().port}${r.json.grn.attachments.invoice[0]}`)
  assert.equal(fileRes.status, 401, 'files are not public')

  // validation
  r = await call('POST', '/grns', { vendorName: 'x' }, token)
  assert.equal(r.status, 400)

  const checks = (fail) => QC_CHECKLIST.map((_, i) => (fail && i === 2 ? { result: 'fail', comment: 'Hinge loose' } : { result: 'pass', comment: '' }))

  r = await call('PUT', `/qc/${qc1._id}/submit`, { checks: checks(true), decision: 'PASS' }, token)
  assert.equal(r.status, 400, 'cannot pass with failed checks')

  r = await call('PUT', `/qc/${qc1._id}/submit`, { checks: QC_CHECKLIST.map(() => ({ result: 'fail', comment: '' })), decision: 'REJECT' }, token)
  assert.equal(r.status, 400, 'fail needs comment')

  r = await call('PUT', `/qc/${qc1._id}/submit`, { checks: checks(false), decision: 'PASS', workingPorts: 3, totalPorts: 4 }, token)
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.equal(r.json.qc.status, 'Passed')

  r = await call('PUT', `/qc/${qc1._id}/submit`, { checks: checks(false), decision: 'PASS' }, token)
  assert.equal(r.status, 409, 'cannot resubmit')

  r = await call('GET', `/grns/${grnId}`, null, token)
  assert.equal(r.json.grn.qc.status, 'Pending', 'one item still pending')

  r = await call('PUT', `/qc/${qc2._id}/submit`, { checks: checks(true), decision: 'REJECT' }, qcToken)
  assert.equal(r.json.qc.status, 'Rejected')
  r = await call('GET', `/grns/${grnId}`, null, token)
  assert.equal(r.json.grn.qc.status, 'Rejected', 'GRN rejected if any item rejected')

  r = await call('DELETE', `/grns/${grnId}`, null, token)
  assert.equal(r.status, 409, 'cannot delete inspected GRN')

  r = await call('POST', '/qc', { itemName: 'Standalone', batchId: 'B-1', checks: checks(false), decision: 'PASS' }, token)
  assert.equal(r.status, 201, JSON.stringify(r.json))

  r = await call('GET', '/dashboard/stats', null, token)
  assert.equal(r.json.stats.totalGrns, 1)
  assert.equal(r.json.stats.passedQc, 2)
  assert.equal(r.json.stats.rejectedQc, 1)
  assert.equal(r.json.monthlyGrns.length, 6)

  r = await call('GET', '/qc?status=Passed', null, token)
  assert.equal(r.json.pagination.total, 2)

  r = await call('GET', '/meta/options', null, token)
  assert.equal(r.json.qcChecklist.length, 32)

  console.log('All backend checks passed')
  server.close()
  await mongoose.disconnect()
  await mongod.stop()
})().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
