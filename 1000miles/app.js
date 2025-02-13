document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    const map = L.map('map').setView([53.615, -1.910], 13);

    // Add a tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Elements to display track list and summary
    const trackList = document.getElementById('track-list');
    const summary = document.getElementById('summary');

    // Variables to store total distance and elevation gain
    let totalDistanceMiles = 0;
    let totalElevationGainFeet = 0;

    // Handle file input change event
    document.getElementById('file-input').addEventListener('change', function (event) {
        const files = event.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const gpxData = e.target.result;
                    const gpxLayer = new L.GPX(gpxData, {
                        async: true,
                        marker_option: {
                            startIconUrl: null,
                            endIconUrl: null,
                            shadowUrl: null,
                        },
                        polyline_options: {
                            color: getRandomColor(),
                            opacity: 0.75,
                            weight: 3,
                            lineJoin: 'round'
                        }
                    }).on('loaded', function (e) {
                        const gpx = e.target;
                        map.fitBounds(gpx.getBounds());

                        // Calculate distance in UK miles and elevation gain in feet
                        const distanceMiles = gpx.get_distance() * 0.000621371; // Correct conversion
                        const elevationGainFeet = gpx.get_elevation_gain() * 3.28084;

                        // Update total distance and elevation gain
                        totalDistanceMiles += distanceMiles;
                        totalElevationGainFeet += elevationGainFeet;

                        // Display track information in the table with one decimal place
                        const row = document.createElement('tr');
                        row.innerHTML = `<td>${file.name}</td>
                                         <td>${distanceMiles.toFixed(1)}</td>
                                         <td>${elevationGainFeet.toFixed(1)}</td>`;
                        trackList.appendChild(row);

                        // Update summary information with one decimal place
                        summary.innerHTML = `<strong>Total Distance:</strong> ${totalDistanceMiles.toFixed(1)} miles<br>
                                            <strong>Total Elevation Gain:</strong> ${totalElevationGainFeet.toFixed(1)} feet`;

                        // Add pop-up to the GPX layer with one decimal place
                        const popupContent = `<strong>${file.name}</strong><br>
                                              Distance: ${distanceMiles.toFixed(1)} miles<br>
                                              Elevation Gain: ${elevationGainFeet.toFixed(1)} feet`;
                        gpxLayer.bindPopup(popupContent);
                    }).addTo(map);
                };
                reader.readAsText(file);
            });
        }
    });

    // Function to generate a random color for each track
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});
