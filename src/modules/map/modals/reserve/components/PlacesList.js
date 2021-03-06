import React from 'react'
import { View, Text, ImageBackground, Image, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import { em, H, W } from '~/common/constants'
import { openHourStatus } from '~/common/utils/time';
import { getStationStatus } from '~/common/utils/stationStatus';

export default class PlacesList extends React.Component {
  state = {
    selectedIndex: 0
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { searchedPlaces, place } = nextProps.map;
    
    if (searchedPlaces && place) {
      const selectedIndex = searchedPlaces.findIndex(p => p.name === place.name);
      if (this.flatList && selectedIndex >= 0) {
        this.flatList.scrollToIndex({
          animated: true,
          index: selectedIndex,
          viewOffset: 0,
          viewPosition: 0.5
        });
      }
    }   
  }

  onSelectPlace = (index) => {
    this.props.onSelectPlace(index)
  }

  getItemLayout = (item, index) => {
    return (
      {
        length: W,
        offset: W * index,
        index
      }    
    );
  }

  _keyExtractor = (item, index) => index;

  renderListItem = ({ item, index }) => {
    const { _t } = this.props.appActions;
    const { place } = this.props.map;
    const backgroundColor = '#FFFFFF';
    var itemContainerStyles = [{
      marginLeft: 20,
      marginRight: 20,
      marginBottom: 10,
      position: 'relative',
      width: W-80
    }];
    if (!item) return null;
    const hourStatus = openHourStatus(item.openHours);
    const { batterries, places } = getStationStatus(item.stations_status);
    return (
      <View style={itemContainerStyles}>
        {/* <ImageBackground
          source={require('~/common/assets/images/png/nearSearchDialogItemBg.png')}
          resizeMode={'stretch'}
          style={{ flexDirection: 'row', width: W-40, padding: 2 }}
        > */}
          <View style={{backgroundColor: backgroundColor, borderRadius: 20*em, width: W-80}}>
            <TouchableOpacity
              style={{flexDirection: 'row', margin: 20}}
              onPress={() => this.onSelectPlace(index)}
            >
              <View style={{ marginLeft: 3 }}>
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 45, height: 45, borderRadius: 10 }}
                />
              </View>
              <View style={{marginLeft: 15, flex: 1 }}>
                <Text style={{color: '#36384a', fontSize: 18, fontWeight: 'bold'}}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: 'row', marginVertical: 5 }}>
                  <Text style={{ color: (hourStatus.openStatus ? '#1be497' : '#c9c9ce'), fontSize: 17 }}>
                    {hourStatus.openStatus ? `${_t('Opened')}` : `${_t('Closed')}`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 }}>
                  <View style={{ justifyContent: 'center', alignItems: 'flex-start', flex: 1 }}>
                    <Text style={{color: '#35cdfa', fontWeight: '500', fontSize: 17}}>
                      {`${batterries} ${(batterries > 1) ? _t('batteries') : _t('battery')}`}
                    </Text>
                  </View>
                  <View style={{ justifyContent: 'center', alignItems: 'flex-start', flex: 1 }}>
                    <Text style={{color: '#35cdfa', fontWeight: '500', fontSize: 17}}>
                      {`${places} ${(places > 1) ? _t('places') : _t('place')}`}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        {/* </ImageBackground> */}
      </View>
    )
  }

  render() {
    const { searchedPlaces, place } = this.props.map;
    const itemIndex = (searchedPlaces && place) ? searchedPlaces.findIndex(p => {return p.name === place.name}) : -1;
    return (
      <View style={{ marginHorizontal: -20 }}>
        {this.renderListItem({item: searchedPlaces[itemIndex], index: itemIndex})}
        {/* <FlatList
          data={searchedPlaces}
          renderItem={this.renderListItem}
          keyExtractor={this._keyExtractor}
          horizontal
          getItemLayout={(data, index) => this.getItemLayout(dat  a, index)}
          initialScrollIndex={itemIndex}
          ref={ref => (this.flatList = ref)}
        />        */}
      </View>
    )
  }
}
