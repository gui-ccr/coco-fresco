# Coco Fresco 🥥

Um sistema fechado e exclusivo, desenvolvido com muito carinho sob medida para minha mãe gerenciar a logística e a gestão financeira diária do seu negócio de Água de Coco.

> ⚠️ **Aviso:** Este é um projeto de uso estritamente pessoal e privado.

## 📋 Funcionalidades

- **Dashboard Diário**: Acompanhe o lucro, despesas do negócio, despesas de casa e outros gastos de forma visualmente rica e em tempo real.
- **Gestão de Transações**: Adicione vendas rápidas ou despesas (como reposição de estoque) com layout focado em telas móveis e numpad customizado integrado de carregamento veloz.
- **Categorização Automática**: Controle em tempo real dividido por categorias (Ex: Reposição de Estoque, Gasto Fixo de Casa, Gasto Aleatório).
- **Dias de Trabalho**: Inicialização de dia de forma automatizada com abertura de caixa ("fundo de troco") personalizável com base no histórico anterior.
- **Relatórios Visuais**: Gráficos modernos (via Recharts) das métricas de vendas, proporção de despesas e lucros e histórico em lista.
- **Painel de Configurações Dinâmicas**: Ajuste em tempo real dos custos unitários (preço de custo do espeto/coco, garrafas) e preços de venda.
- **Banco de dados Remoto**: Todas as despesas persistem em nuvem via Supabase.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) focando em classes utilitárias e simulação de app nativo (ocultação de scrollbar configurado globalmente).
- **Banco de Dados / Backend**: [Supabase](https://supabase.com/) (para realtime sync e persistência SQL cloud).
- **Animações (UX)**: [GSAP](https://gsap.com/) para animações ultra performáticas em modais, sheet containers de numpads e tipografia móvel.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- **Node.js** (versão 18+) 
- **Gerenciador de pacotes** de NPM ou Yarn
- Projeto provisionado no Supabase para conexão Postgres

### 2. Clonando e Instalando
```bash
# Clone o repositório
git clone https://github.com/gui-ccr/coco-fresco.git
cd coco-fresco

# Instale todas as dependências
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz contendo seu acesso ao Supabase:
```env
SUPABASE_URL=sua_url_do_projeto
SUPABASE_ANON_KEY=sua_apiKey_publica_do_projeto
```

### 4. Iniciando Modo de Desenvolvimento
```bash
npm run dev
```
Acesse a respectiva porta disponibilizada pelo Vite no console `http://localhost:5173` ou equivalente em seu navegador.

## 📦 Build para Produção
Para compilar a versão final para publicar no ambiente de produção:
```bash
npm run build
```

---
*Desenvolvido com ❤️ pelo **filho coruja ([Gui-ccr])** exclusivamente para sua mãe! 👩‍👦🥥*

---
*Desenvolvido individualmente por **[Gui-ccr]** 📱🥥*