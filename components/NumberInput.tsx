import { TextInput, StyleSheet, View, Text,NativeSyntheticEvent, TextInputSubmitEditingEventData, StyleProp, ViewStyle, TextStyle  } from "react-native";
import { forwardRef } from "react";

type componentProps = {
    value?: string, 
    setValue?: React.Dispatch<React.SetStateAction<string>>, 
    placeholder?: string, 
    label?: string, 
    editable?: boolean,
    onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void | undefined,
    decimal?: boolean
    style?: StyleProp<ViewStyle>
    labelStyle?: StyleProp<TextStyle>
    textInputStyle?: StyleProp<TextStyle>
}

const NumberInput = forwardRef<TextInput, componentProps>(
    ({value = '', setValue = () => {}, placeholder = '', label = '', editable = true, onSubmitEditing = undefined, decimal = false, style = {}, labelStyle = {}, textInputStyle = {}}: componentProps, ref) => {
    
    const onChangeText = (text: string) => {
        if(!decimal) {
            const integerInput = text.replace(",","").replace(".","")
            setValue(integerInput)
        } else {
            setValue(text)
        }
        
    }

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.labelText, labelStyle]}>
                {label}
            </Text>
            <TextInput 
                style={[styles.inputStyle, {borderColor: editable ? '#888888' : '#747474', borderWidth: editable ? 2 : 1,}, textInputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={editable ? '#888888' : '#747474'}
                placeholder={placeholder}
                keyboardType="numeric"
                
                editable={editable}
                onSubmitEditing={onSubmitEditing}
                ref={ref}
            />
        </View>
    )
})

export default NumberInput

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    labelText: {
        color: 'white',
        fontSize: 15
    },
    inputStyle: {
        height: 60,
        borderRadius: 5,
        color: 'white',
        paddingHorizontal: 10
    }
})