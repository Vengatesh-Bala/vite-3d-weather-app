# 3D Weather App 🌤️

A modern, interactive weather application featuring stunning 3D animations powered by Three.js and Vite. Get real-time weather data with beautiful 3D visual effects that change based on weather conditions.

## ✨ Features

- **3D Animated Background**: Dynamic particle systems, floating clouds, and animated sun
- **Real-time Weather Data**: Live weather information from OpenWeatherMap API
- **Interactive 3D Effects**: Weather-specific animations (rain, snow, clouds, clear sky)
- **Modern UI**: Glassmorphism design with smooth animations
- **Responsive Design**: Works perfectly on all device sizes
- **Real-time Updates**: Dynamic 3D scene changes based on weather conditions

## 🚀 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js for 3D animations
- **Build Tool**: Vite for fast development and building
- **Animations**: GSAP for smooth animations
- **Weather API**: OpenWeatherMap API
- **Styling**: Modern CSS with glassmorphism effects

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Step 1: Clone or Download
```bash
# If cloning from git
git clone <repository-url>
cd 3d-weather-app

# Or simply download and extract the project files
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Get Weather API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Open `src/main.js`
5. Replace `'YOUR_API_KEY_HERE'` with your actual API key:

```javascript
const WEATHER_API_KEY = 'your_actual_api_key_here';
```

### Step 4: Run the Application
```bash
# Development mode
npm run dev
# or
yarn dev

# The app will open automatically in your browser at http://localhost:3000
```

### Step 5: Build for Production
```bash
npm run build
# or
yarn build
```

## 🎮 How to Use

1. **Enter City Name**: Type any city name in the search input
2. **Press Enter**: The app will fetch weather data for that city
3. **View Weather**: See temperature, humidity, wind speed, pressure, and "feels like" temperature
4. **Watch 3D Effects**: The background will automatically change based on weather conditions:
   - ☔ **Rain**: Animated raindrops falling
   - ❄️ **Snow**: Gentle snowfall animation
   - ☁️ **Clouds**: Dense cloud formations
   - ☀️ **Clear**: Bright sun with sparkles

## 🌟 3D Animation Features

### Base Scene
- **Particle System**: 1000 animated stars with random colors
- **Floating Clouds**: 20 semi-transparent clouds with gentle movement
- **Animated Sun**: Rotating sun with pulsing opacity

### Weather-Specific Effects
- **Rain**: 500 animated raindrops with realistic falling motion
- **Snow**: 300 snowflakes with slower, gentler movement
- **Cloudy**: Additional cloud formations for overcast conditions
- **Clear**: Enhanced sun brightness with sparkle effects

## 🎨 Customization

### Changing Colors
Modify the color schemes in `src/main.js`:

```javascript
// Sun color
sun.material.color.setHex(0xffff88);

// Rain color
const rainMaterial = new THREE.PointsMaterial({
    color: 0x87ceeb, // Change this hex value
    // ... other properties
});
```

### Adding New Weather Types
Extend the `update3DScene` function to add new weather conditions:

```javascript
case 'thunderstorm':
    createThunderstorm();
    break;
```

### Modifying 3D Elements
Adjust particle counts, sizes, and animation speeds in the respective creation functions.

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ Internet Explorer (not supported)

## 🔧 Troubleshooting

### Common Issues

1. **3D Scene Not Loading**
   - Ensure WebGL is enabled in your browser
   - Check browser console for errors
   - Try refreshing the page

2. **Weather Data Not Loading**
   - Verify your API key is correct
   - Check internet connection
   - Ensure city name is spelled correctly

3. **Performance Issues**
   - Reduce particle counts in the code
   - Close other browser tabs
   - Use a modern browser

### Performance Tips

- The app is optimized for modern devices
- Particle counts can be reduced for older devices
- 3D effects automatically adjust based on device capabilities

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify your API key is valid

## 🎯 Future Enhancements

- [ ] 5-day weather forecast
- [ ] More weather conditions (fog, hail, etc.)
- [ ] Custom 3D models for different weather types
- [ ] Sound effects for weather conditions
- [ ] Dark/light theme toggle
- [ ] Location-based weather (GPS)
- [ ] Weather alerts and notifications

---

**Enjoy your 3D weather experience! 🌈✨**
