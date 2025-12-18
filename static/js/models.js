const modelsData = [
    {
        name: 'ISS',
        file: 'iss.glb',
        preview: 'iss.png',
        description: 'International Space Station - A modular space station in low Earth orbit, serving as a microgravity research laboratory.',
        category: 'spacecraft',
        tags: ['Spacecraft', 'LEO', 'Research']
    },
    {
        name: 'Hubble',
        file: 'hubble.glb',
        preview: 'hubble.png',
        description: 'Hubble Space Telescope - One of the largest and most versatile space telescopes, providing stunning images of the universe.',
        category: 'satellite',
        tags: ['Telescope', 'LEO', 'Observatory']
    },
    {
        name: 'Jason-3',
        file: 'Jason_3.glb',
        preview: 'jason_3.png',
        description: 'Jason-3 Satellite - Ocean surface topography mission satellite for monitoring sea level and ocean circulation.',
        category: 'satellite',
        tags: ['Earth Observation', 'Ocean', 'Climate']
    },
    {
        name: 'Aqua',
        file: 'aqua.glb',
        preview: 'aqua.png',
        description: 'Aqua Satellite - NASA Earth Science satellite collecting data about Earth\'s water cycle and climate systems.',
        category: 'satellite',
        tags: ['Earth Observation', 'Climate', 'Water']
    },
    {
        name: 'GOES',
        file: 'goes.glb',
        preview: 'goes.png',
        description: 'GOES Satellite - Geostationary Operational Environmental Satellite for weather monitoring and forecasting.',
        category: 'satellite',
        tags: ['Weather', 'GEO', 'Monitoring']
    },
    {
        name: 'Sputnik 1',
        file: 'sputnik_1.glb',
        preview: 'sputnik_1.png',
        description: 'Sputnik 1 - The first artificial Earth satellite launched by the Soviet Union in 1957 marking the start of the Space Age.',
        category: 'satellite',
        tags: ['Historic', 'LEO', 'Pioneer']
    },
    {
        name: 'Earth',
        file: 'earth.glb',
        preview: 'earth.png',
        description: 'Planet Earth - Our home planet, the third planet from the Sun and the only known planet to harbor life.',
        category: 'celestial',
        tags: ['Planet', 'Terrestrial', 'Home']
    },
    {
        name: 'Moon',
        file: 'moon.glb',
        preview: 'moon.png',
        description: 'The Moon - Earth\'s only natural satellite, the fifth largest moon in the Solar System.',
        category: 'celestial',
        tags: ['Natural Satellite', 'Rocky', 'Tidally Locked']
    },
    {
        name: 'Sun',
        file: 'sun.glb',
        preview: 'sun.png',
        description: 'The Sun - The star at the center of our Solar System, providing light and energy to all planets.',
        category: 'celestial',
        tags: ['Star', 'G-type', 'Energy Source']
    },
    {
        name: 'UFO',
        file: 'ufo.glb',
        preview: 'ufo.png',
        description: 'UFO Model - An unidentified flying object model for creative visualization and entertainment purposes.',
        category: 'spacecraft',
        tags: ['Fictional', 'Spacecraft', 'Fun']
    }
];

const modelsGrid = document.getElementById('modelsGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const scrollTopBtn = document.getElementById('scrollTop');

function createModelCard(modelData) {
    const card = document.createElement('div');
    card.className = 'model-card';
    card.dataset.category = modelData.category;

    const preview = document.createElement('div');
    preview.className = 'model-preview';

    const img = document.createElement('img');
    img.alt = modelData.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.onerror = () => {
        preview.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.5); font-size: 0.9rem;">Image not available</div>';
    };
    img.src = `/static/assets/previews/${modelData.preview}`;
    preview.appendChild(img);

    const info = document.createElement('div');
    info.className = 'model-info';

    const name = document.createElement('h3');
    name.className = 'model-name';
    name.textContent = modelData.name;

    const description = document.createElement('p');
    description.className = 'model-description';
    description.textContent = modelData.description;

    const meta = document.createElement('div');
    meta.className = 'model-meta';
    const categoryTag = document.createElement('span');
    categoryTag.className = 'meta-tag';
    categoryTag.textContent = modelData.category.charAt(0).toUpperCase() + modelData.category.slice(1);
    meta.appendChild(categoryTag);

    info.appendChild(name);
    info.appendChild(description);
    info.appendChild(meta);

    card.appendChild(preview);
    card.appendChild(info);

    return card;
}

modelsData.forEach(modelData => {
    const card = createModelCard(modelData);
    modelsGrid.appendChild(card);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        const cards = document.querySelectorAll('.model-card');

        cards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});