# -*- coding: utf-8 -*-

import xml.etree.ElementTree as ET
import pandas as pd
import requests
import arcpy
import os

class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the name of the toolbox is the name of the
        .pyt file)."""
        self.label = "Planet Hosted Data Toolbox"
        self.alias = "Planet Hosted Data Toolbox"

        # List of tool classes associated with this toolbox
        self.tools = [Access_Hosted_Data]


class Access_Hosted_Data(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Add Hosted Data to Map"
        self.description = "Search your Planet account for Hosted Data to add to your ArcGIS Pro maps."
        self.canRunInBackground = False

        # Store Planet variables
        # First,set your Planet API key in your computers environmental variables (safer) or hard code api key here (less safe)
        self.api_key = os.getenv("PL_API_KEY")
        self.hosted_data_url = "https://api.planet.com/hosted-data/v1/folders"

        session = requests.Session()
        session.auth = (self.api_key, "")
        self.session = session

    def getParameterInfo(self):
        """Define parameter definitions"""

        # Parameter to select from all folders you have access to
        param0 = arcpy.Parameter(
            displayName="Select a Folder",
            name="folder",
            datatype="GPString",
            parameterType="Required",
            direction="Input")

        # Get a list of all folders that you have access to 
        folders_resp = self.session.get(self.hosted_data_url)
        list_of_folders = [i["name"] for i in folders_resp.json()["folders"]]

        # Update the list used in the parameter drop down with the list of folders
        param0.filter.type = "ValueList"
        param0.filter.list = list_of_folders

        # Parameter to select from dates available in the folder
        param1 = arcpy.Parameter(
            displayName="Collection",
            name="collection",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        param1.filter.type = "ValueList"

        # Parameter to select a renderer
        param2 = arcpy.Parameter(
            displayName="Renderer",
            name="render",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        param2.filter.type = "ValueList"
        param2.filter.list = ["mtvi2", "msavi2", "vari", "ndwi", "ndvi", "cir"]

        params = [param0, param1, param2]
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        #if the first parameter is not empty/has been selected by the user
        if parameters[0].altered:
            
            #get all of the folders
            folders_resp = self.session.get(self.hosted_data_url)

            #get the folder ID associated with the name of the folder selected by the users
            folder_id = [i["id"] for i in folders_resp.json()["folders"] if i["name"] == parameters[0].valueAsText][0]

            #create wmts url
            wmts_url = "https://api.planet.com/hosted-data/tiles/folders/" + folder_id + "/wmts?api_key=" + self.api_key + "&group=date"

            #get wmts
            wmts_xml = self.session.get(wmts_url).text

            #parse xml
            root = ET.fromstring(wmts_xml)
            contents = root.findall('{http://www.opengis.net/wmts/1.0}Contents')[0]
            layers = contents.findall('{http://www.opengis.net/wmts/1.0}Layer')
            list_of_dates = [layer.findall('{http://www.opengis.net/ows/1.1}Title')[0].text.split(':')[-1].split('-')[0] for layer in layers]

            #update the dropdown for the second parameter to show the available dates
            parameters[1].filter.type = "ValueList"
            parameters[1].filter.list = list_of_dates

        
        return(parameters)

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""

        #Create an XYZ service URL and add to the map

        #get all of the folders
        folders_resp = self.session.get(self.hosted_data_url)

        #get the folder ID associated with the name of the folder selected by the users
        folder_id = [i["id"] for i in folders_resp.json()["folders"] if i["name"] == parameters[0].valueAsText][0]

        #create wmts url
        wmts_url = "https://api.planet.com/hosted-data/tiles/folders/" + folder_id + "/wmts?api_key=" + self.api_key + "&group=date"

        #get wmts
        wmts_xml = self.session.get(wmts_url).text

        #parse xml
        root = ET.fromstring(wmts_xml)
        contents = root.findall('{http://www.opengis.net/wmts/1.0}Contents')[0]
        layers = contents.findall('{http://www.opengis.net/wmts/1.0}Layer')

        xyz_service = [layer.findall('{http://www.opengis.net/wmts/1.0}ResourceURL')[0].attrib["template"] for layer in layers if layer.findall('{http://www.opengis.net/ows/1.1}Title')[0].text.split(':')[-1].split('-')[0] == parameters[1].valueAsText][0]
        xyz_service = xyz_service.replace("TileMatrix", "z")
        xyz_service = xyz_service.replace("TileCol", "x")
        xyz_service = xyz_service.replace("TileRow", "y")
        xyz_service = xyz_service + '?api_key=' + self.api_key
        
        # optionally add a renderer
        if parameters[2].valueAsText:
            xyz_service = xyz_service + '&proc=' + parameters[2].valueAsText

        # add a message for the xyz service url
        messages.addMessage(xyz_service)

        # adds to the first map in the project and does not zoom, in future let user select which map to add to
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        m = aprx.listMaps()[0]
        m.addDataFromPath(xyz_service)
        
        return

    def postExecute(self, parameters):
        """This method takes place after outputs are processed and
        added to the display."""
        return
