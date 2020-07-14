import React from 'react';
import { PROVIDER_GOOGLE, Polyline, Marker, AnimatedRegion } from 'react-native-maps';
import { ClusterMap } from 'react-native-cluster-map';
import { Dimensions, View, Image, Platform, Text, StyleSheet } from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import googleMapConfig from '~/common/config/googleMap';
import convertUnits from 'convert-units';
import { W, H } from '~/common/constants';
import { generateColor } from '~/common/utils/gradientColor';
import defaultCurrentLocation from '~/common/config/locations';
import { openHourStatus } from '~/common/utils/time';
import { translate } from '~/common/i18n';
import moment from 'moment';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 60;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INIT_VIEW_LATITUDE_DELTA = 0.04;
const INIT_VIEW_LONGITUDE_DELTA = INIT_VIEW_LATITUDE_DELTA * ASPECT_RATIO;
const CURRENT_LOCATION_LATITUDE_DELTA = 0.0059397161733585335;
const CURRENT_LOCATION_LONGITUDE_DELTA = 0.005845874547958374; //INITI_VIEW_LATITUDE_DELTA * ASPECT_RATIO;

const INITIALIZE_REGION = {
  latitude: defaultCurrentLocation.coordinate.latitude,
  longitude: defaultCurrentLocation.coordinate.longitude,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};


const PIN_OPEN_IMAGE = require('~/common/assets/images/png/pin-open.png');
const PIN_CLOSE_IMAGE = require('~/common/assets/images/png/pin-close.png');
const PIN_SELECT_IMAGE = require('~/common/assets/images/png/pin-select.png');
const CURRENT_LOCATION_IMAGE = require('~/common/assets/images/png/currentLocation.png');

export default class ClusterMapView extends React.Component {
  state = {
    mapView: null,
    directionCoordinates: [],
    degree: 0,
    currentLocation: this.props.currentLocation
  }

  onMapReady = (coordinate) => {
    this.mapView.mapRef.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: INIT_VIEW_LATITUDE_DELTA,
      longitudeDelta: INIT_VIEW_LONGITUDE_DELTA
    });  
  };

  onGoToLocation = (coordinate) => {
    this.mapView.mapRef.animateToRegion({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: CURRENT_LOCATION_LATITUDE_DELTA,
      longitudeDelta: CURRENT_LOCATION_LONGITUDE_DELTA
    });  
  };

  renderMarkers = () => {
    const { places, selectedPlace } = this.props;
    // const currentLocation = this.state.currentLocation;
    const selectedIndex = places.findIndex(p => {
        return selectedPlace && p.name === selectedPlace.name
      });
    var placeImage = PIN_OPEN_IMAGE;
    var markers = [];
    if (places) {
      Object.keys(places).map((key, index) => {
        const place = places[key];
        if(place && place.coordinate) {
          if (selectedPlace && (key === `${selectedIndex}`)) placeImage = PIN_SELECT_IMAGE;
          else {
            // placeImage = place.isOpened ? PIN_OPEN_IMAGE : PIN_CLOSE_IMAGE;
            if (place.openHours) {
              // const currentWeekDay = translate(moment().format('dddd'), 'fr');
              const hourStatus = openHourStatus(place.openHours);
              placeImage = hourStatus.openStatus ? PIN_OPEN_IMAGE : PIN_CLOSE_IMAGE;
            } else {
              placeImage = PIN_CLOSE_IMAGE;
            }
          };
          markers.push(
            <Marker
              key={`station-${index}`}
              coordinate={place.coordinate}
              onPress={() => this.props.onSelectMarker(key)}
            >
              <Image source={placeImage} style={{width: 40, height: 40}}/>
            </Marker>
          );
        }
      })
    };
    return markers;
  };

  calculateDegree = (l1, l2) => {
    x = l2.latitude - l1.latitude;
    y = l2.longitude - l1.longitude;
    return Math.atan2(y, x) * 180 / Math.PI + 90;
  };

  onUserLocationChange = async (currLoc) => {
    console.log('====== onUserLocationChange: currLoc: ', currLoc.nativeEvent);
    if (currLoc.nativeEvent && currLoc.nativeEvent.coordinate) {
      const { onDetectCurrentLocation } = this.props;
      onDetectCurrentLocation && onDetectCurrentLocation(currLoc.nativeEvent.coordinate);
      this.setState({currentLocation: {coordinate: currLoc.nativeEvent.coordinate}})
    }
  };

  renderCurrentLocationMarker = () => {
    const currentLocation = this.state.currentLocation;
    const { directionCoordinates } = this.state;
    // const degree = (directionCoordinates.length > 2)
    //   ? this.calculateDegree(directionCoordinates[0], directionCoordinates[1])
    //   : 90;
    
    return (
      <Marker.Animated
        key={'my-location'}
        coordinate={currentLocation.coordinate}
        anchor={{x: 0.5, y: 0.5}}
        rotation={130}
      >
       <Image
          source={CURRENT_LOCATION_IMAGE}
          style={{width: 44, height: 40,
            // transform: [{rotate: `${degree}deg`}],
          }}
        />
      </Marker.Animated>
    )
  };

  renderCustomDirection = () => {
    const { directionCoordinates } = this.state;
    const startColor = '#FFDF00';
    const endColor = '#FF52A8';
    const strokeColors = generateColor(
      startColor,
      endColor,
      directionCoordinates ? directionCoordinates.length : 1
    );

    return (
      <Polyline
        coordinates={directionCoordinates}
        strokeWidth={4}
        strokeColor={startColor}
        strokeColors={strokeColors}
      />
    );
  };

  renderMapViewDirection = () => {
    const { currentLocation, directionCoordinates } = this.state;
    const { selectedPlace, onDetectDirection } = this.props;
    const GOOGLE_MAPS_APIKEY = Platform.OS === 'ios' 
      ? googleMapConfig.IOS_GOOGLE_MAPS_APIKEY
      : googleMapConfig.ANDROID_GOOGLE_MAPS_APIKEY;
    console.log('===== renderMapViewDirection: currentLocation: ', currentLocation)

    var mapDirections = [];
    mapDirections.push(
      <MapViewDirections
        origin={currentLocation.coordinate}
        destination={selectedPlace.coordinate}
        apikey={GOOGLE_MAPS_APIKEY}
        mode={"WALKING"}
        strokeWidth={0}
        strokeColor="hotpink"
        optimizeWaypoints={true}
        precision={'high'}
        onStart={(params) => {
          console.log(`Started routing between "${params.origin}" and "${params.destination}"`);
        }}
        onReady={result => {
          console.log('====== result: ', result);
          if (!result) {
            console.log('====== reset direction');
            this.setState({directionCoordinates: []});
            onDetectDirection && onDetectDirection({
              distance: null,
              duration: null
            });
            return;
          }
          var distance = convertUnits(result.distance).from('km').toBest({ cutOffNumber: 1 });
          var duration = convertUnits(result.duration).from('min').toBest({ cutOffNumber: 1 });
          onDetectDirection && onDetectDirection({
            distance: `${Math.round(distance.val * 100)/100} ${distance.unit}`,
            duration: `${Math.round(duration.val)} ${duration.unit}`
          })
          var directionCoordinates = [];
          directionCoordinates.push(currentLocation.coordinate);
          for(var i = 0; i < result.coordinates.length - 1; i++) {
            var coord = result.coordinates[i];
            directionCoordinates.push(coord);
          }
          directionCoordinates.push(selectedPlace.coordinate);
          const counts = directionCoordinates.length;
          // this.mapView && this.mapView.fitToCoordinates(directionCoordinates, {
          //   edgePadding: {
          //     right: (width / 10),
          //     bottom: (height / 5 * 2),
          //     left: (width / 10),
          //     top: (height / 7),
          //   }
          // });
          this.setState({directionCoordinates});
        }}
        onError={(errorMessage) => {
          console.log('==== GOT AN ERROR: ', errorMessage);
          onDetectDirection && onDetectDirection({
            distance: null,
            duration: null
          });
          this.setState({directionCoordinates: []});
        }}
      />
    );
    if (selectedPlace && (directionCoordinates.length > 0))
      mapDirections.push(this.renderCustomDirection());
    return mapDirections;
  };

  renderCustomClusterMarker = (count) => {
    return (
      <View style={{margin: 5, width: 45, height: 45,}}>
        <View
          style={{
            width: 35,
            height: 35,
            borderRadius: 25,
            backgroundColor: '#35cdfa',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: "#000000",
            shadowOffset: { width: 2, height: 3 },
            shadowOpacity: 0.23,
            shadowRadius: 4.62,
            elevation: 8
          }}>
          <Text style={{color: "#FFFFFF", fontSize: 17, fontWeight: '500'}}>{count}</Text>
        </View>
      </View>
    );
  }

  renderClusterMap = () => {
    const { currentLocation } = this.state;
    const { selectedPlace } = this.props;
    var region = null;
    if (currentLocation)
      region = {
        latitude: currentLocation.coordinate.latitude,
        longitude: currentLocation.coordinate.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

    return (
      <ClusterMap
        initialRegion={INITIALIZE_REGION}
        region={region}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={Platform.OS == "android" ? "none" : "standard"}
        showsUserLocation={true}
        showsCompass={true}
        rotateEnabled={true}
        loadingEnabled={true}
        showsBuildings={true}
        pitchEnabled={true}
        onMapReady={() => this.onMapReady(region)}
        onUserLocationChange={this.onUserLocationChange}
        zoomTapEnabled={false}
        renderClusterMarker={this.renderCustomClusterMarker}
        ref={c => this.mapView = c}
        priorityMarker={(selectedPlace && selectedPlace.coordinate && currentLocation && currentLocation.coordinate) &&
          this.renderMapViewDirection()}
      >
        { this.renderMarkers() }
       {/* {(selectedPlace && selectedPlace.coordinate && currentLocation && currentLocation.coordinate) &&
          this.renderMapViewDirection()} */}
        {/* { selectedPlace && (directionCoordinates.length > 0) && this.renderCustomDirection() } */}
      </ClusterMap>
    );
  };

  render() {
    const { children } = this.props;

    return (
      <View style={styles.container}
        // style={
        //   {
        //   position: 'absolute', left: 0, top: 0,
        //   width: W, height: H, zIndex: 10
        // }}
      >
        { this.renderClusterMap() }
        { children && children }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});