import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';

type CheckboxProps = {
    value?: boolean
    setValue?: React.Dispatch<React.SetStateAction<boolean>>
    color?: string
    size?: number
    onPress?: (event: GestureResponderEvent) => void
}

export default function Checkbox({value = false, setValue, color="black", size=24, onPress}: CheckboxProps) {
    const [status, setStatus] = useState(value)

    const toggleCheckbox = () => {
        if(setValue === undefined){
            setStatus(!status)
        } else {
            setValue(!value)
        }    
    }

    return(
        <TouchableOpacity onPress={toggleCheckbox} onPressOut={onPress}>
            <MaterialCommunityIcons name={status ? "checkbox-outline" : "checkbox-blank-outline"} size={size} color={color} />
        </TouchableOpacity>
    )
}