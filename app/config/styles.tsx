import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 40
    },
    deviceNameInput: {
      backgroundColor: 'white',
      borderRadius: 8,
      height: 50,
      padding: 10,
      marginTop: 10,
      marginBottom: 10,
      flex: 1
    },
    deviceNameText: {
      color: '#888888',
      height: 50,
      textAlignVertical: 'center'
    },
    deviceNameInputView: {
      borderBottomColor: '#888888',
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',  
      marginBottom: 10
    },
    saveIcon: {
      alignSelf: 'center',
      paddingLeft: 5,
    },
    inputIP: {
      backgroundColor: 'white',
      borderRadius: 8,
      height: 50,
      padding: 10,
      marginRight: 5,
      flex: 2
    },
    inputPorta: {
      backgroundColor: 'white',
      borderRadius: 8,
      height: 50,
      padding: 10,
      flex: 1
    },
    conStatus: {
      paddingRight: 5,
      alignSelf: 'center'
    },
    inputView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    testConnButton: {
      borderColor: "#095E4A",
      borderWidth: 1,
      padding: 20,
      marginTop: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 25
    },
    saveConfigButton: {
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    syncButton: {
      padding: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 15
    }
  });
  