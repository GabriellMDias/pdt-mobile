import ModalMessage from "@/components/ModalMessage"
import StdButton from "@/components/StdButton"
import DropDownPicker, { type ItemType } from 'react-native-dropdown-picker';
import { TransmissionList } from "@/components/TransmissionList"
import { db } from "@/database/database-connection"
import { Entypo, MaterialIcons } from "@expo/vector-icons"
import { router, Stack, useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { View, Text, Alert } from "react-native"
import axios from "axios";
import { ConProps, getConProps } from "@/utils/getConProps";
import { LastSync } from "@/components/LastSync";

interface LogBalancoTotal extends Balanco{
    qtd_transmitida: number,
    qtd_nao_transmitida: number,
    qtd_total: number
}

type LogBalancoItem = {
    id: number
    id_produto: number
    id_balanco: number
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


export default function transmissionScreen(){
    const [conProps, setConProps] = useState<ConProps>()
    const [balancos, setBalancos] = useState<ItemType<number>[]>([])
    const [logBalancoTotal, setLogBalancoTotal] = useState<LogBalancoTotal[]>([])
    const [logBalancoItemsNotTransmit, setLogBalancoItemsNotTransmit] = useState<LogBalancoItem[]>([])
    const [modalBalancoVisible, setModalBalancoVisible] = useState(false)
    const [transmitModal, setTransmitModal] = useState(false)
    const [openPicker, setOpenPicker] = useState(false);
    const [value, setValue] = useState<number | null>(null);

    const transmissionListContentConfig: TransmissionListContent<LogBalancoTotal>[] = [
        {label: 'Balanço: ', field: 'id', dataType: "text"},
        {label: 'Descrição: ', field: 'descricao', dataType: "text"},
        {label: 'Itens Pendentes: ', field: 'qtd_nao_transmitida', dataType: "text"},
        {label: 'Itens Coletados: ', field: 'qtd_total', dataType: "text"}]


    const getData = () => {
        const queryBalancos = `
            SELECT
                id as value,
                id || ' - ' || descricao as label
            FROM balanco
            WHERE id_loja = ?
            AND id_situacaobalanco = 0;
        `

        const queryLogBalancoTotal = `
            SELECT
                b.id,
                b.id_loja,
                b.descricao,
                b.estoque,
                SUM(CASE WHEN lbi.transmitido = 1 THEN 1 ELSE 0 END) AS qtd_transmitida,
                SUM(CASE WHEN lbi.transmitido = 0 THEN 1 ELSE 0 END) AS qtd_nao_transmitida,
                COUNT(lbi.transmitido) AS qtd_total,
                CASE
                    WHEN SUM(CASE WHEN lbi.transmitido = 0 THEN 1 ELSE 0 END) = COUNT(lbi.transmitido) THEN 0
                    WHEN SUM(CASE WHEN lbi.transmitido = 1 THEN 1 ELSE 0 END) = COUNT(lbi.transmitido) THEN 1
                    ELSE 2
                END as transmitido
            FROM logbalancoitem lbi
            JOIN balanco b ON b.id = lbi.id_balanco
            WHERE b.id_loja = ?
            GROUP BY b.id, b.id_loja, b.descricao, b.estoque;
        `

        const queryLogBalancoItemsNotTransmit = `
            SELECT DISTINCT
                lbi.id,
                lbi.id_produto,
                lbi.id_balanco,
                p.descricaocompleta as descricao_produto,
                lbi.codigobarras,
                lbi.id_tipoentradasaida,
                lbi.quantidade,
                lbi.transmitido
            FROM logbalancoitem lbi
            JOIN produto p ON p.id = lbi.id_produto
            WHERE
                lbi.transmitido = 0
            ORDER BY lbi.transmitido, lbi.id;
        `

        const conPropsRes = getConProps()
        const balancosRes = db.getAllSync<ItemType<number>>(queryBalancos, conPropsRes?.id_currentstore ?? 1)
        const logBalancoTotalRes = db.getAllSync<LogBalancoTotal>(queryLogBalancoTotal, conPropsRes?.id_currentstore ?? 1)
        const logBalancoItemRes = db.getAllSync<LogBalancoItem>(queryLogBalancoItemsNotTransmit, [])

        setConProps(conPropsRes)
        setBalancos(balancosRes)
        setLogBalancoTotal(logBalancoTotalRes)
        setLogBalancoItemsNotTransmit(logBalancoItemRes)
    }

    useFocusEffect(
        useCallback(
            getData
    , []))

    const handleTransmit = async () => {
        const bodyData: BalancoBodyData[] = logBalancoItemsNotTransmit.map((item) => {return {
            idLoja: conProps?.id_currentstore,
            idBalanco: item.id_balanco,
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
        
        if(logBalancoItemsNotTransmit.length > 0) {
            try {
                setTransmitModal(true)


                const postResponse = await axios.post<BalancoBodyData[]>(`http://${conProps?.ipint}:${conProps?.portint}/transmit/lancamentobalanco`, bodyDataSummedUp, {timeout: 60000})
                
                
                if(postResponse.status === 200) {
                    const logBalancoItemsTransmitted = logBalancoItemsNotTransmit.
                                                    filter((balancoItemNotTransmit) => 
                                                        postResponse.data.map((item) => item.idProduto).includes(balancoItemNotTransmit.id_produto) &&
                                                        postResponse.data.map((item) => item.idBalanco).includes(balancoItemNotTransmit.id_balanco)
                                                    )

                    const logBalancoItemsNotTransmitted = logBalancoItemsNotTransmit.
                                                        filter((balancoItemNotTransmit) => (
                                                            !postResponse.data.map((item) => item.idProduto).includes(balancoItemNotTransmit.id_produto) &&
                                                            !postResponse.data.map((item) => item.idBalanco).includes(balancoItemNotTransmit.id_balanco)
                                                        ))

                    if(logBalancoItemsNotTransmitted.length > 0) {
                        Alert.alert('Erro', 
                            'Não foi possível transmitir alguns produtos. Verifique se estão com o cadastro ativo', 
                            [{text: 'OK'}])
                    }

                    if(logBalancoItemsTransmitted.length > 0) {
                        const updateQuery = `UPDATE logbalancoitem SET transmitido = 1 WHERE id IN (${logBalancoItemsTransmitted.map((item) => item.id).join(',')});`
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
        const deleteBalancoItemsQuery = `DELETE FROM logbalancoitem WHERE id_balanco = ?`;

        db.runSync(deleteBalancoItemsQuery, [id]);
        getData()
    }

    const handleOk = () => {
        if(value !== null) {
            setModalBalancoVisible(false)
            router.navigate(`/estoque/balanco/lancamento/${value}`)
        }
    }

    const handleCancelLanc = () => {
        setValue(null)
        setModalBalancoVisible(false)
    }

    return (
        <View style={{margin: 15}}>
            <Stack.Screen
                        options={{
                        title: 'Balanco',
                        headerTitle: 'Balanço'
                        }}
                    />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <LastSync />
                <StdButton 
                    title="Transmitir" 
                    icon={<Entypo name="paper-plane" size={24} color="white" />} 
                    style={{position: 'relative', height: 50, width: 175}} 
                    onPress={handleTransmit}/>
            </View>

            <View style={{height: '100%', paddingBottom: 100}}>
                <TransmissionList 
                    style={{marginVertical: 15}}
                    data={logBalancoTotal}
                    onDelete={onDelete}
                    content={transmissionListContentConfig}
                    onPressRoute="/estoque/balanco"
                    />
            </View>

            <StdButton 
                style={{right: 0, bottom:50, width: 60, height: 60, borderRadius: 30}} 
                icon={<Entypo name="plus" size={40} color="white" />}
                onPress={() => setModalBalancoVisible(true)}/>

            <ModalMessage 
                modalVisible={modalBalancoVisible}
                setModalVisible={setModalBalancoVisible}
                hasOKButton={false}
                title="Balanço"
                titleStyle={{color: '#095E4A'}}
                
                >
                    <View style={{flexDirection: 'row'}}>
                        <DropDownPicker
                            placeholder="Selecionar Balanço"
                            open={openPicker}
                            value={value}
                            items={balancos}
                            setOpen={setOpenPicker}
                            setValue={setValue}
                            setItems={setBalancos}
                            style={{borderColor: '#888888'}}
                            dropDownContainerStyle={{borderColor: '#888888'}}
                            textStyle={{color: '#888888'}}
                            searchable={true}
                            translation={{SEARCH_PLACEHOLDER: 'Pesquisar...'}}
                        />    
                        
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