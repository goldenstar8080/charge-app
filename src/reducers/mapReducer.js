import { mapActionTypes } from '~/actions/types';
import { filterPlaces } from '~/common/utils/filterPlaces';

const initialState = {
  places: [],
  currentLocation: null,
  searchedPlaces: [],
  place: null,
  direction: {},
  searchLimit: '1km',
  stations: [],
  scannedQrCode: '',
  activeModal: 'unlock'
}

export default function reducer(state = initialState, action) {
  switch(action.type) {
    case mapActionTypes.MAP_INIT:
      return {
        ...initialState
      }
    case mapActionTypes.CHANGED_CURRENT_LOCATION:
      return {
        ...state,
        currentLocation: action.payload.currentLocation
      }
    case mapActionTypes.LOAD_PLACES_ON_MAP_SUCCESS:
      return {
        ...state,
        // currentLocation: action.payload.currentLocation,
        places: action.payload.places,
        searchedPlaces: filterPlaces(
          action.payload.places,
          '',
          action.payload.currentLocation ? action.payload.currentLocation : null
        )
      }
    case mapActionTypes.SEARCH_PLACES_REQUEST:
      return {
        ...state,
        searchedPlaces: filterPlaces(
          state.places,
          action.payload.searchVal,
          action.payload.currentLocation ? action.payload.currentLocation : null
        )
      }
    case mapActionTypes.SEARCH_PLACES_SUCCESS:
      return {
        ...state,
        searchedPlaces: action.payload.searchedPlaces
      }
    case mapActionTypes.SELECT_PLACE:
      return {
        ...state,
        place: ((action.payload.index == -1) && state.searchedPlaces)
          ? null : state.searchedPlaces[action.payload.index]
      }
    case mapActionTypes.SET_DIRECTION:
      return {
        ...state,
        direction: action.payload.direction
      }
    case mapActionTypes.GET_ALL_STATIONS:
      return {
        ...state,
      }
    case mapActionTypes.GET_ALL_STATIONS_SUCCESS:
      return {
        ...state,
        ...action.payload
      }
    case mapActionTypes.GET_ALL_STATIONS_FAILURE:
        return {
          ...state,
          ...action.payload
        }
    case mapActionTypes.GET_STATION_DETAIL:
      return {
        ...state,
        station: state.places[action.payload.stationSn]
      }
    case mapActionTypes.RECEIVED_STATION_DETAIL:
      var stations = state.stations;
      console.log('==== action.payload.station.stationSn: ', action.payload.station.stationSn);
      var index = stations.length > 0 ?
        stations.findIndex((s) => s.stationSn === action.payload.station.stationSn) :
        -1 ;
      console.log('===== index: ', index);
      if (index > -1) {
        console.log('===== Removing previous station: ');
        stations.splice(index, 1);
      }
      console.log('===== Adding this station: action.payload.station: ', action.payload.station);
      stations.push(action.payload.station)
      return {
        ...state,
        stations: stations
      }
    case mapActionTypes.SCANNED_QR_CODE:
      return {
        ...state,
        scannedQrCode: action.payload.scannedQrCode
      }
    case mapActionTypes.ACTIVE_MODAL:
      return {
        ...state,
        activeModal: action.payload.activeModal
      }
    default:
      return state
  }
}
