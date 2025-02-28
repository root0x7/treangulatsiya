<template>
  <div id="app">

    
    <div class="map-container">
      <div id="map"></div>
      
      <div class="controls">
        <button @click="toggleDrawMode">{{ drawMode ? 'Stop' : 'Start' }}</button>
        <button @click="clearPolygon">Tozalash</button>
        <button @click="completePolygon" :disabled="points.length < 3">Yakunlash</button>
        
        <div class="point-list">
          <h4>Punktlar ({{ points.length }})</h4>
          <div v-for="(point, index) in pointsFormatted" :key="index" class="point-item">
            Point {{ index + 1 }}: {{ point }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Fill, Stroke, Circle } from 'ol/style';

export default {
  name: 'Tree3',

  data() {
    return {
      map: null,
      drawMode: false,
      points: [],
      vectorSource: null,
      vectorLayer: null,
      pointFeatures: [],
      polygonFeature: null
    };
  },
  computed: {
    pointsFormatted() {
      return this.points.map(point => {
        const coords = transform(point, 'EPSG:3857', 'EPSG:4326');
        return `Lat: ${coords[1].toFixed(6)}, Lon: ${coords[0].toFixed(6)}`;
      });
    }
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.vectorSource = new VectorSource();
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: new Style({
          fill: new Fill({ color: 'rgba(100, 180, 100, 0.2)' }),
          stroke: new Stroke({ color: '#4CAF50', width: 2 }),
          image: new Circle({ radius: 7, fill: new Fill({ color: '#4CAF50' }) })
        })
      });

      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({ source: new OSM() }),
          this.vectorLayer
        ],
        view: new View({
          center: fromLonLat([69.2401, 41.2995]),
          zoom: 12
        })
      });

      this.map.on('click', (event) => {
        if (this.drawMode) {
          this.addPoint(event.coordinate);
        }
      });
    },
    
    toggleDrawMode() {
      this.drawMode = !this.drawMode;
    },
    
    addPoint(coordinate) {
      this.points.push(coordinate);
      const pointFeature = new Feature({ geometry: new Point(coordinate) });
      this.pointFeatures.push(pointFeature);
      this.vectorSource.addFeature(pointFeature);
      if (this.points.length >= 2) {
        this.updatePolygon();
      }
    },
    
    updatePolygon() {
      if (this.polygonFeature) {
        this.vectorSource.removeFeature(this.polygonFeature);
      }
      this.polygonFeature = new Feature({ geometry: new Polygon([this.points]) });
      this.vectorSource.addFeature(this.polygonFeature);
    },
    
    completePolygon() {
      if (this.points.length < 3) {
        alert('At least 3 points are needed to form a polygon');
        return;
      }
      if (this.points[0] !== this.points[this.points.length - 1]) {
        this.addPoint(this.points[0]);
      }
      this.drawMode = false;
    },
    
    clearPolygon() {
      this.points = [];
      this.vectorSource.clear();
      this.pointFeatures = [];
      this.polygonFeature = null;
    }
  }
};
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.header {
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  text-align: center;
}
.map-container {
  flex: 1;
  position: relative;
}
#map {
  width: 100%;
  height: 100%;
}
.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  z-index: 1000;
}
button {
  padding: 8px 12px;
  margin: 5px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}
button:hover {
  background-color: #45a049;
}
.point-list {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}
.point-item {
  padding: 5px;
  border-bottom: 1px solid #ddd;
}
</style>
