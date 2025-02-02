<script lang="ts">
  import { Geolocation } from "@capacitor/geolocation";
  import { logout } from "../lib/auth";
  import Nav from "../components/Nav.svelte";
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import { onMount } from "svelte";
  import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
  import "leaflet-geosearch/dist/geosearch.css";

  let map: any;
  let pickupMarker: any;
  let dropoffMarker: any;
  let routeLine: any;
  let currentLocationMarker: any;
  let searchControl: any;
  let isLoading = $state(false);
  let step = $state("pickup"); // 'pickup' or 'dropoff'

  let pickupLocation = $state({
    address: "",
    coords: { lat: 0, lng: 0 },
  });

  let dropoffLocation = $state({
    address: "",
    coords: { lat: 0, lng: 0 },
  });

  async function getAddressFromCoords(
    lat: number,
    lng: number,
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await response.json();
      return data.display_name || "Location not found";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Address unavailable";
    }
  }

  async function getRoute(start: [number, number], end: [number, number]) {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`,
      );
      const data = await response.json();
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]],
      );
    } catch (error) {
      console.error("Error fetching route:", error);
      return [start, end]; // Fallback to straight line if routing fails
    }
  }

  const customIcon = (color: string) =>
    L.divIcon({
      className: "custom-div-icon",
      html: `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    "></div>
  `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

  onMount(() => {
    // Ask to enable location services if not already enabled

    map = L.map("map", {
      center: [14.5995, 120.9842],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}",
      {
        minZoom: 0,
        maxZoom: 20,
        ext: "png",
      },
    ).addTo(map);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: "PH",
      },
    });

    searchControl = GeoSearchControl({
      provider: provider,
      showMarker: false,
      searchLabel: "Search for a location",
    });
    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result: any) => {
      const { lat, lng } = result.location;
      handleLocationSelection(lat, lng);
    });

    getCurrentLocation();

    map.on("click", async (event: any) => {
      const { lat, lng } = event.latlng;
      handleLocationSelection(lat, lng);
    });
  });

  async function handleLocationSelection(lat: number, lng: number) {
    const address = await getAddressFromCoords(lat, lng);

    if (step === "pickup") {
      pickupLocation = { coords: { lat, lng }, address };
      updatePickupMarker();
    } else {
      dropoffLocation = { coords: { lat, lng }, address };
      updateDropoffMarker();
      drawRoute();
    }
  }

  async function useCurrentLocationAsPickup() {
    if (!currentLocationMarker) {
      await getCurrentLocation();
    }

    const position = currentLocationMarker.getLatLng();
    const address = await getAddressFromCoords(position.lat, position.lng);
    pickupLocation = {
      coords: { lat: position.lat, lng: position.lng },
      address,
    };
    updatePickupMarker();
  }

  async function getCurrentLocation() {
    const position = await Geolocation.getCurrentPosition();

    const { latitude, longitude } = position.coords;
    const address = await getAddressFromCoords(latitude, longitude);

    currentLocationMarker = L.marker([latitude, longitude], {}).addTo(map);

    map.setView([latitude, longitude], 15);
    pickupLocation = { coords: { lat: latitude, lng: longitude }, address };
    updatePickupMarker();
  }

  async function updatePickupMarker() {
    if (pickupMarker) {
      map.removeLayer(pickupMarker);
    }

    pickupMarker = L.marker(
      [pickupLocation.coords.lat, pickupLocation.coords.lng],
      {
        icon: customIcon("#27ae60"),
      },
    ).addTo(map);
  }

  async function updateDropoffMarker() {
    if (dropoffMarker) {
      map.removeLayer(dropoffMarker);
    }

    dropoffMarker = L.marker(
      [dropoffLocation.coords.lat, dropoffLocation.coords.lng],
      {
        icon: customIcon("#e74c3c"),
      },
    ).addTo(map);
  }

  function goToDropoff() {
    if (pickupLocation.coords.lat) {
      step = "dropoff";
    }
  }

  function goToPickup() {
    step = "pickup";
    if (dropoffMarker) map.removeLayer(dropoffMarker);
    if (routeLine) map.removeLayer(routeLine);
    dropoffLocation = { address: "", coords: { lat: 0, lng: 0 } };
  }

  function resetLocations() {
    if (pickupMarker) map.removeLayer(pickupMarker);
    if (dropoffMarker) map.removeLayer(dropoffMarker);
    if (routeLine) map.removeLayer(routeLine);

    pickupLocation = { address: "", coords: { lat: 0, lng: 0 } };
    dropoffLocation = { address: "", coords: { lat: 0, lng: 0 } };
    step = "pickup";
  }

  async function drawRoute() {
    if (routeLine) {
      map.removeLayer(routeLine);
    }

    const start: [number, number] = [
      pickupLocation.coords.lat,
      pickupLocation.coords.lng,
    ];
    const end: [number, number] = [
      dropoffLocation.coords.lat,
      dropoffLocation.coords.lng,
    ];

    const routeCoordinates = await getRoute(start, end);

    routeLine = L.polyline(routeCoordinates, {
      color: "#3498db",
      weight: 4,
      opacity: 0.7,
      lineJoin: "round",
    }).addTo(map);

    // Fit the map to show the entire route
    const bounds = L.latLngBounds(routeCoordinates);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
</script>

<div class="container">
  <div class="locations-panel">
    <div class="header">
      <h2>Book a Ride</h2>
      <div class="progress-bar">
        <div class="progress-step {step === 'pickup' ? 'active' : ''}"></div>
        <div class="progress-step {step === 'dropoff' ? 'active' : ''}"></div>
      </div>
    </div>

    {#if step === "pickup"}
      <div class="step-content">
        <p>Pickup Location</p>
        <div class="location-input">
          <span class="location-dot pickup"></span>
          <input
            type="text"
            placeholder="Select Location on the map"
            value={pickupLocation.address}
            readonly
          />
        </div>

        <button
          class="current-location-btn"
          onclick={useCurrentLocationAsPickup}
        >
          Use My Current Location
        </button>

        <div class="buttons">
          <button onclick={resetLocations} class="reset-btn">Clear</button>
          <button
            class="next-btn"
            onclick={goToDropoff}
            disabled={!pickupLocation.coords.lat}
          >
            Confirm Pickup
          </button>
        </div>
      </div>
    {:else}
      <div class="step-content">
        <p>Dropoff Location</p>
        <div class="location-summary">
          <div class="location-input">
            <span class="location-dot pickup"></span>
            <input type="text" value={pickupLocation.address} readonly />
            <button class="edit-btn" onclick={goToPickup}>Change</button>
          </div>
        </div>

        <div class="location-input">
          <span class="location-dot dropoff"></span>
          <input
            type="text"
            placeholder="Select Dropoff on the map"
            value={dropoffLocation.address}
            readonly
          />
        </div>

        <div class="buttons">
          <button onclick={resetLocations} class="reset-btn">Clear</button>
          <button class="book-btn" disabled={!dropoffLocation.coords.lat}>
            Confirm Ride
          </button>
        </div>
      </div>
    {/if}
  </div>

  <div id="map"></div>

  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Getting your location...</p>
    </div>
  {/if}
  <Nav />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    background-color: #f5f6fa;
  }

  .locations-panel {
    background: white;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    flex: 1;
  }

  h2 {
    margin-bottom: 0.5rem;
    color: #2d3436;
    font-size: 1rem;
  }

  .progress-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .progress-step {
    flex: 1;
    height: 4px;
    background-color: var(--background);
    border-radius: 2px;
  }

  .progress-step.active {
    background-color: var(--accent);
  }

  .location-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    padding: 0.25rem 0.5rem;
    margin-bottom: 0.5rem;
  }

  .location-dot {
    width: 10px;
    height: 10px;
    aspect-ratio: 1/1;
    border-radius: 50%;
  }

  .location-dot.pickup {
    background-color: #27ae60;
  }

  .location-dot.dropoff {
    background-color: var(--secondary);
  }

  input {
    border: none;
    background: transparent;
    width: 100%;
    padding: 0.25rem;
    font-size: 0.8rem;
    color: #2d3436;
    &:focus {
      outline: none;
    }
  }

  input::placeholder {
    color: #b2bec3;
    font-size: 0.8rem;
  }

  .buttons {
    display: flex;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;
    text-align: center;
  }

  .reset-btn {
    background-color: #e9ecef;
    color: #2d3436;
  }

  .current-location-btn {
    width: 100%;
    background-color: var(--primary);
    color: white;
    margin-bottom: 1rem;
  }

  .next-btn,
  .book-btn {
    background-color: #27ae60;
    color: white;
  }

  .next-btn:disabled,
  .book-btn:disabled {
    background-color: #b2bec3;
    cursor: not-allowed;
  }

  .edit-btn {
    background-color: transparent;
    color: #3498db;
    font-weight: 600;
    padding: 0;
  }

  #map {
    width: 100%;
    height: 70vh;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    z-index: 1000;
  }
  .step-content {
    p {
      font-size: 0.8rem;
      color: #636e72;
      margin-bottom: 0.5rem;
    }
  }

  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
