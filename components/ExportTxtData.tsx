import { TouchableOpacity } from "react-native";
import { Entypo } from '@expo/vector-icons';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function ExportTxtData({data, fileName}: {data: any, fileName: string}) {
    
    const saveLogToFile = async () => {
        const today = new Date()
        const fullFileName = `${fileName} (${today.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-')}).txt`

        console.log(data)


        try {
            const logString = JSON.stringify(data, null, 2);
            const fileDir = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Documents")

            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(fileDir);
            if (!permissions.granted) {
                return;
            }

            const uri = await FileSystem.StorageAccessFramework.createFileAsync(fileDir, fullFileName, 'text/plain')
            await FileSystem.writeAsStringAsync(uri, logString)

            Alert.alert('Sucesso', 'Arquivo salvo em: ' + uri);
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