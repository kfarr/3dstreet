import { useState, useCallback, useEffect } from 'react';
import { SavingModal } from '../SavingModal';

import styles from './GeoModal.module.scss';
import { Mangnifier20Icon, Save24Icon, QR32Icon } from '../../../icons';

import { httpsCallable } from 'firebase/functions';
import { firebaseConfig, functions } from '../../../services/firebase.js';
import Modal from '../Modal.jsx';
import { Button, Input } from '../../components/index.js';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete
} from '@react-google-maps/api';
import GeoImg from '../../../../../ui_assets/geo.png';
import { roundCoord } from '../../../../../src/utils.js';
import { QrCode } from '../../components/QrCode';

const GeoModal = ({ isOpen, onClose }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: firebaseConfig.apiKey
  });

  const [markerPosition, setMarkerPosition] = useState({
    lat: 37.7637072, // lat: 37.76370724481858, lng: -122.41517686259827
    lng: -122.4151768
  });
  const [autocomplete, setAutocomplete] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const streetGeo = document
        .getElementById('reference-layers')
        ?.getAttribute('street-geo');

      if (streetGeo && streetGeo['latitude'] && streetGeo['longitude']) {
        const lat = roundCoord(parseFloat(streetGeo['latitude']));
        const lng = roundCoord(parseFloat(streetGeo['longitude']));

        if (!isNaN(lat) && !isNaN(lng)) {
          setMarkerPosition({ lat, lng });
        }
      }
    }
  }, [isOpen]);

  const requestAndSetElevation = async (lat, lng) => {
    try {
      const getGeoidHeight = httpsCallable(functions, 'getGeoidHeight');
      const result = await getGeoidHeight({ lat: lat, lon: lng });
      return result.data;
    } catch (error) {
      console.error(error.code, error.message, error.details);
      return null;
    }
  };

  const setMarkerPositionAndElevation = useCallback((lat, lng) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setMarkerPosition({
        lat: roundCoord(lat),
        lng: roundCoord(lng)
      });
    }
  }, []);

  const onMapClick = useCallback((event) => {
    setMarkerPositionAndElevation(event.latLng.lat(), event.latLng.lng());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCoordinateChange = (value) => {
    const [newLat, newLng] = value
      .split(',')
      .map((coord) => parseFloat(coord.trim()));

    setMarkerPositionAndElevation(newLat, newLng);
  };

  const onAutocompleteLoad = useCallback((autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.geometry) {
        setMarkerPositionAndElevation(
          place.geometry.location.lat(),
          place.geometry.location.lng()
        );
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  }, [autocomplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCloseCheck = (evt) => {
    // do not close geoModal when clicking on a list with suggestions for addresses
    const autocompleteContatiner = document.querySelector('.pac-container');
    if (autocompleteContatiner.children.length === 0) {
      onClose();
    }
  };

  const onQRHandler = () => {
    let currentSceneId = STREET.utils.getCurrentSceneId();
    const PROTOCOL = 'https://';
    const HOSTNAME = window.location.host; // such as 'dev-3dstreet.web.app'
    const QUERYSTRING = '?viewer=ar';
    const HASH = '#/scenes/' + currentSceneId + '.json';
    const AR_URL = PROTOCOL + HOSTNAME + QUERYSTRING + HASH;
    const APPCLIP_PREFIX = 'https://launchar.app/l/gy8Ma2?url='; // via https://launchar.app/projects/
    const APPCLIP_URL = APPCLIP_PREFIX + encodeURIComponent(AR_URL);
    setQrCodeUrl(APPCLIP_URL);
    setTimeout(
      () =>
        document
          .getElementById('qrCodeContainer')
          ?.scrollIntoView({ behavior: 'smooth' }),
      100
    );
  };

  const onSaveHandler = async () => {
    setIsWorking(true);
    const latitude = markerPosition.lat;
    const longitude = markerPosition.lng;
    const data = await requestAndSetElevation(latitude, longitude);

    if (data) {
      console.log(`latitude: ${latitude}, longitude: ${longitude}`);
      console.log(`elevation: ${data.ellipsoidalHeight}`);

      const geoLayer = document.getElementById('reference-layers');
      AFRAME.INSPECTOR.execute(
        geoLayer.hasAttribute('street-geo') ? 'entityupdate' : 'componentadd',
        {
          entity: geoLayer,
          component: 'street-geo',
          value: {
            latitude: latitude,
            longitude: longitude,
            ellipsoidalHeight: data.ellipsoidalHeight,
            orthometricHeight: data.orthometricHeight,
            geoidHeight: data.geoidHeight
          }
        }
      );
    }

    setIsWorking(false);
    onClose();
  };

  return (
    <>
      <Modal
        className={styles.modalWrapper}
        isOpen={isOpen}
        onClose={onCloseCheck}
      >
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <img src={GeoImg} alt="geo" style={{ objectFit: 'contain' }} />
            <h3>Scene Location</h3>
            <p className={styles.badge}>Pro</p>
          </div>
          {isLoaded && (
            <>
              <GoogleMap
                mapContainerStyle={{
                  width: '100%',
                  minHeight: '200px',
                  borderRadius: 4,
                  border: '1px solid #8965EF'
                }}
                center={{ lat: markerPosition.lat, lng: markerPosition.lng }}
                zoom={20}
                onClick={onMapClick}
                options={{ streetViewControl: false, mapTypeId: 'satellite' }}
                tilt={0}
              >
                <Marker
                  position={{
                    lat: markerPosition.lat,
                    lng: markerPosition.lng
                  }}
                />
              </GoogleMap>
            </>
          )}
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <Input
              leadingIcon={<Mangnifier20Icon />}
              placeholder="Search for a location"
              onChange={(value) => {}}
            />
          </Autocomplete>
          <div className={styles.sceneGeo}>
            <div>
              <p>Centerpoint</p>
              <Input
                leadingIcon={<p className={styles.iconGeo}>Lat, Long</p>}
                value={`${markerPosition.lat}, ${markerPosition.lng}`}
                placeholder="None"
                onChange={handleCoordinateChange}
              ></Input>
            </div>
          </div>

          {qrCodeUrl && (
            <div className={styles.qrCodeContainer} id="qrCodeContainer">
              <QrCode url={qrCodeUrl} />
              <div>Click on the QR Code to download it</div>
            </div>
          )}

          <div className={styles.controlButtons}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {!qrCodeUrl && (
              <Button
                leadingIcon={<QR32Icon />}
                variant="filled"
                onClick={onQRHandler}
              >
                Create Augmented Reality QR Code
              </Button>
            )}
            <Button
              leadingIcon={<Save24Icon />}
              variant="filled"
              onClick={onSaveHandler}
            >
              Update Scene Location
            </Button>
          </div>
        </div>
      </Modal>
      {isWorking && <SavingModal action="Working" />}
    </>
  );
};

export { GeoModal };
