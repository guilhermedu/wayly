import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const searchStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B2E5B2',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    justifyContent: 'center',
    marginBottom: 10, 
  },
  logo: {
    width: 50, 
    height: 50,
    resizeMode: 'contain',
  },
  searchBar: {
    width: '75%', 
    height: 40, 
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginLeft: 10,
    fontSize: 14,
    textAlign: 'left',
  },
  distanceContainer: { 
    width: '90%',
    marginBottom: 10,
    alignItems: 'center',
  },
  sliderContainer: {
    width: '100%',
    position: 'relative',
  },
  sliderLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    zIndex: 1,
  },
  distanceInput: { 
    width: 70,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginVertical: 5,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
  },
  inactiveFilter: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
  },
  inactiveFilterText: {
    color: '#4CAF50',
  },

  sectionTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  listContainer: {
    width: '90%',
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 10, 
    padding: 10, 
    width: screenWidth * 0.9,
    height: 90, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, 
  },
  destinationImage: {
    width: 70, 
    height: 70, 
    borderRadius: 10, 
    marginRight: 10,
  },
  destinationText: {
    fontSize: 16, 
    fontWeight: 'bold',
  },
  routeText: {
    fontSize: 14, 
    color: 'blue',
    marginTop: 5,
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

  // 🔹 Modal
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
    color: '#000',
    textAlign: 'center',
  },
  modalSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
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
