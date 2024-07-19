import { db } from '@/database/database-connection';
import { AxiosInstance } from 'axios';
import axios from 'axios';

type Store = {
    id: number;
    descricao: string;
}

type TipoEmbalagem = {
    id: number;
    descricao: string;
    descricaocompleta: string;
}

type TipoLancamento = {
    id: number;
    descricao: string;
}

type Recipe = {
    id: number,
    descricao: string,
    id_produto: number
}

export default async function synchronize(ipInt: string, portInt: string, ipExt: string, portExt: string, idCurentStore: number) {
    const API = axios.create({baseURL: `http://${ipInt}:${portInt}`});

    try {
        // Testar a conexão e aguardar no máximo 10 segundos
        await Promise.race([
            testConnection(API),
            new Promise((_, reject) => setTimeout(() => reject('Timeout'), 10000))
        ]);
    } catch (error) {
        alert('Falha ao sincronizar: ' + error);
        throw new Error('Falha ao sincronizar');
        return; // Aborta a sincronização se o teste de conexão falhar
    }
    
    const stores = await API.get<Store[]>('/sync/stores');
    const tipoEmbalagens = await API.get<TipoEmbalagem[]>('/sync/tipoembalagem');
    const products = await API.post<Produto[]>('/sync/products', {idLoja: idCurentStore});
    const recipes = await API.post<Recipe[]>('/sync/recipes', {idLoja: idCurentStore})
    const tiposmotivotroca = await API.get<TipoLancamento[]>('/sync/tipomotivotroca');
    const tiposconsumo = await API.get<TipoLancamento[]>('/sync/tipoconsumo');
    const balancos = await API.post<Balanco[]>('/sync/balancos', {idLoja: idCurentStore});

    const tables = ['tipomotivotroca', 'produto', 'tipoembalagem', 'tipoconsumo', 'loja', 'receita', 'balanco'];

    db.withTransactionSync(() => {
            // Delete saved Data
            tables.forEach((table) => {
                db.runSync(`DELETE FROM ${table};`);
            });

            // Update Current Store in connprops
            db.runSync('UPDATE conprops SET id_currentstore = ? WHERE id = 1;', [idCurentStore])

            // Update Last Sync Data
            db.runSync("UPDATE conprops SET lastsync = DATETIME(CURRENT_TIMESTAMP, 'localtime') WHERE id = 1;", [])

            // Sync stores
            stores.data.forEach((store) => {
                const sql = `INSERT INTO loja (id, descricao) VALUES (?, ?);`;
                db.runSync('INSERT INTO loja (id, descricao) VALUES (?, ?)', [store.id, store.descricao]);
            });
            console.log("Lojas Sincronizadas!");

            // Sync tipoembalagem
            tipoEmbalagens.data.forEach(async (tipoembalagem) => {
                const sql = `INSERT INTO tipoembalagem (id, descricao, descricaocompleta) VALUES (?, ?, ?);`;
                db.runSync(sql, [tipoembalagem.id, tipoembalagem.descricao, tipoembalagem.descricaocompleta]);
            });
            console.log("Tipo Embalagem Sincronizado!");

            // Sync products
            console.log('Sincronizando Produtos...');
            db.runSync(`DELETE FROM produto;`, []);
            products.data.forEach((product) => {
                const args = [
                    product.id, 
                    product.codigobarras, 
                    product.qtdembalagem, 
                    product.decimal ? 1 : 0,
                    product.id_tipoembalagem, 
                    product.descricaocompleta, 
                    product.pesobruto, 
                    product.permitequebra ? 1 : 0,
                    product.permiteperda ? 1 : 0,
                    product.precovenda,
                    product.estoque,
                    product.troca,
                    product.customediocomimposto,
                    product.fabricacaopropria ? 1 : 0
                ];
                const sql = `INSERT INTO produto 
                                (id, codigobarras, qtdembalagem, decimal, id_tipoembalagem, descricaocompleta, pesobruto, permitequebra, permiteperda, precovenda, estoque, troca, customediocomimposto, fabricacaopropria) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
                db.runSync(sql, args);
            });
            console.log('Produtos sincronizados!');

            // Sync recipes
            console.log('Sincronizando Receitas...');
            db.runSync(`DELETE FROM receita;`, []);
            recipes.data.forEach(async (recipe) => {
                const args = [
                    recipe.id, 
                    recipe.descricao,
                    recipe.id_produto
                ];
                const sql = `INSERT INTO receita 
                                (id, descricao, id_produto) 
                                VALUES (?, ?, ?);`;
                db.runSync(sql, args);
            });
            console.log('Receitas sincronizadas!');

            // Sync motivos troca
            tiposmotivotroca.data.forEach((tipomotivotroca) => {
                const sql = `INSERT INTO tipomotivotroca (id, descricao) VALUES (?, ?);`;
                db.runSync(sql, [tipomotivotroca.id, tipomotivotroca.descricao]);
            });
            console.log("Motivos troca Sincronizado!");

            // Sync tipos consumo
            tiposconsumo.data.forEach((tipoconsumo) => {
                const sql = `INSERT INTO tipoconsumo (id, descricao) VALUES (?, ?);`;
                db.runSync(sql, [tipoconsumo.id, tipoconsumo.descricao]);
            });
            console.log("Tipos consumo Sincronizado!");

            //Sync balancos
            balancos.data.forEach((balanco) => {
                const sql = `INSERT INTO balanco (id, id_loja, descricao, estoque, id_situacaobalanco) VALUES (?, ?, ?, ?, ?);`
                db.runSync(sql, [balanco.id, balanco.id_loja, balanco.descricao, balanco.estoque, balanco.id_situacaobalanco])
            })
            console.log('Balanços sincronizados!')
        }
    )
}

async function testConnection(api: AxiosInstance): Promise<void> {
    try {
        const response = await api.get(`/testconnection/syncing`);
        if (response.status !== 200) {
            throw new Error('Status de resposta não esperado');
        }
    } catch (error) {
        throw new Error('Erro ao testar conexão');
    }
}