import { Stack } from "expo-router";
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
import NumberInput from "@/components/NumberInput";
import ExportTxtData from "@/components/ExportTxtData";


type LogProducao = {
    id: number,
    id_receita: number,
    descricaoreceita: string,
    id_produto: number,
    id_tipoentradasaida: number,
    quantidade: number,
    transmitido: number
}

type ProducaoBodyData = {
    idLoja: number | undefined;
    idProduto: number;
    quantidade: number;
    ipTerminal: string;
    idUser: number;
}


export default function transmissionScreen() {
    const [openPicker, setOpenPicker] = useState(false);
    const [value, setValue] = useState<number | null>(null);
    const [receitas, setReceitas] = useState<{value: number,label: string}[]>([]);
    const [modalVisible, setModalVisible] = useState(false)
    const [logProducao, setLogProducao] = useState<LogProducao[]>([])
    const [conProps, setConProps] = useState<ConProps>()
    const [quantityProduced, setQuantityProduced] = useState<string>('')
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
        const queryReceitas = `
            SELECT 
                id as value,
                id_produto || ' - ' || descricao as label
            FROM receita
            ORDER BY descricao;
        `

        const queryLogProducao = `
            SELECT DISTINCT
                lp.id,
                lp.id_receita,
                r.descricao as descricaoreceita,
                r.id_produto,
                lp.id_tipoentradasaida,
                CASE
                    WHEN lp.id_tipoentradasaida = 0 THEN lp.quantidade
                    WHEN lp.id_tipoentradasaida = 1 THEN -lp.quantidade
                END as quantidade,
                lp.transmitido
            FROM logproducao as lp
            JOIN receita r ON r.id = lp.id_receita
            WHERE lp.id_loja = ?
            ORDER BY lp.transmitido, lp.id;
        `

        const conPropsRes = db.getFirstSync<ConProps>(queryConProps, [])
        const receitasRes = db.getAllSync<{value: number,label: string}>(queryReceitas, [])
        const logProducaoRes = db.getAllSync<LogProducao>(queryLogProducao, [conPropsRes?.id_currentstore ?? 1])

        setConProps(conPropsRes ?? undefined)
        setReceitas(receitasRes)
        setLogProducao(logProducaoRes)
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const handleTransmit = async () => {
        const logProducaoNotTransmit = logProducao.filter((item) => item.transmitido === 0)

        const bodyData: ProducaoBodyData[] = logProducaoNotTransmit.map((item) => {return {
            idLoja: conProps?.id_currentstore,
            idProduto: item.id_produto,
            quantidade: item.quantidade,
            ipTerminal: "192.168.82.30",
            idUser: 66
        }})

        if(logProducaoNotTransmit.length > 0) {
            try {
                setTransmitModal(true)
                const postResponse = await axios.post<ProducaoBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentoproducao`, bodyData, {timeout: 60000})
                if(postResponse.status === 200) {
                    const logProducaoTransmitted = logProducaoNotTransmit.filter((producaoNotTransmit) => postResponse.data.map((item) => item.idProduto).includes(producaoNotTransmit.id_produto))
                    const logProducaoNotTransmitted = logProducaoNotTransmit.filter((producaoNotTransmit) => !postResponse.data.map((item) => item.idProduto).includes(producaoNotTransmit.id_produto))

                    if(logProducaoNotTransmitted.length > 0) {
                        Alert.alert('Erro', 
                            'Não foi possível transmitir alguns produtos. Verifique se estão com o cadastro ativo', 
                            [{text: 'OK'}])
                    }

                    if(logProducaoTransmitted.length > 0) {
                        const updateQuery = `UPDATE logproducao SET transmitido = 1 WHERE id IN (${logProducaoTransmitted.map((item) => item.id).join(',')});`
                        await db.execAsync(updateQuery)
                        getData()
                    }
                } else {
                    Alert.alert('Erro', "Erro ao transmitir producao: " + postResponse, [{text: 'OK'}])
                } 
            } catch (err) {
                Alert.alert("Erro", "Erro ao comunicar com o servidor, verifique a configuração de IP ou conexão com a internet", [{text: 'OK'}])
            } finally {
                setTransmitModal(false)
            }
        }
    }


    const onDelete = (id: number) => {
        const deleteQuery = 'DELETE FROM logproducao WHERE id = ?'
        db.runSync(deleteQuery, [id])
        getData()
    }

    const handleOk = () => {
        if(value !== undefined && parseFloat(quantityProduced) > 0) {
            const insertQuery = `INSERT INTO logproducao 
                            (id_loja, id_receita, id_tipoentradasaida, quantidade, transmitido)
                            VALUES
                            (?, ?, ?, ?, ?);`
    
            db.runSync(insertQuery, [conProps?.id_currentstore ?? 1, value, 0, quantityProduced, 0])
            setValue(null)
            setQuantityProduced("")
            getData()
        }
    }

    return (
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Producao',
                        headerTitle: 'Producao',
                        headerRight: () => <ExportTxtData data={logProducao} fileName="consumo"/>
                        }}
                    />
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View>
                    <Text style={{color: '#888888'}}>Última Sincronização:</Text>
                    <Text style={{color: '#888888'}}>
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
                    data={logProducao}
                    onDelete={onDelete}
                    content={[
                        {label: 'Receita: ', field: 'descricaoreceita', dataType: "text"},
                        {label: 'Quantidade Produzida: ', field: 'quantidade', dataType: "localeString"}]}/>
            </View>          
            
            <StdButton 
                style={{right: 0, bottom:50, width: 60, height: 60, borderRadius: 30}} 
                icon={<Entypo name="plus" size={40} color="white" />}
                onPress={() => setModalVisible(true)}/>

            <ModalMessage 
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                hasOKButton={false}
                title="PRODUÇÃO"
                titleStyle={{color: '#095E4A'}}
                
                >
                    <View style={{flexDirection: 'row'}}>
                        <DropDownPicker
                            placeholder="Selecionar Produto"
                            open={openPicker}
                            value={value}
                            items={receitas}
                            setOpen={setOpenPicker}
                            setValue={setValue}
                            setItems={setReceitas}
                            style={{borderColor: '#888888'}}
                            dropDownContainerStyle={{borderColor: '#888888'}}
                            textStyle={{color: '#888888'}}
                            searchable={true}
                            translation={{SEARCH_PLACEHOLDER: 'Pesquisar...'}}
                        />    
                        
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        <NumberInput value={quantityProduced} setValue={setQuantityProduced} placeholder="Quantidade" style={{borderColor: '#888888'}} textInputStyle={{color: 'black'}} decimal={true}/>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10}}>
                        <StdButton 
                            title="CANCELAR"
                            style={{position: 'relative', height: 50, width: 125, backgroundColor: 'white', borderColor: '#888888', borderWidth: 1}}
                            titleStyle={{color: '#888888'}}
                            onPress={() => setModalVisible(false)}/>
                        <StdButton 
                            title="OK"
                            style={{position: 'relative', height: 50, width: 125}}
                            onPress={handleOk}/>
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