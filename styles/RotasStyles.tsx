import { StyleSheet, Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#B2E5B2',
    width: '100%',
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputsContainer: {
    flexDirection: 'row',
    width: 350,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    textAlign: 'center',
    fontSize: 16,
    elevation: 2,
  },
  // Aumentado para ocupar mais espaço vertical
  map: {
    width: '100%',
    height: screenHeight * 0.8,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  navIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  iconWrapper: {
    padding: 5,
    borderRadius: 20,
  },
  iconActive: {
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: '#B2E5B2',
  },
});