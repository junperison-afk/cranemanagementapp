// データベース側の制約を直接確認するスクリプト
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConstraints() {
  try {
    console.log('=== データベース側の制約を確認 ===\n');
    
    // contractsテーブルのすべてのユニーク制約を確認
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'contracts'::regclass
      AND contype = 'u'
      ORDER BY conname
    `;
    
    console.log('1. contractsテーブルのユニーク制約:');
    console.log(uniqueConstraints);
    
    // salesOpportunityIdに関連する制約を確認
    const salesOppConstraints = uniqueConstraints.filter(c => 
      c.constraint_name.includes('salesOpportunityId') ||
      c.definition.includes('salesOpportunityId')
    );
    
    console.log('\n2. salesOpportunityIdに関連する制約:');
    console.log(salesOppConstraints);
    
    // ユニークインデックスも確認
    const uniqueIndexes = await prisma.$queryRaw`
      SELECT 
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique,
        pg_get_indexdef(i.oid) AS index_definition
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'contracts'
      AND a.attname = 'salesOpportunityId'
      AND ix.indisunique = true
    `;
    
    console.log('\n3. salesOpportunityIdのユニークインデックス:');
    console.log(uniqueIndexes);
    
    // すべてのインデックスを確認
    const allIndexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'contracts'
      AND indexdef LIKE '%salesOpportunityId%'
      ORDER BY indexname
    `;
    
    console.log('\n4. salesOpportunityIdに関連するすべてのインデックス:');
    console.log(allIndexes);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConstraints();

