import { TouchableOpacity } from "react-native";
import { Entypo } from '@expo/vector-icons';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export default function ExportTxtData(data: any, fileName: string) {
    const saveLogToFile = async () => {
        try {
            const logString = JSON.stringify(data, null, 2);
            const filePath = `${FileSystem.documentDirectory}${fileName}.txt`
            await FileSystem.writeAsStringAsync(filePath, logString)
            Alert.alert('Sucesso', 'Arquivo salvo em: ' + filePath);
        } catch (err) {

            Alert.alert('Erro', `Erro ao salvar o arquivo: ${err}`);
        }
    };

    return (
        <TouchableOpacity onPress={saveLogToFile}>
            <Entypo name="export" size={24} color="white" />
        </TouchableOpacity>
    )
}