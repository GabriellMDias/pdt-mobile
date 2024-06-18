import { Entypo, AntDesign, FontAwesome, FontAwesome5, FontAwesome6, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

type ScreenGroup = {
    id: number
    name: string
    icon: (size: number, color: any) => React.JSX.Element
    screens: Screen[]
}

type Screen = {
    id: number
    name: string
    route: string
    icon: (size: number, color: any) => React.JSX.Element
    table: string | null
}


export const screensConfig: ScreenGroup[] = [
    {
        id: 1,
        name: "Menu Principal",
        icon: (size, color) => <Entypo name="home" size={size} color={color} />,
        screens: []
    },
    {
        id: 2,
        name: "Administrativo",
        icon: (size, color) => <AntDesign name="folderopen" size={size} color={color} />,
        screens: [
            {
                id: 1,
                name: "Cotação Fornecedor",
                route: "/developing",
                icon: (size, color) => <FontAwesome name="industry" size={size} color={color} />,
                table: null
            },
            {
                id: 2,
                name: "Cotação Cliente",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="person" size={size} color={color} />,
                table: null
            },
            {
                id: 3,
                name: "Pedido",
                route: "/developing",
                icon: (size, color) => <FontAwesome name="shopping-basket" size={size} color={color} />,
                table: null
            },
            {
                id: 4,
                name: "Favoritos",
                route: "/developing",
                icon: (size, color) => <FontAwesome name="search" size={size} color={color} />,
                table: null
            },
            {
                id: 5,
                name: "Ruptura",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="boxes-stacked" size={size} color={color} />,
                table: null
            },
            {
                id: 6,
                name: "Venda PDV",
                route: "/developing",
                icon: (size, color) => <MaterialIcons name="local-grocery-store" size={size} color={color} />,
                table: null
            },
            {
                id: 7,
                name: "Venda Período",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="calendar-check" size={size} color={color} />,
                table: null
            },
            {
                id: 8,
                name: "Análise de Oferta",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="search-dollar" size={size} color={color} />,
                table: null
            },
            {
                id: 9,
                name: "Administração de Preço",
                route: "/developing",
                icon: (size, color) => <MaterialIcons name="price-check" size={size} color={color} />,
                table: null
            },
            {
                id: 10,
                name: "Favoritos",
                route: "/developing",
                icon: (size, color) => <AntDesign name="star" size={size} color={color} />,
                table: null
            },
            {
                id: 11,
                name: "Agenda Fornecedor",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="calendar-alt" size={size} color={color} />,
                table: null
            },
            {
                id: 12,
                name: "Pedido de Compras",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="shopping-basket" size={size} color={color} />,
                table: null
            }
        ]
    },
    {
        id: 3,
        name: "Estoque",
        icon: (size, color) => <FontAwesome5 name="boxes" size={size} color={color} />,
        screens: [
            {
                id: 13,
                name: "Balanço",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="clipboard-list" size={size} color={color} />,
                table: null
            },
            {
                id: 14,
                name: "Cesta Básica",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="box" size={size} color={color} />,
                table: null
            },
            {
                id: 15,
                name: "Consumo",
                route: "/estoque/consumo/transmissionScreen",
                icon: (size, color) => <FontAwesome5 name="coffee" size={size} color={color} />,
                table: "logconsumo"
            },
            {
                id: 16,
                name: "Perda",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="arrow-trend-down" size={size} color={color} />,
                table: null
            },
            {
                id: 17,
                name: "Produção",
                route: "/estoque/producao/transmissionScreen",
                icon: (size, color) => <MaterialCommunityIcons name="blender" size={size} color={color} />,
                table: "logproducao"
            },
            {
                id: 18,
                name: "Quebra",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="trash-can" size={size} color={color} />,
                table: null
            },
            {
                id: 19,
                name: "Transferência Interna",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="money-bill-transfer" size={size} color={color} />,
                table: null
            },
            {
                id: 20,
                name: "Troca",
                route: "/estoque/troca/transmissionScreen",
                icon: (size, color) => <Entypo name="cycle" size={size} color={color} />,
                table: "logtroca"
            },
            {
                id: 21,
                name: "Estoque Loja",
                route: "/developing",
                icon: (size, color) => <MaterialIcons name="forklift" size={size} color={color} />,
                table: null
            },
            {
                id: 22,
                name: "Validade",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />,
                table: null
            }
        ]
    },
    {
        id: 4,
        name: "Financeiro",
        icon: (size, color) => <MaterialIcons name="attach-money" size={size} color={color} />,
        screens: [
            {
                id: 23,
                name: "Contas a Pagar",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="trending-down" size={size} color={color} />,
                table: null
            },
            {
                id: 24,
                name: "Contas a Receber",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="trending-up" size={size} color={color} />,
                table: null
            },
        ]
    },
    {
        id: 5,
        name: "Nota Fiscal",
        icon: (size, color) => <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />,
        screens: [
            {
                id: 25,
                name: "Conferência NF Entrada",
                route: "/developing",
                icon: (size, color) => <MaterialIcons name="input" size={size} color={color} />,
                table: null
            },
            {
                id: 26,
                name: "Saída",
                route: "/developing",
                icon: (size, color) => <AntDesign name="export" size={size} color={color} />,
                table: null
            },
            {
                id: 27,
                name: "Despesa",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="cash-minus" size={size} color={color} />,
                table: null
            },
            {
                id: 28,
                name: "Bonificação",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="cash-plus" size={size} color={color} />,
                table: null
            }
        ]
    },
    {
        id: 6,
        name: "Logistica",
        icon: (size, color) => <FontAwesome6 name="truck-ramp-box" size={size} color={color} />,
        screens: [
            {
                id: 29,
                name: "Reposição",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="file-cabinet" size={size} color={color} />,
                table: null
            },
            {
                id: 30,
                name: "Controle de Cargas",
                route: "/developing",
                icon: (size, color) => <MaterialIcons name="pallet" size={size} color={color} />,
                table: null
            }
        ]
    },
    {
        id: 7,
        name: "Utilitário",
        icon: (size, color) => <FontAwesome5 name="calculator" size={size} color={color} />,
        screens: [
            {
                id: 31,
                name: "Emissor Etiqueta",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="printer" size={size} color={color} />,
                table: null
            },
            {
                id: 32,
                name: "Estoque Online",
                route: "/developing",
                icon: (size, color) => <FontAwesome6 name="boxes-stacked" size={size} color={color} />,
                table: null
            },
            {
                id: 33,
                name: "Consultar Preço",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="dollar-sign" size={size} color={color} />,
                table: null
            },
            {
                id: 34,
                name: "DDV Mínimo",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="calendar-today" size={size} color={color} />,
                table: null
            },
            {
                id: 35,
                name: "VR Task",
                route: "/developing",
                icon: (size, color) => <FontAwesome5 name="tasks" size={size} color={color} />,
                table: null
            }
        ]
    },
    {
        id: 8,
        name: "PDV",
        icon: (size, color) => <Feather name="monitor" size={size} color={color} />,
        screens: [
            {
                id: 36,
                name: "Consistência",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="basket-check" size={size} color={color} />,
                table: null
            },
            {
                id: 37,
                name: "Motivo Cancelamento",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="cancel" size={size} color={color} />,
                table: null
            },
            {
                id: 38,
                name: "Motivo Desconto",
                route: "/developing",
                icon: (size, color) => <MaterialCommunityIcons name="brightness-percent" size={size} color={color} />,
                table: null
            }
        ]
    }
]
