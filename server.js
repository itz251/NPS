const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage for Local Device Photo Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const readDB = () => JSON.parse(fs.readFileSync('db.json', 'utf8'));
const writeDB = (data) => fs.writeFileSync('db.json', JSON.stringify(data, null, 2));

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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Add YouTube Video Link API
app.post('/api/gallery/video', (req, res) => {
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    let videoUrl = req.body.url;
    
    // Convert normal YouTube link to Embed link automatically
    if (videoUrl.includes('watch?v=')) {
        videoUrl = videoUrl.replace('watch?v=', 'embed/');
    } else if (videoUrl.includes('youtu.be/')) {
        videoUrl = videoUrl.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    const newItem = { id: Date.now(), type: 'video', url: videoUrl };
    db.gallery.unshift(newItem);
    fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
    res.json({ success: true, item: newItem });
});

// Get Daily Manna
app.get('/api/manna', (req, res) => {
    const db = readDB();
    res.json({ manna: db.manna || "" });
});

// Update Daily Manna
app.put('/api/manna', (req, res) => {
    const db = readDB();
    db.manna = req.body.manna;
    writeDB(db);
    res.json({ success: true, manna: db.manna });
});
async function handleFormSubmit(event) {
    event.preventDefault(); // Stop default browser redirect
    
    const form = event.target;
    const statusText = document.getElementById("form-status");
    const submitBtn = document.getElementById("submit-btn");
    
    // Disable button while sending
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";

    const data = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            statusText.innerText = "Thank you! Your message has been sent to navayerusalem@gmail.com";
            statusText.classList.remove("hidden");
            form.reset();
        } else {
            statusText.innerText = "Oops! There was a problem submitting your form. Please try again.";
            statusText.classList.remove("hidden");
        }
    } catch (error) {
        statusText.innerText = "Oops! Network error. Please try again later.";
        statusText.classList.remove("hidden");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Send Message";
    }
}