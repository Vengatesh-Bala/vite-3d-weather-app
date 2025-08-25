import * as THREE from 'three';
import { gsap } from 'gsap';

// Try runtime config (for future flexibility), fallback to baked env
const WEATHER_API_KEY = (
    window.RUNTIME_CONFIG?.VITE_WEATHER_API_KEY ||
    import.meta.env.VITE_WEATHER_API_KEY || 
    ''
).trim();

try {
    const last4 = WEATHER_API_KEY ? WEATHER_API_KEY.slice(-4) : '';
    console.log('[WeatherApp] API key loaded:', {
        length: WEATHER_API_KEY.length,
        endsWith: last4
    });
} catch {}

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';


// Three.js scene setup
let scene, camera, renderer, particles, clouds, sun;
let animationId;
let activeThemeGroup = null; // per-search theme container
let audioContext = null; let audioEnabled = false; let activeAudioNodes = [];
let lastMouse = { x: 0, y: 0 };

// DOM elements
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const soundToggle = document.getElementById('soundToggle');
const bgVideo = document.getElementById('bgVideo');
const loading = document.getElementById('loading');
const weatherInfo = document.getElementById('weatherInfo');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const feelsLike = document.getElementById('feelsLike');
const error = document.getElementById('error');

// Initialize 3D scene
function init3DScene() {
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('app').appendChild(renderer.domElement);
    
    // Create particles (stars)
    createParticles();
    
    // Create clouds
    createClouds();
    
    // Create sun
    createSun();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    // Parallax
    window.addEventListener('mousemove', (e) => {
        lastMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        lastMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
}

// Create particle system (stars)
function createParticles() {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        
        colors[i * 3] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Create clouds
function createClouds() {
    clouds = new THREE.Group();
    
    for (let i = 0; i < 20; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 2 + 1, 8, 6);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * 20 + 10,
            (Math.random() - 0.5) * 100
        );
        
        clouds.add(cloud);
    }
    
    scene.add(clouds);
}

// Create sun
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.8
    });
    
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(30, 30, 0);
    scene.add(sun);
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Rotate particles
    if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
    }
    
    // Animate clouds
    if (clouds) {
        clouds.children.forEach((cloud, index) => {
            cloud.position.x += Math.sin(Date.now() * 0.001 + index) * 0.01;
            cloud.position.y += Math.cos(Date.now() * 0.001 + index) * 0.005;
        });
    }
    
    // Animate sun
    if (sun) {
        sun.rotation.y += 0.005;
        sun.material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.2;
    }

    // Subtle parallax on camera
    camera.position.x += (lastMouse.x * 2 - camera.position.x) * 0.01;
    camera.position.y += (10 + lastMouse.y * 2 - camera.position.y) * 0.01;
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Weather API functions
async function getWeatherData(city) {
    try {
        const url = `${WEATHER_API_URL}?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            let apiMsg = '';
            try { apiMsg = (await response.json())?.message || ''; } catch {}
            if (response.status === 401) {
                throw new Error(apiMsg ? `401: ${apiMsg}` : 'Invalid API key or key not yet activated (401).');
            }
            if (response.status === 404) {
                throw new Error(apiMsg ? `404: ${apiMsg}` : 'City not found (404).');
            }
            throw new Error(apiMsg ? `${response.status}: ${apiMsg}` : `Request failed (${response.status}).`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

// Update weather display
function updateWeatherDisplay(weatherData) {
    cityName.textContent = weatherData.name;
    temperature.textContent = `${Math.round(weatherData.main.temp)}°C`;
    description.textContent = weatherData.weather[0].description;
    humidity.textContent = `${weatherData.main.humidity}%`;
    windSpeed.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    pressure.textContent = `${weatherData.main.pressure} hPa`;
    feelsLike.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
    
    // Animate weather info appearance
    weatherInfo.classList.add('show');
    
    // Update 3D scene and camera based on weather and temperature
    applySkyByTime(weatherData);
    applyPaletteByTemp(weatherData.main.temp);
    if (weatherData.coord) flyCameraToCoords(weatherData.coord);
    const theme = chooseThemeByTemp(weatherData.main.temp, weatherData.weather[0].main);
    setBackgroundVideoByTheme(theme.type);
    update3DScene(theme.type, { variant: theme.variant });
    const windKmH = Math.round((weatherData.wind?.speed || 0) * 3.6);
    setupWeatherAudio(theme.type, windKmH);
}

// Update 3D scene based on weather conditions
function update3DScene(weatherType, options = {}) {
    // Clean up previous theme
    if (activeThemeGroup) {
        scene.remove(activeThemeGroup);
        disposeGroup(activeThemeGroup);
        activeThemeGroup = null;
    }

    // Create new theme group
    activeThemeGroup = new THREE.Group();
    scene.add(activeThemeGroup);

    // Variation per search or forced
    const variant = Number.isInteger(options.variant) ? options.variant : Math.floor(Math.random() * 3);

    switch (weatherType.toLowerCase()) {
        case 'rain':
            createRain(activeThemeGroup, variant);
            break;
        case 'snow':
            createSnow(activeThemeGroup, variant);
            break;
        case 'clouds':
            createCloudTheme(activeThemeGroup, variant);
            break;
        case 'clear':
            createClearTheme(activeThemeGroup, variant);
            break;
        case 'thunderstorm':
            createStormTheme(activeThemeGroup, variant);
            break;
        default:
            createAmbientTheme(activeThemeGroup, variant);
    }

    // Entrance animation
    gsap.fromTo(activeThemeGroup.position, { z: -40 }, { z: 0, duration: 1.2, ease: 'power2.out' });
}

// Create rain effect
function createRain(group, variant = 0) {
    const rainCount = 500;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount; i++) {
        rainPositions[i * 3] = (Math.random() - 0.5) * 100;
        rainPositions[i * 3 + 1] = Math.random() * 50 + 25;
        rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    
    const rainMaterial = new THREE.PointsMaterial({
        color: 0x87ceeb,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });
    
    const rain = new THREE.Points(rainGeometry, rainMaterial);
    group.add(rain);
    
    // Animate rain
    const speed = variant === 2 ? 1.2 : variant === 1 ? 1.8 : 2.4;
    gsap.to(rain.position, { y: -25, duration: speed, repeat: -1, ease: 'none' });
}

// Create snow effect
function createSnow(group, variant = 0) {
    const snowCount = 300;
    const snowGeometry = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    
    for (let i = 0; i < snowCount; i++) {
        snowPositions[i * 3] = (Math.random() - 0.5) * 100;
        snowPositions[i * 3 + 1] = Math.random() * 50 + 25;
        snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    
    const snowMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.8
    });
    
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    group.add(snow);
    
    // Animate snow
    const speed = variant === 2 ? 6 : variant === 1 ? 5 : 4;
    gsap.to(snow.position, { y: -25, duration: speed, repeat: -1, ease: 'none' });
}

// Create more clouds for cloudy weather
function createCloudTheme(group, variant = 0) {
    const count = variant === 2 ? 45 : variant === 1 ? 35 : 30;
    for (let i = 0; i < count; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 3 + 2, 8, 6);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: variant === 2 ? 0xb0b0b0 : 0xcccccc,
            transparent: true,
            opacity: 0.4
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 120,
            Math.random() * 30 + 15,
            (Math.random() - 0.5) * 120
        );
        
        group.add(cloud);
    }
}

// Create clear sky effect
function createClearTheme(group, variant = 0) {
    sun.material.color.setHex(variant === 2 ? 0xfff0aa : 0xffff88);
    sun.material.opacity = 1;
    const sparkleCount = variant === 2 ? 90 : variant === 1 ? 65 : 50;
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount; i++) {
        sparklePositions[i * 3] = (Math.random() - 0.5) * 100;
        sparklePositions[i * 3 + 1] = Math.random() * 50 + 10;
        sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    const sparkleMaterial = new THREE.PointsMaterial({ color: 0xffffaa, size: 0.2, transparent: true, opacity: 0.6 });
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    group.add(sparkles);
}

// Create default weather
function createAmbientTheme(group, variant = 0) {
    const count = 12 + variant * 6;
    for (let i = 0; i < count; i++) {
        const g = new THREE.SphereGeometry(Math.random() * 1.2 + 0.3, 16, 16);
        const m = new THREE.MeshStandardMaterial({ color: 0x88c0ff, emissive: 0x113355, metalness: 0.2, roughness: 0.4 });
        const orb = new THREE.Mesh(g, m);
        orb.position.set((Math.random() - 0.5) * 80, Math.random() * 30, (Math.random() - 0.5) * 80);
        group.add(orb);
    }
}

function createStormTheme(group, variant = 0) {
    createCloudTheme(group, 2);
    const flash = new THREE.PointLight(0x99ccff, 0.0, 200);
    flash.position.set(0, 30, 0);
    group.add(flash);
    const flashLoop = () => {
        const delay = 2 + Math.random() * 4;
        gsap.to(flash, { intensity: 0.0, duration: 0.1, delay });
        gsap.to(flash, { intensity: 3.0, duration: 0.08, delay: delay + 0.1 });
        gsap.to(flash, { intensity: 0.0, duration: 0.15, delay: delay + 0.2, onComplete: flashLoop });
    };
    flashLoop();
}

function disposeGroup(group) {
    group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
    });
}

// Camera fly-to transition per search
function flyCameraToRandomSpot() {
    const radius = 25 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const target = { x: Math.cos(angle) * radius, y: 10 + Math.random() * 20, z: Math.sin(angle) * radius };
    gsap.to(camera.position, { x: target.x, y: target.y, z: target.z, duration: 1.4, ease: 'power2.inOut' });
    gsap.to(camera, { fov: 70 + Math.random() * 10, duration: 1.4, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() });
}

function flyCameraToCoords(coord) {
    const radius = 35;
    const lat = THREE.MathUtils.degToRad(coord.lat);
    const lon = THREE.MathUtils.degToRad(coord.lon);
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    const y = 10 + Math.sin(lat) * 10;
    gsap.to(camera.position, { x, y, z, duration: 1.6, ease: 'power2.inOut' });
    gsap.to(camera, { fov: 70, duration: 1.6, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() });
}

// City-based sky colors using time-of-day
function applySkyByTime(weatherData) {
    try {
        const tzOffset = (weatherData.timezone || 0) * 1000;
        const local = new Date(Date.now() + tzOffset);
        const hour = local.getUTCHours();
        let grad;
        if (hour >= 5 && hour < 8) grad = 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)'; // dawn
        else if (hour >= 8 && hour < 17) grad = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'; // day
        else if (hour >= 17 && hour < 20) grad = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'; // dusk
        else grad = 'linear-gradient(135deg, #141e30 0%, #243b55 100%)'; // night
        document.body.style.background = grad;
    } catch {}
}

// Temperature palettes (Pinterest-inspired hues)
function applyPaletteByTemp(tempC) {
    if (typeof tempC !== 'number') return;
    if (tempC < 15) {
        document.body.style.background = 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'; // cold blues
    } else if (tempC < 28) {
        document.body.style.background = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'; // mild sky
    } else {
        document.body.style.background = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'; // warm sunset
    }
}

// Temperature-based theme selection
function chooseThemeByTemp(tempC, weatherMain) {
    if (typeof tempC === 'number' && tempC < 15) {
        return { type: 'snow', variant: 1 };
    }
    // Otherwise prefer clear/sun; if weather says thunderstorm or rain, respect it
    const main = (weatherMain || '').toLowerCase();
    if (main.includes('thunder')) return { type: 'thunderstorm', variant: 2 };
    if (main.includes('rain') || main.includes('drizzle')) return { type: 'rain', variant: 1 };
    if (main.includes('cloud')) return { type: 'clouds', variant: 1 };
    return { type: 'clear', variant: tempC > 28 ? 2 : 1 };
}

// Simple 3D models per weather
function createUmbrella(group) {
    const canopy = new THREE.SphereGeometry(3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xff4d6d, metalness: 0.1, roughness: 0.6 });
    const top = new THREE.Mesh(canopy, canopyMat);
    top.position.y = 6;
    group.add(top);
    const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 3;
    group.add(handle);
}

function createSnowman(group) {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 24), bodyMat);
    const middle = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24), bodyMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 24), bodyMat);
    bottom.position.y = 3; middle.position.y = 6; head.position.y = 8.5;
    group.add(bottom, middle, head);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xff7f11 }));
    nose.position.set(0, 8.5, 1.2); nose.rotation.x = Math.PI / 2;
    group.add(nose);
}

function createLightningBolt(group) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0.5, -1.2); shape.lineTo(-0.2, -1.2); shape.lineTo(0.6, -3); shape.lineTo(-0.1, -2.1); shape.lineTo(0.2, -2.1);
    const geo = new THREE.ShapeGeometry(shape);
    const bolt = new THREE.Mesh(geo, mat);
    bolt.position.set(0, 12, 0);
    bolt.scale.set(4, 4, 1);
    group.add(bolt);
    gsap.to(bolt.material, { opacity: 0, duration: 0.15, repeat: -1, yoyo: true, ease: 'power1.inOut' });
}

// Integrate models into themes
const originalCreateRain = createRain;
createRain = function(group, variant){ originalCreateRain(group, variant); createUmbrella(group); };
const originalCreateSnow = createSnow;
createSnow = function(group, variant){ originalCreateSnow(group, variant); createSnowman(group); };
const originalCreateStorm = createStormTheme;
createStormTheme = function(group, variant){ originalCreateStorm(group, variant); createLightningBolt(group); };

// Weather ambience audio
function setupWeatherAudio(weatherType, windKmH = 0) {
    cleanupAudio();
    if (!audioEnabled) return;
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Ensure resumed (autoplay policy)
    if (audioContext.state === 'suspended') { try { audioContext.resume(); } catch {} }
    const routeToMaster = () => {
        const master = audioContext.createGain(); master.gain.value = 1.0; master.connect(audioContext.destination); return master;
    };
    const master = routeToMaster();
    const makeTone = (type, freq, gain) => {
        const osc = audioContext.createOscillator(); const g = audioContext.createGain();
        osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
        osc.connect(g); g.connect(master); osc.start();
        activeAudioNodes.push(osc, g, master);
    };
    const makeNoise = (gain, filterFreq) => {
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
        const whiteNoise = audioContext.createBufferSource(); whiteNoise.buffer = noiseBuffer; whiteNoise.loop = true;
        const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = filterFreq;
        const g = audioContext.createGain(); g.gain.value = gain;
        whiteNoise.connect(filter); filter.connect(g); g.connect(master); whiteNoise.start(0);
        activeAudioNodes.push(whiteNoise, filter, g, master);
    };
    const wt = weatherType.toLowerCase();
    const windGain = Math.min(Math.max((windKmH || 0) / 60, 0), 0.5); // 0..0.5
    switch (wt) {
        case 'rain':
            makeNoise(0.025 + windGain, 1400);
            break;
        case 'snow':
            makeTone('sine', 320, 0.012);
            makeNoise(0.01 + windGain * 0.5, 800);
            break;
        case 'thunderstorm':
            makeNoise(0.04 + windGain, 900);
            makeTone('sawtooth', 90, 0.01);
            break;
        case 'clouds':
            makeNoise(0.008 + windGain * 0.6, 1200);
            makeTone('sine', 220, 0.006);
            break;
        case 'clear':
            makeNoise(0.006 + windGain * 0.5, 2000);
            makeTone('sine', 440, 0.006);
            break;
        default:
            makeTone('sine', 280, 0.008);
    }
}

// Select background video by theme (user can replace sources with high-quality loops)
function setBackgroundVideoByTheme(themeType) {
    if (!bgVideo) return;
    bgVideo.muted = true; bgVideo.loop = true; bgVideo.playsInline = true;
    const key = ((themeType || 'clear').toLowerCase());
    // First try local assets (place your downloaded MP4s under public/videos)
    const localMap = {
        snow: '/videos/snow.mp4',
        rain: '/videos/rain.mp4',
        thunderstorm: '/videos/storm.mp4',
        clouds: '/videos/clouds.mp4',
        clear: '/videos/sun.mp4'
    };
    // Fallback theme-based sample videos (Google sample bucket)
    const remoteMapPrimary = {
        snow: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        rain: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thunderstorm: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        clouds: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        clear: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    };
    // Final fallback (single small MP4 known to allow cross-origin)
    const remoteMapFallback = {
        snow: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        rain: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        thunderstorm: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        clouds: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        clear: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    };
    const candidates = [localMap[key], remoteMapPrimary[key], remoteMapFallback[key]].filter(Boolean);
    const tryPlay = async (list, idx = 0) => {
        if (!list[idx]) return; // give up
        const src = list[idx];
        if (bgVideo.getAttribute('src') !== src) {
            bgVideo.setAttribute('src', src);
        }
        try {
            // On some browsers, need to load() before play after changing src
            bgVideo.load();
            await bgVideo.play();
            bgVideo.style.display = 'block';
            console.log('[WeatherApp] bgVideo playing:', src);
        } catch {
            // Try next fallback
            tryPlay(list, idx + 1);
        }
    };
    tryPlay(candidates);

    // If a network/CORS error occurs, log but allow fallbacks and future attempts
    const onError = () => {
        console.warn('[WeatherApp] bgVideo error');
    };
    bgVideo.onerror = onError;
    bgVideo.onplaying = () => { bgVideo.style.display = 'block'; };
    bgVideo.onloadeddata = () => { bgVideo.style.display = 'block'; };
}

function cleanupAudio() {
    activeAudioNodes.forEach(node => {
        try { if (node.stop) node.stop(); } catch {}
        try { node.disconnect(); } catch {}
    });
    activeAudioNodes = [];
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    weatherInfo.classList.remove('show');
    error.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
}

// Show error
function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    weatherInfo.classList.remove('show');
}

// Handle city input
async function handleCitySearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    showLoading();
    
    try {
        const weatherData = await getWeatherData(city);
        updateWeatherDisplay(weatherData);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Event listeners
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleCitySearch();
    }
});

if (searchButton) {
    searchButton.addEventListener('click', () => {
        handleCitySearch();
        if (audioEnabled && audioContext && audioContext.state === 'suspended') { try { audioContext.resume(); } catch {} }
    });
}

if (soundToggle) {
    soundToggle.addEventListener('click', async () => {
        audioEnabled = !audioEnabled;
        soundToggle.textContent = `Sound: ${audioEnabled ? 'On' : 'Off'}`;
        if (audioEnabled && !audioContext) {
            try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
        }
        if (!audioEnabled) cleanupAudio();
        else if (audioContext && audioContext.state === 'suspended') { try { await audioContext.resume(); } catch {} }
    });
}

// Initialize the app
function init() {
    init3DScene();
    
    // Set default city
    cityInput.value = 'London';
    handleCitySearch();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
