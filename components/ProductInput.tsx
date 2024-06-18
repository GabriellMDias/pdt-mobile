import { Camera, CameraType, CameraView, FlashMode } from "expo-camera";
import { Stack } from "expo-router";
import React, { useState, forwardRef, useEffect } from "react";
import { View, TouchableOpacity, TextInput, StyleSheet, Text, StyleProp, ViewStyle, ScrollView, Alert } from "react-native";
import { Entypo, Ionicons, Foundation } from '@expo/vector-icons';
import { db } from "@/database/database-connection";
import ModalMessage from "@/components/ModalMessage";

interface ProdutoPlus extends Produto {
    descricaoembalagem: string
}

type componentProps = {
    barCode: string, 
    setBarcode: React.Dispatch<React.SetStateAction<string>>, 
    style: StyleProp<ViewStyle>,
    setSelectedProduct: React.Dispatch<React.SetStateAction<Produto | undefined>>,
    suggestBoxVisible: boolean, 
    setSuggestBoxVisible: React.Dispatch<React.SetStateAction<boolean>>,
    nextRef: React.RefObject<TextInput>
}

const ProductInput = forwardRef<TextInput, componentProps>(({barCode, setBarcode, style, setSelectedProduct, suggestBoxVisible, setSuggestBoxVisible, nextRef}: componentProps, ref) => {
    const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);
    const [cameraOpened, setCameraOpened] = useState(false)
    const [flashOn, setFlashOn] = useState<FlashMode>('off')
    const [facing, setFacing] = useState<CameraType>('back');
    const [filteredProducts, setFilteredProducts] = useState<ProdutoPlus[]>()
    const [errorMsgVisible, setErrorMsgVisible] = useState(false);
    const [products, setProducts] = useState<ProdutoPlus[]>()

    useEffect(() => {
        getProducts()
    }, [])

    const getProducts = () => {
        const query = `
                    SELECT 
                        p.id,
                        p.codigobarras,
                        p.qtdembalagem,
                        p.decimal,
                        p.id_tipoembalagem,
                        tp.descricao as descricaoembalagem,
                        p.descricaocompleta,
                        p.pesobruto,
                        p.permitequebra,
                        p.permiteperda,
                        p.precovenda,
                        p.estoque,
                        p.troca,
                        p.customediocomimposto,
                        p.fabricacaopropria
                    FROM produto p
                    JOIN tipoembalagem tp ON tp.id = p.id_tipoembalagem;
                `
        const productsResult = db.getAllSync<ProdutoPlus>(query, [])
        setProducts(productsResult)
        setFilteredProducts(productsResult.slice(0, 15))
    }

    const getCameraPermissions = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        await Camera.requestMicrophonePermissionsAsync();
        setHasPermission(status === "granted");
    };

    const openCamera = () => {
        getCameraPermissions();
        if (hasPermission === false) {
            alert('Sem acesso à câmera!')
        } else {
            setCameraOpened(true)
        }
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    async function toggleFlash() {
        setFlashOn(current => (current === 'on' ? 'off' : 'on'));
    }

    const handleBarCodeScanned = ({ data }: { data: any }) => {
        setBarcode(data)
        setCameraOpened(false)
        onChangeProductInput(data)
        handleSelectProduct(data)
    };

    const handleSelectProduct = (product: ProdutoPlus | string) => {
        if (typeof product !== 'string'){
            setSuggestBoxVisible(false)
            setBarcode(product.codigobarras.toString())
            setSelectedProduct(product)
            setFilteredProducts([])
            nextRef.current?.focus()
        } else {
            const productFound = products?.find((produto) => produto.codigobarras.toString() === product)
            if (productFound) {
                setSelectedProduct(productFound)
                setBarcode(productFound.codigobarras.toString())
                setSuggestBoxVisible(false)
                setFilteredProducts([])
                nextRef.current?.focus()
            } else {
                const productId = products?.find((produto) => produto.id === Number(product))
                console.log(productId)
                if (productId) {
                    setSelectedProduct(productId)
                    setBarcode(productId.codigobarras.toString())
                    setSuggestBoxVisible(false)
                    setFilteredProducts([])
                    nextRef.current?.focus()
                } else {
                    setErrorMsgVisible(true)
                    setSelectedProduct(undefined)
                    setSuggestBoxVisible(false)
                }
                
            }
        }
    }

    const onChangeProductInput = (input: string) => {
        setBarcode(input)
        setSelectedProduct(undefined)
        setSuggestBoxVisible(true)

        const termos = input.toLowerCase().split(' ');

        const filteredByProductName = new Set(
            products?.filter(produto => {
                const nomeLowerCase = produto.descricaocompleta.toLowerCase();
                return produto.descricaocompleta !== undefined && termos.every(termo => nomeLowerCase.includes(termo));
            })
        );

        const filteredByProductBarCode = new Set(
            products?.filter(produto => {
                return produto.codigobarras !== undefined && termos.every(termo => produto.codigobarras.toString() === termo);
            })
        );

        const filteredById = new Set(
            products?.filter(produto => {
                return produto.id !== undefined && termos.every(termo => produto.id.toString().includes(termo));
            })
        );

        const filteredData = [...filteredById, ...filteredByProductName, ...filteredByProductBarCode];

        const limitedFilteredProducts = filteredData.slice(0, 15)

        setFilteredProducts(limitedFilteredProducts);
    } 

    if (cameraOpened) {
        return (
            <View style={styles.container}>
                <Stack.Screen
                    options={{
                    headerShown: false
                    }}
                 />
                <CameraView
                    onBarcodeScanned={handleBarCodeScanned}
                    style={[StyleSheet.absoluteFillObject, {marginBottom: 50}]}
                    facing = {facing}
                    flash = {flashOn}
                >
                </CameraView>
                <View style={styles.cameraOptions}>
                    <TouchableOpacity onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={40} color="white"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFlash}>
                        <Ionicons name={flashOn === 'on' ? "flash" : "flash-off"} size={40} color="white"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCameraOpened(false)}>
                        <Text style={styles.cameraOptionsText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    } else {
        return (
            <View style={style}>
                <Stack.Screen
                    options={{
                    headerShown: true
                    }}
                />
                <Text style={styles.labelText}>Produto</Text>
                <View style={styles.productInput}>
                    <TextInput
                        style={styles.productInputText} 
                        placeholder="Produto" 
                        placeholderTextColor='#888888'
                        onChangeText={onChangeProductInput}
                        value={barCode}
                        onPressIn={() => {setSuggestBoxVisible(true)}}
                        onSubmitEditing={() => {handleSelectProduct(barCode)}}
                        ref={ref}/>
                    <TouchableOpacity onPress={() => onChangeProductInput("")} style={{position: 'absolute', right: 75}}>
                        <Ionicons name="close" size={30} color="#095E4A" />
                    </TouchableOpacity> 
                    <TouchableOpacity onPress={openCamera}>
                        <Entypo name="camera" size={25} color="white" style={styles.cameraIcon}/>
                    </TouchableOpacity>
                </View>
                {suggestBoxVisible ? <ScrollView style={styles.suggestBox} keyboardShouldPersistTaps="handled">
                    {filteredProducts?.map((produto, index) => {
                        return (<TouchableOpacity key={index} style={styles.suggestBoxItem} onPress={() => handleSelectProduct(produto)}>
                                    <Text style={[styles.suggestBoxText, {flex:1}]}>{produto.id}</Text>
                                    <Text style={[styles.suggestBoxText, {flex:3}]}>{produto.descricaocompleta}</Text>
                                    <Text style={[styles.suggestBoxText, {flex:1}]}>{produto.descricaoembalagem} {produto.qtdembalagem}</Text>
                                </TouchableOpacity>)
                    })}
                </ScrollView> : ''}

                <ModalMessage 
                    modalVisible={errorMsgVisible}
                    setModalVisible={setErrorMsgVisible}
                    title="ERRO!"
                    text="Produto não encontrado"
                    icon={<Foundation name="alert" size={75} color="#095E4A" />}
                    />
            </View>
        );
    }
})

export default ProductInput

const styles = StyleSheet.create({
    container: {
        height: '100%',
    },
    labelText: {
        color: 'white'
    },
    productInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#282825",
        zIndex: 11
    },
    productInputText: {
        flex: 1,
        height: 60,
        borderColor: '#888888',
        borderWidth: 2,
        borderRadius: 5,
        color: 'white',
        paddingHorizontal: 10
    },
    clearInput:{
        position: 'absolute', 
        right: 75
    },
    cameraIcon: {
        backgroundColor: "#095E4A",
        textAlign: 'center',
        textAlignVertical: 'center',
        height: 60,
        width: 70,
        borderRadius: 5
    },
    cameraOptions: {
        flex: 1,
        position: 'absolute',
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 10,
        bottom: 0,
        height: 50,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cameraOptionsText: {
        color: 'white',
        justifyContent: 'center'
    },
    suggestBox: {
        backgroundColor: "#424242",
        borderColor: '#888888',
        borderWidth: 1,
        borderRadius: 5,
        position: 'absolute',
        maxHeight: 250,
        width: '100%',
        zIndex: 10,
        marginTop: 75
    },
    suggestBoxItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 5,
        borderBottomColor: '#888888',
        borderBottomWidth: 0.5,
        borderStyle: "dashed"
    },
    suggestBoxText: {
        color: 'white',
        fontSize: 17,
        flexWrap: 'wrap',
        textAlignVertical: 'center',
        alignItems: "flex-start"
    }
})