import React, {useRef} from 'react';
import {Pressable, ImageProps} from 'react-native';
import styled from 'styled-components/native';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {px2ddp} from '@animavita/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const AVATAR_SIZE = 18;

const StyledAvatar = styled.Image<Pick<AvatarProps, 'width' | 'height'>>`
  border-radius: ${px2ddp(AVATAR_SIZE) / 2}px;
  width: ${({width}) => width || px2ddp(AVATAR_SIZE)}px;
  height: ${({height}) => height || px2ddp(AVATAR_SIZE)}px;
`;

const StyledMenu = styled(Menu)`
  margin-top: ${({width}) => width || px2ddp(AVATAR_SIZE)}px;
`;

export interface AvatarProps extends ImageProps {
  width?: number;
  height?: number;
  menu?: boolean;
}

interface MenuRef {
  hide: () => void;
  show: () => void;
}

const Avatar: React.FC<AvatarProps> = props => {
  const menu = useRef<MenuRef>(null);
  const navigation = useNavigation();

  const hideMenu = () => {
    if (menu.current) {
      menu.current.hide();
    }
  };

  const showMenu = () => {
    if (props.menu && menu.current) {
      menu.current.show();
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('SignUp');
  };

  return (
    <StyledMenu
      ref={menu}
      button={
        <Pressable onPress={showMenu}>
          <StyledAvatar {...props} testID="avatar" />
        </Pressable>
      }>
      <MenuItem onPress={hideMenu} disabled>
        Configurações
      </MenuItem>
      <MenuDivider />
      <MenuItem onPress={handleLogout}>Sair</MenuItem>
    </StyledMenu>
  );
};

export default Avatar;
