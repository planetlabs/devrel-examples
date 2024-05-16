import { React, type AllWidgetProps } from 'jimu-core'
import {
  loadArcGISJSAPIModules,
  JimuMapViewComponent,
  type JimuMapView
} from 'jimu-arcgis'
import { FeatureLayerZoomToOutlined } from 'jimu-icons/outlined/gis/feature-layer-zoom-to'
import { Button } from 'jimu-ui';
import { getSHConfigExtent, fetchToken } from './utilities';
import * as projection from 'esri/geometry/projection';
import SpatialReference from 'esri/geometry/SpatialReference';

// Components
import DateSelector from './dateSelector';
import LayerSelector from './layerSelector';


interface State {
  accessToken: string | null;
  availableDates: string[];
  wmtsLayers: __esri.Layer[];
  selectedLayer: string;
  selectedDate: Date;
  layerOptions: { title: string; id: string; description: string; collectionId: string }[];
  WMTSError: string;
  configurationExtent: __esri.Extent;
}

export default class Widget extends React.PureComponent<AllWidgetProps<unknown>, State> {
  tokenRefreshInterval: NodeJS.Timeout | null = null;
  WMTSLayer: typeof __esri.WMTSLayer;
  jimuMapView: JimuMapView;
  wmtsLayer: __esri.Layer;

  state: State = {
    accessToken: null,
    availableDates: [],
    wmtsLayers: [],
    selectedLayer: "",
    selectedDate: null,
    layerOptions: [],
    WMTSError: null,
    configurationExtent: null,
  };


  constructor(props) {
    super(props);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleLayerChange = this.handleLayerChange.bind(this);
  }

  loadModules = async () => {
    [this.WMTSLayer] = await loadArcGISJSAPIModules(['esri/layers/WMTSLayer']);
  };

  async componentDidMount() {
    await this.loadModules();
    await this.fetchAndSetToken();
    this.tokenRefreshInterval = setInterval(() => {
      this.fetchAndSetToken();
    }, 3600000);
  }

  isConfigured = () => {
    return this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
  }

  componentWillUnmount() {
    clearInterval(this.tokenRefreshInterval);
  }

  fetchAndSetToken = async () => {
    const credentials = {
      client_id: this.props.config.clientID,
      client_secret: this.props.config.clientSecret
    };

    try {
      const token = await fetchToken(credentials);
      this.setState({ accessToken: token });
      return token; // Return the token for further use
    } catch (error) {
      console.error("Error fetching token:", error);
      return null; // Return null in case of an error
    }
  };

  handleLayerChange = (event) => {

    const newLayer = event.target.value;
    this.setState({ selectedLayer: newLayer });

    if (this.state.selectedDate && newLayer) {
      const isoString = this.state.selectedDate.toISOString().split('T')[0];
      this.addWMTSLayer(this.createWmts(isoString, newLayer));
    }

  };

  handleDateChange = (newDate) => {  

    if (newDate) {
      const isoString = newDate.toISOString().split('T')[0];
      this.setState({ selectedDate: newDate });

      if (this.state.selectedLayer) {
        this.addWMTSLayer(this.createWmts(isoString, this.state.selectedLayer));
      } else {
        console.log("No valid layer selected.")
      }
    } else {
      console.log("No valid date selected.")
      this.setState({ selectedDate: null });
    }
  };
  

  // Set the map extent to match the configuration extent
  fetchAndSetConfigurationExtent = async (token) => {
    if (token && this.props.config.configurationID) {
      try {
        const configurationExtent = await getSHConfigExtent(this.props.config.configurationID);
        this.setState({ configurationExtent: configurationExtent });

        if (this.jimuMapView && this.jimuMapView.view) {
          this.jimuMapView.view.goTo(configurationExtent);
        }

      } catch (error) {
        console.error('Error fetching extent data:', error);
      }
    } else {
      console.error('Access token or configuration ID is missing');
    }
  };

  // Function to generate WMTS layer based on date
  createWmts = (inDate: string, inLayer: string): __esri.WMTSLayer => {

    const Layer = inLayer;

    const baseUrl = "https://services.sentinel-hub.com/ogc/wmts";
    const configuration_id = this.props.config.configurationID;
    const wmtsUrl = `${baseUrl}/${configuration_id}`

    const customParams = {
      "TIME": `${inDate}/${inDate}`,
      "LAYER": Layer,
      "transparent": "true"
    };

    const layer = new this.WMTSLayer({
      url: wmtsUrl,
      customLayerParameters: customParams
    });

    return layer;
  };

  addWMTSLayer = (layer: __esri.WMTSLayer) => {
    if (!this.jimuMapView) {
      console.error("Can't add WMTS Layer - Map view is not available");
      return;
    }

    // Remove any previously added WMTS layers
    this.state.wmtsLayers.forEach(layer => {
      this.jimuMapView.view.map.remove(layer);
    });

    // Reset the wmtsLayers array in the state
    this.setState({ wmtsLayers: [] });

    this.jimuMapView.view.map.add(layer);

    // Add the new layer to the wmtsLayers array in the state
    this.setState(state => ({
      wmtsLayers: [...state.wmtsLayers, layer]
    }));
  };


  getMapExtent = () => {
    const extent = this.jimuMapView.view.extent;
    const outSpatialReference = new SpatialReference({ wkid: 4326 });
    const projectedExtent = projection.project(extent, outSpatialReference);
    return projectedExtent;
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (!jimuMapView) {
      return;
    }
    this.jimuMapView = jimuMapView;
  };

  render() {

    if (!this.isConfigured()) {
      return 'Configure the widget by selecting a map first';
    }

    return (
      <div className="widget-use-map-view" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>

        <JimuMapViewComponent useMapWidgetId={this.props.useMapWidgetIds?.[0]} onActiveViewChange={this.onActiveViewChange}></JimuMapViewComponent>

        <h2>Planet Imagery</h2>
        <div>
          <LayerSelector
            selectedLayer={this.state.selectedLayer}
            accessToken={this.state.accessToken}
            configurationID={this.props.config.configurationID}
            onLayerChange={this.handleLayerChange}
          />
          <Button
            onClick={() => this.fetchAndSetConfigurationExtent(this.state.accessToken)}
            title="Zoom to Data Extent"
            className="jimu-btn"
          >
            <FeatureLayerZoomToOutlined size='m' />
          </Button>
        </div>
        <br />
        <div>
          <DateSelector
            selectedDate={this.state.selectedDate}
            accessToken={this.state.accessToken}
            handleDateChange={this.handleDateChange}
            collectionID={this.props.config.collectionID}
            getMapExtent = {this.getMapExtent}
          />
        </div>
      </div>
    )
  }
}