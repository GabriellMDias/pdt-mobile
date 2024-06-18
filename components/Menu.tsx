import { router } from "expo-router"
import React, { useRef, useState } from "react"
import { Animated, TouchableOpacity, View, Text, StyleSheet, ScrollView } from "react-native"
import { screensConfig } from "@/constants/ScreensConfig"
import { AntDesign } from '@expo/vector-icons';

export default function Menu( {selectedScreenId}:{selectedScreenId:number}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuAnim = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        Animated.timing(menuAnim, {
          toValue: isMenuOpen ? 0 : 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        setIsMenuOpen(!isMenuOpen);
      }

    const changeScreen = (screenId: number, selectedScreenId: number) =>{
        if(screenId === 1 && screenId !== selectedScreenId) {
            router.replace('/home')
        } else if (screenId !== selectedScreenId){
            router.replace(`/screensmenu/${screenId}`)
        }
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    bottom: menuAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-65%', '-0%'],
                    })
                }
            ]}
        >
            <TouchableOpacity 
                style={styles.menuButton}
                onPress={toggleMenu}
            >
                <Text style={styles.menuText}>MENU</Text>
                <Text style={styles.menuIcon}>
                    {isMenuOpen ? 
                    <AntDesign name="down" size={24} color="white" /> : 
                    <AntDesign name="up" size={24} color="white" />}
                </Text>
            </TouchableOpacity>
            <ScrollView style={styles.menuItemsContainer}>
                {screensConfig.map((screen, index) => (
                    <View 
                        key={index} 
                        style={styles.menuItemContainer}
                    >
                        <TouchableOpacity 
                            style={[styles.menuItemLink, selectedScreenId === screen.id ? {backgroundColor: 'rgba(255, 255, 255, 0.2)'} : {} ]}
                            onPress={() => changeScreen(screen.id, selectedScreenId)}
                        >
                            <View style={styles.menuItem}>
                                {screen.icon(20, 'white')}
                                <Text style={styles.menuItemText}>{screen.name}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                ))}
                
            </ScrollView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        backgroundColor: "#095E4A",
        alignItems: 'center',
        zIndex: 1,
        height: '70%',
    },
    menuButton: {
        position: 'absolute',
        top: -20,
        backgroundColor: "#095E4A", 
        alignContent: 'center', 
        justifyContent: 'center',
        alignItems: 'center', 
        width: 100, 
        height: 80, 
        borderRadius: 50,
        zIndex: 2
    },
    menuText: {
        fontSize: 12,
        color: 'white',
        top: -10
    },
    menuIcon: {
        fontSize: 30,
        color: 'white',
        top: -10
    },
    menuItemsContainer: {
        marginTop: 60,
        width: '75%',
    },
    menuItemContainer: {
        paddingVertical: 5,
        borderBottomColor: "#888888",
        borderBottomWidth: 1,
    },
    menuItemLink: {
        flexDirection: 'row',
        borderRadius: 15,
        height: 35,
        alignItems: 'center'
    },
    menuItemText: {
        color: 'white',
        fontSize: 20,
        paddingLeft: 20
    },
    menuItem: {
        flexDirection: 'row',
        left: '25%',
        alignItems: 'center'
    }
});