import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B2E5B2',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000',
  },
  searchBar: {
    width: '90%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  locationButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  carouselItem: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.3,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  carouselContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  imageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  placeImage: {
    width: 120,
    height: 80,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 60,
  },
  subText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#6BD88D',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
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