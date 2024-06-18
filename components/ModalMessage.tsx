import React, { ReactNode, useState } from 'react';
import { Modal, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View} from 'react-native';

type ModalMessageProps = { 
    modalVisible: boolean, 
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
    title?: string,
    text?: string,
    icon?: JSX.Element,
    hasOKButton?: boolean,
    children?: ReactNode,
    titleStyle?: StyleProp<TextStyle>
}

export default function ModalMessage({ modalVisible, setModalVisible, title = '', text = '', icon = <></>, hasOKButton = true, children, titleStyle={} }: ModalMessageProps) {
  return (
    <View style={styles.centeredView}>
      <Modal
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            {icon}
            <Text style={[styles.modalText, titleStyle]}>{title}</Text>
            <Text style={styles.textStyle}>{text}</Text>
            {hasOKButton ? <TouchableOpacity
              style={styles.buttonClose}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text>OK</Text>
            </TouchableOpacity> : ''}
            {children}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginHorizontal: 25
  },
  buttonClose: {
    borderColor: 'black',
    borderWidth: 1,
    paddingHorizontal: 100,
    paddingVertical: 15,
    borderRadius: 10
  },
  textStyle: {
    color: 'black',
    marginBottom: 5
  },
  modalText: {
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20
  }
});
