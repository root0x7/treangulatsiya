<template>
  <div class="map-container">
    <div id="map" ref="mapRef" class="map"></div>
    <div class="legend">
      <h3>Geodezik tarmoq</h3>
      <div v-for="(category, index) in categories" :key="index" class="legend-item">
        <div class="color-box" :style="{ backgroundColor: category.color }"></div>
        <span>{{ category.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';

export default {
  name: 'Tree',
  setup() {
    const mapRef = ref(null);
    let map = null;
    
    // Farg'ona vodiysi geodezik punktlari (namuna)
    const triangulationPoints = [
      { id: 1, lon: 71.72, lat: 40.38, type: 'triangulation', name: 'T-1', class: 1 }, // Farg'ona
      { id: 2, lon: 71.98, lat: 40.52, type: 'triangulation', name: 'T-2', class: 1 }, // Qo'qon
      { id: 3, lon: 72.23, lat: 40.77, type: 'triangulation', name: 'T-3', class: 1 }, // Namangan
      { id: 4, lon: 71.58, lat: 40.78, type: 'triangulation', name: 'T-4', class: 1 }, // Andijon
      { id: 5, lon: 71.55, lat: 40.47, type: 'triangulation', name: 'T-5', class: 1 }, // Oltiariq
      { id: 6, lon: 72.10, lat: 40.42, type: 'triangulation', name: 'T-6', class: 2 }, // Rishton
      { id: 7, lon: 72.06, lat: 40.63, type: 'triangulation', name: 'T-7', class: 2 }, // Beshariq
      { id: 8, lon: 71.78, lat: 40.71, type: 'triangulation', name: 'T-8', class: 2 }, // Asaka
      { id: 9, lon: 71.85, lat: 40.33, type: 'triangulation', name: 'T-9', class: 2 }, // Quva
      { id: 10, lon: 71.67, lat: 40.63, type: 'triangulation', name: 'T-10', class: 2 }, // Margilon
      { id: 11, lon: 72.03, lat: 40.85, type: 'triangulation', name: 'T-11', class: 2 }, // Uchqo'rg'on
      { id: 12, lon: 71.63, lat: 40.93, type: 'triangulation', name: 'T-12', class: 2 }, // Xonobod
    ];
    
    // Triangulatsiya liniyalarini tuzish
    const triangulationLines = [
      // 1-class uchburchaklar
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 1 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      
      // 2-class uchburchaklar
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 6 },
      { from: 9, to: 10 },
      { from: 10, to: 11 },
      { from: 11, to: 9 },
      { from: 10, to: 12 },
      { from: 12, to: 11 },
      
      // Bog'lovchi liniyalar
      { from: 1, to: 9 },
      { from: 2, to: 6 },
      { from: 3, to: 11 },
      { from: 4, to: 12 },
      { from: 5, to: 10 }
    ];
    
    // Atmetkalar kategoriyalari va ranglari
    const categories = [
      { name: '1-klass triangulatsiya punktlari', type: 'class1', color: '#FF5733' },
      { name: '2-klass triangulatsiya punktlari', type: 'class2', color: '#33A8FF' },
      { name: 'Triangulatsiya liniyalari', type: 'line', color: '#000000' }
    ];

    onMounted(() => {
      initMap();
      addTriangulationNetwork();
    });
    
    const initMap = () => {
      // Xaritani yaratish
      map = new Map({
        target: mapRef.value,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: fromLonLat([71.80, 40.60]), // Farg'ona vodiysi markazi
          zoom: 9
        })
      });
    };
    
    const addTriangulationNetwork = () => {
      // Punktlar uchun vector source
      const pointSource = new VectorSource();
      
      // Triangulatsiya liniyalari uchun vector source
      const lineSource = new VectorSource();
      
      // Punktlarni qo'shish
      triangulationPoints.forEach(point => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.lon, point.lat])),
          name: point.name,
          type: point.type,
          class: point.class
        });
        
        // Punkt turi bo'yicha style qo'llash
        const pointColor = point.class === 1 ? '#FF5733' : '#33A8FF';
        const pointRadius = point.class === 1 ? 10 : 7;
        
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: pointRadius,
              fill: new Fill({ color: pointColor }),
              stroke: new Stroke({ color: '#fff', width: 2 })
            }),
            text: new Text({
              text: point.name,
              font: '12px Calibri,sans-serif',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({ color: '#fff', width: 3 }),
              offsetY: -15
            })
          })
        );
        
        pointSource.addFeature(feature);
      });
      
      // Liniyalarni qo'shish
      triangulationLines.forEach(line => {
        const fromPoint = triangulationPoints.find(p => p.id === line.from);
        const toPoint = triangulationPoints.find(p => p.id === line.to);
        
        if (fromPoint && toPoint) {
          const lineFeature = new Feature({
            geometry: new LineString([
              fromLonLat([fromPoint.lon, fromPoint.lat]),
              fromLonLat([toPoint.lon, toPoint.lat])
            ])
          });
          
          // Liniya stilini o'rnatish
          const lineWidth = (fromPoint.class === 1 && toPoint.class === 1) ? 3 : 2;
          const lineColor = (fromPoint.class === 1 && toPoint.class === 1) ? '#000000' : '#555555';
          
          lineFeature.setStyle(
            new Style({
              stroke: new Stroke({
                color: lineColor,
                width: lineWidth,
                lineDash: [fromPoint.class === 1 && toPoint.class === 1 ? 0 : 4]
              })
            })
          );
          
          lineSource.addFeature(lineFeature);
        }
      });
      
      // Liniyalar layerini qo'shish (birinchi qo'shiladi, punktlar tepada ko'rinishi uchun)
      const lineLayer = new VectorLayer({
        source: lineSource,
        title: 'Triangulatsiya liniyalari'
      });
      
      // Punktlar layerini qo'shish
      const pointLayer = new VectorLayer({
        source: pointSource,
        title: 'Triangulatsiya punktlari'
      });
      
      map.addLayer(lineLayer);
      map.addLayer(pointLayer);
    };
    
    return {
      mapRef,
      categories
    };
  }
};
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 600px;
}

.map {
  width: 100%;
  height: 100%;
}

.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.legend h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.color-box {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border: 1px solid #000;
}
</style>