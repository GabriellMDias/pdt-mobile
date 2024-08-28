import { db } from "@/database/database-connection"

export type ConProps = {
    devicename: string
    id: number
    id_currentstore: number
    ipext: string
    ipint: string
    lastsync: string
    portext: string
    portint: string
}

export const getConProps = () => {
    const queryConProps = `
            SELECT
                devicename,
                ipint,
                portint,
                ipext,
                portext,
                id_currentstore,
                lastsync
            FROM conprops WHERE id = 1;`

    const conPropsRes = db.getFirstSync<ConProps>(queryConProps, [])

    if(conPropsRes === null) {
        const emptyConProps: ConProps = {
            devicename: "",
            id: 1,
            id_currentstore: -1,
            ipext: "",
            ipint: "",
            lastsync: "",
            portext: "",
            portint: "string"
        }
        return emptyConProps
    }

    return conPropsRes
}