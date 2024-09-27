import { ConProps} from "@/utils/getConProps"
import { View, Text } from "react-native"

export const LastSync = ({conProps} : {conProps: ConProps | undefined}) => {    
    return (
        <View>
            <Text style={{color: '#888888'}}>Última Sincronização:</Text>
            <Text style={{color: '#888888'}}>
                {conProps !== undefined 
                ? (new Date(conProps.lastsync)).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })
                : ""}
            </Text>
        </View>
    )
}