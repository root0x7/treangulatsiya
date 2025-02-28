<template>
  <div class="map-container">
    <div id="map" ref="mapRef" class="map"></div>
    <div class="tools">
      <h3>Triangulatsiya punktlari</h3>
      <div class="tool-controls">
        <div class="mode-controls">
          <button @click="setMode('add')" :class="{ active: currentMode === 'add' }">
            Punkt qo'shish
          </button>
          <button @click="setMode('connect')" :class="{ active: currentMode === 'connect' }">
            Liniya chizish
          </button>
          <button @click="setMode('delete')" :class="{ active: currentMode === 'delete' }">
            O'chirish
          </button>
        </div>
        <div class="point-class">
          <label>Punkt klassi:</label>
          <select v-model="currentClass">
            <option value="1">1-klass</option>
            <option value="2">2-klass</option>
            <option value="3">3-klass</option>
          </select>
        </div>
        <button @click="generateTriangulation" class="action-button">
          Avtomatik triangulatsiya
        </button>
        <button @click="clearAll" class="action-button danger">
          Hammasini tozalash
        </button>
      </div>
      <div class="help-text">
        <p v-if="currentMode === 'add'">Xaritada punkt qo'shish uchun bosing</p>
        <p v-if="currentMode === 'connect'">Liniya chizish uchun ikki punktni ketma-ket tanlang</p>
        <p v-if="currentMode === 'delete'">O'chirish uchun punkt yoki liniyani bosing</p>
      </div>
      <div class="point-info" v-if="selectedPoint">
        <h4>Tanlangan punkt</h4>
        <p>Nomi: {{ selectedPoint.name }}</p>
        <p>Klass: {{ selectedPoint.class }}-klass</p>
        <p>Koordinata: {{ selectedPoint.lon.toFixed(5) }}, {{ selectedPoint.lat.toFixed(5) }}</p>
      </div>
      <div class="legend">
        <div class="legend-item">
          <div class="color-box" style="background-color: #FF5733;"></div>
          <span>1-klass</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #33A8FF;"></div>
          <span>2-klass</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="background-color: #33FF57;"></div>
          <span>3-klass</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { Select, Draw } from 'ol/interaction';
import { click } from 'ol/events/condition';

export default {
  name: 'Tree2',
  setup() {
    const mapRef = ref(null);
    let map = null;
    
    // Xolat boshqaruvi
    const currentMode = ref('add');
    const currentClass = ref('1');
    const selectedPoint = ref(null);
    
    // Punktlar va liniyalar ma'lumotlari
    const points = reactive([]);
    const lines = reactive([]);
    
    // Layer sourcelarini saqlash
    let pointSource = null;
    let lineSource = null;
    
    // Tanlangan punktlar (liniya chizish uchun)
    const selectedPoints = reactive([]);
    
    // Interatsiyalar
    let select = null;
    
    onMounted(() => {
      initMap();
      setupInteractions();
    });
    
    const initMap = () => {
      // Point va line sourcelari
      pointSource = new VectorSource();
      lineSource = new VectorSource();
      
      // Liniyalar layeri
      const lineLayer = new VectorLayer({
        source: lineSource,
        style: (feature) => {
          const fromClass = feature.get('fromClass');
          const toClass = feature.get('toClass');
          
          // Eng yuqori klassni aniqlash
          const maxClass = Math.min(fromClass, toClass);
          
          let lineWidth = 3;
          let lineDash = null;
          
          if (maxClass === 1) {
            lineWidth = 3;
          } else if (maxClass === 2) {
            lineWidth = 2;
            lineDash = [4, 4];
          } else {
            lineWidth = 1.5;
            lineDash = [2, 2];
          }
          
          return new Style({
            stroke: new Stroke({
              color: '#000000',
              width: lineWidth,
              lineDash: lineDash
            })
          });
        }
      });
      
      // Punktlar layeri
      const pointLayer = new VectorLayer({
        source: pointSource,
        style: (feature) => {
          const pointClass = feature.get('class');
          const pointName = feature.get('name');
          
          let pointColor = '#33FF57'; // 3-klass
          let pointRadius = 6;
          
          if (pointClass === 1) {
            pointColor = '#FF5733';
            pointRadius = 10;
          } else if (pointClass === 2) {
            pointColor = '#33A8FF';
            pointRadius = 8;
          }
          
          return new Style({
            image: new Circle({
              radius: pointRadius,
              fill: new Fill({ color: pointColor }),
              stroke: new Stroke({ color: '#fff', width: 2 })
            }),
            text: new Text({
              text: pointName,
              font: '12px Calibri,sans-serif',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({ color: '#fff', width: 3 }),
              offsetY: -15
            })
          });
        }
      });
      
      // Xaritani yaratish
      map = new Map({
        target: mapRef.value,
        layers: [
          new TileLayer({
            source: new OSM()
          }),
          lineLayer,
          pointLayer
        ],
        view: new View({
          center: fromLonLat([71.80, 40.60]), // Farg'ona vodiysi markazi
          zoom: 9
        })
      });
    };
    
    const setupInteractions = () => {
      // Xaritaga bosish eventi
      map.on('click', (event) => {
        if (currentMode.value === 'add') {
          // Punkt qo'shish rejimi
          const coordinates = event.coordinate;
          const [lon, lat] = toLonLat(coordinates);
          addPoint(lon, lat);
        }
      });
      
      // Punkt tanlash interaktsiyasi
      select = new Select({
        condition: click,
        style: (feature) => {
          // Tanlangan element stili
          if (feature.getGeometry().getType() === 'Point') {
            const pointClass = feature.get('class');
            let pointColor = '#33FF57'; // 3-klass
            
            if (pointClass === 1) {
              pointColor = '#FF5733';
            } else if (pointClass === 2) {
              pointColor = '#33A8FF';
            }
            
            return new Style({
              image: new Circle({
                radius: 12,
                fill: new Fill({ color: pointColor }),
                stroke: new Stroke({ color: '#ffff00', width: 3 })
              }),
              text: new Text({
                text: feature.get('name'),
                font: 'bold 14px Calibri,sans-serif',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 3 }),
                offsetY: -18
              })
            });
          }
          
          // Tanlangan liniya stili
          return new Style({
            stroke: new Stroke({
              color: '#ffff00',
              width: 4
            })
          });
        }
      });
      
      map.addInteraction(select);
      
      // Tanlash eventi
      select.on('select', (e) => {
        if (e.selected.length > 0) {
          const selectedFeature = e.selected[0];
          
          if (currentMode.value === 'connect') {
            // Liniya chizish rejimi
            if (selectedFeature.getGeometry().getType() === 'Point') {
              handlePointSelection(selectedFeature);
            }
          } else if (currentMode.value === 'delete') {
            // O'chirish rejimi
            if (selectedFeature.getGeometry().getType() === 'Point') {
              deletePoint(selectedFeature);
            } else {
              deleteLine(selectedFeature);
            }
          } else {
            // Oddiy tanlash rejimi
            if (selectedFeature.getGeometry().getType() === 'Point') {
              const id = selectedFeature.get('id');
              const point = points.find(p => p.id === id);
              if (point) {
                selectedPoint.value = point;
              }
            } else {
              selectedPoint.value = null;
            }
          }
        } else {
          selectedPoint.value = null;
        }
      });
    };
    
    // Punkt qo'shish
    const addPoint = (lon, lat) => {
      const id = points.length + 1;
      const name = `T-${id}`;
      const pointClass = parseInt(currentClass.value);
      
      const point = {
        id,
        lon,
        lat,
        name,
        class: pointClass
      };
      
      points.push(point);
      
      const feature = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
        id,
        name,
        class: pointClass
      });
      
      pointSource.addFeature(feature);
      
      // Yangi punkt tanlangan bo'lsin
      selectedPoint.value = point;
    };
    
    // Punktni o'chirish
    const deletePoint = (feature) => {
      const id = feature.get('id');
      
      // Punktni o'chirish
      const index = points.findIndex(p => p.id === id);
      if (index !== -1) {
        points.splice(index, 1);
      }
      
      // Punktga bog'liq liniyalarni topish va o'chirish
      const connectedLines = lineSource.getFeatures().filter(lineFeature => {
        return lineFeature.get('fromId') === id || lineFeature.get('toId') === id;
      });
      
      connectedLines.forEach(lineFeature => {
        const fromId = lineFeature.get('fromId');
        const toId = lineFeature.get('toId');
        
        const lineIndex = lines.findIndex(l => 
          (l.fromId === fromId && l.toId === toId) || 
          (l.fromId === toId && l.toId === fromId)
        );
        
        if (lineIndex !== -1) {
          lines.splice(lineIndex, 1);
        }
        
        lineSource.removeFeature(lineFeature);
      });
      
      // Punktni o'chirish
      pointSource.removeFeature(feature);
      
      // Tanlangan punktni tozalash
      selectedPoint.value = null;
    };
    
    // Liniyani o'chirish
    const deleteLine = (feature) => {
      const fromId = feature.get('fromId');
      const toId = feature.get('toId');
      
      // Liniyani o'chirish
      const index = lines.findIndex(l => 
        (l.fromId === fromId && l.toId === toId) || 
        (l.fromId === toId && l.toId === fromId)
      );
      
      if (index !== -1) {
        lines.splice(index, 1);
      }
      
      // Liniya featureni o'chirish
      lineSource.removeFeature(feature);
    };
    
    // Rejimni o'zgartirish
    const setMode = (mode) => {
      currentMode.value = mode;
      selectedPoints.length = 0; // Tanlangan punktlarni tozalash
    };
    
    // Punkt tanlash (liniya chizish uchun)
    const handlePointSelection = (feature) => {
      const id = feature.get('id');
      const pointClass = feature.get('class');
      
      // Tanlangan punkt massiviga qo'shish
      selectedPoints.push({
        id,
        class: pointClass
      });
      
      // Agar ikki punkt tanlangan bo'lsa, ular orasida liniya chizish
      if (selectedPoints.length === 2) {
        const fromId = selectedPoints[0].id;
        const toId = selectedPoints[1].id;
        const fromClass = selectedPoints[0].class;
        const toClass = selectedPoints[1].class;
        
        // Agar shu punktlar orasida liniya bo'lmasa, yangi liniya qo'shish
        const existingLine = lines.find(l => 
          (l.fromId === fromId && l.toId === toId) || 
          (l.fromId === toId && l.toId === fromId)
        );
        
        if (!existingLine) {
          addLine(fromId, toId, fromClass, toClass);
        }
        
        // Tanlovni tozalash
        selectedPoints.length = 0;
      }
    };
    
    // Liniya qo'shish
    const addLine = (fromId, toId, fromClass, toClass) => {
      // Punktlarni topish
      const fromPoint = points.find(p => p.id === fromId);
      const toPoint = points.find(p => p.id === toId);
      
      if (fromPoint && toPoint) {
        // Liniyani ma'lumotlar massiviga qo'shish
        lines.push({
          fromId,
          toId,
          fromClass,
          toClass
        });
        
        // Liniya featureni yaratish
        const lineFeature = new Feature({
          geometry: new LineString([
            fromLonLat([fromPoint.lon, fromPoint.lat]),
            fromLonLat([toPoint.lon, toPoint.lat])
          ]),
          fromId,
          toId,
          fromClass,
          toClass
        });
        
        // Liniyani sourceiga qo'shish
        lineSource.addFeature(lineFeature);
      }
    };
    
    // Avtomatik triangulatsiya yaratish
    const generateTriangulation = () => {
      if (points.length < 3) {
        alert('Triangulatsiya uchun kamida 3ta punkt kerak!');
        return;
      }
      
      // Mavjud liniyalarni tozalash
      lineSource.clear();
      lines.length = 0;
      
      // Oddiy triangulatsiya: har bir punktni boshqalari bilan bog'lash
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const fromId = points[i].id;
          const toId = points[j].id;
          const fromClass = points[i].class;
          const toClass = points[j].class;
          
          // Delaunay triangulatsiyasi yoki boshqa algoritmlar qo'llanishi mumkin,
          // hozircha oddiy usul bilan har bir punktni eng yaqin 3ta punktga bog'laymiz
          
          // O'rtadagi masofa 
          const dist = Math.sqrt(
            Math.pow(points[i].lon - points[j].lon, 2) + 
            Math.pow(points[i].lat - points[j].lat, 2)
          );
          
          // Eng yaqin punktlarni bog'lash
          if (dist < 0.5) { // 0.5 gradus = taxminan 50km
            addLine(fromId, toId, fromClass, toClass);
          }
        }
      }
    };
    
    // Hammasini tozalash
    const clearAll = () => {
      pointSource.clear();
      lineSource.clear();
      points.length = 0;
      lines.length = 0;
      selectedPoint.value = null;
    };
    
    return {
      mapRef,
      currentMode,
      currentClass,
      selectedPoint,
      setMode,
      generateTriangulation,
      clearAll
    };
  }
};
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 600px;
  display: flex;
}

.map {
  flex: 1;
  height: 100%;
}

.tools {
  width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tool-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-controls {
  display: flex;
  gap: 5px;
}

.mode-controls button {
  flex: 1;
  padding: 8px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.mode-controls button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #2E7D32;
}

.point-class {
  display: flex;
  align-items: center;
  gap: 10px;
}

.point-class select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.action-button {
  padding: 10px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 5px;
}

.action-button.danger {
  background-color: #F44336;
}

.action-button:hover {
  opacity: 0.9;
}

.help-text {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.point-info {
  background-color: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
}

.point-info h4 {
  margin-top: 0;
  margin-bottom: 8px;
}

.point-info p {
  margin: 4px 0;
}

.legend {
  margin-top: auto;
  border-top: 1px solid #ddd;
  padding-top: 10px;
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

h3 {
  margin-top: 0;
  margin-bottom: 15px;
}
</style>