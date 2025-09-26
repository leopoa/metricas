#!/bin/bash

# Script de Deploy para Analisador de Lead Time
# Este script automatiza o processo de build e deploy da aplicação

set -e  # Sair em caso de erro

echo "🚀 Iniciando processo de deploy do Analisador de Lead Time..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado."
    exit 1
fi

# Verificar se o pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Erro: pnpm não está instalado. Instale com: npm install -g pnpm"
    exit 1
fi

echo "📦 Instalando dependências..."
pnpm install

echo "🔧 Executando build da aplicação..."
pnpm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Erro: Diretório 'dist' não foi criado. Build falhou."
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Opções de deploy
echo ""
echo "🌐 Opções de deploy disponíveis:"
echo "1. Deploy local (servidor de desenvolvimento)"
echo "2. Deploy para produção (requer configuração adicional)"
echo "3. Gerar arquivo para deploy manual"

read -p "Escolha uma opção (1-3): " choice

case $choice in
    1)
        echo "🖥️  Iniciando servidor local..."
        echo "Acesse a aplicação em: http://localhost:5173"
        pnpm run dev --host
        ;;
    2)
        echo "🌍 Para deploy em produção, você pode usar uma das seguintes opções:"
        echo ""
        echo "📋 Netlify:"
        echo "   1. Faça login em https://netlify.com"
        echo "   2. Arraste a pasta 'dist' para o painel de deploy"
        echo "   3. Ou conecte seu repositório Git"
        echo ""
        echo "📋 Vercel:"
        echo "   1. Instale: npm i -g vercel"
        echo "   2. Execute: vercel --prod"
        echo ""
        echo "📋 GitHub Pages:"
        echo "   1. Commit e push para seu repositório"
        echo "   2. Vá em Settings > Pages"
        echo "   3. Configure para usar GitHub Actions"
        echo ""
        echo "📋 Servidor próprio:"
        echo "   1. Copie o conteúdo da pasta 'dist' para seu servidor web"
        echo "   2. Configure o servidor para servir arquivos estáticos"
        ;;
    3)
        echo "📁 Criando arquivo compactado para deploy manual..."
        
        # Criar nome do arquivo com timestamp
        timestamp=$(date +"%Y%m%d_%H%M%S")
        filename="leadtime-analyzer-build-${timestamp}.zip"
        
        # Compactar apenas a pasta dist
        cd dist
        zip -r "../${filename}" .
        cd ..
        
        echo "✅ Arquivo criado: ${filename}"
        echo "📤 Você pode fazer upload deste arquivo para qualquer servidor web."
        echo "📝 Instruções:"
        echo "   1. Extraia o conteúdo do ZIP no diretório raiz do seu servidor"
        echo "   2. Configure o servidor para servir o index.html como página inicial"
        ;;
    *)
        echo "❌ Opção inválida."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deploy concluído!"
echo "📚 Para mais informações, consulte o README.md"

