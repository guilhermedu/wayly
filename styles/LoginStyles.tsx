import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export const loginstyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B2E5B2', 
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    
    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 10, 
    },
    title: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    input: {
        width: screenWidth * 0.8,
        height: 45,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        zIndex: 2,
    },
    recoverPassword: {
        color: '#000',
        fontSize: 12,
        alignSelf: 'flex-end',
        marginRight: 10,
        marginTop: -5,
        zIndex: 2,
    },
    button: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 8,
        width: screenWidth * 0.8,
        alignItems: 'center',
        marginTop: 20,
        zIndex: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#000',
        fontSize: 14,
        marginTop: 10,
        marginBottom: 5,
        zIndex: 2,
    },
    altButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 8,
        width: screenWidth * 0.8,
        alignItems: 'center',
        marginTop: 50,
        borderWidth: 1,
        borderColor: '#000',
        zIndex: 2,
    },
    altButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
