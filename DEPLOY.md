# Guia de Deploy - Analisador de Lead Time

Este documento fornece instruções detalhadas para fazer o deploy da aplicação Analisador de Lead Time.

## 🚀 Deploy Automático

### Usando o Script de Deploy

1. **Execute o script de deploy**:
   ```bash
   ./deploy.sh
   ```

2. **Escolha uma das opções**:
   - **Opção 1**: Servidor local para desenvolvimento
   - **Opção 2**: Instruções para deploy em produção
   - **Opção 3**: Gerar arquivo ZIP para deploy manual

## 🌐 Opções de Deploy em Produção

### 1. Netlify (Recomendado)

**Deploy via Drag & Drop:**
1. Execute `pnpm run build` para gerar a pasta `dist`
2. Acesse [netlify.com](https://netlify.com)
3. Arraste a pasta `dist` para o painel de deploy
4. Sua aplicação estará online em poucos segundos

**Deploy via Git:**
1. Conecte seu repositório GitHub/GitLab
2. Configure:
   - Build command: `pnpm run build`
   - Publish directory: `dist`
3. Deploy automático a cada push

### 2. Vercel

1. **Instale a CLI do Vercel**:
   ```bash
   npm i -g vercel
   ```

2. **Execute o deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure (se necessário)**:
   - Build command: `pnpm run build`
   - Output directory: `dist`

### 3. GitHub Pages

1. **Crie um workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install -g pnpm
         - run: pnpm install
         - run: pnpm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Configure GitHub Pages**:
   - Vá em Settings > Pages
   - Source: GitHub Actions

### 4. Servidor Próprio

1. **Gere o build**:
   ```bash
   pnpm run build
   ```

2. **Copie os arquivos**:
   ```bash
   scp -r dist/* usuario@servidor:/var/www/html/
   ```

3. **Configure o servidor web** (Apache/Nginx) para:
   - Servir `index.html` como página inicial
   - Configurar roteamento para SPA (se necessário)

## 🐳 Deploy com Docker

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### Comandos Docker

```bash
# Build da imagem
docker build -t leadtime-analyzer .

# Executar container
docker run -p 8080:80 leadtime-analyzer
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

Para diferentes ambientes, você pode configurar:

```bash
# .env.production
VITE_API_URL=https://api.exemplo.com
VITE_APP_TITLE=Analisador de Lead Time - Produção
```

### Build Otimizado

```bash
# Build com análise de bundle
pnpm run build -- --analyze

# Build com compressão máxima
pnpm run build -- --minify
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de memória durante build**:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   pnpm run build
   ```

2. **Arquivos não encontrados após deploy**:
   - Verifique se o servidor está configurado para servir arquivos estáticos
   - Confirme se o caminho base está correto

3. **Página em branco após deploy**:
   - Verifique o console do navegador para erros
   - Confirme se todos os assets foram copiados

### Logs e Monitoramento

Para produção, considere:
- Configurar logs de acesso
- Monitoramento de performance
- Alertas de erro
- Backup regular dos dados

## 📊 Performance

### Otimizações Recomendadas

1. **Compressão Gzip/Brotli** no servidor
2. **CDN** para assets estáticos
3. **Cache headers** apropriados
4. **Lazy loading** para componentes grandes

### Métricas a Monitorar

- Tempo de carregamento inicial
- Tamanho do bundle
- Core Web Vitals
- Taxa de erro de upload de CSV

