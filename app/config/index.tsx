import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from './styles';

import { db } from '@/database/database-connection';
import synchronize from './sync';
import ModalMessage from '@/components/ModalMessage';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import StdButton from '@/components/StdButton';
import { getConProps } from '@/utils/getConProps';



export default function Config() {
  
  const [deviceName, onChangeDeviceName] = useState<string | null>('')
  const [ipInt, onChangeIpInt] = useState('');
  const [portInt, onChangePortInt] = useState('');
  const [ipExt, onChangeIpExt] = useState('');
  const [portExt, onChangePortExt] = useState('');
  const [isLoading, setIsLoading] = useState(true)
  const [deviceNameSaved, setDeviceNameSaved] = useState<boolean>(false)
  const [ipIntConnStatus, setIpIntConnStatus] = useState<boolean>(false)
  const [ipExtConnStatus, setIpExtConnStatus] = useState<boolean>(false)
  const [conPropsSaved, setConPropsSaved] = useState<boolean>(false)
  const [syncModal, setSyncModal] = useState<boolean>(false)
  const [storeSelectorModal, setStoreSelectorModal] = useState<boolean>(false)
  const [openStorePicker, setOpenStorePicker] = useState(false);
  const [selectedStore, setSelectedStore] = useState<undefined | number>(undefined);
  const [stores, setStores] = useState<{value: number, label: string}[]>([])

  useEffect(() => {
    setConProps()
  }, []);

  useEffect(()=>{
    setConPropsSaved(false)
  }, [ipInt, ipExt, portInt, portExt, deviceName])
  

  const setConProps = () => {
    const conProps = getConProps()

    onChangeDeviceName(conProps.devicename)
    onChangeIpInt(conProps.ipint)
    onChangePortInt(conProps.portint)
    onChangeIpExt(conProps.ipext)
    onChangePortExt(conProps.portext)
      
    setIsLoading(false)
    if(conProps.devicename !== "") {
      setDeviceNameSaved(true)
    }
  }

  const saveDeviceName = () => {
    if(deviceName?.replace(" ", "") !== ""){
      setDeviceNameSaved(current => (current === true ? false : true))
      setConPropsSaved(false)
    }
  }

  const handleSync = async (idCurentStore: number) => {
    setStoreSelectorModal(false)
    setSyncModal(true)
    try{
      await synchronize(ipInt, portInt, ipExt, portExt, idCurentStore) 
      router.replace("/home")
    } catch (error) {
      console.log(error)
    } finally {
      setSyncModal(false)
    }
  }

  const updateConProps = () => {
    const query = "UPDATE conprops SET devicename = ?, ipint = ?, portint = ?, ipext = ?, portext = ? WHERE id = 1;";

    const result = db.runSync(query, [deviceName, ipInt, portInt, ipExt, portExt])

    setConPropsSaved(true)
    setDeviceNameSaved(true)
  }

  const testConnection = async (ip: string, port: string, setStatus: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      const result = await axios.get(`http://${ip}:${port}/testconnection/${deviceName}`);
      result.status === 200 ? setStatus(true) : setStatus(false);
    } catch (error) {
        setStatus(false);
        return;
    }
    
    try {
        const strs = await axios.get<{id: number, descricao: string}[]>(`http://${ip}:${port}/sync/stores`);
        const strsFixedObj = strs.data.map((str) => {return {value: str.id, label: str.descricao}})
        setStores(strsFixedObj)
    } catch (error) {
        console.error("Erro ao obter lojas:", error);
    }
}
  
  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <Stack.Screen
        options={{
          title: 'Config',
          headerTitle: 'Configurações',
        }}
      />
        {
          isLoading ?
            <ActivityIndicator size="large" color="#095E4A"/>
          :
            <ScrollView style={styles.container}>
            <View style={styles.deviceNameInputView}>
              {deviceNameSaved ? <Text style={styles.deviceNameText}>{deviceName}</Text>
                :<TextInput
                    style={styles.deviceNameInput}
                    onChangeText={onChangeDeviceName}
                    value={deviceName ?? ""}
                    placeholder="NOME DO DISPOSITIVO"
                    maxLength={30}
                    />}
                  <TouchableOpacity style={styles.saveIcon} onPress={saveDeviceName}>
                    <FontAwesome name={deviceNameSaved ? "pencil" : "save" } size={30} color="#095E4A" />
                  </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
              <Text style={{flex: 2, marginLeft: 30, color: 'white'}}> IP INTERNO </Text>
              <Text style={{flex: 1, color: 'white'}}> PORTA </Text>
            </View>
            <View style={styles.inputView}>
              <AntDesign 
                name={ipIntConnStatus ? "checkcircle" : "closecircle" } 
                size={30} 
                style={styles.conStatus} 
                color={ipIntConnStatus ? "green" : "red" } />
              <TextInput
              style={styles.inputIP}
              onChangeText={onChangeIpInt}
              value={ipInt}
              placeholder="IP INTERNO"
              aria-label="input" 
              aria-labelledby="labelUsername"
              maxLength={15}
              keyboardType='numeric'
              />
              <TextInput
              style={styles.inputPorta}
              onChangeText={onChangePortInt}
              value={portInt}
              placeholder="PORTA"
              maxLength={5}
              keyboardType='numeric'
              />
            </View>
            <TouchableOpacity style={styles.testConnButton} onPress={() => testConnection(ipInt, portInt, setIpIntConnStatus)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                TESTAR CONEXÃO
              </Text>
            </TouchableOpacity>


            <View style={styles.inputView}>
              <Text style={{flex: 2, marginLeft: 30, color: 'white'}}> IP EXTERNO </Text>
              <Text style={{flex: 1, color: 'white'}}> PORTA </Text>
            </View>
            <View style={styles.inputView}>
            <AntDesign 
                name={ipExtConnStatus ? "checkcircle" : "closecircle" } 
                size={30} 
                style={styles.conStatus} 
                color={ipExtConnStatus ? "green" : "red" } />
              <TextInput
              style={styles.inputIP}
              onChangeText={onChangeIpExt}
              value={ipExt}
              placeholder="IP EXTERNO"
              aria-label="input" 
              aria-labelledby="labelUsername"
              maxLength={15}
              keyboardType='numeric'
              />
              <TextInput
              style={styles.inputPorta}
              onChangeText={onChangePortExt}
              value={portExt}
              placeholder="PORTA"
              maxLength={5}
              keyboardType='numeric'
              />
            </View>
            <TouchableOpacity style={styles.testConnButton} onPress={() => testConnection(ipExt, portExt, setIpExtConnStatus)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                TESTAR CONEXÃO
              </Text>
            </TouchableOpacity>

            {/*Divider*/}
            <View style={{borderBottomColor: "#888888", borderBottomWidth: 1, marginBottom: 10, marginTop: 10}}>

            </View>

            <TouchableOpacity 
              style={[styles.saveConfigButton, 
              {backgroundColor: !conPropsSaved ? "#095E4A" : "#373737"}]} 
              disabled={conPropsSaved}
              onPress={updateConProps}>
              <Text style={{color: !conPropsSaved ? 'white' : '#888888', fontWeight: 'bold'}}>
                SALVAR CONFIGURAÇÕES
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setStoreSelectorModal(true)}
              disabled={!conPropsSaved}
              style={[styles.syncButton, 
              {backgroundColor: conPropsSaved ? "#095E4A" : "#373737"}]}>
              <Text style={{color: conPropsSaved ? 'white' : '#888888', fontWeight: 'bold'}}>
                SINCRONIZAR INFORMAÇÕES
              </Text>
            </TouchableOpacity>

          </ScrollView>
        }
        <ModalMessage 
          modalVisible={syncModal} 
          setModalVisible={setSyncModal} 
          hasOKButton={false} 
          title='Sincronizando...'
          text='Sincronizando dados, aguarde!'
          icon={<MaterialIcons name="phonelink-ring" size={50} color="black" />}/> 

        <ModalMessage 
          modalVisible={storeSelectorModal} 
          setModalVisible={setStoreSelectorModal}
          hasOKButton={false}
          title='Selecionar Loja'
          >
            <View>
              <DropDownPicker
                  placeholder="Selecionar Loja..."
                  open={openStorePicker}
                  value={selectedStore ?? 1}
                  items={stores}
                  setOpen={setOpenStorePicker}
                  setValue={setSelectedStore}
                  setItems={setStores}
                  style={{borderColor: '#888888'}}
                  dropDownContainerStyle={{borderColor: '#888888'}}
                  textStyle={{color: '#888888'}}
                  translation={{NOTHING_TO_SHOW: 'Não foi possível encontrar as lojas'}}
              />    
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10}}>
                      <StdButton 
                          title="CANCELAR"
                          style={{position: 'relative', height: 50, width: 125, backgroundColor: 'white', borderColor: '#888888', borderWidth: 1}}
                          titleStyle={{color: '#888888'}}
                          onPress={() => setStoreSelectorModal(false)}/>
                      <StdButton 
                          title="OK"
                          style={{position: 'relative', height: 50, width: 125}}
                          onPress={() => handleSync(selectedStore ?? 1)}/>
                  </View>
            </View>
        </ModalMessage> 
    </View>
  );
}