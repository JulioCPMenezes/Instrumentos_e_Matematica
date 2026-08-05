export const timeline = [
  {
    periodo: 'Antiguidade',
    titulo: 'A harmonia das proporções',
    simbolo: '2:1',
    imagem: './public/assets/timeline/pitagoras.svg',
    texto: 'A tradição pitagórica associou intervalos musicais a razões simples entre comprimentos de cordas. Quando a parte vibrante é reduzida à metade, a frequência tende a dobrar.',
    formula: 'Oitava 2:1 · Quinta 3:2 · Quarta 4:3',
    matematica: ['frações', 'razões', 'proporções', 'relação inversa'],
    interacao: 'monocordio'
  },
  {
    periodo: 'Séculos XVI–XVIII',
    titulo: 'Dividindo a oitava em doze partes',
    simbolo: '2¹⁄¹²',
    imagem: './public/assets/timeline/temperamento.svg',
    texto: 'No temperamento igual, cada semitom multiplica a frequência pelo mesmo fator. Como doze passos precisam dobrar a frequência, o fator é a raiz décima segunda de 2.',
    formula: 'r¹² = 2  →  r = 2^(1/12)  →  fₙ = f₀ · 2^(n/12)',
    matematica: ['potências', 'raízes', 'progressão geométrica', 'função exponencial'],
    interacao: 'temperamento'
  },
  {
    periodo: 'Século XVII',
    titulo: 'Mersenne e as cordas',
    simbolo: '√',
    imagem: './public/assets/timeline/mersenne.svg',
    texto: 'Comprimento, tensão e massa por metro passaram a ser estudados quantitativamente. Essas variáveis continuam fundamentais na construção e na afinação dos instrumentos de corda.',
    formula: 'f = (1 / 2L) · √(T / μ)',
    matematica: ['raiz quadrada', 'proporcionalidade', 'função de várias variáveis'],
    interacao: 'cordas'
  },
  {
    periodo: 'Séculos XVII–XVIII',
    titulo: 'Ondas estacionárias e harmônicos',
    simbolo: 'n·f',
    imagem: './public/assets/timeline/harmonicos.svg',
    texto: 'Cordas e colunas de ar podem vibrar em modos diferentes. Em um modelo ideal, os harmônicos aparecem em múltiplos inteiros da frequência fundamental.',
    formula: 'fₙ = n · f₁',
    matematica: ['múltiplos', 'sequências', 'periodicidade', 'padrões'],
    interacao: 'harmonicos'
  },
  {
    periodo: 'Século XIX',
    titulo: 'Fourier e a soma de ondas',
    simbolo: 'Σ',
    imagem: './public/assets/timeline/fourier.svg',
    texto: 'Sons periódicos complexos podem ser estudados como somas de componentes senoidais com frequências, amplitudes e fases diferentes.',
    formula: 's(t) = Σ Aₙ · sen(2πfₙt + φₙ)',
    matematica: ['trigonometria', 'soma de funções', 'séries', 'fase'],
    interacao: 'fourier'
  },
  {
    periodo: 'Fim do século XIX',
    titulo: 'Sabine mede a reverberação',
    simbolo: 'RT₆₀',
    imagem: './public/assets/timeline/sabine.svg',
    texto: 'O tempo de reverberação passou a ser estimado relacionando o volume de uma sala com a absorção equivalente de suas superfícies.',
    formula: 'RT₆₀ = 0,161 · V / A',
    matematica: ['área', 'volume', 'soma ponderada', 'modelagem'],
    interacao: 'sabine'
  },
  {
    periodo: '1997–1999',
    titulo: 'Uma sala que pode ser afinada',
    simbolo: '15',
    imagem: './public/assets/timeline/sala-sp.svg',
    texto: 'A transformação da antiga estação em sala de concertos reuniu preservação, isolamento, materiais, geometria e acústica. Quinze painéis móveis ajudam a adaptar o espaço.',
    formula: 'geometria + materiais + volume + absorção',
    matematica: ['geometria espacial', 'simulação', 'otimização', 'acústica'],
    interacao: 'sala'
  },
  {
    periodo: '2026',
    titulo: 'Transformando fórmulas em experiência',
    simbolo: '</>',
    imagem: './public/assets/timeline/projeto.svg',
    texto: 'Nosso grupo reuniu pesquisa, programação, design, sons, gráficos e modelos tridimensionais para tornar relações matemáticas visíveis, manipuláveis e audíveis.',
    formula: 'pesquisa + Matemática + design + código',
    matematica: ['dados', 'gráficos', 'modelagem', 'comunicação científica'],
    interacao: 'produto'
  }
];
