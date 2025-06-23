# Estágio 1: Base e Instalação de Dependências
# Usamos uma imagem Node.js v20 LTS, baseada em Alpine para ser mais leve.
FROM node:20-alpine AS base

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de dependências primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala as dependências de produção e desenvolvimento (necessário por causa do 'tsx')
RUN npm install

# Copia o resto do código da aplicação
COPY . .


# Estágio 2: Build de Produção (Opcional, mas recomendado)
# Se seu projeto tem um passo de build para o frontend (com Vite, etc.)
# Você provavelmente tem um script "build" no seu package.json
# RUN npm run build


# Estágio 3: Imagem Final
# Aqui poderíamos copiar os artefatos de build para uma imagem menor,
# mas para manter a simplicidade, vamos usar a imagem base.

# Expõe a porta que a aplicação usa dentro do contêiner
EXPOSE 5000

# O comando para iniciar a aplicação quando o contêiner rodar.
# Usamos o script 'start' do package.json, que deve ser configurado para produção.
# Exemplo de script "start" no package.json: "start": "NODE_ENV=production tsx server/index.ts"
CMD [ "npm", "run", "dev" ]