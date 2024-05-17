import { React } from 'jimu-core';
import { DatePicker, LocalizationProvider, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import esriRequest from 'esri/request';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 *  Searches the Sentinel Hub catalog API for a given extent and month 
 *  @param monthStart the first date of the month currently in the calendar view
 *  @param extent Current map extent
 *  @param accessToken Sentinel Hub access token 
 *  @param collectionID Sentinel Hub Collection ID as supplied in the widget configuration 
 *  @returns {Promise<string[]>} An object that contains the list of dates with available data
 */
async function getAvailableDates(monthStart: Date, extent: any, accessToken: string, collectionID: string): Promise<string[]> {
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
        method: "post" as const,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        responseType: "json" as const,
        body: JSON.stringify(payload)
    };

    try {
        const response = await esriRequest(endpoint, options);
        const timestamps: string[] = response.data.features.map((feature: any) => feature.properties.datetime);
        const uniqueDates: string[] = [...new Set(timestamps.map((timestamp: string) => timestamp.split('T')[0]))];
        return uniqueDates;
    } catch (error) {
        console.error('Error fetching dates:', error);
        throw error;
    }
}

interface DateSelectorProps {
    selectedDate: Date | null;
    accessToken: string;
    handleDateChange: (date: Date | null) => void;
    collectionID: string;
    getMapExtent: (wkid: number) => any;
}

interface CustomDayProps extends PickersDayProps<Date> {
    availableDates: string[];
    selectedDate: Date | null;
}

const CustomDay: React.FC<CustomDayProps> = (props) => {
    const { day, availableDates, selectedDate, ...other } = props;
    const dateStr = format(day, "yyyy-MM-dd");
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
        <PickersDay
            {...other}
            day={day}
            selected={isSelected || (selectedDate && day.getTime() === selectedDate.getTime())}
            style={dayStyles}
        />
    );
};

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, accessToken, handleDateChange, collectionID, getMapExtent }) => {
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const startDate = new Date();
    
    // When collectionID and accessToken are available, get the extent and current month and search for available data
    useEffect(() => {
        const mapExtent = getMapExtent(4326);
        if (!mapExtent) {
            console.error("Unable to determine map extent");
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

    // Function to search for new dates when the user changes the date picker month
    const handleMonthChange = (date: Date) => {
        const mapExtent = getMapExtent(4326);
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
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
                <DatePicker
                    label="Date"
                    onChange={(newDate) => handleDateChange(newDate)}
                    value={selectedDate}
                    onMonthChange={handleMonthChange}
                    slots={{ day: (dayProps) => <CustomDay {...dayProps} availableDates={availableDates} selectedDate={selectedDate} /> }}  // Use slots to pass CustomDay with availableDates and selectedDate
                    slotProps={{
                        textField: {
                            helperText: 'Select a date to view data',
                        }
                    }}
                />
            </div>
        </LocalizationProvider>
    );
};

export default DateSelector;
