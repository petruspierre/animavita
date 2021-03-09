import React, {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Facebook from 'expo-facebook';
import {useNavigation} from '@react-navigation/native';
import FacebookProvider, {Login} from 'react-facebook-sdk';
import {FacebookButton} from '@animavita/ui/social';
import {graphql, useMutation} from '@animavita/relay';
import {differenceInSeconds} from 'date-fns';

import getEnvVars from '../../../environment';
import {changeShowBottomBar} from '../../utils/bottomBar';
import {keys} from '../../utils/asyncStorage';

import {
  ContinueWithFacebookMutation as ContinueWithFacebookMutationType,
  ContinueWithFacebookMutationResponse,
} from './__generated__/ContinueWithFacebookMutation.graphql';

const {fbAppID, fbAppName} = getEnvVars();

interface FacebookWebSuccessfulResponse {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
  };
  tokenDetail: {
    accessToken: string;
    data_access_expiration_time: number;
    expiresIn: number;
    graphDomain: string;
    signedRequest: string;
    userID: string;
  };
}

const ContinueWithFacebookMutation = graphql`
  mutation ContinueWithFacebookMutation($input: SaveFacebookUserInput!) {
    SaveFacebookUser(input: $input) {
      error
      user {
        name
      }
      token
    }
  }
`;

const ContinueWithFacebook: React.FC = () => {
  const navigation = useNavigation();

  const [isSavingPending, saveFacebookUser] = useMutation<ContinueWithFacebookMutationType>(
    ContinueWithFacebookMutation,
  );

  const [fbLoginIsLoading, changeFbLoginLoadingTo] = useState(false);

  useEffect(() => {
    changeShowBottomBar(fbLoginIsLoading);
  }, [fbLoginIsLoading]);

  // TODO: initialize this sooner
  useEffect(() => {
    async function initializeFacebookSDK() {
      try {
        await Facebook.initializeAsync({appId: fbAppID, appName: fbAppName});
      } catch ({message}) {
        // eslint-disable-next-line no-console
        console.log(`Facebook Login Error: ${message}`);
      }
    }

    Platform.OS !== 'web' && initializeFacebookSDK();
  }, []);

  const onCompleted = async (data: ContinueWithFacebookMutationResponse) => {
    changeFbLoginLoadingTo(false);
    if (data.SaveFacebookUser && data.SaveFacebookUser.token) {
      await AsyncStorage.setItem(keys.token, data.SaveFacebookUser.token);
      navigation.navigate('Home');
    }
  };

  // TODO: show feedback of error
  const onError = error => {
    changeFbLoginLoadingTo(false);
  };

  const loginWithFacebookMobile = async () => {
    // prevent the user from firing too much requests
    if (fbLoginIsLoading) return;

    changeFbLoginLoadingTo(true);

    const response = await Facebook.logInWithReadPermissionsAsync({
      permissions: ['public_profile', 'email'],
    });

    if (response.type === 'success') {
      const {token, permissions, expirationDate} = response;
      const expires = differenceInSeconds(new Date(expirationDate), new Date());

      saveFacebookUser({
        variables: {
          input: {
            token,
            expires,
            permissions: permissions || [],
          },
        },
        onCompleted,
        onError,
      });
    } else {
      changeFbLoginLoadingTo(false);
    }
  };

  const loginWithFacebookWeb = async (data: FacebookWebSuccessfulResponse) => {
    // prevent the user from firing too much requests
    if (fbLoginIsLoading) return;

    changeFbLoginLoadingTo(true);

    saveFacebookUser({
      variables: {
        input: {
          token: data.tokenDetail.accessToken,
          expires: data.tokenDetail.expiresIn,
          permissions: ['public_profile', 'email'],
        },
      },
      onCompleted,
      onError,
    });
  };

  const handleLoginWithFacebookWebError = error => {
    changeFbLoginLoadingTo(false);
  };

  if (Platform.OS === 'web') {
    return (
      <FacebookProvider appId={fbAppID}>
        <Login scope="public_profile,email" onResponse={loginWithFacebookWeb} onError={handleLoginWithFacebookWebError}>
          <FacebookButton testID="fb-btn" />
        </Login>
      </FacebookProvider>
    );
  } else {
    return <FacebookButton testID="fb-btn" onPress={loginWithFacebookMobile} />;
  }
};

export default ContinueWithFacebook;
