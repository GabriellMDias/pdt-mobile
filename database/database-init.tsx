import { db } from './database-connection'


export default class DatabaseInit {

    constructor() {
        db.execSync('PRAGMA foreign_keys = ON;');
        this.InitDb()
    }
    
    private InitDb() {
        var sql = [
            `CREATE TABLE IF NOT EXISTS conprops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                devicename TEXT,
                ipint TEXT,
                portint TEXT,
                ipext TEXT,
                portext TEXT,
                id_currentstore INTEGER,
                lastsync TIMESTAMP
            );`,
            `INSERT INTO conprops (id) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM conprops WHERE id = 1);`,
            `CREATE TABLE IF NOT EXISTS loja (
                id INTEGER PRIMARY KEY NOT NULL,
                descricao TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS favorites (
                id_screen INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS tipoembalagem (
                id INTEGER PRIMARY KEY NOT NULL,
                descricao TEXT,
                descricaocompleta TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS produto (
                id INTEGER NOT NULL,
                codigobarras numeric(14,0) NOT NULL,
                qtdembalagem INTEGER NOT NULL,
                decimal boolean NOT NULL,
                id_tipoembalagem INTEGER NOT NULL,
                descricaocompleta TEXT NOT NULL,
                pesobruto numeric(12,3),
                permitequebra boolean DEFAULT true,
                permiteperda boolean DEFAULT true,
                precovenda numeric(11,4) NOT NULL,
                estoque numeric(12,3) NOT NULL,
                troca numeric(12,3) NOT NULL,
                customediocomimposto numeric(13,4) NOT NULL,
                fabricacaopropria boolean NOT NULL DEFAULT false
            )`,
            `CREATE TABLE IF NOT EXISTS receita (
                id INTEGER NOT NULL,
                descricao TEXT NOT NULL,
                id_produto INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS tipomotivotroca (
                id INTEGER PRIMARY KEY NOT NULL,
                descricao TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS tipoconsumo (
                id INTEGER PRIMARY KEY NOT NULL,
                descricao TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS logtroca (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigobarras numeric(14,0) NOT NULL,
                id_loja INTEGER NOT NULL,
                id_produto INTEGER NOT NULL,
                id_tipoentradasaida integer NOT NULL,
                id_motivotroca integer,
                quantidade numeric(18,3) NOT NULL,
                transmitido boolean NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS logconsumo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigobarras numeric(14,0) NOT NULL,
                id_loja INTEGER NOT NULL,
                id_produto INTEGER NOT NULL,
                id_tipoentradasaida INTEGER NOT NULL,
                id_tipoconsumo INTEGER NOT NULL,
                quantidade numeric(18,3) NOT NULL,
                transmitido boolean NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS logproducao (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_loja INTEGER NOT NULL,
                id_receita INTEGER NOT NULL,
                id_tipoentradasaida integer NOT NULL,
                quantidade numeric(18,3) NOT NULL,
                transmitido boolean NOT NULL
            )`,
            `
                CREATE TABLE IF NOT EXISTS favoritos (
                    id_screen INTEGER PRIMARY KEY
                )
            `,
            `CREATE TABLE IF NOT EXISTS balanco (
                id INTEGER NOT NULL,
                id_loja INTEGER NOT NULL,
                descricao TEXT NOT NULL,
                estoque TEXT NOT NULL,
                id_situacaobalanco INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS logbalancoitem (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigobarras numeric(14,0) NOT NULL,
                id_balanco INTEGER NOT NULL,
                id_produto INTEGER NOT NULL,
                id_tipoentradasaida integer NOT NULL,
                quantidade numeric(18,3) NOT NULL,
                transmitido boolean NOT NULL
            )`
        ];

        for (var i = 0; i < sql.length; i++) {
            db.execSync(sql[i]);
        }

        console.log("transaction complete call back ");
    }

}