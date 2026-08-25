const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

let faults = [];
let pins = [];
let zones = [];
let devices = {};

app.get('/', (req, res) => res.send('Server is Online'));
app.get('/api', (req, res) => res.json({ status: 'active', message: 'API running' }));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('/api/faults', (req, res) => res.json(faults));
app.post('/api/faults', (req, res) => {
  const fault = { id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'pending', ...req.body };
  faults.unshift(fault);
  res.json(fault);
});
app.post('/api/faults/:id/start', (req, res) => {
  const fault = faults.find(f => f.id === req.params.id);
  if (fault) {
    fault.status = 'in_progress';
    fault.worker_name = req.body.worker_name;
  }
  res.json(fault || {});
});
app.post('/api/faults/:id/complete', (req, res) => {
  const fault = faults.find(f => f.id === req.params.id);
  if (fault) {
    fault.status = 'completed';
    fault.worker_name = req.body.worker_name;
    fault.after_photo = req.body.after_photo;
  }
  res.json(fault || {});
});
app.delete('/api/faults/:id', (req, res) => {
  faults = faults.filter(f => f.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/pins', (req, res) => res.json(pins));
app.put('/api/pins', (req, res) => { pins = req.body; res.json(pins); });
app.get('/api/zones', (req, res) => res.json(zones));
app.post('/api/zones/seed', (req, res) => { zones = req.body; res.json(zones); });
app.post('/api/zones', (req, res) => { zones.push(req.body); res.json(zones); });

app.post('/api/presence/heartbeat', (req, res) => {
  const { device_id, name, role } = req.body;
  if (device_id) {
    devices[device_id] = { device_id, name, role, last_seen: Date.now() };
  }
  res.json({ success: true });
});
app.get('/api/presence', (req, res) => {
  const now = Date.now();
  const active = Object.values(devices).filter(d => now - d.last_seen < 30000);
  res.json(active);
});
app.post('/api/presence/kick', (req, res) => {
  delete devices[req.body.device_id];
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
