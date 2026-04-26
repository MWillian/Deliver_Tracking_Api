# Cria a migration e aplica ao banco de desenvolvimento
npx prisma migrate dev --name criar_tabelas_iniciais

# Visualiza o estado atual do banco
npx prisma migrate status

# Reseta o banco e reaplica todas as migrations (cuidado: apaga dados)
npx prisma migrate reset

# Após qualquer alteração no schema, é preciso regenerar o Prisma Client
npx prisma generate

# Cria/aplica estrutura do banco(gera executável do sqlite se não tiver)
prisma migrate dev

# Geração de dados fictícios
node prisma/seed.js