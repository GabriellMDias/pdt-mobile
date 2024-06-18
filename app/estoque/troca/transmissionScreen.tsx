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
import axios from "axios";
import ExportTxtData from "@/components/ExportTxtData";


type LogTroca = {
    id: number,
    descricaocompleta: string,
    id_produto: number,
    codigobarras: number,
    id_tipoentradasaida: number,
    id_motivotroca: number,
    desc_motivo_troca: string,
    quantidade: number,
    transmitido: number
}

type MotivoTroca = {
    value: number,
    label: string
}

type TrocaBodyData = {
    idLoja: number | undefined;
    idProduto: number;
    quantidade: number;
    idTipoTroca: number;
    ipTerminal: string;
    idUser: number;
}

export default function transmissionScreen() {
    const [openPicker, setOpenPicker] = useState(false);
    const [value, setValue] = useState<number | null>(null);
    const [motivosTroca, setMotivosTroca] = useState<MotivoTroca[]>([]);
    const [modalVisible, setModalVisible] = useState(false)
    const [logTroca, setLogTroca] = useState<LogTroca[]>([])
    const [conProps, setConProps] = useState<ConProps>()
    const [transmitModal, setTransmitModal] = useState<boolean>(false)
    

    const getData = () => {
        const queryConProps = `
            SELECT
                devicename,
                ipint,
                portint,
                ipext,
                portext,
                id_currentstore,
                lastsync
            FROM conprops WHERE id = 1;
        `
        const queryMotivosTroca = `
            SELECT 
                id as value,
                descricao as label
            FROM tipomotivotroca as label;
        `
        const queryLogTroca = `
            SELECT DISTINCT
                lt.id,
                p.descricaocompleta,
                lt.id_produto,
                lt.codigobarras,
                lt.id_tipoentradasaida,
                lt.id_motivotroca,
                lt.id_motivotroca || ' - ' || tmt.descricao as desc_motivo_troca,
                CASE
                    WHEN lt.id_tipoentradasaida = 0 THEN lt.quantidade
                    WHEN lt.id_tipoentradasaida = 1 THEN -lt.quantidade
                END as quantidade,
                lt.transmitido
            FROM logtroca as lt
            JOIN produto p ON p.id = lt.id_produto
            JOIN tipomotivotroca tmt ON tmt.id = lt.id_motivotroca
            WHERE id_loja = ?
            ORDER BY lt.transmitido, lt.id;
        `

        const conPropsRes = db.getFirstSync<ConProps>(queryConProps, [])
        const motivosTrocaRes = db.getAllSync<MotivoTroca>(queryMotivosTroca, [])
        const logTrocaRes = db.getAllSync<LogTroca>(queryLogTroca, [conPropsRes?.id_currentstore ?? 1])

        setConProps(conPropsRes ?? undefined)
        setMotivosTroca(motivosTrocaRes)
        setLogTroca(logTrocaRes)
        
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const handleTransmit = async () => {
        const logTrocaNotTransmit = logTroca.filter((item) => item.transmitido === 0)

        const bodyData: TrocaBodyData[] = logTrocaNotTransmit.map((item) => {return {
            idLoja: conProps?.id_currentstore,
            idProduto: item.id_produto,
            quantidade: item.quantidade,
            idTipoTroca: item.id_motivotroca,
            ipTerminal: "192.168.82.30",
            idUser: 66
        }})

        const bodyDataSummedUp = Object.values(bodyData.reduce((acc: { [key: string]: TrocaBodyData }, item) => {
            const key = `${item.idLoja}-${item.idProduto}-${item.idTipoTroca}-${item.idUser}-${item.ipTerminal}`;
            
            if (!acc[key]) {
                acc[key] = { ...item };
            } else {
                acc[key].quantidade += item.quantidade;
            }
            
            return acc;
        }, {}));

        if (logTrocaNotTransmit.length > 0){
            try {
                setTransmitModal(true)
                const postResponse = await axios.post<TrocaBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentotroca`, bodyDataSummedUp, {timeout: 60000})
                if(postResponse.status === 200) {
                    const logTrocaTransmitted = logTrocaNotTransmit.
                                                    filter((trocaNotTransmit) => 
                                                        postResponse.data.map((item) => item.idProduto).includes(trocaNotTransmit.id_produto) &&
                                                        postResponse.data.map((item) => item.idTipoTroca).includes(trocaNotTransmit.id_motivotroca)
                                                )

                    const logTrocaNotTransmitted = logTrocaNotTransmit.
                                                    filter((trocaNotTransmit) => (
                                                        !postResponse.data.map((item) => item.idProduto).includes(trocaNotTransmit.id_produto) &&
                                                        !postResponse.data.map((item) => item.idTipoTroca).includes(trocaNotTransmit.id_motivotroca))
                                                    )

                    if(logTrocaNotTransmitted.length > 0) {
                        Alert.alert('Erro', 
                            'Não foi possível transmitir alguns produtos. Verifique se estão com o cadastro ativo', 
                            [{text: 'OK'}])
                    }

                    if (logTrocaTransmitted.length > 0) {
                        const updateQuery = `UPDATE logtroca SET transmitido = 1 WHERE id IN (${logTrocaTransmitted.map((item) => item.id).join(',')});`
                        await db.execAsync(updateQuery)
                        getData()
                    }
                } else {
                    Alert.alert('Erro', "Erro ao transmitir troca: " + postResponse, [{text: 'OK'}])
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
            router.navigate(`/estoque/troca/${value}`)
        }
    }

    const onDelete = (id: number) => {
        const deleteQuery = 'DELETE FROM logtroca WHERE id = ?;'
        db.runSync(deleteQuery, [id])
        getData()
    }

    return (
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Troca',
                        headerTitle: 'Troca',
                        headerRight: () => <ExportTxtData data={logTroca} fileName="consumo"/>
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
                    data={logTroca}
                    onDelete={onDelete}
                    content={[
                        {label: 'Motivo Troca: ', field: 'desc_motivo_troca', dataType: "text"},
                        {label: 'Código Interno: ', field: 'id_produto', dataType: "text"},
                        {label: 'Produto: ', field: 'descricaocompleta', dataType: "text"},
                        {label: 'Código de Barras: ', field: 'codigobarras', dataType: "text"},
                        {label: 'Quantidade Coletada: ', field: 'quantidade', dataType: "localeString"}]}/>
            </View>          
            
            <StdButton 
                style={{right: 0, bottom:50, width: 60, height: 60, borderRadius: 30}} 
                icon={<Entypo name="plus" size={40} color="white" />}
                onPress={() => setModalVisible(true)}/>

            <ModalMessage 
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                hasOKButton={false}
                title="TROCA"
                titleStyle={{color: '#095E4A'}}
                >
                    <View>
                    <DropDownPicker
                        placeholder="Selecionar Motivo Troca"
                        open={openPicker}
                        value={value}
                        items={motivosTroca}
                        setOpen={setOpenPicker}
                        setValue={setValue}
                        setItems={setMotivosTroca}
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