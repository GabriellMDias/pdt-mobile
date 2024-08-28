import { Stack, router} from "expo-router";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import StdButton from "@/components/StdButton";
import { Entypo, MaterialIcons } from '@expo/vector-icons';    
import React, { useState, useCallback } from "react";
import { db } from "@/database/database-connection";
import ModalMessage from "@/components/ModalMessage";
import { TransmissionList } from "@/components/TransmissionList";
import ExportTxtData from "@/components/ExportTxtData";
import axios from "axios";
import { ConProps, getConProps } from "@/utils/getConProps";


type LogConsumo = {
    id: number,
    descricaocompleta: string,
    id_produto: number,
    codigobarras: number,
    id_tipoentradasaida: number,
    id_tipoconsumo: number,
    desc_motivo_consumo: string,
    quantidade: number,
    transmitido: number
}

interface TransmissionListContent<LogType> {
    label: string;
    field: keyof LogType;
    dataType: "text" | "localeString";
}

type MotivoConsumo = {
    value: number,
    label: string
}

type ConsumoBodyData = {
    idLoja: number | undefined;
    idProduto: number;
    quantidade: number;
    idTipoConsumo: number;
    ipTerminal: string;
    idUser: number;
}

export default function transmissionScreen() {
    const [openPicker, setOpenPicker] = useState(false);
    const [value, setValue] = useState<number | null>(null);
    const [tiposConsumo, setTiposConsumo] = useState<MotivoConsumo[]>([]);
    const [modalVisible, setModalVisible] = useState(false)
    const [logConsumo, setLogConsumo] = useState<LogConsumo[]>([])
    const [conProps, setConProps] = useState<ConProps>()
    const [transmitModal, setTransmitModal] = useState<boolean>(false)


    const transmissionListContentConfig: TransmissionListContent<LogConsumo>[] = [
        {label: 'Tipo Consumo: ', field: 'desc_motivo_consumo', dataType: "text"},
        {label: 'Código Interno: ', field: 'id_produto', dataType: "text"},
        {label: 'Produto: ', field: 'descricaocompleta', dataType: "text"},
        {label: 'Código de Barras: ', field: 'codigobarras', dataType: "text"},
        {label: 'Quantidade Coletada: ', field: 'quantidade', dataType: "localeString"}]

    const getData = () => {
        const queryTiposConsumo = `
            SELECT 
                id as value,
                descricao as label
            FROM tipoconsumo as label;
        `
        const queryLogConsumo = `
        SELECT DISTINCT
            lc.id,
            p.descricaocompleta,
            lc.id_produto,
            lc.codigobarras,
            lc.id_tipoentradasaida,
            lc.id_tipoconsumo,
            lc.id_tipoconsumo || ' - ' || tc.descricao as desc_motivo_consumo,
            CASE
                WHEN lc.id_tipoentradasaida = 0 THEN lc.quantidade
                WHEN lc.id_tipoentradasaida = 1 THEN -lc.quantidade
            END as quantidade,
            lc.transmitido
        FROM logconsumo as lc
        JOIN produto p ON p.id = lc.id_produto
        JOIN tipoconsumo tc ON tc.id = lc.id_tipoconsumo
        WHERE id_loja = ?
        ORDER BY lc.transmitido, lc.id;
        `

        const conPropsRes = getConProps()
        const tiposConsumoRes = db.getAllSync<MotivoConsumo>(queryTiposConsumo, [])
        const logConsumoRes = db.getAllSync<LogConsumo>(queryLogConsumo, [conPropsRes?.id_currentstore ?? 1])

        setConProps(conPropsRes)
        setTiposConsumo(tiposConsumoRes)
        setLogConsumo(logConsumoRes)
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const handleTransmit = async () => {
        const logConsumoNotTransmit = logConsumo.filter((item) => item.transmitido === 0)

        const bodyData: ConsumoBodyData[] = logConsumoNotTransmit.map((item) => {return {
            idLoja: conProps?.id_currentstore,
            idProduto: item.id_produto,
            quantidade: item.quantidade,
            idTipoConsumo: item.id_tipoconsumo,
            ipTerminal: "192.168.82.30",
            idUser: 66
        }})

        const bodyDataSummedUp = Object.values(bodyData.reduce((acc: { [key: string]: ConsumoBodyData }, item) => {
            const key = `${item.idLoja}-${item.idProduto}-${item.idTipoConsumo}-${item.idUser}-${item.ipTerminal}`;
            
            if (!acc[key]) {
                acc[key] = { ...item };
            } else {
                acc[key].quantidade += item.quantidade;
            }
            
            return acc;
        }, {}));
        
        if(logConsumoNotTransmit.length > 0) {
            try {
                setTransmitModal(true)


                const postResponse = await axios.post<ConsumoBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentoconsumo`, bodyDataSummedUp, {timeout: 60000})
                
                
                if(postResponse.status === 200) {
                    const logConsumoTransmitted = logConsumoNotTransmit.
                                                    filter((consumoNotTransmit) => 
                                                        postResponse.data.map((item) => item.idProduto).includes(consumoNotTransmit.id_produto) &&
                                                        postResponse.data.map((item) => item.idTipoConsumo).includes(consumoNotTransmit.id_tipoconsumo)
                                                    )

                    const logConsumoNotTransmitted = logConsumoNotTransmit.
                                                        filter((consumoNotTransmit) => (
                                                            !postResponse.data.map((item) => item.idProduto).includes(consumoNotTransmit.id_produto) &&
                                                            !postResponse.data.map((item) => item.idTipoConsumo).includes(consumoNotTransmit.id_tipoconsumo)
                                                        ))

                    if(logConsumoNotTransmitted.length > 0) {
                        Alert.alert('Erro', 
                            'Não foi possível transmitir alguns produtos. Verifique se estão com o cadastro ativo', 
                            [{text: 'OK'}])
                    }

                    if(logConsumoTransmitted.length > 0) {
                        const updateQuery = `UPDATE logconsumo SET transmitido = 1 WHERE id IN (${logConsumoTransmitted.map((item) => item.id).join(',')});`
                        await db.execAsync(updateQuery)
                        getData()
                    }
                } else {
                    Alert.alert('Erro', "Erro ao transmitir consumo: " + postResponse, [{text: 'OK'}])
                } 
            } catch (err) {
                Alert.alert("Erro", "Erro ao comunicar com o servidor, verifique a configuração de IP ou conexão com a internet", [{text: 'OK'}])
            } finally {
                setTransmitModal(false)
            }
        }
    }

    const handleOkButton = () => {
        if(value !== null) {
            setModalVisible(false)
            router.navigate(`/estoque/consumo/${value}`)
        }
    }

    const onDelete = (id: number) => {
        const deleteQuery = 'DELETE FROM logconsumo WHERE id = ?;'
        db.runSync(deleteQuery, [id])
        getData()
    }

    return (
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Consumo',
                        headerTitle: 'Consumo',
                        headerRight: () => <ExportTxtData data={logConsumo} fileName="consumo"/>
                        }}
                    />
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View>
                    <Text style={{color: '#888888'}}>Última Sincronização:</Text>
                    <Text style={{ color: '#888888' }}>
                      {conProps !== undefined 
                        ? (new Date(conProps.lastsync)).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : ""}
                    </Text>
                </View>
                <StdButton 
                    title="Transmitir" 
                    icon={<Entypo name="paper-plane" size={24} color="white" />} 
                    style={{position: 'relative', height: 50, width: 175}} 
                    onPress={handleTransmit}/>
            </View>

            <View style={{height: '100%', paddingBottom: 100}}>
                <TransmissionList 
                    style={{marginVertical: 15}}
                    data={logConsumo}
                    onDelete={onDelete}
                    content={transmissionListContentConfig}/>
            </View>          
            
            <StdButton 
                style={{right: 0, bottom:50, width: 60, height: 60, borderRadius: 30}} 
                icon={<Entypo name="plus" size={40} color="white" />}
                onPress={() => setModalVisible(true)}/>

            <ModalMessage 
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                hasOKButton={false}
                title="Consumo"
                titleStyle={{color: '#095E4A'}}
                >
                    <View>
                    <DropDownPicker
                        placeholder="Selecionar Motivo Consumo"
                        open={openPicker}
                        value={value}
                        items={tiposConsumo}
                        setOpen={setOpenPicker}
                        setValue={setValue}
                        setItems={setTiposConsumo}
                        style={{borderColor: '#888888'}}
                        dropDownContainerStyle={{borderColor: '#888888'}}
                        textStyle={{color: '#888888'}}
                    />    
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10}}>
                            <StdButton 
                                title="CANCELAR"
                                style={{position: 'relative', height: 50, width: 125, backgroundColor: 'white', borderColor: '#888888', borderWidth: 1}}
                                titleStyle={{color: '#888888'}}
                                onPress={() => setModalVisible(false)}/>
                            <StdButton 
                                title="OK"
                                style={{position: 'relative', height: 50, width: 125}}
                                onPress={handleOkButton}/>
                        </View>
                    </View>
            </ModalMessage>

            <ModalMessage 
                modalVisible={transmitModal} 
                setModalVisible={setTransmitModal} 
                hasOKButton={false} 
                title='Transmitindo...'
                text='Transmitindo dados, aguarde!'
                icon={<MaterialIcons name="phonelink-ring" size={50} color="black" />}/> 
        </View>
    )
}

const styles = StyleSheet.create({
    textContainer: {
        flexDirection: 'row',
        flexWrap: "wrap"
    },
    textGray: {
        fontSize: 10,
        flexWrap: "wrap",
        color: '#909090'
    },
    textWhite: {
        fontSize: 10,
        flexWrap: "wrap",
        color: 'white'
    }
})