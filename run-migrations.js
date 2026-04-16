import fs from 'fs';
import 'dotenv/config';
import { pool } from './src/config/database.js';

const sql = fs.readFileSync('src/migrations/migrations.sql', 'utf-8');

try{
    await pool.query(sql);
    console.log("Migration executada com sucesso.");
}catch(err){
    console.error('Erro na migration:', err.message);
}finally{
    await pool.end();
}