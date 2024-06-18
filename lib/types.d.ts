type Produto = {
    id: number
    codigobarras: number
    qtdembalagem: number
    decimal: boolean
    id_tipoembalagem: number
    descricaocompleta: string
    pesobruto: number
    permitequebra: boolean
    permiteperda: boolean
    precovenda: number
    estoque: number
    troca: number
    customediocomimposto: number
    fabricacaopropria: boolean 
}

type ConProps = {
    devicename: string
    id: number
    id_currentstore: number
    ipext: string
    ipint: string
    lastsync: string
    portext: string
    portint: string
}