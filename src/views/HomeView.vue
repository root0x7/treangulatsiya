<template>
  <div class="map-container">
    <div id="map" ref="mapRef" class="map"></div>
    <div class="legend">
      <h3>Atmetkalar</h3>
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
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';

export default {
  name: 'HomeView',
  setup() {
    const mapRef = ref(null);
    let map = null;
    
    // Geodezik atmetkalar ma'lumotlari (namuna)
    const markPoints = [
      { id: 1, lon: 69.240, lat: 41.311, type: 'triangulation', name: 'T-1' },
      { id: 2, lon: 69.250, lat: 41.315, type: 'triangulation', name: 'T-2' },
      { id: 3, lon: 69.260, lat: 41.305, type: 'triangulation', name: 'T-3' },
      { id: 4, lon: 69.245, lat: 41.320, type: 'polygon', name: 'P-1' },
      { id: 5, lon: 69.255, lat: 41.325, type: 'polygon', name: 'P-2' },
      { id: 6, lon: 69.235, lat: 41.300, type: 'gps', name: 'GPS-1' },
      { id: 7, lon: 69.265, lat: 41.310, type: 'gps', name: 'GPS-2' },
    ];
    
    // Atmetkalar kategoriyalari va ranglari
    const categories = [
      { name: 'Triangulatsion punktlar', type: 'triangulation', color: '#FF5733' },
      { name: 'Poligonometriya punktlari', type: 'polygon', color: '#33A8FF' },
      { name: 'GPS punktlari', type: 'gps', color: '#33FF57' }
    ];

    onMounted(() => {
      initMap();
      addMarkersToMap();
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
          center: fromLonLat([69.240, 41.311]), // Toshkent markazi
          zoom: 13
        })
      });
    };
    
    const addMarkersToMap = () => {
      // Har bir kategoriya uchun alohida vector layer yaratish
      categories.forEach(category => {
        // Kategoriyaga mos atmetkalarni filtrlash
        const categoryPoints = markPoints.filter(point => point.type === category.type);
        
        // Atmetkalar uchun features yaratish
        const features = categoryPoints.map(point => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([point.lon, point.lat])),
            name: point.name,
            type: point.type
          });
          
          // Atmetkalar uchun style yaratish
          feature.setStyle(
            new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({ color: category.color }),
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
          
          return feature;
        });
        
        // Vector layer yaratish va xaritaga qo'shish
        const vectorSource = new VectorSource({
          features: features
        });
        
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          title: category.name
        });
        
        map.addLayer(vectorLayer);
      });
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