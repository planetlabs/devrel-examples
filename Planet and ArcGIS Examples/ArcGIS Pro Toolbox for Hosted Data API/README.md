# Planet Hosted Data API ArcGIS Toolbox Example

This code sample is for an ArcGIS Pro Python Toolbox that enables you to interact with Planet's Hosted Data API.  Using the tool in this toolbox, you can explore data available in your Hosted Data folders and add them as XYZ services to your ArcGIS Pro maps. You must select a date for which data is available and you also have the option to select from different rendering options.

## Set up instructions

1. Download or clone this repository to your desktop
2. Follow one of the following steps to add your API key to the toolbox.
    1. (Recommended) Create an environmental variable called "PL_API_Key" and store your Planet API Key there (requires a computer restart)
    2. Edit the .pyt file in a text editor and hardcode your Planet API Key as a string 
3. Ensure you have ArcGIS Pro version 3.x installed
4. In the Catalog, navigate to the folder where this repository is located
5. Find the .pyt file which will appear in the catalog as a Python Toolbox
6. Add the Python Toolbox to your project

## How to use the toolbox

Once the toolbox has been added to your project, you can open it and find a single tool called "Add Hosted Data to Map".

Simple open the tool and select from the drop downs for each variable:

1. <b>Select a Folder</b>: choose from one of your Planet Hosted Data Folders
2. <b>Collection</b>: the images in the folder are grouped by their collection date, choose from one of the available imagery dates
3. <b>Renderer</b>: leave blank for true color, or select from the dropdown for one of the support renderer (e.g. NDVI) 

## Known limitations

* The toolbox currently adds the layer to the first map in your ArcGIS Pro project
* The layer added to the map currently does not zoom to the location of the layer and the layer does not support the "zoom to layer" tool

## Disclaimer

This is not an officially supported tool, yet, and is available as part of the Hosted Data API early access program.  If you have questions or feedback, please reach out to hosted-data@planet.com.