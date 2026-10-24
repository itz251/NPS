function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('show');
}

document.addEventListener("DOMContentLoaded", function() {
    loadHomeData();
});

function loadHomeData() {
    // 1. Events
   // fetch('http://localhost:3000/api/events')
   fetch('/api/events')  
   .then(res => res.json())
        .then(events => {
            let container = document.getElementById('events-container');
            if (!container) return;
            container.innerHTML = '';
            events.forEach(ev => {
                container.innerHTML += `
                    <div class="event-card">
                        <h3>${ev.title}</h3>
                        <p><strong>Time:</strong> ${ev.time}</p>
                        <p>${ev.desc}</p>
                    </div>
                `;
            });
        });

    // 2. Branches
   // fetch('http://localhost:3000/api/branches')
   fetch('/api/branches')  
   .then(res => res.json())
        .then(branches => {
            let container = document.getElementById('branches-container');
            if (!container) return;
            container.innerHTML = '';
            branches.forEach(b => {
                container.innerHTML += `
                    <div style="background:white; padding:20px; border-radius:8px; border-top:4px solid #3498db; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <h3><i class="fa fa-church"></i> ${b.name}</h3>
                        <p style="margin-top:8px;"><i class="fa fa-map-marker-alt"></i> ${b.address}</p>
                        <p style="margin-top:5px;"><i class="fa fa-clock"></i> ${b.timing}</p>
                    </div>
                `;
            });
        });

    // 3. Gallery
   // fetch('http://localhost:3000/api/gallery')
   fetch('/api/gallery')  
   .then(res => res.json())
        .then(gallery => {
            let container = document.getElementById('home-gallery-container');
            if (!container) return;
            container.innerHTML = '';
            gallery.slice(0, 4).forEach(item => {
                container.innerHTML += `
                    <div class="gallery-item">
                        <img src="${item.url}" alt="Church Photo">
                    </div>
                `;
            });
        });
}

// Gallery Highlights with Moving Effect
//fetch('http://localhost:3000/api/gallery')
fetch('/api/gallery')  
.then(res => res.json())
    .then(gallery => {
        let container = document.getElementById('home-gallery-container');
        if (!container) return;
        container.innerHTML = '';
        
        // Sirf photos filter karein
        let photos = gallery.filter(item => item.type !== 'video');
        if(photos.length === 0) {
            container.innerHTML = '<p style="padding:20px; color:#666;">No photos available</p>';
            return;
        }

        // Infinite loop effect ke liye array ko do baar repeat karte hain
        let displayList = [...photos, ...photos];

        displayList.forEach(item => {
            container.innerHTML += `
                <div class="ticker-item">
                    <img src="${item.url}" alt="Church Photo">
                </div>
            `;
        });
    });

    // Fetch Daily Manna on Home Page
//fetch('http://localhost:3000/api/manna')
fetch('/api/manna')
    .then(res => res.json())
    .then(data => {
        let mannaEl = document.getElementById('daily-manna-text');
        if (mannaEl) mannaEl.innerText = data.manna;
    });