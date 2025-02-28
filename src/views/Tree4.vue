<template>
   <div>
      <div ref="mapContainer" style="width: 100%; height: 500px;"></div>
      <div>
        <h3>Selected Points:</h3>
        <ul>
          <li v-for="(point, index) in points" :key="index">
            {{ point }}
          </li>
        </ul>
      </div>
    </div>
</template>


<script>
  import { defineComponent, ref, onMounted } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

export default defineComponent({
  setup() {
    const mapContainer = ref(null);
    const points = ref([]);
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    onMounted(() => {
      const map = new Map({
        target: mapContainer.value,
        layers: [
          new TileLayer({ source: new OSM() }),
          vectorLayer
        ],
        view: new View({
          center: [0, 0],
          zoom: 2
        })
      });

      map.on('click', (event) => {
        const coord = event.coordinate;
        addPoint(coord);
      });
    });

    function addPoint(coord) {
      const pointFeature = new Feature(new Point(coord));
      pointFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: 'blue' }),
            stroke: new Stroke({ color: 'white', width: 2 })
          })
        })
      );
      vectorSource.addFeature(pointFeature);
      points.value.push(coord);
    }

    return { mapContainer, points };
  },

});

</script>