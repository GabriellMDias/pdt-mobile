import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from "expo-router"
import React from "react"
import { View, Text } from "react-native"



export default function Developing() {

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen
                options={{title:'Não desenvolvido...'}}
            />
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                
                <Text style={{color: "#095E4A"}}>
                    Tela ainda não desenvolvida!
                </Text>
                <MaterialCommunityIcons name="hammer-wrench" size={50} color="#888888" />
            </View>
            
        </View>
    )
}