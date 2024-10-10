import { Alert } from 'react-native';
import { db } from './database-connection'
import { migrations } from './migrations';

const APP_VERSION = '1.1.6'

export default class DatabaseInit {

    constructor() {
        db.execSync('PRAGMA foreign_keys = ON;');
        this.InitDb()
    }
    
    private InitDb() {
        db.execSync(`CREATE TABLE IF NOT EXISTS migration_number (id INTEGER, number INTEGER);`);

        const currentMigration = db.getFirstSync<{number: Number}>('SELECT number FROM migration_number LIMIT 1')

        if(currentMigration === null) {
            this.applyMigrations(0)
        } else {
            this.applyMigrations(currentMigration.number)
        }

        db.execSync(`UPDATE conprops SET app_version = '${APP_VERSION}' WHERE id = 1`,)
    }

    private applyMigrations(currentVersion: Number) {
        const migrationsNumbers = Object.keys(migrations).map(Number);
    
        // Filtra as versões mais recentes que a versão atual do banco
        const versionsToApply = migrationsNumbers.filter(n => n > Number(currentVersion));
    
        if (versionsToApply.length > 0) {

            versionsToApply.forEach(version => {
                const versionStr = String(version);
                const migrationQueries = migrations[versionStr as unknown as keyof typeof migrations];
    
                migrationQueries.forEach(query => {
                    try {
                        db.execSync(query);
                    } catch (error) {
                        Alert.alert('Erro!', 
                            '' + error, 
                            [{text: 'OK'}])
                    }
                });
            });
    
          console.log('Database migrated to version:', versionsToApply[versionsToApply.length - 1]);
        } else {
          console.log('Database is up-to-date.');
        }
      }
}



