const app_version = '1.1.6'
const migration_number = 2

export default [
    `ALTER TABLE conprops ADD COLUMN app_version TEXT DEFAULT 1`,

    /* The command below should be in every migration from now on*/
    `UPDATE migration_number SET number = ${migration_number} WHERE id = 1`
]