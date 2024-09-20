import { Stack } from "expo-router";
import { View, Text, StyleSheet, Alert, TextInput, Keyboard } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker, { type ItemType } from 'react-native-dropdown-picker';
import StdButton from "@/components/StdButton";
import { Entypo, MaterialIcons } from '@expo/vector-icons';    
import React, { useState, useCallback, useRef } from "react";
import { db } from "@/database/database-connection";
import ModalMessage from "@/components/ModalMessage";
import { TransmissionList } from "@/components/TransmissionList";
import axios from "axios";
import NumberInput from "@/components/NumberInput";
import ExportTxtData from "@/components/ExportTxtData";
import { ConProps, getConProps } from "@/utils/getConProps";


interface ReceitasDropDown extends ItemType<number> {
    decimal: boolean
}

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
    const [receitas, setReceitas] = useState<ReceitasDropDown[]>([]);
    const [modalVisible, setModalVisible] = useState(false)
    const [logProducao, setLogProducao] = useState<LogProducao[]>([])
    const [conProps, setConProps] = useState<ConProps>()
    const [quantityProduced, setQuantityProduced] = useState<string>('')
    const [transmitModal, setTransmitModal] = useState<boolean>(false)

    const dropDownPickerRef = useRef<TextInput>(null);
    const quantityInputRef = useRef<TextInput>(null)
    

    const getData = () => {
        const queryReceitas = `
            SELECT 
                r.id as value,
                r.id_produto || ' - ' || descricao as label,
                p.decimal
            FROM receita r
            JOIN produto p ON p.id = r.id_produto
            ORDER BY r.descricao;
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

        const conPropsRes = getConProps()
        const receitasRes = db.getAllSync<ReceitasDropDown>(queryReceitas, [])
        const logProducaoRes = db.getAllSync<LogProducao>(queryLogProducao, [conPropsRes.id_currentstore])

        setConProps(conPropsRes)
        setReceitas(receitasRes)
        setLogProducao(logProducaoRes)
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const openProductionModal = () => {
        setModalVisible(true)
        setOpenPicker(true)

        setTimeout(() => {
            dropDownPickerRef.current?.focus();  // Foca na caixa de pesquisa
        }, 100);
    }

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
                const postResponse = await axios.post<ProducaoBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentoproducao`, bodyData, {timeout: 1800000})
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
        const quantityProducedWithDot = quantityProduced.replace(",", ".")

        if(value !== undefined && parseFloat(quantityProducedWithDot) > 0) {
            const insertQuery = `INSERT INTO logproducao 
                            (id_loja, id_receita, id_tipoentradasaida, quantidade, transmitido)
                            VALUES
                            (?, ?, ?, ?, ?);`
    
            db.runSync(insertQuery, [conProps?.id_currentstore ?? 1, value, 0, quantityProducedWithDot, 0])
            setValue(null)
            setQuantityProduced("")
            getData()
            setOpenPicker(true)
            setTimeout(() => {
                dropDownPickerRef.current?.focus();  // Foca na caixa de pesquisa
            }, 100);
        }
    }

    const handleCancelLanc = () => {
        setValue(null)
        setQuantityProduced("")
        setModalVisible(false)
    }

    return (
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Producao',
                        headerTitle: 'Producao',
                        headerRight: () => <ExportTxtData data={logProducao} fileName="producao"/>
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
                onPress={openProductionModal}/>

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
                            searchTextInputProps={{ref: dropDownPickerRef}}
                            onSelectItem={() => quantityInputRef.current?.focus()}
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
                            scrollViewProps={{keyboardShouldPersistTaps: "always"}}
                            flatListProps={{keyboardShouldPersistTaps: "always"}}
                        />    
                        
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        <NumberInput 
                            value={quantityProduced} 
                            setValue={setQuantityProduced} 
                            placeholder="Quantidade" 
                            style={{borderColor: '#888888'}} 
                            textInputStyle={{color: 'black'}} 
                            decimal={receitas.find((receita) => receita.value === value)?.decimal}
                            ref={quantityInputRef}/>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10}}>
                        <StdButton 
                            title="CANCELAR"
                            style={{position: 'relative', height: 50, width: 125, backgroundColor: 'white', borderColor: '#888888', borderWidth: 1}}
                            titleStyle={{color: '#888888'}}
                            onPress={handleCancelLanc}/>
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