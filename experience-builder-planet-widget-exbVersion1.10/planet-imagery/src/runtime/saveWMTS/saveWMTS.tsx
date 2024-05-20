// saveWMTS.tsx

import { useState, useEffect } from 'react';
import esriRequest from 'esri/request';
import Button from '@mui/material/Button';
import template from './templateWMTSDefinition.json';
import { React } from 'jimu-core'
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';

interface SaveWMTSProps {
    selectedDate: Date;
    selectedLayer: string;
    getMapExtent: (wkid?: number) => any;
    configurationID: string;
    wmtsLayers: any;
    getEsriCredentials: () => any;
}


const SaveWMTS: React.FC<SaveWMTSProps> = ({ selectedDate, selectedLayer, getMapExtent, configurationID, wmtsLayers, getEsriCredentials }) => {
    const [wmtsDefinition, setWmtsDefinition] = useState<any | null>(null);
    const [open, setOpen] = React.useState(false);
    const [name, setName] = useState('');
    const [validName, setValidName] = useState(null);
    const [itemId, setItemId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const checkLayerName = async (layerName, token, portalUrl, user) => {
        const baseUrl = `${portalUrl}/sharing/rest/search`;
        const queryParams = [
            `token=${encodeURIComponent(token)}`,
            `f=json`,
            `filter=title: "${layerName}" AND type: "WMTS" AND owner: "${user.username}" AND ownerfolder: "root"`,
            `num=1`
        ];
        const queryString = queryParams.join('&');
        const url = `${baseUrl}?${queryString}`;

        const options = {
            responseType: "json" as const,
            method: "auto" as const,
        };

        try {
            const response = await esriRequest(url, options);
            console.log(response);
            if (response.data.total === 0) {
                setValidName(true);
                return true;
            } else {
                setValidName(false);
                return false;
            }
        } catch (error) {
            console.error('Error fetching layers:', error);
            throw error;
        }
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setName(null);
        setWmtsDefinition(null);
        setValidName(null);
        setOpen(false);
        setErrorMessage(null);
        setItemId(null);
    };

    const handleSave = async (layerName) => {
        const { token, portalUrl, user, savePermission } = getEsriCredentials();
        const layerNameValid = await checkLayerName(layerName, token, portalUrl, user);

        if (layerNameValid) {
            setValidName(true);
            const wmtsDefinition = await createWmtsDefinition();
            const response = await postSaveLayer(wmtsDefinition);

            if (response.data && response.data.id) {
                setItemId(response.data.id);
            } else {
                setErrorMessage('Failed to save layer. No item ID returned.');
            }
        } else {
            setValidName(false);
            return false;
        }
    };

    const createWmtsDefinition = async () => {
        const extent = getMapExtent();

        const newWmtsDefinition = {
            ...template,
            templateUrl: template.templateUrl
                .replace('${configuration_id}', configurationID)
                .replace('${selectedLayer}', selectedLayer),
            wmtsInfo: {
                ...template.wmtsInfo,
                url: template.wmtsInfo.url.replace('${configuration_id}', configurationID),
                customLayerParameters: wmtsLayers[0].customLayerParameters,
            },
            fullExtent: {
                ...template.fullExtent,
                ymax: extent.ymax,
                ymin: extent.ymin,
                xmax: extent.xmax,
                xmin: extent.xmin,
            },
        };
        return newWmtsDefinition;
    };

    const postSaveLayer = async (wmtsDefinition: any) => {
        const { token, portalUrl, user, savePermission } = getEsriCredentials();
        const url = `${portalUrl}/sharing/rest/content/users/${user.username}/addItem`;
        const extent4326 = getMapExtent(4326)

        const formData = new FormData();
        formData.append('f', 'json');
        formData.append('token', token);
        formData.append('text', JSON.stringify(wmtsDefinition));
        formData.append('url', `https://services.sentinel-hub.com/ogc/wmts/${configurationID}`);
        formData.append('title', name);
        formData.append('type', 'WMTS');
        formData.append('tags', 'WMTS, Planet Labs, Sentinel Hub');
        // formData.append('snippet', 'test');
        formData.append('extent', `${extent4326.xmin},${extent4326.ymin},${extent4326.xmax},${extent4326.ymax}`);

        const options = {
            method: 'post' as const,
            body: formData,
            responseType: 'json' as const,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        try {
            const response = await esriRequest(url, options);
            if (response.data.success) {
                console.log('Item added successfully:', response.data);
                return response
            } else {
                console.error('Error adding item:', response.data.error.message);
                return response
            }
        } catch (error) {
            console.error('Error submitting JSON payload:', error);
        }
    };

    const handleInputChange = (event) => {
        setName(event.target.value);
        if (validName === false) {
            setValidName(null);
        }
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Save Layer
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries((formData as any).entries());
                        const layerName = formJson.name;
                        handleSave(layerName);
                    },
                }}
            >
                <DialogTitle>Save Layer</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will save the current layer configuration to your content with the map extent, renderer, and data filter.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="name"
                        name="name"
                        label="Layer Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={handleInputChange}
                    />
                    {validName === false && (
                        <Alert severity="error">
                            The name is already taken. Please choose a different name.
                        </Alert>
                    )}
                    {errorMessage === false && (
                        <Alert severity="error">
                            ${errorMessage}
                        </Alert>
                    )}
                    {itemId && (
                        <DialogContentText>
                            <a href={`${getEsriCredentials().portalUrl}/home/item.html?id=${itemId}`} target="_blank" rel="noopener noreferrer">Open the item in your content</a>
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button type="submit">Save</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
export default SaveWMTS;