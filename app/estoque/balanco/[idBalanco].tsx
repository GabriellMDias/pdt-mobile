import ExportTxtData from "@/components/ExportTxtData"
import ModalMessage from "@/components/ModalMessage"
import StdButton from "@/components/StdButton"
import { TransmissionList } from "@/components/TransmissionList"
import { db } from "@/database/database-connection"
import { ConProps, getConProps } from "@/utils/getConProps"
import { Entypo, MaterialIcons } from "@expo/vector-icons"
import axios from "axios"
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useCallback, useState } from "react"
import { View, Text, Alert } from "react-native"

type LogBalancoItem = {
    id: number
    id_produto: number
    descricao_produto: string
    codigobarras: number
    id_tipoentradasaida: number
    quantidade: number
    transmitido: number
}

type BalancoBodyData = {
    idLoja: number | undefined;
    idBalanco: number;
    idProduto: number;
    quantidade: number;
    ipTerminal: string;
    idUser: number;
}

export default function balancoItems() {
    const { idBalanco } = useLocalSearchParams<{idBalanco: string}>()

    const [conProps, setConProps] = useState<ConProps>()
    const [logBalancoItem, setLogBalancoItem] = useState<LogBalancoItem[]>([])
    const [transmitModal, setTransmitModal] = useState(false)

    const transmissionListContentConfig: TransmissionListContent<LogBalancoItem>[] = [
        {label: 'Código Interno: ', field: 'id_produto', dataType: "text"},
        {label: 'Descrição: ', field: 'descricao_produto', dataType: "text"},
        {label: 'Código de Barras: ', field: 'codigobarras', dataType: "text"},
        {label: 'Quantidade coletada: ', field: 'quantidade', dataType: "text"}
    ]

    const getData = () => {
        const queryLogBalancoItem = `
            SELECT DISTINCT
                lbi.id,
                lbi.id_produto,
                p.descricaocompleta as descricao_produto,
                lbi.codigobarras,
                lbi.id_tipoentradasaida,
                CASE
                    WHEN lbi.id_tipoentradasaida = 0 THEN lbi.quantidade
                    WHEN lbi.id_tipoentradasaida = 1 THEN -lbi.quantidade
                END as quantidade,
                lbi.transmitido
            FROM logbalancoitem lbi
            JOIN produto p ON p.id = lbi.id_produto
            WHERE
                lbi.id_balanco = ?
            ORDER BY lbi.transmitido, lbi.id;
        `

        if(idBalanco !== undefined) {
            const conPropsRes = getConProps()
            const logBalancoItemRes = db.getAllSync<LogBalancoItem>(queryLogBalancoItem, [idBalanco])

            setConProps(conPropsRes)
            setLogBalancoItem(logBalancoItemRes)
        }
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const handleTransmit = async () => {
        if(idBalanco === undefined) {
            return
        }

        const logBalancoItemNotTransmit = logBalancoItem.filter((item) => item.transmitido === 0)

        const bodyData: BalancoBodyData[] = logBalancoItemNotTransmit.map((item) => {return {
            idLoja: conProps?.id_currentstore,
            idBalanco: parseInt(idBalanco),
            idProduto: item.id_produto,
            quantidade: item.quantidade,
            ipTerminal: "192.168.82.30",
            idUser: 66
        }})

        const bodyDataSummedUp = Object.values(bodyData.reduce((acc: { [key: string]: BalancoBodyData }, item) => {
            const key = `${item.idLoja}-${item.idBalanco}-${item.idProduto}-${item.idUser}-${item.ipTerminal}`;
            
            if (!acc[key]) {
                acc[key] = { ...item };
            } else {
                acc[key].quantidade += item.quantidade;
            }
            
            return acc;
        }, {}));
        
        if(logBalancoItemNotTransmit.length > 0) {
            try {
                setTransmitModal(true)


                const postResponse = await axios.post<BalancoBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentobalanco`, bodyDataSummedUp, {timeout: 1800000})
                
                
                if(postResponse.status === 200) {
                    const logBalancoItemTransmitted = logBalancoItemNotTransmit.
                                                    filter((balancoItemNotTransmit) => 
                                                        postResponse.data.map((item) => item.idProduto).includes(balancoItemNotTransmit.id_produto)
                                                    )

                    const logBalancoItemNotTransmitted = logBalancoItemNotTransmit.
                                                        filter((balancoItemNotTransmit) => (
                                                            !postResponse.data.map((item) => item.idProduto).includes(balancoItemNotTransmit.id_produto)
                                                        ))

                    if(logBalancoItemNotTransmitted.length > 0) {
                        Alert.alert('Erro', 
                            'Não foi possível transmitir alguns produtos. Verifique se estão com o cadastro ativo', 
                            [{text: 'OK'}])
                    }

                    if(logBalancoItemTransmitted.length > 0) {
                        const updateQuery = `UPDATE logbalancoitem SET transmitido = 1 WHERE id IN (${logBalancoItemTransmitted.map((item) => item.id).join(',')});`
                        await db.execAsync(updateQuery)
                        getData()
                    }
                } else {
                    Alert.alert('Erro', "Erro ao transmitir balanco: " + postResponse, [{text: 'OK'}])
                } 
            } catch (err) {
                Alert.alert("Erro", "Erro ao comunicar com o servidor, verifique a configuração de IP ou conexão com a internet", [{text: 'OK'}])
            } finally {
                setTransmitModal(false)
            }
        }
    }

    const onDelete = async (id: number) => {
        const deleteBalancoItemsQuery = `DELETE FROM logbalancoitem WHERE id = ?`;

        db.runSync(deleteBalancoItemsQuery, [id]);
        getData()
    }

    return(
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Balanco',
                        headerTitle: 'Balanço',
                        headerRight: () => <ExportTxtData data={logBalancoItem} fileName="balanco"/>
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
                    data={logBalancoItem}
                    onDelete={onDelete}
                    content={transmissionListContentConfig}/>
            </View>

            <StdButton 
                style={{right: 0, bottom:50, width: 60, height: 60, borderRadius: 30}} 
                icon={<Entypo name="plus" size={40} color="white" />}
                onPress={() => router.navigate(`/estoque/balanco/lancamento/${idBalanco}`)}/>

            {/*Modal de transmissão*/}
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