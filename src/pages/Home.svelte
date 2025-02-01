<script lang="ts">
  import { Geolocation } from "@capacitor/geolocation";
  import { logout } from "../lib/auth";
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import { onMount } from "svelte";

  let map: any;
  let destinationCoordinates = ""; // To store the clicked location's coordinates

  onMount(() => {
    // Initialize the map with default coordinates (Manila)
    map = L.map("map").setView([14.5995, 120.9842], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Check geolocation permissions and set the user's current location
    Geolocation.checkPermissions()
      .then((result) => {
        if (result.location === "granted") {
          return Geolocation.getCurrentPosition();
        } else {
          throw new Error("Location permission not granted");
        }
      })
      .then((position) => {
        const { latitude, longitude } = position.coords;

        // Update the map view to the user's location
        map.setView([latitude, longitude], 13);

        // Add a marker at the user's location
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
      })
      .catch((error) => {
        console.error("Error getting location:", error.message);
        alert("Unable to access your location. Please check your settings.");
      });

    // Add a click event listener to the map
    map.on("click", (event: any) => {
      const { lat, lng } = event.latlng; // Get the clicked location's coordinates

      // Clear any existing destination marker
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && layer !== map._layers[L.stamp(map)]) {
          map.removeLayer(layer);
        }
      });

      // Add a marker at the clicked location
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup("Destination")
        .openPopup();

      // Update the destination coordinates display
      destinationCoordinates = `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`;
    });
  });
</script>

<button on:click={logout}>Logout</button>

<div id="map"></div>

<!-- Display the destination coordinates -->
<div id="coordinates">
  Destination: {destinationCoordinates || "Click on the map to select a destination"}
</div>

<style>
  #map {
    height: 90vh; /* Reduced height to leave space for coordinates */
    width: 100%; /* Full width */
  }

  #coordinates {
    height: 10vh; /* Space for coordinates display */
    width: 100%;
    background-color: #f4f4f4;
    padding: 10px;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 14px;
    text-align: center;
    border-top: 1px solid #ccc;
  }
</style>
