import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { Icon } from '../Icons/Icon';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFEDEC',
    borderBottomWidth: 2,
    borderBottomColor: '#ECEAE9',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    paddingBottom: 10,
  },
  row: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
  },
});

const Header = ({ title, description, onLogoutPress }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <TouchableOpacity onPress={onLogoutPress}>
          <Icon name="LogOut" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Header;
