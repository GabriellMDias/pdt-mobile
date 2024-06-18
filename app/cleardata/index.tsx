import { Stack, router } from "expo-router";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { screensConfig } from "@/constants/ScreensConfig"
import { useState } from "react";
import Checkbox from "@/components/Checkbox";
import { db } from "@/database/database-connection";
import StdButton from "@/components/StdButton";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import ModalMessage from "@/components/ModalMessage";


export default function ClearData() {
    const [selectedScreensIds, setSelectedScreensIds] = useState<number[]>([])
    const [deleteModal, setDeleteModal] = useState<boolean>(false)

    const screensGroupWithTable = screensConfig.map(group => {
        const filteredScreens = group.screens.filter(screen => screen.table !== null);
        return {
            ...group,
            screens: filteredScreens
        };
    }).filter(group => group.screens.length > 0);

    const screenWithTable = screensConfig.flatMap(group => 
        group.screens.filter(screen => screen.table !== null)
    );

    const toggleScreenCheckbox = (screenId: number) => {
        
        if(selectedScreensIds?.includes(screenId)) {
            setSelectedScreensIds(selectedScreensIds.filter(id => id !== screenId))
        } else {
            const newSelectedScreensIds = [...selectedScreensIds ?? [], screenId]
            setSelectedScreensIds(newSelectedScreensIds)
        }
    }

    const handleDeleteData = () => {
        if(selectedScreensIds.length > 0) {
            const tablesToDelete = screenWithTable.filter((item) => selectedScreensIds.includes(item.id)).map((item) => item.table)
            const deleteTableQueries = tablesToDelete.map(item => `DELETE FROM ${item};`)
            const resetIdQueries = tablesToDelete.map(item => `DELETE FROM sqlite_sequence WHERE name = '${item}';`)

            setDeleteModal(true)
            deleteTableQueries.map((query) => {
                db.runSync(query)
            })
            resetIdQueries.map((query) => {
                db.runSync(query)
            })
            setDeleteModal(false)
            router.replace("/home")
        }
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                title: 'Limpar Dados',
                headerTitle: 'Limpar Dados'
                }}
            />
            <ScrollView contentContainerStyle={styles.background}>
                {screensGroupWithTable.map((screenGroup) => 
                    <View key={screenGroup.id}> 
                        <Text style={styles.screenGroupName}>
                            {screenGroup.name}    
                        </Text>    
                        {screenGroup.screens.map((screen) =>
                            <View style={styles.screenItem} key={screen.id}>
                                <Checkbox value={selectedScreensIds.includes(screen.id)} color="white" size={30} onPress={() => toggleScreenCheckbox(screen.id)}/>
                                <Text style={styles.screenName}>
                                    {screen.name}
                                </Text>
                            </View>
                            ) 
                        }
                    </ View>
                )}
                <View style={styles.buttonsView}>
                    <StdButton 
                        title="Excluir"
                        style={styles.button}
                        icon={<AntDesign name="delete" size={24} color="white"/>}
                        onPress={handleDeleteData}
                    />
                </View>    
            </ ScrollView>

            <ModalMessage 
                modalVisible={deleteModal} 
                setModalVisible={setDeleteModal} 
                hasOKButton={false} 
                title='Limpando dados...'
                icon={<MaterialIcons name="phonelink-ring" size={50} color="black" />}/> 
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 15,
        marginTop: 15,
    },
    background: {
        backgroundColor: '#373737',
        padding: 10,
    },
    screenGroupName: {
        backgroundColor: '#095E4A',
        textAlign: 'center',
        marginHorizontal: 100,
        borderRadius: 10,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18
    },
    screenItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    screenName: {
        color: 'white',
    },
    button: {
        position: 'relative',
        paddingVertical: 5,
        paddingHorizontal: 25
    },
    buttonsView: {
        flexDirection: 'row',
        justifyContent: 'center'
    }
})