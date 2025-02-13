// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2); // Start with a world view
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const tracksData = []; // Array to store track data (name, distance, elevation, geoJSON)

// Function to parse GPX and extract data
function parseGPX(gpxFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            const gpxData = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(gpxData, "text/xml");

            const trackName = xmlDoc.querySelector("trk > name")?.textContent || gpxFile.name;
            const trackPoints = xmlDoc.querySelectorAll("trkpt");

            if (!trackPoints || trackPoints.length === 0) {
                reject("No track points found in GPX file.");
                return;
            }

            const coordinates = [];
            for (let i = 0; i < trackPoints.length; i++) {
                const lat = parseFloat(trackPoints[i].getAttribute("lat"));
                const lon = parseFloat(trackPoints[i].getAttribute("lon"));
                const ele = parseFloat(trackPoints[i].querySelector("ele")?.textContent || 0); // Elevation

                if (!isNaN(lat) && !isNaN(lon)) {
                    coordinates.push([lat, lon, ele]); // Store elevation with coordinates
                }
            }


            const distance = calculateDistance(coordinates);
            const elevationGain = calculateElevationGain(coordinates);
            const geoJSON = {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates.map(coord => [coord[1], coord[0]]) // Leaflet expects [longitude, latitude]
              }
            };


            resolve({
                name: trackName,
                distance: distance,
                elevationGain: elevationGain,
                geoJSON: geoJSON,
            });
        };

        reader.onerror = function(e) {
            reject("Error reading GPX file.");
        };

        reader.readAsText(gpxFile);
    });
}

// Function to calculate distance (Haversine formula)
function calculateDistance(coordinates) {
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
        const lat1 = coordinates[i - 1][0];
        const lon1 = coordinates[i - 1][1];
        const lat2 = coordinates[i][0];
        const lon2 = coordinates[i][1];

        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        totalDistance += distance;
    }
    return totalDistance;
}

// Function to calculate elevation gain
function calculateElevationGain(coordinates) {
    let elevationGain = 0;
    for (let i = 1; i < coordinates.length; i++) {
        const ele1 = coordinates[i - 1][2];
        const ele2 = coordinates[i][2];
        const diff = ele2 - ele1;
        if (diff > 0) {
            elevationGain += diff;
        }
    }
    return elevationGain;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Function to display track on the map
function displayTrack(trackData) {
    const trackLayer = L.geoJSON(trackData.geoJSON).addTo(map);
    map.fitBounds(trackLayer.getBounds()); // Zoom to the track

    // Add to track list
    const trackList = document.getElementById("tracks");
    const listItem = document.createElement("li");
    listItem.textContent = `${trackData.name} - Distance: ${trackData.distance.toFixed(2)} km, Elevation Gain: ${trackData.elevationGain.toFixed(2)} m`;
    trackList.appendChild(listItem);
}

// Function to update overall statistics
function updateOverallStatistics() {
    let totalDistance = 0;
    let totalElevationGain = 0;

    tracksData.forEach(track => {
        totalDistance += track.distance;
        totalElevationGain += track.elevationGain;
    });

    document.getElementById("total-distance").textContent = totalDistance.toFixed(2);
    document.getElementById("total-elevation-gain").textContent = totalElevationGain.toFixed(2);
}


// Event listener for file upload
document.getElementById("gpx-upload").addEventListener("change", async function(event) {
    const files = event.target.files;

    for (let i = 0; i < files.length; i++) {
        try {
            const trackData = await parseGPX(files[i]);
            tracksData.push(trackData);
            displayTrack(trackData);
            updateOverallStatistics();
        } catch (error) {
            alert(`Error processing file ${files[i].name}: ${error}`);
            console.error(error);
        }
    }
});