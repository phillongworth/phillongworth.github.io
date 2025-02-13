document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map (Leaflet setup remains the same)
    const map = L.map('map').setView([53.615, -1.910], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const trackList = document.getElementById('track-list');
    const summary = document.getElementById('summary');

    let totalDistanceMiles = 0;
    let totalElevationGainFeet = 0;

    document.getElementById('file-input').addEventListener('change', function (event) {
        const files = event.target.files;
        if (files.length > 0) {
            Array.from(files).forEach(async (file) => {
                const { data, error } = await supabase.storage
                    .from('gpx-tracks')
                    .upload(`gpx/${file.name}`, file);

                if (error) {
                    console.error('Error uploading file:', error.message);
                    return;
                }

                const url = supabase.storage.from('gpx-tracks').getPublicUrl(data.Key).publicURL;

                const reader = new FileReader();
                reader.onload = async function (e) {
                    const gpxData = e.target.result;
                    const gpxLayer = new L.GPX(gpxData, {
                        async: true,
                        polyline_options: { color: getRandomColor() }
                    }).on('loaded', async function (e) {
                        const gpx = e.target;
                        map.fitBounds(gpx.getBounds());

                        const distanceMiles = gpx.get_distance() * 0.000621371;
                        const elevationGainFeet = gpx.get_elevation_gain() * 3.28084;

                        totalDistanceMiles += distanceMiles;
                        totalElevationGainFeet += elevationGainFeet;

                        const row = document.createElement('tr');
                        row.innerHTML = `<td>${file.name}</td>
                                         <td>${distanceMiles.toFixed(1)}</td>
                                         <td>${elevationGainFeet.toFixed(1)}</td>`;
                        trackList.appendChild(row);

                        summary.innerHTML = `<strong>Total Distance:</strong> ${totalDistanceMiles.toFixed(1)} miles<br>
                                            <strong>Total Elevation Gain:</strong> ${totalElevationGainFeet.toFixed(1)} feet`;

                        const popupContent = `<strong>${file.name}</strong><br>
                                              Distance: ${distanceMiles.toFixed(1)} miles<br>
                                              Elevation Gain: ${elevationGainFeet.toFixed(1)} feet`;
                        gpxLayer.bindPopup(popupContent);

                        // Store metadata in Supabase
                        await supabase.from('tracks').insert([{
                            name: file.name,
                            distance: distanceMiles,
                            elevation: elevationGainFeet,
                            url: url
                        }]);
                    }).addTo(map);
                };
                reader.readAsText(file);
            });
        }
    });

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Load existing tracks from Supabase
    async function loadTracks() {
        const { data, error } = await supabase.from('tracks').select('*');
        if (error) {
            console.error('Error loading tracks:', error.message);
            return;
        }

        data.forEach((track) => {
            fetch(track.url).then(response => response.text()).then(gpxData => {
                const gpxLayer = new L.GPX(gpxData, {
                    async: true,
                    polyline_options: { color: getRandomColor() }
                }).on('loaded', function (e) {
                    const gpx = e.target;
                    map.fitBounds(gpx.getBounds());

                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${track.name}</td>
                                     <td>${track.distance.toFixed(1)}</td>
                                     <td>${track.elevation.toFixed(1)}</td>`;
                    trackList.appendChild(row);

                    const popupContent = `<strong>${track.name}</strong><br>
                                          Distance: ${track.distance.toFixed(1)} miles<br>
                                          Elevation Gain: ${track.elevation.toFixed(1)} feet`;
                    gpxLayer.bindPopup(popupContent);
                }).addTo(map);
            });
        });
    }

    loadTracks();
});
