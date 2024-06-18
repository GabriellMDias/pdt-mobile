import { Stack } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { screensConfig } from "@/constants/ScreensConfig"
import { AntDesign } from '@expo/vector-icons';
import { useCallback, useState } from "react";
import Checkbox from "@/components/Checkbox";
import { db } from "@/database/database-connection";


export default function Favorites() {
    const screensConfigWithoutFav = screensConfig.filter((screen) => screen.id !== 1)
    const [openedScreenGroup, setOpenedScreenGroup] = useState<number[]>([])
    const [favoriteScreensIds, setFavoriteScreensIds] = useState<number[]>()
    
    const getFavorites =  () => {
        const sqlFavoritesQuery = 'SELECT id_screen FROM favoritos;'
        const favoritesRes = db.getAllSync<{id_screen: number}>(sqlFavoritesQuery, [])
        setFavoriteScreensIds(favoritesRes.map((item) => item.id_screen))
    }
    
    useFocusEffect(
        useCallback(
            getFavorites
    , []))
    
    const toggleScreenCheckbox = (screenId: number) => {
        if(favoriteScreensIds?.includes(screenId)) {
            const sqlDeleteQuery = 'DELETE FROM favoritos WHERE id_screen = ?;'
            db.runSync(sqlDeleteQuery, [screenId])
            setFavoriteScreensIds(favoriteScreensIds.filter(id => id !== screenId))
        } else {
            const sqlInsertQuery = 'INSERT INTO favoritos (id_screen) VALUES (?);'
            db.runSync(sqlInsertQuery, [screenId])
            setFavoriteScreensIds([...favoriteScreensIds ?? [], screenId])
        }
    }

    const toggleScreenGroupOpen = (screenGroupId: number) => {
        if (openedScreenGroup.includes(screenGroupId)) {
            // Remover screenGroupId do array openedScreenGroup
            setOpenedScreenGroup(openedScreenGroup.filter(id => id !== screenGroupId));
        } else {
            // Inserir screenGroupId no array openedScreenGroup
            setOpenedScreenGroup([...openedScreenGroup, screenGroupId]);
        }
    }

    if(favoriteScreensIds === undefined) return (
        <View style={styles.loading}>
            <Stack.Screen
                options={{
                title: 'Favorites',
                headerTitle: 'Favoritos'
                }}
            />
            <ActivityIndicator size="large" color="#095E4A"/>
        </View>
    )

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                title: 'Favorites',
                headerTitle: 'Favoritos'
                }}
            />
            <ScrollView>
                {screensConfigWithoutFav.map((screenGroup, index) => {
                    return (
                        <View key={index}>
                            <TouchableOpacity onPress={() => toggleScreenGroupOpen(screenGroup.id)}>
                                <View style={styles.screenGroupItem}>
                                    <AntDesign name={openedScreenGroup.includes(screenGroup.id) ? "down" : "right"} size={24} color="white" />
                                    <Text style={styles.text}>{screenGroup.name}</Text>
                                </View>
                            </TouchableOpacity>  
                            <View style={[styles.screensList, {height: openedScreenGroup.includes(screenGroup.id) ? 'auto': 0}]}>
                                {screenGroup.screens.map((screen, index) => {
                                    return(
                                        <View style={styles.screenItem} key={index}>
                                            <Checkbox value={favoriteScreensIds.includes(screen.id)} color="white" size={35} onPress={() => toggleScreenCheckbox(screen.id)}/>
                                            <Text style={styles.screenName}>
                                                {screen.name}
                                            </Text>
                                        </View>
                                    )
                                })}
                            </View>
                        </View>

                    )
                })}
            </ScrollView>
            
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 15,
        marginTop: 15,
    },
    screenGroupItem: {
        flexDirection: 'row',
        backgroundColor: '#373737'
    },
    screensList: {
        backgroundColor: '#373737'
    },
    screenItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    screenName: {
        color: 'white',
    },
    text: {
        color: '#888888',
        fontWeight: 'bold',
        fontSize: 18
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})