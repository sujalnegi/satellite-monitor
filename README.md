# Satellite Monitor

<div align="center">
<img src="static/images/logo.svg" alt="Logo" width="400"/>

**Satellite Monitor is an imersice 3D Simulation of Earth and a few of its satellites that revolve around it. Explore the vast space of "space" where you can change sim speed model scaleing and more.**

</div>

## Features

* **Real-Time Satellite Tracking:**
    * **Live Orbital Visualization:** Track satellites like ISS, Hubble, and GOES in real-time using TLE (Two-Line Element) data.
    * **3D Earth Model:** Beautiful rotating Earth with realistic textures and lighting.
    * **Moon Visualization:** Accurate Moon positioning and orbital mechanics.
* **Interactive 3D Model Viewer:**
    * **Satellite Models Gallery:** Explore detailed 3D models of famous satellites (ISS, Hubble, GOES).
    * **360° Rotation:** Fully interactive camera controls with zoom, pan, and rotate.
    * **Grid Reference:** a gird mat to give a more 3D look to models.
* **Advanced Simulation Controls:**
    * **Time Control:** Adjust simulation speed from 0.1x to 10x. (1x = 1 hour/second)
    * **Reverse Time:** Watch satellites orbit backwards.
    * **Pause/Play:** Control the simulation flow.
    * **Camera Modes:** Switch between Earth-locked and satellite-locked views.
* **Custom Satellite Upload:**
    * **GLB Model Support:** Upload your own 3D satellite models (.glb format).
    * **Automatic Orbit Assignment:** Custom satellites (UFO) are placed in a 400km orbit with red orbit lines.
    * **Toast Notifications:** Modern notification system for upload feedback.
* **Enhanced Loading Experience:**
    * **Animated Loading Screen:** Rocket animation with progress bar.
    * **Smooth Transitions:** Fade-in effects for professional feel.
* **Responsive UI:**
    * Clean, modern interface with retro-gaming aesthetics.
    * Fully responsive design that works on all devices.
    * Intuitive controls and satellite information panels.

## Demo Viddeo & Deployed Link

Demo Video: [Here](https://drive.google.com/file/d/1LuYNKn6xBX_GNBrNnHbWcLhoiGdyBZMh/view?usp=drive_link)

Deploy Linke is [Here](https://satellite-monitor-k6jo.onrender.com)



## Technologies Used

* **Backend:** Python, Flask
* **3D Graphics:** Three.js, WebGL
* **Satellite Calculations:** satellite.js 
* **3D Models:** GLTFLoader, DRACOLoader
* **Frontend:** HTML5, CSS3, JavaScript 
* **Fonts:** Press Start 2P (retro), Inter 


## Local Setup and Installation

Follow these steps to get the application running on your local machine.

### 1. Prerequisites

* Python 3.7+
* `pip` (Python package installer)
* Modern web browser (Chrome, Firefox, Edge)

### 2. Clone the Repository

Clone this repository to your local machine using Git:

```bash
git clone https://github.com/sujalnegi/satellite-monitor.git
cd satellite-monitor
```

### 3. Create a Virtual Environment

It is highly recommended to create a virtual environment to manage project dependencies.

```bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies

Install all the required Python libraries using `pip`.

```bash
pip install -r requirements.txt
```

### 5. Run the Application

Once the setup is complete, you can start the Flask development server:

```bash
python app.py
```

Now, open your web browser and navigate to the following address:

```
http://127.0.0.1:5000/
```

You should see the **Satellite Tracker** application running!

## How to Use

### Main Simulation Page
1. Navigate to the **Simulation** page from the home screen.
2. Select a satellite from the dropdown menu (ISS, Hubble, GOES, etc.).
3. Use the **speed slider** to adjust simulation speed.
4. Click **Pause/Play** to control time flow.
5. Try the **Reverse Time** feature to watch satellites orbit backwards.
6. Use **zoom controls** (+/-) to adjust your view.

### 3D Model Viewer
1. Click **"Explore 3D Models"** from the home page.
2. Select a satellite model to view in detail.
3. Use your mouse to rotate, zoom, and pan around the model.
4. Click **"Launching Pad"** to return to the main page.

### Custom Satellite Upload
1. In the simulation, click **"➕ Add Custom Satellite"** in the control panel.
2. Select a GLB file from your computer.
3. Click **"Add Satellite"** to upload.
4. Your custom satellite (UFO) will appear with a **red orbit line**.
5. Select "UFO" from the dropdown to track your custom satellite.

### Camera Controls
- **Mouse Drag:** Rotate camera around Earth
- **Scroll Wheel:** Zoom in/out
- **Right Click + Drag:** Pan camera
- **Reset View:** Click the reset button when tracking a satellite
- **Switch View:** Toggle between Earth and satellite perspectives

## Project Structure

```
satellite-monitor/
├── app.py                 # Flask application
├── static/
│   ├── assets/           # 3D models (.glb files)
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   │   ├── main.js       # Simulation logic
│   │   ├── modelviewer.js # 3D model viewer
│   │   └── models.js     # Model gallery
│   └── images/           # Images and textures
├── templates/            # HTML templates
│   ├── index.html        # Home page
│   ├── simulation.html   # Main simulation
│   ├── models.html       # Model gallery
│   └── modelviewer.html  # Model viewer
└── requirements.txt      # Python dependencies
```

## Author

- Email: [sujal1negi@gmail.com](mailto:sujal1negi@gmail.com)
- Instagram: [@_sujalnegi_](https://www.instagram.com/_sujalnegi_/)
- GitHub: [sujalnegi](https://github.com/sujalnegi)

## License

This project is open source and available for educational purposes(use however). 

## Acknowledgments/Credits

- Satellite TLE data from CelesTrak
- 3D models from NASA and sketchers from sketchlab
- Three.js community 
- satellite.js for orbital calculations
