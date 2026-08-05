export const familias = {
  cordas: {
    nome: 'Cordas', cor: '#c9922e',
    destaque: 'O som nasce da vibração de cordas tensionadas.',
    explicacao: 'Nos instrumentos de corda, o som começa quando uma ou mais cordas tensionadas entram em vibração. Essa vibração passa pelo cavalete e pelo corpo oco do instrumento, que funciona como caixa de ressonância e amplia o som.',
    metodos: [
      ['Friccionadas', 'O arco é passado sobre as cordas, mantendo a vibração.', 'Violino, viola, violoncelo e contrabaixo.'],
      ['Dedilhadas', 'A corda é puxada e solta com os dedos.', 'Harpa e pizzicato nos instrumentos de arco.'],
      ['Percutidas', 'Um mecanismo golpeia a corda.', 'Piano.']
    ],
    instrumentos: ['violino', 'viola', 'violoncelo', 'contrabaixo', 'harpa', 'piano']
  },
  madeiras: {
    nome: 'Madeiras', cor: '#43855b',
    destaque: 'O som nasce da vibração de uma coluna de ar.',
    explicacao: 'Nos instrumentos de madeira, o músico sopra e faz o ar dentro do tubo entrar em vibração. Apesar do nome, vários instrumentos dessa família são feitos de metal; a classificação está ligada ao funcionamento acústico e à origem histórica.',
    metodos: [
      ['Sopro direto', 'O ar é direcionado contra uma borda, fazendo a coluna de ar vibrar.', 'Flauta transversal e flautim.'],
      ['Palheta simples', 'Uma única lâmina vibra contra o bocal.', 'Clarinete.'],
      ['Palheta dupla', 'Duas pequenas lâminas vibram uma contra a outra.', 'Oboé e fagote.']
    ],
    instrumentos: ['piccolo', 'flauta', 'oboe', 'clarinete', 'fagote', 'contrafagote']
  },
  metais: {
    nome: 'Metais', cor: '#b96720',
    destaque: 'O som começa na vibração dos lábios do músico.',
    explicacao: 'Nos instrumentos de metal, o músico pressiona os lábios contra um bocal e produz uma vibração semelhante a um zumbido. Essa vibração movimenta a coluna de ar no tubo, e a campana ajuda a projetar o som.',
    metodos: [
      ['Válvulas', 'Direcionam o ar por trechos adicionais de tubo, aumentando o caminho e produzindo notas mais graves.', 'Trompete, trompa e tuba.'],
      ['Vara móvel', 'A vara aumenta ou diminui diretamente o comprimento do tubo.', 'Trombone.']
    ],
    instrumentos: ['trompete', 'trompa', 'trombone', 'tuba']
  },
  percussao: {
    nome: 'Percussão', cor: '#9a3042',
    destaque: 'O som nasce do impacto, da agitação, da raspagem ou da fricção.',
    explicacao: 'A percussão é a família mais diversa da orquestra. Seus instrumentos podem produzir som pela vibração de membranas, barras, placas, discos metálicos ou do próprio corpo do instrumento.',
    metodos: [
      ['Altura definida', 'Produzem notas que podem ser identificadas e afinadas.', 'Tímpano, xilofone, marimba, vibrafone e glockenspiel.'],
      ['Altura indefinida', 'Produzem sons para ritmo, impacto ou efeito.', 'Caixa, bombo, pratos, triângulo e gongo.'],
      ['Membranofones e idiofones', 'A vibração vem de uma membrana ou do próprio corpo rígido.', 'Tímpano, bombo, xilofone, triângulo, pratos e gongo.']
    ],
    instrumentos: ['timpano', 'xilofone', 'marimba', 'caixa', 'pratos', 'triangulo', 'gongo']
  }
};
