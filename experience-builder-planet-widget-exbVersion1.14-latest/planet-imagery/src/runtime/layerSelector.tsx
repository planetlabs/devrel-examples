import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import esriRequest from 'esri/request';

/**
 *  Parses the list object into a more useable format
 *  @param {object} layersResponse Object that contains the list of layers from the WMS endpoint
 *  @returns {object} An object that contains the important details for each layer
 */
const parseLayers = (layersResponse) => {
  return layersResponse.map(layer => ({
    title: layer.title,
    id: layer.id,
    description: layer.description,
    collectionId: layer.datasourceDefaults.collectionId
  }));
};

/**
*  Gets the list of layers for a Sentinel Hub configuration specified in the widget configuration 
*  @param {string} accessToken A Sentinel Hub access token
*  @param {string} configurationID Sentinel Hub Configuration ID as supplied in the widget configuration 
*  @returns {string} An object that contains the important details for each layer
*/
const getLayers = async (accessToken, configurationID) => {
  const url = `https://services.sentinel-hub.com/configuration/v1/wms/instances/${configurationID}/layers`;

  const options = {
    responseType: "json" as const,
    method: "auto" as const,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await esriRequest(url, options);
    const layers = parseLayers(response.data)
    return layers;
  } catch (error) {
    console.error('Error fetching layers:', error);
    throw error;
  }
};

/**
*  Component that allows the user to select a layer to display on the map 
*  @param {string} selectedLayer The actively selected layer or null state
*  @param {string} accessToken Sentinel Hub access token 
*  @param {string} configurationID Sentinel Hub Configuration ID as supplied in the widget configuration
*  @param {string} onLayerChange Function to update the map and states for user layer selection
*/
function LayerSelector({ selectedLayer, accessToken, configurationID, onLayerChange }) {

  // Create a state for an array to store the available layers from the configuration  
  const [layers, setLayers] = useState([]);

  // When accessToken and configurationID become available, get the available layers and set the state 
  useEffect(() => {
    const fetchLayers = async () => {
      if (accessToken && configurationID) {
        try {
          const layersData = await getLayers(accessToken, configurationID);
          setLayers(layersData);
        } catch (error) {
          console.error('Error fetching layers:', error);
        }
      } else {
        return
      }
    };
    fetchLayers();
  }, [accessToken, configurationID]);


  return (
    <FormControl variant="outlined" style={{ width: '200px', marginRight: '30px' }}>
      <InputLabel id="demo-simple-select-outlined-label">Renderer</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={selectedLayer}
        onChange={(event) => onLayerChange(event)}
        label="Choice"
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {layers.map((layer, index) => (
          <MenuItem key={index} value={layer.id}>
            {layer.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default LayerSelector;
