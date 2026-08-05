# Instrumentos musicais e Matemática

Site interativo desenvolvido para o **Trabalho de Matemática do Grupo 5**, a partir de uma saída pedagógica à Sala São Paulo.

## Grupo

- Caio França — N° 3
- Enzo Mota — N° 6
- Gabriel Andozia — N° 8
- Julio Menezes — N° 15
- Professor: Marcio Welker Corrêa

## O que existe no projeto

- abertura obrigatória com cortinas vermelhas;
- palco com instrumentos tridimensionais procedurais e alternativa em Canvas;
- título **Instrumentos musicais e Matemática**;
- apresentação do grupo em formato de slide;
- fotografias enviadas pelo grupo;
- mascote 3D do professor Marcio no canto inferior direito;
- mascote móvel, girável e com reprodução do áudio fornecido;
- pergunta-guia e objetivos do trabalho;
- seção sobre a saída pedagógica;
- linha do tempo interativa da Matemática na música;
- mapa interativo da orquestra;
- famílias das cordas, madeiras, metais e percussão;
- cards com 16 instrumentos;
- explorador tridimensional de instrumentos;
- laboratório matemático de cordas, trastes, tubos, válvulas, barras, membranas e ressonância de Helmholtz;
- comparador controlado de tamanho e frequência;
- laboratório de ondas, harmônicos, batimentos, comprimento de onda e decibéis;
- experimento do teto móvel com arraste direto do próprio teto;
- ondas douradas animadas no experimento acústico;
- cálculo didático de reverberação pela fórmula de Sabine;
- experimento editável com tabela, erro percentual, regressão linear, R² e exportação CSV;
- seção sobre o produto desenvolvido;
- conclusões e referências;
- modo de apresentação;
- testes automatizados dos cálculos matemáticos.

O quiz da versão anterior foi removido. A antiga seção separada de cards sobre a arquitetura da Sala São Paulo também foi removida; o conteúdo acústico relevante foi concentrado no experimento do teto móvel.

## Requisitos

- computador com Windows, macOS ou Linux;
- Node.js 18 ou superior;
- navegador atualizado, de preferência Google Chrome ou Microsoft Edge.

O projeto foi preparado principalmente para apresentação em computador.

## Como executar no Windows

1. Extraia o ZIP para uma pasta comum.
2. Abra a pasta extraída.
3. Dê dois cliques em:

```text
rodar-site.bat
```

4. O navegador deve abrir em:

```text
http://localhost:4173
```

5. Mantenha a janela preta aberta enquanto estiver usando o site.
6. Para encerrar, pressione `Ctrl + C` ou feche a janela preta.

## Como executar pelo terminal

Abra o terminal na pasta do projeto e rode:

```bash
npm run dev
```

Depois acesse:

```text
http://localhost:4173
```

Não é necessário executar `npm install`, pois a versão entregue não depende de pacotes externos para iniciar.

## Testes matemáticos

Execute:

```bash
npm test
```

Os testes verificam:

- efeito do comprimento, da tensão e da densidade linear em cordas;
- temperamento igual;
- posição do 12º traste;
- tubos abertos e fechados;
- batimentos;
- fórmula de Sabine;
- regressão linear;
- R²;
- erro percentual.

## Gerar a versão de produção

```bash
npm run build
```

O comando recria a pasta `dist/`.

Para testar a versão de produção:

```bash
npm run preview
```

## Funcionamento do 3D

A biblioteca Three.js está incluída localmente no projeto. O conteúdo principal não depende de CDN.

O site utiliza Three.js para:

- palco de abertura;
- explorador dos instrumentos;
- mascote do professor;
- modelo do teto acústico.

Caso o navegador ou o computador não consiga criar um contexto WebGL, o site troca automaticamente para representações em Canvas. Os textos, fórmulas e simuladores continuam funcionando.

## Onde alterar os dados

### Informações gerais

Arquivo:

```text
src/data/siteConfig.js
```

Ainda podem ser preenchidos:

- escola;
- turma;
- data da visita;
- atividade realizada.

### Responsabilidades dos integrantes

Arquivo:

```text
src/data/integrantes.js
```

Os nomes e números já estão preenchidos. Falta somente registrar a divisão real de tarefas, caso o grupo queira mostrar essa informação.

### Registros da visita

Arquivo:

```text
src/data/visita.js
```

As fotos fornecidas já estão inseridas em:

```text
public/assets/visita/
```

### Dados reais do experimento

Arquivo:

```text
src/data/experimento.js
```

Os valores atuais são exemplos identificados no site. Eles podem ser substituídos pelos resultados reais do grupo. Também é possível editar a tabela no próprio navegador e salvar localmente.

## Estrutura principal

```text
index.html
src/
  audio/
  data/
  math/
  sections/
  styles/
  three/
  utils/
  vendor/
public/
  assets/
tests/
dist/
```

## Documentação complementar

- `PLACEHOLDERS.md` — dados que ainda dependem do grupo;
- `SOURCES.md` — fontes acadêmicas e institucionais;
- `CREDITS.md` — créditos dos recursos;
- `RELATORIO-DE-MELHORIAS.md` — alterações realizadas.
