# Fontes e referências

A pesquisa foi organizada priorizando fontes institucionais, materiais acadêmicos, livros didáticos abertos e documentação oficial.

Data geral de consulta e revisão: **1º de agosto de 2026**.

## 1. Sala São Paulo

### Fundação Osesp — Sala de Concertos

- Capacidade total de 1.388 lugares.
- Dimensões aproximadas do palco: 20,50 m × 12,80 m.
- Pé-direito de até 27 m.

https://salasaopaulo.com.br/salasp/pt/espaco-eventos/sala-de-concertos

### Fundação Osesp — A acústica

- Participação dos balcões, palco, poltronas, paredes e materiais na acústica.
- Teto com 15 painéis móveis.
- Adaptação das condições acústicas a diferentes repertórios.

https://salasaopaulo.com.br/salasp/pt/sobre/sala-sao-paulo-acustica

### Fundação Osesp — O projeto arquitetônico

- Transformação do edifício entre 1997 e 1999.
- Relação com as vibrações ferroviárias.
- Inauguração em 9 de julho de 1999.

https://salasaopaulo.com.br/salasp/pt/sobre/sala-sao-paulo-arquitetura

## 2. Cordas e ondas

### OpenStax — Wave Speed on a Stretched String

- Velocidade da onda em uma corda:

```text
v = √(T/μ)
```

- Frequência dos modos de uma corda ideal:

```text
fₙ = n/(2L) · √(T/μ)
```

https://openstax.org/books/university-physics-volume-1/pages/16-3-wave-speed-on-a-stretched-string

### OpenStax — Standing Waves and Resonance

- Ondas estacionárias.
- Nós e ventres.
- Frequências fundamentais e harmônicos.

https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance

### UNSW — Strings and standing waves

- Relações entre comprimento, tensão, densidade linear e frequência.
- Aplicações em instrumentos de cordas.

https://phys.unsw.edu.au/jw/strings.html

## 3. Colunas de ar e instrumentos de sopro

### UNSW — Woodwind acoustics

- Comprimento acústico.
- Furos e chaves.
- Modelos de tubos e limites das aproximações.

https://phys.unsw.edu.au/jw/woodwind.html

### OpenStax — Air columns

- Tubos abertos e fechados.
- Modos permitidos e ressonância.

https://openstax.org/books/college-physics-2e/pages/17-5-sound-interference-and-resonance-standing-waves-in-air-columns

## 4. Afinação e trastes

### John Baez / University of California, Riverside — Tuning

- Oitava como razão 2:1.
- Temperamento igual.
- Fator `2^(1/12)`.
- Progressão geométrica das frequências.

https://math.ucr.edu/home/baez/tuning_talk/

## 5. História da Matemática e da música

### MacTutor — Pythagoras

- Tradição pitagórica.
- Cuidado histórico ao separar Pitágoras de seus seguidores.

https://mathshistory.st-andrews.ac.uk/Biographies/Pythagoras/

### MacTutor — Mersenne publications

- Estudos quantitativos sobre cordas e acústica.

https://mathshistory.st-andrews.ac.uk/Extras/Mersenne_publications/

### MacTutor — Joseph Fourier

- Desenvolvimento das séries trigonométricas.
- Base matemática para análise de sinais periódicos.

https://mathshistory.st-andrews.ac.uk/Biographies/Fourier/

## 6. Barras, membranas e ressonância

### University of Rochester — Bars and Bells

- Flexão de barras.
- Dependência aproximada com `1/L²`.
- Influência de espessura, elasticidade e densidade.

https://www.pas.rochester.edu/~sybenzvi/courses/phy103/2015f/phy103_bars_and_bells.pdf

### University of Illinois — Circular membranes

- Modos de membranas circulares.
- Relação com funções de Bessel.
- Dependência aproximada com raio, tensão e densidade superficial.

https://courses.physics.illinois.edu/phys406/sp2017/Lecture_Notes/P406POM_Lecture_Notes/P406POM_Lect4_Part2.pdf

### UNSW — Helmholtz resonance

- Relação entre área da abertura, volume e comprimento efetivo.

https://phys.unsw.edu.au/jw/Helmholtz.html

## 7. Reverberação

### Montana State University — Reverberation and Sabine

- Modelo de Sabine.
- Relação entre volume, área, absorção e RT60.

https://www.montana.edu/rmaher/eele217_fl19/lectures/lecture_12a.html

A fórmula é usada no site somente como modelo didático:

```text
RT60 = 0,161 · V/A
A = Σ(Sᵢ · αᵢ)
```

## 8. Tecnologias

### Three.js

https://threejs.org/

https://threejs.org/manual/en/installation.html

https://github.com/mrdoob/three.js/releases/tag/r185

### MDN — Web Audio API

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

### MDN — Preferência por menos movimento

https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### MDN — Intersection Observer

https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

## 9. Limites dos modelos

As fórmulas utilizadas são aproximações educacionais. Instrumentos reais e salas reais apresentam:

- geometrias complexas;
- propriedades dos materiais que variam com frequência e temperatura;
- acoplamento entre diferentes partes vibrantes;
- perdas e amortecimento;
- modos não harmônicos;
- efeitos do músico;
- distribuição espacial tridimensional;
- diferenças entre medições e modelos ideais.

O site informa esses limites nas próprias experiências para evitar apresentar uma simulação didática como medição oficial.
