import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { FontAwesome } from '@expo/vector-icons';

export default function AddRadio({add, setAdd}: {add: boolean, setAdd: React.Dispatch<React.SetStateAction<boolean>>}) {
    
    return (
        <View style={{flexDirection: 'row', width: '100%', justifyContent: "space-evenly"}}>
                <TouchableOpacity style={{flexDirection: 'row', gap: 5, alignItems: "center"}} onPress={() => setAdd(true)}>
                    <FontAwesome name={add ? "dot-circle-o" : "circle-o"} size={24} color="#095E4A" />
                    <Text style={{color: '#888888'}}>Adicionar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{flexDirection: 'row', gap: 5, alignItems: "center"}} onPress={() => setAdd(false)}>
                    <FontAwesome name={add ? "circle-o" : "dot-circle-o"} size={24} color="#095E4A" />
                    <Text style={{color: '#888888'}}>Remover</Text>
                </TouchableOpacity>
            </View>
    )
}