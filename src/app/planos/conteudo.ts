// Textos da landing /planos, extraídos para reutilização. Nada de markup aqui.

export const NAV_LABELS = {
  recursos: 'Recursos',
  planos: 'Planos',
  comoFunciona: 'Como funciona',
  faq: 'FAQ',
  entrarNaApp: 'Entrar na app',
};

export const HERO = {
  badge: 'WIS — Services',
  titulo: ['Organize sua igreja.', 'Foque no que importa:', 'Adoração.'],
  lead: 'O WIS ajuda líderes a organizar ministérios, escalas, eventos e repertórios. Tudo em um só lugar, para que a sua equipe esteja sempre em sintonia.',
  ctaPrincipal: 'Começar grátis',
  ctaSecundario: 'Ver planos',
  semCartao: 'Não é necessário cartão de crédito',
  notaFlutuante: 'Mais tempo para o que realmente importa.',
  imagemAlt: 'Tela do WIS no celular, com a equipe escalada de um culto e as confirmações de presença',
};

export const RECURSOS = {
  kicker: 'Recursos',
  titulo: 'Tudo que sua igreja precisa para estar em sintonia',
};

export const FEATURES = [
  { label: 'Escalas inteligentes', desc: 'Crie escalas em segundos e evite sobreposições.' },
  { label: 'Eventos e cultos', desc: 'Planeje cada culto com antecedência.' },
  { label: 'Setlists e repertório', desc: 'Organize músicas, tom e andamento.' },
  { label: 'Confirmações', desc: 'Notificações automáticas e confirmação de presença.' },
  { label: 'Ministérios e funções', desc: 'Estruture ministérios e atribua funções.' },
  { label: 'Pessoas e equipes', desc: 'Gerencie membros e líderes.' },
  { label: 'Relatórios e insights', desc: 'Acompanhe participação e histórico.' },
  { label: 'Multi-organização', desc: 'Gerencie várias igrejas em uma conta.' },
];

export const METRICS = [
  { value: '7', label: 'módulos integrados' },
  { value: 'PWA', label: 'instala sem loja' },
  { value: '1 conta', label: 'várias igrejas' },
  { value: '€ / R$', label: 'Portugal e Brasil' },
];

export const COMO_FUNCIONA = {
  kicker: 'Como funciona',
  titulo: 'Começar é muito simples',
  passos: [
    { n: '01', title: 'Crie a organização', desc: 'Cadastre sua igreja em poucos minutos, sem cartão de crédito.' },
    { n: '02', title: 'Defina os ministérios', desc: 'Crie ministérios e funções do seu jeito.' },
    { n: '03', title: 'Convide a equipe', desc: 'Convide membros e líderes por código ou email.' },
    { n: '04', title: 'Publique o culto', desc: 'Monte escalas, setlist e compartilhe com todos.' },
  ],
};

export const PLANOS = {
  kicker: 'Planos',
  titulo: 'Escolha o plano ideal para sua igreja',
  toggleMensal: 'Mensal',
  toggleAnual: 'Anual',
  notaAnual: 'No plano anual você paga 10 meses e usa 12!',
  rodape: 'Comece grátis no Semente, sem cartão. Os planos pagos são cobrados de forma segura via Stripe.',
  recomendado: 'Recomendado',
};

export const FAQ_TITULO = { kicker: 'FAQ', titulo: 'Perguntas frequentes' };

export const FAQ = [
  { q: 'Posso cancelar quando quiser?', a: 'Sim. A assinatura é gerida por você no portal de faturamento e pode ser cancelada a qualquer momento — o plano continua ativo até o fim do período já pago, e depois sua organização volta ao plano gratuito sem perder os dados.' },
  { q: 'Existe período de teste?', a: 'O plano Semente é gratuito e não pede cartão, então você pode usar o WIS de verdade com sua equipe antes de decidir. Quando precisar de mais pessoas, ministérios ou recursos, é só mudar de plano.' },
  { q: 'Como funciona o upgrade de plano?', a: 'Você escolhe o novo plano aqui mesmo e o pagamento é feito de forma segura via Stripe. Os novos limites e recursos passam a valer imediatamente — não é preciso recriar nada.' },
  { q: 'Posso mudar de plano depois?', a: 'Pode subir ou descer de plano quando quiser. Ao descer, confira antes se sua igreja está dentro dos limites do plano menor (pessoas, ministérios e líderes).' },
  { q: 'Os dados da minha igreja estão seguros?', a: 'Cada organização só enxerga os próprios dados, com regras de acesso aplicadas no banco de dados e não apenas na interface. Os pagamentos passam pelo Stripe — nenhum dado de cartão chega aos nossos servidores.' },
  { q: 'Posso gerenciar mais de uma igreja?', a: 'Sim. Uma conta pode participar de várias organizações, e você troca entre elas dentro do app sem precisar sair e entrar de novo.' },
];

export const INSTALACAO = {
  titulo: ['Domingo já vem aí.', 'Organize sua equipe hoje.'],
  texto: 'Descarrega para iOS ou Android — ou usa já no navegador. O WIS instala-se no ecrã inicial sem passar por nenhuma loja e continua a abrir sem rede.',
  lojaApple: 'App Store',
  lojaGoogle: 'Google Play',
  entrarPwa: 'Entrar na PWA',
};

export const FOOTER = {
  descricao: 'Gestão de ministérios de igreja — escalas, eventos e repertório.',
  colProduto: 'Produto',
  colLegal: 'Legal',
  colSuporte: 'Suporte',
  termos: 'Termos de Uso',
  privacidade: 'Privacidade',
  centralAjuda: 'Central de ajuda',
};

export const AVISO_CHECKOUT = {
  semente: 'Para começar',
  broto: 'Para equipes em crescimento',
  colheita: 'Para igrejas sem limites',
};
