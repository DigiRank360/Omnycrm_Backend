const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
})

// Atomic, race-free sequence (used for GRN numbers)
counterSchema.statics.next = async function (key) {
  const doc = await this.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true })
  return doc.seq
}

counterSchema.statics.peek = async function (key) {
  const doc = await this.findOne({ key })
  return (doc?.seq || 0) + 1
}

module.exports = mongoose.model('Counter', counterSchema)
