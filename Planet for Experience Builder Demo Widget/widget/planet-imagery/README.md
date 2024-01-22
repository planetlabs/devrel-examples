# Planet Experience Builder Demo Widget

This is a sample Experience build widget that shows how to integrate imagery from Planet APIs with ArcGIS.

This widget is powered by the [Sentinel Hub](https://sentinel-hub.com/) APIs and requires that you have both a Planet and Sentinel Hub account.  

It that allows for a user to search for and visualize imagery stored in a Sentinel Hub collection directly from within ArcGIS Experience Builder so that Planet imagery can be used in GIS workflows without needing to download any data.

## How does it work?

- Select from different imagery renderers - users can select from different layers that determine how imagery is rendered. Layers are defined in Sentinel Hub Configurations.
- See what dates imagery is available for - a calendar can be used to search for dates that can be selected to display on the map
- Stream imagery as OGC services - this code sample uses the Sentinel Hub OGC API to stream the map services in this widget from the Sentinel Hub cloud-based APIs