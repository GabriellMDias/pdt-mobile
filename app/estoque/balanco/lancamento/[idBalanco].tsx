import AddRadio from "@/components/AddRadio";
import NumberInput from "@/components/NumberInput";
import ProductInput from "@/components/ProductInput";
import StdButton from "@/components/StdButton";
import { db } from "@/database/database-connection";
import { ConProps, getConProps } from "@/utils/getConProps";
import { FontAwesome } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { TouchableWithoutFeedback, StyleSheet, View, TextInput, Text, Alert } from "react-native";

type TotalCollectedPerProduct = {
    id: number, 
    transmitido: number,
    total: number    
}

export default function lancamentoBalancoItem() {
    const { idBalanco } = useLocalSearchParams<{idBalanco: string}>()

    const [barCode, setBarcode] = useState("")
    const [quantity, setQuantity] = useState("")
    const [embalagem, setEmbalagem] = useState("1")
    const [suggestBoxVisible, setSuggestBoxVisible] = useState(false);
    const [tipoEmbalagens, setTipoEmbalagens] = useState<{id: number, descricao: string}[]>([])
    const [currentStoreId, setCurrentStoreId] = useState<number>(1)
    const [selectedProduct, setSelectedProduct] = useState<Produto>()
    const [totalCollectedPerProduct, setTotalCollectedPerProduct] = useState<TotalCollectedPerProduct[]>([])
    const [conProps, setConProps] = useState<ConProps>()

    const [add, setAdd] = useState(true)

    const productInputRef = useRef<TextInput>(null)
    const quantityInputRef = useRef<TextInput>(null)
    const embalagemInputRef = useRef<TextInput>(null)

    useEffect(() => {
        getBalancoInfo()
        const conPropsRes = getConProps()
        setConProps(conPropsRes)

        getTotalCollectedPerProduct()
        productInputRef.current?.focus()
    }, [])

    const getBalancoInfo = () => {
        const tipoEmbalagensRes = db.getAllSync<{id: number, descricao: string}>('SELECT id, descricao FROM tipoembalagem;', [])
        setTipoEmbalagens(tipoEmbalagensRes)

        const currentStoreIdRes = db.getFirstSync<{id_currentstore: number}>('SELECT id_currentstore FROM conprops WHERE id = 1;')
        setCurrentStoreId(currentStoreIdRes?.id_currentstore ?? 1)
    }

    const getTotalCollectedPerProduct = () => {
        const logConsumoTotalQuery = `
        SELECT 
            p.id,
            lbi.transmitido,
            SUM(CASE
                WHEN lbi.id_tipoentradasaida = 0 THEN lbi.quantidade
                WHEN lbi.id_tipoentradasaida = 1 THEN -lbi.quantidade
            END) as total           
        FROM logbalancoitem as lbi
        JOIN produto p ON p.id = lbi.id_produto
        WHERE lbi.id_balanco = ?
        GROUP BY p.id, lbi.transmitido;
        `

        if(idBalanco !== undefined) {
            const logConsumoTotalRes = db.getAllSync<TotalCollectedPerProduct>(logConsumoTotalQuery, [idBalanco])
            setTotalCollectedPerProduct(logConsumoTotalRes)
        }
        
    }

    const handleSave = () => {
        if(selectedProduct && Number(quantity.replace(',','.')) > 0 && Number(embalagem.replace(',','.')) > 0) {
            const insertQuery = `INSERT INTO logbalancoitem
                                (
                                    codigobarras, 
                                    id_balanco, 
                                    id_produto,  
                                    id_tipoentradasaida,
                                    quantidade, 
                                    transmitido
                                )
                                VALUES
                                (?, ?, ?, ?, ?, ?);`
            
            const totalQuantity = Number((parseFloat(quantity.replace(',', '.')) * 
            parseFloat(embalagem.replace(',', '.'))).toFixed(3))

            if(!add && totalQuantity > (totalCollectedPerProduct.find((item) => item.id === selectedProduct?.id && item.transmitido === 0)?.total ?? 0) ){
                Alert.alert('Erro', 'Quantidade removida maior que o total coletado!', [
                    {text: 'OK'},
                  ]);
            } else if (idBalanco !== undefined){
                db.runSync(insertQuery, 
                    [selectedProduct.codigobarras, idBalanco, selectedProduct.id, add ? 0 : 1, totalQuantity, 0]
                )
    
    
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
                        title: 'Balanco',
                        headerTitle: 'Balanço',
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
                    ref={productInputRef}
                    setQuantity={setQuantity}/>
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