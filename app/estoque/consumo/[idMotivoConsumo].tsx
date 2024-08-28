import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableWithoutFeedback, TextInput, Alert } from "react-native";
import NumberInput from "@/components/NumberInput"
import { FontAwesome } from '@expo/vector-icons';
import ProductInput from "@/components/ProductInput";
import AddRadio from "@/components/AddRadio";
import StdButton from "@/components/StdButton";
import { Stack, useLocalSearchParams } from "expo-router";
import { db } from "@/database/database-connection";
import { ConProps, getConProps } from "@/utils/getConProps";

type TotalCollectedPerProduct = {
    id: number, 
    transmitido: number,
    total: number    
}

export default function consumo() {
    const { idMotivoConsumo } = useLocalSearchParams<{ idMotivoConsumo: string }>();

    const [barCode, setBarcode] = useState("")
    const [quantity, setQuantity] = useState("")
    const [embalagem, setEmbalagem] = useState("1")
    const [selectedProduct, setSelectedProduct] = useState<Produto>()
    const [suggestBoxVisible, setSuggestBoxVisible] = useState(false);
    const [tipoEmbalagens, setTipoEmbalagens] = useState<{id: number, descricao: string}[]>([])
    const [currentStoreId, setCurrentStoreId] = useState<number>(1)
    const [totalCollectedPerProduct, setTotalCollectedPerProduct] = useState<TotalCollectedPerProduct[]>([])
    const [conProps, setConProps] = useState<ConProps>()

    const [add, setAdd] = useState(true)

    const productInputRef = useRef<TextInput>(null)
    const quantityInputRef = useRef<TextInput>(null)
    const embalagemInputRef = useRef<TextInput>(null)

    useEffect(() => {
        getConsumoInfo()
        const conPropsRes = getConProps()
        setConProps(conPropsRes)
        getTotalCollectedPerProduct()
        productInputRef.current?.focus()
    }, [])

    const getConsumoInfo = () => {
        const tipoEmbalagensRes = db.getAllSync<{id: number, descricao: string}>('SELECT id, descricao FROM tipoembalagem;', [])
        setTipoEmbalagens(tipoEmbalagensRes)

        const currentStoreIdRes = db.getFirstSync<{id_currentstore: number}>('SELECT id_currentstore FROM conprops WHERE id = 1;')
        setCurrentStoreId(currentStoreIdRes?.id_currentstore ?? 1)
    }

    const getTotalCollectedPerProduct = () => {
        const logConsumoTotalQuery = `
        SELECT 
            p.id,
            lc.transmitido,
            SUM(CASE
                WHEN id_tipoentradasaida = 0 THEN lc.quantidade
                WHEN id_tipoentradasaida = 1 THEN - lc.quantidade
            END) as total           
        FROM logconsumo as lc
        JOIN produto p ON p.id = lc.id_produto
        JOIN tipoconsumo tc ON tc.id = lc.id_tipoconsumo
        WHERE id_loja = ? AND lc.id_tipoconsumo = ?
        GROUP BY p.id, lc.transmitido;
        `

        const logConsumoTotalRes = db.getAllSync<TotalCollectedPerProduct>(logConsumoTotalQuery, [conProps?.id_currentstore ?? 1, idMotivoConsumo ?? 1])
        setTotalCollectedPerProduct(logConsumoTotalRes)
    }

    const handleSave = () => {
        if(selectedProduct && Number(quantity.replace(',','.')) > 0 && Number(embalagem.replace(',','.')) > 0) {
            const insertQuery = `INSERT INTO logconsumo
                                (id_loja, codigobarras, id_produto, id_tipoentradasaida, id_tipoconsumo, quantidade, transmitido)
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?);`
            
            const totalQuantity = Number((parseFloat(quantity.replace(',', '.')) * 
            parseFloat(embalagem.replace(',', '.'))).toFixed(3))

            const idMotivoConsumoFixed = idMotivoConsumo === undefined ? 1 : idMotivoConsumo

            if(!add && totalQuantity > (totalCollectedPerProduct.find((item) => item.id === selectedProduct?.id && item.transmitido === 0)?.total ?? 0) ){
                Alert.alert('Erro', 'Quantidade removida maior que o total coletado!', [
                    {text: 'OK'},
                  ]);
            } else {
                db.runSync(insertQuery, 
                    [currentStoreId, selectedProduct.codigobarras, selectedProduct.id, add ? 0 : 1, idMotivoConsumoFixed, totalQuantity, 0]
                )

                console.log(currentStoreId, selectedProduct.codigobarras, selectedProduct.id, add ? 0 : 1, idMotivoConsumoFixed, totalQuantity, 0)
    
    
                setBarcode("")
                setQuantity("")
                setEmbalagem("1")
                setSelectedProduct(undefined)
                getTotalCollectedPerProduct()
                productInputRef.current?.focus()
            } 
        }
    }


    return (
        <TouchableWithoutFeedback onPress={() => setSuggestBoxVisible(false)}>
            <View style={styles.container}>
                <Stack.Screen
                        options={{
                        title: 'Consumo',
                        headerTitle: 'Consumo',
                        }}
                    />
                <StdButton 
                    style={styles.saveButton} 
                         title="Salvar" 
                         icon={<FontAwesome name="save" 
                         size={24} 
                         color="white" />}
                         onPress={handleSave}/>
                <ProductInput 
                    barCode={barCode} 
                    setBarcode={setBarcode} 
                    style={{marginTop: 40}} 
                    setSelectedProduct={setSelectedProduct}
                    suggestBoxVisible={suggestBoxVisible}
                    setSuggestBoxVisible={setSuggestBoxVisible}
                    nextRef={quantityInputRef}
                    ref={productInputRef}/>
                <View style={styles.inputRow}>
                    <NumberInput 
                        placeholder="Quantidade" 
                        value={quantity} 
                        setValue={setQuantity} 
                        label="Quantidade"
                        onSubmitEditing={() => embalagemInputRef.current?.focus()}
                        decimal={selectedProduct?.decimal}
                        ref={quantityInputRef}/>
                    <NumberInput 
                        placeholder="Embalagem" 
                        value={embalagem} 
                        setValue={setEmbalagem} 
                        label="Embalagem"
                        decimal={false}
                        ref={embalagemInputRef}/>
                    <NumberInput 
                        placeholder="Total" 
                        value={
                            (parseFloat(quantity.replace(',', '.')) * 
                            parseFloat(embalagem.replace(',', '.'))).toString() === 'NaN' ? '0' 
                            : (parseFloat(quantity.replace(',', '.')) * 
                            parseFloat(embalagem.replace(',', '.'))).
                                toLocaleString('pt-br', {maximumFractionDigits: 3})} 
                        label="Total" editable={false}/>
                </View>
                <View style={styles.inputRow}>
                    <NumberInput 
                        placeholder="Quantidade Caixa" 
                        label="Quantidade Caixa" 
                        editable={false}/>
                    <NumberInput 
                        placeholder="Peso Caixa" 
                        label="Peso Caixa" 
                        editable={false}/>
                </View>
                <View style={styles.inputRatio}>
                    <AddRadio add={add} setAdd={setAdd}/>
                </View>
                <Text style={styles.prodName}>{selectedProduct?.descricaocompleta}</Text>
                <View style={styles.prodInfo}>
                    <View style={styles.inputRow}>
                        <NumberInput 
                            placeholder="Embalagem" 
                            value={selectedProduct ? 
                                tipoEmbalagens.filter((item) => item.id === selectedProduct?.id_tipoembalagem)[0].descricao + 
                                '/' + selectedProduct?.qtdembalagem.toString() : ""}
                            label="Embalagem" 
                            editable={false}/>
                        <NumberInput 
                            placeholder="Estoque" 
                            value={selectedProduct?.estoque.toString().replace('.', ',')}
                            label="Estoque" 
                            editable={false}/>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={styles.inputRow}>
                            <NumberInput 
                                placeholder="Preço Venda" 
                                value={'R$ ' +
                                    (Number(selectedProduct?.precovenda).toFixed(2).replace('.',',') === 'NaN' ? 
                                    ''
                                    : Number(selectedProduct?.precovenda).toFixed(2).replace('.',','))}
                                label="Preço Venda" 
                                editable={false}/>
                            <NumberInput 
                                placeholder="Preço Custo" 
                                value={'R$ ' +
                                    (Number(selectedProduct?.customediocomimposto).toFixed(2).replace('.',',') === 'NaN' ? 
                                    ''
                                    : Number(selectedProduct?.customediocomimposto).toFixed(2).replace('.',','))}
                                label="Preço Custo"
                                editable={false}/>
                            <NumberInput 
                                placeholder="Coletados" 
                                value={totalCollectedPerProduct.filter((item) => item.id === selectedProduct?.id).reduce((prev, current) => prev + current.total, 0).toFixed(3).replace('.',',')}
                                label="Coletados" 
                                editable={false}/>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
        
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 15,
        marginTop: 15
    },
    saveButton: {
        alignSelf: "flex-end",
        height: 50, 
        width: 120
    },
    inputRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 10,
        marginVertical: 5
    },
    inputRatio: {
        marginVertical: 20
    },
    prodInfo: {
        paddingHorizontal: 15,
        width: '100%',
        backgroundColor: '#121212',
    },
    prodName: {
        backgroundColor: '#121212',
        color: 'white',
        fontSize: 20,
        paddingHorizontal: 15,
        flexWrap: 'wrap'
    }

})