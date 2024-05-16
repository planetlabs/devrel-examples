#!/bin/bash

# Navigate to the directory containing the package.json
cd exb/ArcGISExperienceBuilder/client

# Use jq to add dependencies
jq '.dependencies += {
    "@mui/material": "5.15.15",
    "@mui/x-date-pickers": "7.3.1",
    "@date-io/date-fns": "^2.14.0",
    "date-fns": "^2.28.0"
}' package.json > temp.json && mv temp.json package.json
