const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const defaultDB = {
    events: [],
    gallery: [],
    branches: [],
    manna: []
};

const ensureUploadsDir = () => {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
};

const ensureDBFile = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    }
};

const readDB = () => {
    ensureDBFile();
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            events: Array.isArray(parsed.events) ? parsed.events : [],
            gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
            branches: Array.isArray(parsed.branches) ? parsed.branches : [],
            manna: Array.isArray(parsed.manna) ? parsed.manna : []
        };
    } catch (error) {
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
        return { ...defaultDB };
    }
};

const writeDB = (data) => {
    ensureDBFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOADS_DIR));
ensureUploadsDir();
ensureDBFile();

// Multer Storage for Local Device Photo Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsDir();
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const normalizeYouTubeUrl = (rawUrl) => {
    if (typeof rawUrl !== 'string') return '';

    let url = rawUrl.trim();
    if (!url) return '';

    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    try {
        const parsed = new URL(url);

        if (parsed.hostname === 'youtu.be') {
            const id = parsed.pathname.replace('/', '');
            return id ? `https://www.youtube.com/embed/${id}` : '';
        }

        if (parsed.hostname.includes('youtube.com')) {
            const id = parsed.searchParams.get('v');
            if (id) return `https://www.youtube.com/embed/${id}`;

            const parts = parsed.pathname.split('/').filter(Boolean);
            const fallbackId = parts[parts.length - 1];
            if (fallbackId && !['embed', 'shorts', 'live', 'watch'].includes(parts[0])) {
                return `https://www.youtube.com/embed/${fallbackId}`;
            }
        }

        return url;
    } catch (error) {
        return url;
    }
};

// Events APIs
app.get('/api/events', (req, res) => res.json(readDB().events));

app.post('/api/events', (req, res) => {
    const db = readDB();
    const newEvent = { id: Date.now(), ...req.body };
    db.events.unshift(newEvent);
    writeDB(db);
    res.json({ success: true, event: newEvent });
});

app.put('/api/events/:id', (req, res) => {
    const db = readDB();
    db.events = db.events.map(ev => ev.id == req.params.id ? { id: Number(req.params.id), ...req.body } : ev);
    writeDB(db);
    res.json({ success: true });
});

app.delete('/api/events/:id', (req, res) => {
    const db = readDB();
    db.events = db.events.filter(ev => ev.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Gallery APIs (Device Upload)
app.get('/api/gallery', (req, res) => res.json(readDB().gallery));

app.post('/api/gallery', upload.single('photo'), (req, res) => {
    const db = readDB();
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const photoUrl = `/uploads/${req.file.filename}`;
    const newPhoto = { id: Date.now(), type: 'photo', url: photoUrl };
    db.gallery.unshift(newPhoto);
    writeDB(db);
    res.json({ success: true, photo: newPhoto });
});

app.delete('/api/gallery/:id', (req, res) => {
    const db = readDB();
    db.gallery = db.gallery.filter(item => item.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Branches API
app.get('/api/branches', (req, res) => res.json(readDB().branches));

// Add YouTube Video Link API
app.post('/api/gallery/video', (req, res) => {
    const db = readDB();
    const videoUrl = normalizeYouTubeUrl(req.body?.url);

    if (!videoUrl || !/(youtube\.com|youtu\.be)/i.test(videoUrl)) {
        return res.status(400).json({ error: 'Valid YouTube video URL is required' });
    }

    const newItem = { id: Date.now(), type: 'video', url: videoUrl };
    db.gallery.unshift(newItem);
    writeDB(db);
    res.json({ success: true, item: newItem });
});

// Get Daily Manna List
app.get('/api/manna', (req, res) => {
    const db = readDB();
    res.json(db.manna || []);
});

// Add Daily Manna (Secure)
app.post('/api/manna', (req, res) => {
    if (req.headers['admin-pass'] !== '1234') {
        return res.status(401).json({ error: 'Unauthorized!' });
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
        return res.status(400).json({ error: 'Manna text is required' });
    }

    const db = readDB();
    if (!db.manna) db.manna = [];
    const newManna = { id: Date.now(), text };
    db.manna.unshift(newManna);
    writeDB(db);
    res.json({ success: true, manna: newManna });
});

// Update Daily Manna (Secure)
app.put('/api/manna/:id', (req, res) => {
    if (req.headers['admin-pass'] !== '1234') {
        return res.status(401).json({ error: 'Unauthorized!' });
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
        return res.status(400).json({ error: 'Manna text is required' });
    }

    const db = readDB();
    db.manna = db.manna.map(m => m.id == req.params.id ? { id: Number(req.params.id), text } : m);
    writeDB(db);
    res.json({ success: true });
});

// Delete Daily Manna (Secure)
app.delete('/api/manna/:id', (req, res) => {
    if (req.headers['admin-pass'] !== '1234') {
        return res.status(401).json({ error: 'Unauthorized!' });
    }
    const db = readDB();
    db.manna = db.manna.filter(m => m.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});