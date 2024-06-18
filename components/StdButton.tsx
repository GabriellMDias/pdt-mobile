import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent, TextStyle } from "react-native";

type Props = {
    style?: StyleProp<ViewStyle>,
    titleStyle?: StyleProp<TextStyle>,
    title?: string, 
    icon?: React.JSX.Element,
    onPress?: (event: GestureResponderEvent) => void
}

export default function StdButton({ style={}, titleStyle={}, title="", icon=<></>, onPress = ()=>{} }: Props) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            {icon}
            {title === "" ? "" : <Text style={[styles.text, titleStyle]}> {title} </Text>}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: "#095E4A"
    },
    text: {
        color: 'white',
        fontSize: 17
    }
})