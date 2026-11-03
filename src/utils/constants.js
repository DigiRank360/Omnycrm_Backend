const ROLES = Object.freeze({
  ADMIN: 'admin',
  QC: 'qc',
})

// Roles allowed per module
const ACCESS = Object.freeze({
  GRN: ['admin'],
  QC: ['admin', 'qc'],
  DASHBOARD: ['admin', 'qc'],
  USERS: ['admin'],
})

const COURIERS = ['Delhivery', 'BlueDart', 'DTDC', 'Ecom Express', 'Other']
const WAREHOUSES = ['Warehouse 1', 'Warehouse 2']
const PACKAGING_STATUS = ['Intact', 'Damaged', 'Tampered']

const QC_STATUS = Object.freeze({
  PENDING: 'Pending',
  PASSED: 'Passed',
  REJECTED: 'Rejected',
})

const QC_CHECKLIST = [
  'Body & Chassis – No cracks/dents',
  'Screen Condition – No dead pixels',
  'Hinges – Opens/closes smoothly',
  'Keyboard – All keys working',
  'Touchpad – Smooth & responsive',
  'Ports & Connectors – (USB/HDMI/VGA)',
  'Camera – Clear image',
  'Microphone – Clear audio',
  'Speakers – Good sound quality',
  'Headphone Jack – Working properly',
  'Battery Health – Holds charge (min. 1hr)',
  'Charging Port – No loose connection',
  'Cooling System – No overheating/fan noise',
  'OS Installed & Activated',
  'RAM – Correct Capacity Displayed',
  'Processor – Stable under load',
  'Storage – No bad sectors (Health 100%)',
  'Wi-Fi – Stable connection',
  'Bluetooth – Pairing/Data Transfer',
  'Boot Speed – Within acceptable limits',
  'BIOS Check – No security/admin lock',
  'Display Brightness – Adjusts properly',
  'Touchscreen – Multi-touch working',
  'Webcam Quality – No blur/noise',
  'System Updates – Drivers installed',
  'System Restore – Recovery partition check',
  'USB Ports – Data & Power working',
  'Battery Charge Time – Normal charging',
  'Graphics – No artifacts/glitches',
  'Keyboard Backlight – All LEDs working',
  'Wi-Fi Range – Strong signal at 10m',
  'Warranty – Status verified',
]

module.exports = { ROLES, ACCESS, COURIERS, WAREHOUSES, PACKAGING_STATUS, QC_STATUS, QC_CHECKLIST }
