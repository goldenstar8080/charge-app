import React from 'react';
import { TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { Actions } from 'react-native-router-flux';
import { Spacer, Button, PhoneNumberInput } from '~/common/components';
import { PhoneAuth, FacebookAuth, AppleAuth } from '~/common/services/rn-firebase/auth';
import {
  createSocialAccount,
  checkIfUserExistsByPhoneNumber
} from '~/common/services/rn-firebase/database';
import { sendFcmMessage } from '~/common/services/rn-firebase/message';
import { W, H, em } from '~/common/constants';
import commonStyles from '~/common/styles';
import FirstWrapper from '../../common/wrappers/FirstWrapper';
import { convertLanguage2CallingCode } from '~/common/utils/country';
import SetConfirmCode from '../../confirm-code/ViewContainer';
import * as notifications from '~/common/services/onesignal/notifications';

const { loginWithPhone, confirmWithPhone } = PhoneAuth;
const { loginWithFacebook } = FacebookAuth;
const { loginWithApple } = AppleAuth;
const FACEBOOK_IMAGE = require('~/common/assets/images/facebook.png');
const APPLE_IMAGE = require('~/common/assets/images/png/apple.png');

export default class LoginView extends React.Component {
  state = {
    phoneNumber: this.props.phoneNumber || '',
    countryCode: convertLanguage2CallingCode(this.props.app.language) || '33',
    facebookLogining: false,
    phoneLogining: false,
    showConfirmCodeModal: false
  }

  onLogin = async () => {
    const { _t } = this.props.appActions;
    const { countryCode, phoneNumber } = this.state;
    const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

    this.setState({phoneLogining: true});
    console.log('==== onLogin: checking user by phone number: ', fullPhoneNumber);
    const isExistUser = await checkIfUserExistsByPhoneNumber(fullPhoneNumber);
    if (!isExistUser) {
      this.setState({phoneLogining: false}, () => {
        Alert.alert(
          _t('Failed to login with phone number.'),
          _t('Your phone number was not registered yet. Would you register now?'),
          [
            {text: _t('Cancel'), onPress: () => console.log('Cancel Pressed')},
            {text: _t('OK'), onPress: () => this.goSignup()},
          ],
          {cancelable: true},
        );  
      });
    } else {
      console.log('==== try to send confirm code: ', fullPhoneNumber);
      const res = await loginWithPhone(fullPhoneNumber);
      this.setState({phoneLogining: false});
      if (res.confirmation) {
        this.setState({
          confirmation: res.confirmation,
          showConfirmCodeModal: true
        });
      } else {
        console.log('===== Phone number login failed: error: ', res.error);
        Alert.alert(
          _t('Failed to login with phone number.'),
          _t(res.error),
          [
            {text: _t('OK'), onPress: () => console.log('OK Pressed')},
          ],
          {cancelable: true},
        );
        this.setState({phoneLogining: false});
      }
    }
  }

  onFacebookLogin = async () => {
    const { auth, authActions, appActions } = this.props;
    const { _t } = appActions;
    this.setState({facebookLogining: true});
    const res = await loginWithFacebook();
    console.log('===== res: ', res);
    this.setState({facebookLogining: false});
    if (res.credential) {
      this.onSocialLoginSuccess(res.credential, auth);
      authActions.loginSuccessWithSocial(res.credential, auth);
    } else {
      authActions.loginFailed(res.error);
      console.log('===== Facebook login failed: error: ', res.error);
      Alert.alert(
        _t('Failed to login with Facebook account.'),
        _t(res.error),
        [
          { text: _t('OK'), onPress: () => console.log("OK Pressed") }
        ],
        { cancelable: true }
      );
    }
  };

  onAppleLogin = async () => {
    const { authActions, appActions, auth } = this.props;
    const { _t } = appActions;
    this.setState({appleSigning: true});
    const res = await loginWithApple();
    this.setState({appleSigning: false});
    if (res.credential) {
      this.onSocialLoginSuccess(res.credential, auth);
      authActions.loginSuccessWithSocial(res.credential, auth);
    } else {
      authActions.loginFailed(res.error);
      console.log('===== login error: ', res.error);
      Alert.alert(
        _t('Failed to login with Apple account.'),
        _t(res.error),
        [
          {text: _t('OK'), onPress: () => console.log('OK Pressed')},
        ],
        {cancelable: false},
      );
    }
  };

  onSocialLoginSuccess = async (credential, auth) => {
    const resCreateUser = await createSocialAccount(credential);
    if (resCreateUser) {
      if (
        credential.additionalUserInfo &&
        credential.additionalUserInfo.isNewUser
      ) {
        var provideId = credential.additionalUserInfo.providerId;
        var socialSiteName = (provideId === 'facebook.com') ? 'Facebook' : 'Apple';
        // Send notification
        var contents = {
          'en': `You are registered firstly with your ${socialSiteName} account.`,
          'fr': `Vous vous êtes inscrit avec votre compte ${socialSiteName}.`
        }
        var message = {
          type: notifications.NONO_NOTIFICATION_TYPES.REGISTERED_FIRST
        };
        var otherParameters = {
          headings: {
            "en": "Welcome to Nono!",
            "fr": "Bienvenue sur l’application de Nono !"
          },
        }
        if (auth && auth.oneSignalDevice && auth.oneSignalDevice.userId) {
          notifications.postNotification(
            contents,
            message,
            `${auth.oneSignalDevice.userId}`,
            otherParameters
          );
        }
        // Go to Hint screen
        console.log('==== Go to Hint.', auth, credential);
        Actions['hint']();
      }
      // else Actions['hint']();
      else {
        console.log('==== Go to Home.');
        // Actions['home']();
        Actions.home();
        Actions['map_first']();
      }
    };
  }

  goSignup = () => Actions['signup_first']({phoneNumber: this.state.phoneNumber});

  onChangeCountry = (country, code) => {
    this.setState({countryCode: code}, () => {
      this.props.appActions.setLanguage(country.toLowerCase());
    });
  }

  onCloseConfirmCodeModal = () => {
    this.setState({showConfirmCodeModal: false});
  };

  onConfirmedCode = (res) => {
    if (!res.error) {
      const credentail = {
        additionalUserInfo: {},
        user: res.user
      };
      this.props.authActions.loginSuccess(credentail);
    }
    this.onCloseConfirmCodeModal();
  };

  render() {
    const {
      phoneNumber,
      phoneLogining,
      facebookLogining,
      showConfirmCodeModal,
      confirmation
    } = this.state;
    const { _t } = this.props.appActions;
    return (
      <FirstWrapper>
        <React.Fragment>
          <Text
            style={[
              commonStyles.text.titleWhite,
              {fontSize: 26*em, textAlign: 'center'}
            ]}
          >
            {_t("Connect yourself")}
          </Text>
          <Spacer size={10*em} />
          <PhoneNumberInput
            defaultCountry={this.props.app.language.toUpperCase()}
            placeholder={_t('Mobile number')} 
            phoneNumber={phoneNumber}
            onChangeCountry={this.onChangeCountry}
            onChangePhoneNumber={(phoneNumber) => this.setState({phoneNumber})}
          />
          <Spacer size={20*em} />
          <Button
            onPress={this.onLogin}
            caption={_t('Next')}
            loading={phoneLogining}
            disabled={phoneLogining}
          />
          <Text
            style={[
              commonStyles.text.defaultWhite,
              {textAlign: 'center', fontSize: 12*em}
            ]}
          >
            {_t("We will send you an SMS to check your number")}
          </Text>
          <Spacer size={10*em} />
          <Text style={[commonStyles.text.defaultWhite, {textAlign: 'center'}]}>
            {_t("or")}
          </Text>
          <Spacer size={10*em} />
          <Button
            onPress={this.onFacebookLogin} 
            caption={_t('Continue with facebook')} 
            icon={FACEBOOK_IMAGE}
            textColor='#fff'
            bgGradientStart='#48bff3'
            bgGradientEnd='#00a9f2'
            loading={facebookLogining}
            disabled={facebookLogining}
          />
          { (Platform.OS === 'ios') &&
            [<Spacer size={15*em} key={'AppleLoginButtonSpace'} />, 
            <Button
              onPress={this.onAppleLogin}
              caption={_t('Continue with Apple')}
              bgColor='#36384a'
              textColor='#fff'
              icon={APPLE_IMAGE}
              iconColor='#fff'
              key={'Apple-Login-Button'}
            />]
          }
          <Spacer size={30*em} />
          <TouchableOpacity
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row'
            }}
            onPress={() => this.goSignup()}
          >
            <Text style={[commonStyles.text.defaultWhite, {fontSize: 14*em}]}>
              {_t("No account?")}
            </Text>
            <Text
              style={[
                commonStyles.text.defaultWhite,
                {fontSize: 14*em, fontWeight: 'bold'}
              ]}
            >
              {` ${_t('Register yourself')}`}
            </Text>
          </TouchableOpacity>
          <Spacer size={60*em} />

          <SetConfirmCode
            isVisible={showConfirmCodeModal}
            confirmation={confirmation}
            confirmFunc={confirmWithPhone}
            onClose={this.onCloseConfirmCodeModal}
            onConfirmed={this.onConfirmedCode} 
          />
        </React.Fragment>
      </FirstWrapper>
    )
  }
}
