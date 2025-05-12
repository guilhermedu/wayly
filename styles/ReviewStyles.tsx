import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const managerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B2E5B2',
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  formBlock: {
    padding: 10,
    width: '90%',
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  mainBtn: {
    backgroundColor: '#6BD88D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  smallBtn: {
    backgroundColor: '#6BD88D',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: '#E57373',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  entityCard: {
    backgroundColor: '#fff',
    marginVertical: 5,
    padding: 12,
    borderRadius: 10,
    width: width * 0.9,
    marginLeft: (width - width * 0.9) / 2,
    marginRight: (width - width * 0.9) / 2,
  },
  entityText: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'center',
  },
  entityImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
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
  overlayContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  overlayButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  overlayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
