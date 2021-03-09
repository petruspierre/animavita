import React from 'react';
import {fireEvent, act} from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Mount, ThemeContext} from '../../../tests/helpers';
import Avatar from '../Avatar';

const mockedNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockedNavigate,
  }),
}));

const defaultProps = {
  source: {uri: 'imageurl.com'},
};

const mountFactory = propOverrides => {
  const avatarProps = {...defaultProps, ...propOverrides};

  const element = Mount(<Avatar {...avatarProps} />);

  return element;
};

describe('Avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('custom dimensions', () => {
    it('renders with custom width', () => {
      const {getByTestId} = mountFactory({width: 20});

      expect(getByTestId('avatar')).toHaveStyle({width: 20});
    });

    it('renders with custom height', () => {
      const {getByTestId} = mountFactory({height: 20});

      expect(getByTestId('avatar')).toHaveStyle({height: 20});
    });
  });

  describe('menu enabled', () => {
    it('logout application', async () => {
      const {getByTestId, getByText} = mountFactory({menu: true});

      await act(async () => {
        await fireEvent.press(getByTestId('avatar'));
        await fireEvent.press(getByText('Sair'));
      });

      expect(AsyncStorage.clear).toHaveBeenCalled();
      expect(AsyncStorage.clear).toHaveBeenCalledTimes(1);
      expect(mockedNavigate).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledTimes(1);
    });
  });

  it('renders correctly', () => {
    const tree = renderer.create(ThemeContext(<Avatar {...defaultProps} />)).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
