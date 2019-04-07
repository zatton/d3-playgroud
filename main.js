(function() {
  const map = L.map("map", { center: [35, 135], zoom: 6 });
  const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
  L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; " + mapLink + " Contributors"
  }).addTo(map);
  L.svg().addTo(map);

  let threshold = 0,
    i = 0,
    east,
    west,
    north,
    south,
    lng_per_px;

  d3.json("topo5.json", json => {
    json = topojson.presimplify(json);
    //json = topojson.simplify(json, 0.1);
    geodata = topojson.feature(json, json.objects["web"]);

    function projectPoint(x, y, z) {
      if (z >= threshold) {
        const point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }
    }
    const transform = d3.geoTransform({ point: projectPoint });
    const path = d3.geoPath().projection(transform);

    async function getMapCondition() {
      const bounds = map.getBounds();
      east = bounds.getEast();
      west = bounds.getWest();
      south = bounds.getSouth();
      north = bounds.getNorth();
      const size = map.getSize();
      lng_per_px = Math.abs(east - west) / size.x;
      threshold = Math.pow(lng_per_px, 2);
    }

    const filterPath = feature => {
      const lngExt = d3.extent(feature.geometry.coordinates, c => c[0]);
      const latExt = d3.extent(feature.geometry.coordinates, c => c[1]);
      const isInExtent =
        lngExt[0] < east &&
        lngExt[1] > west &&
        latExt[0] < north &&
        latExt[1] > south;
      if (isInExtent) i++;
      return isInExtent;
    };

    const draw = () => {
      i = 0;
      getMapCondition().then(() => {
        const svg = d3.select("svg").select("g");
        svg.selectAll("path").remove();
        svg
          .selectAll("path")
          .data(geodata.features.filter(filterPath))
          .enter()
          .append("path")
          .style("stroke", d => d.properties.color)
          .attr("d", path);
        console.log(i);
      });
    };

    map.on("zoom, moveend", draw);
    draw();
  });
})();
