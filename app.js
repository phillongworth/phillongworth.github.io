document.addEventListener('DOMContentLoaded', function () 
{
    // Create a map instance and set the initial view coordinates and zoom level
    var map = L.map('map').setView([53.6753, -1.9395], 13);
  
  
    // Add a tile layer to the map from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  
  
    // Create a marker with popup and add it to the map
    var marker = L.marker([53.6753, -1.9395]).addTo(map);
    marker.bindPopup("Ripponden").openPopup();
  });