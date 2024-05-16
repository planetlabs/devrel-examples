import { React } from 'jimu-core'
import { DatePicker, LocalizationProvider, PickersDay} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import esriRequest from 'esri/request';
import { useState, useEffect } from 'react';
import { format  } from 'date-fns';

  /**
 *  Searches the Sentinel Hub catalog API for a given extent and month 
 *  @param monthStart the first date of the month currently in the calendar view
 *  @param extent Current map extent
 *  @param accessToken Sentinel Hub access token 
 *  @param collectionID Sentinel Hub Collection ID as supplied in the widget configuration 
 *  @returns {object} An object that contains the list of dates with available data
 */
async function getAvailableDates(monthStart, extent, accessToken, collectionID) {
    const endpoint = "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search";
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    const extent_json = extent.toJSON();
    const bbox = [extent_json.xmin, extent_json.ymin, extent_json.xmax, extent_json.ymax];

    const payload = {
        "collections": [
            `byoc-${collectionID}`
        ],
        "datetime": `${monthStart.toISOString()}/${monthEnd.toISOString()}`,
        "bbox": bbox,
        "limit": 100
    };

    const options = {
        method: "post",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        responseType: "json",
        body: JSON.stringify(payload)
    };

    try {
        const response = await esriRequest(endpoint, options);
        const timestamps = response.data.features.map(feature => feature.properties.datetime);
        const uniqueDates = [...new Set(timestamps.map(timestamp => timestamp.split('T')[0]))];
        return uniqueDates;
    } catch (error) {
        console.error('Error fetching dates:', error);
        throw error;
    }
}


/**
*  Component that allows the user to select a date to display on the map 
*  @param selectedDate The actively selected date or null state
*  @param accessToken Sentinel Hub access token 
*  @param collectionID Sentinel Hub Collection ID as supplied in the widget configuration
*  @param handleDateChange Function to update the map and states for user date selection
*  @param getMapExtent function to get the current map extent to use for searching
*/
const DateSelector = ({selectedDate, accessToken, handleDateChange, collectionID, getMapExtent }) => {

    const [availableDates, setAvailableDates] = useState([]);

    const startDate = new Date();
    
    // When colllectionID and accessToken are available, get the extent and current month and search for available data
    useEffect(() => {

        const mapExtent = getMapExtent();
        if (!mapExtent) {
            console.error("Unable to determine map extent")
            return;
        }

        // Get the start and end date for current month which initializes the date picker
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        if (accessToken && collectionID) {
            getAvailableDates(monthStart, mapExtent, accessToken, collectionID).then(dates => {
                setAvailableDates(dates);
            });
        }


    }, [accessToken, collectionID]);

    // function to search for new dates when the user changes the date picker month
    const handleMonthChange = (date) => {
        const mapExtent = getMapExtent();
        if (!mapExtent) {
            return;
        }
        const monthStart = new Date(date);
        monthStart.setDate(1);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        getAvailableDates(monthStart, mapExtent, accessToken, collectionID).then(dates => {
            setAvailableDates(dates);
        });
    }

    // Custom renderer for dates where data is available
    function CustomDay({ selectedDay, availableDates, ...other }) {
        const dateStr = format(other.day, "yyyy-MM-dd");
        const isSelected = availableDates.includes(dateStr);
        const dayStyles = {
            backgroundColor: isSelected ? "#b3e5fc" : "inherit",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        };
        return (
            <PickersDay {...other} style={dayStyles} />
        );
    }


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
                <div>
                    <DatePicker
                        label="Date"
                        onChange={(newDate) => handleDateChange(newDate)}
                        value={selectedDate}
                        onMonthChange={handleMonthChange}
                        slots={{ day: CustomDay }}
                        slotProps={{
                            textField: {
                                helperText: 'Select a date to view data',
                            },
                            day: {
                                selectedDay: startDate,
                                availableDates: availableDates
                            }
                        }}
                    />
                </div>
            </div>
        </LocalizationProvider>
    );
};


export default DateSelector