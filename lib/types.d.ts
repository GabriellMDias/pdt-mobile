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

type Balanco = {
    id: number,
    id_loja: number,
    descricao: string,
    estoque: string,
    id_situacaobalanco: number
}

interface TransmissionListContent<LogType> {
    label: string;
    field: keyof LogType;
    dataType: "text" | "localeString";
}