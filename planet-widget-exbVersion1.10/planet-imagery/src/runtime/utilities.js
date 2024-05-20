import esriRequest from 'esri/request';
import Extent from "esri/geometry/Extent";

const createEsriExtent = async (boundingBoxElement) => {
  const xmax = parseFloat(boundingBoxElement.getAttribute("maxx"));
  const ymax = parseFloat(boundingBoxElement.getAttribute("maxy"));
  const xmin = parseFloat(boundingBoxElement.getAttribute("minx"));
  const ymin = parseFloat(boundingBoxElement.getAttribute("miny"));
  try {
    const extent = new Extent({
      xmax: xmax,
      ymax: ymax,
      xmin: xmin,
      ymin: ymin,
      spatialReference: { wkid: 3857 }
    });
    return extent;
  } catch (err) {
    console.error('Failed to load Extent module:', err);
    throw err;
  }
};

const getSHConfigExtent = async (configurationID) => {
  const url = `https://services.sentinel-hub.com/ogc/wms/${configurationID}?Request=GetCapabilities`
  const options = {
    responseType: "xml",
    method: "get",
  };
  try {
    const response = await esriRequest(url, options);
    const bbox = response.data.querySelector("BoundingBox[CRS='EPSG:3857']")
    const extent = createEsriExtent(bbox);
    return extent;
  } catch (error) {
    console.error('Error fetching extent:', error);
    throw error;
  }
};

const fetchToken = async (credentials) => {
  const url = 'https://services.sentinel-hub.com/oauth/token';

  const options = {
    query: {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: "client_credentials"
    },
    responseType: "json",
    method: "post"
  };
  try {
    const response = await esriRequest(url, options);
    return response.data.access_token;
  } catch (error) {
    throw error;
  }
};

function metersToDegrees(selectedFeature, meters) {

    const coords = selectedFeature.geometry.coordinates[0];
    const lats = coords.map(coord => coord[1]).sort((a, b) => a - b);
    let medianLat;
    const midIndex = Math.floor(lats.length / 2);
    if (lats.length % 2 === 0) {
        medianLat = (lats[midIndex - 1] + lats[midIndex]) / 2;
    } else {
        medianLat = lats[midIndex];
    }
    const medianLatRadians = medianLat * Math.PI / 180;
    const lengthOfDegree = 111412.84 * Math.cos(medianLatRadians) - 93.5 * Math.cos(3*medianLatRadians) + 0.118 * Math.cos(5*medianLatRadians);
    const resLat = meters / 111319;
    const resLon = meters / lengthOfDegree;
    return {
        resy: resLat,
        resx: resLon
    };
}

export { getSHConfigExtent, fetchToken, metersToDegrees };