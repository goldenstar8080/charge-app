import React from 'react'
import DialogWrapper from '../../common/wrappers/DialogWrapper'
import { View, StyleSheet, Platform } from 'react-native'
import { Button, Spacer } from '~/common/components'
import { colors, W, em } from '~/common/constants'

export default class FindNearestDialog extends React.Component {
  render() {
    const { onClickFind } = this.props
    const { _t } = this.props.appActions

    return (
      <View style={styles.container} >
        <Button
          // icon={require('~/common/assets/images/png/go.png')} iconColor='#fff'
          textColor='#fff'
          bgGradientStart='#ff52a8'
          bgGradientEnd='#ffdf00'
          caption={_t('Find the nearest station')}
          onPress={() => onClickFind()}
          textSize={13}
          containerHeight={40}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, zIndex: 10,
    width: 220 * em,
    height: 40,
    top: 57,
    left: (W / 2 - 110) * em,
    borderRadius: 20,
    // borderTopRightRadius: 20,
    // backgroundColor: '#ffffff00',
    ...Platform.select({
      ios: {
        // shadowColor: "#000000",
        // backgroundColor: '#ffffff00',
        shadowOffset: { width: 1, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
      },
      android : {
        elevation: 8,
      }
    })
  }
})
