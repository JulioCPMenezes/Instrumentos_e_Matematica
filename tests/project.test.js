import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath, encoding = 'utf8') => readFile(resolve(root, relativePath), encoding);

test('a abertura obrigatória e o título final existem', async () => {
  const html = await read('index.html');
  assert.match(html, /id="intro-trigger"/);
  assert.match(html, /Instrumentos musicais e Matemática/);
  assert.doesNotMatch(html, /Pular introdução/i);
  assert.doesNotMatch(html, /mao-aberta|mao-fechada|hand-cursor/i);
});

test('grupo e professor estão preenchidos', async () => {
  const html = await read('index.html');
  for (const value of ['Caio França', 'Enzo Mota', 'Gabriel Andozia', 'Julio Menezes', 'Marcio Welker Corrêa']) {
    assert.match(html, new RegExp(value));
  }
});

test('quiz e antiga seção institucional foram removidos da página', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /id="quiz|quiz-section|Miniquiz|Desafio final/i);
  assert.doesNotMatch(html, /Quando a arquitetura também participa da música/i);
});

test('experimento do teto possui somente altura como controle variável', async () => {
  const html = await read('index.html');
  const source = await read('src/sections/acoustics.js');
  assert.match(html, /id="ceiling-grab-strip"/);
  assert.match(html, /Arraste o teto/);
  assert.doesNotMatch(html, /hall-occupancy|controle de ocupação/i);
  assert.match(source, /fixedAbsorption/);
  assert.match(source, /setHeight/);
  assert.match(html, /Afinando a Sala São Paulo/);
  assert.match(html, /RT₆₀ = 0,161 · V\/A/);
});

test('seções solicitadas foram removidas da página', async () => {
  const html = await read('index.html');
  for (const removed of ['id=\"comparador\"', 'id=\"laboratorio-som\"', 'id=\"experimento\"', 'id=\"produto\"', 'id=\"fontes\"', 'O tamanho importa, mas não age sozinho', 'Veja e ouça a Matemática', 'Testando a relação entre comprimento e frequência', 'Um infográfico que pode ser visto, ouvido e manipulado', 'Fontes, créditos e limites dos modelos']) {
    assert.doesNotMatch(html, new RegExp(removed));
  }
  assert.equal((html.match(/<\/html>/g) || []).length, 1);
});

test('seção de movimento à experiência sonora foi removida', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /id="som"/);
  assert.doesNotMatch(html, /Do movimento à experiência sonora/i);
});

test('seção de frequência possui fórmula, comparação e simulador', async () => {
  const html = await read('index.html');
  const sound = await read('src/sections/sound.js');
  const pitchStart = html.indexOf('id="frequencia"');
  const start = html.indexOf('id="o-que-e-frequencia"');
  const end = html.indexOf('id="mudanca-frequencia"');
  assert.ok(pitchStart > -1 && pitchStart < start && start < end);
  for (const content of ['O Que É Frequência?', 'Frequência: Medindo As Vibrações', 'f =', '200 Hz', 'Frequência Baixa', 'Frequência Alta', 'frequency-simulator-input', 'frequency-simulator-play', 'frequency-simulator-stop']) assert.ok(html.indexOf(content, start) > start && html.indexOf(content, start) < end);
  assert.match(sound, /export function initFrequencySimulator/);
  assert.match(sound, /continuousTone/);
});

test('seção Matemática explica a construção de forma leve e preserva o experimento', async () => {
  const html = await read('index.html');
  const families = await read('src/data/familias.js');
  const layout = await read('src/sections/layout.js');
  const construction = await read('src/sections/construction.js');
  const frequencySection = html.indexOf('id="o-que-e-frequencia"');
  const changesSection = html.indexOf('id="mudanca-frequencia"');
  const mathSection = html.indexOf('id="matematica"');
  assert.ok(frequencySection > -1 && frequencySection < changesSection && changesSection < mathSection);
  for (const content of ['Como os instrumentos mudam de nota?', 'Como a Matemática ajuda a construir instrumentos?', 'Medir para fazer soar', 'Um modelo para cada família', 'Cordas', 'Madeiras', 'Metais', 'Percussão', 'Fórmula e variáveis', 'Fórmulas e variáveis', 'O corpo também participa: caixa de ressonância', 'ressonância do ar interno']) {
    assert.match(html, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(families, /matematica:|formula:/);
  assert.doesNotMatch(layout, /family-math|family-formula|initExplorer/);
  for (const family of ['cordas', 'madeiras', 'metais', 'percussao']) {
    assert.match(html, new RegExp(`data-construction-filter="${family}"`));
  }
  assert.match(html, /class="container family-tabs construction-filters reveal" role="tablist">[\s\S]*?<\/div>\s*<div class="container construction-guide reveal">/);
  assert.match(html, /<details class="math-formula" open>/);
  for (const content of ['μ = m/ℓ', 'quadruplicar Tₘ dobra f', 'ΔL ≈ 0,0595L', 'funções de Bessel', 'correção de extremidade', 'Modelo de Helmholtz', 'Limite do modelo:']) {
    assert.match(html, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const familyStyles = await readFile('src/styles/families-section.css', 'utf8');
  const constructionStyles = await readFile('src/styles/construction-filters.css', 'utf8');
  assert.match(constructionStyles, /\.construction-guide \{ display: grid; grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(constructionStyles, /\.construction-guide \.construction-topic \{ display: grid; width: 100%; justify-items: center;/);
  assert.match(constructionStyles, /\.construction-topic-content \{ width: min\(100%, 1280px\); margin: 28px auto 0;/);
  assert.match(constructionStyles, /\.math-formula \{ width: 100%; margin: 28px auto 0;/);
  assert.match(html, /class="construction-detail-grid construction-detail-grid-two"/);
  assert.match(constructionStyles, /\.construction-detail-grid-two \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); width: min\(100%, 860px\); margin-inline: auto;/);
  assert.match(familyStyles, /\.family-tabs \{ display: flex; flex-wrap: wrap; justify-content: center;/);
  assert.match(familyStyles, /\.family-tabs button \{ flex: 0 1 auto;/);
  assert.match(familyStyles, /\.family-tabs button\.active \{ color: #fff; background: #7b3646;/);
  assert.match(construction, /export function initConstructionFilters/);
  assert.match(construction, /ArrowLeft.*ArrowRight/);
  assert.match(html, /Construa seu instrumento/);
  assert.match(html, /Escolha as dimensões de um instrumento de cordas/);
  assert.doesNotMatch(html, /data-lab=/);
});

test('Sala São Paulo conecta reverberação ao experimento do teto móvel', async () => {
  const html = await read('index.html');
  const scenes = await read('src/three/scenes.js');
  const reverb = html.indexOf('id="reverberacao"');
  const connection = html.indexOf('id="sala-acustica"');
  const hall = html.indexOf('id="acustica"');
  assert.ok(reverb > -1 && reverb < connection && connection < hall);
  for (const content of ['A Sala São Paulo também participa da música', 'O volume de ar interfere', 'Madeira, tecidos, paredes e poltronas', 'A posição do teto modifica', 'Assim como um instrumento pode ser afinado', 'Teto mais baixo', 'Teto mais alto', 'modelo matemático didático inspirado na Sala São Paulo']) assert.match(html, new RegExp(content));
  for (const feature of ['camera.position.set(0, 2.5, 15.4)', 'new THREE.BoxGeometry(2.15, 0.18, 2.35)', 'const panels = []', 'const waves = []', 'panels.forEach(panel']) assert.match(scenes, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(scenes, /room\.rotation\.y|ceiling\.rotation\.y/);
});

test('conclusões apresentam os aprendizados finais do grupo após a acústica da Sala São Paulo', async () => {
  const html = await read('index.html');
  const hall = html.indexOf('id="acustica"');
  const conclusions = html.indexOf('id="conclusoes"');
  assert.ok(hall > -1 && hall < conclusions);
  for (const content of ['10 · Conclusões', 'O que aprendemos?', 'A orquestra transforma diferenças em harmonia', 'O som pode ser sentido e também medido', 'Cada instrumento é um projeto matemático', 'A sala também participa da música', 'Instrumentos diferentes, um único resultado.', 'Cada nota que ouvimos possui uma frequência.', 'Antes de virar música, o som começa como medida e cálculo.', 'O instrumento produz o som; a sala transforma a experiência.']) {
    assert.match(html, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('seção de reverberação conecta o instrumento à acústica da sala', async () => {
  const html = await read('index.html');
  const source = await read('src/sections/reverberation.js');
  for (const content of ['id="reverberacao"', 'O que acontece depois que o som sai do instrumento?', 'Reverberação é a permanência do som', 'Ouvir pouca reverberação', 'Ouvir muita reverberação', 'Define grave ou agudo', 'Define quanto tempo o som permanece', 'O instrumento produz a nota. O ambiente modifica como ela é ouvida.']) assert.match(html, new RegExp(content));
  assert.match(source, /export function initReverberation/);
  assert.match(source, /reverberatedTone/);
});

test('comparação de frequência apresenta sons grave e agudo', async () => {
  const html = await read('index.html');
  const source = await read('src/sections/layout.js');
  assert.match(html, /id="frequencia"/);
  assert.match(html, /O Que Faz Um Som Ser Grave Ou Agudo\?/);
  assert.match(html, /data-pitch-frequency="110"/);
  assert.match(html, /data-pitch-frequency="880"/);
  assert.match(source, /initPitchComparison/);
  assert.match(source, /harmonicSeries/);
  assert.doesNotMatch(html, /Quando a música virou número/);
  assert.match(html, /O Que Faz Um Som Ser Grave Ou Agudo\?/);
});

test('popup dos instrumentos usa visualizador 3D local', async () => {
  const html = await read('index.html');
  const layout = await read('src/sections/layout.js');
  const scenes = await read('src/three/scenes.js');
  assert.match(html, /id="instrument-dialog-model"/);
  assert.match(layout, /initDialogInstrumentViewer/);
  assert.match(layout, /assets\/models\/instrumentos/);
  assert.match(scenes, /setMeshoptDecoder\(MeshoptDecoder\)/);
  assert.match(scenes, /initHallScene/);
  assert.match(scenes, /framingRadius \/ Math\.sin\(limitingHalfFov\) \* 1\.30 \/ zoom/);
  assert.match(scenes, /zoomIn\(\)/);
  assert.match(html, /id="instrument-model-zoom-in"/);
  assert.match(html, /id="instrument-model-zoom-out"/);
  assert.match(layout, /const zoomIn = \$\('#instrument-model-zoom-in'\)/);
  assert.match(layout, /const zoomOut = \$\('#instrument-model-zoom-out'\)/);
  assert.match(layout, /dialog\.addEventListener\('cancel', event => event\.preventDefault\(\)\)/);
  assert.doesNotMatch(layout, /event\.target === dialog/);
});

test('famílias incluem os instrumentos atualizados e suas fotos locais', async () => {
  const familias = await read('src/data/familias.js');
  const instrumentos = await read('src/data/instrumentos.js');
  assert.match(familias, /\['piccolo', 'flauta', 'oboe', 'clarinete', 'fagote', 'contrafagote'\]/);
  assert.match(familias, /\['timpano', 'xilofone', 'marimba', 'caixa', 'pratos', 'triangulo', 'gongo'\]/);
  assert.doesNotMatch(familias, /celesta/);
  assert.match(await read('src/sections/layout.js'), /A coluna de ar dentro do corpo\/tubo do instrumento/);
  assert.doesNotMatch(await read('src/sections/layout.js'), /madeiras: \[[^\]]*caixa de ressonância/);
  for (const asset of ['oboe.png', 'contrafagote.avif', 'marimba.avif', 'harpa.jpg', 'piano.png']) {
    assert.match(instrumentos, new RegExp(asset.replace('.', '\\.')));
    assert.ok((await stat(resolve(root, 'public/assets/instrumentos', asset))).size > 1_000);
  }
});

test('mascote possui canvas próprio e o GLB é válido', async () => {
  const html = await read('index.html');
  const layout = await read('src/sections/layout.js');
  assert.match(html, /id="mascot-canvas"/);
  assert.match(layout, /const canvas = \$\('#mascot-canvas'\)/);
  const scene = await read('src/three/scenes.js');
  assert.match(scene, /OrthographicCamera/);
  const modelPath = resolve(root, 'public/assets/models/man head 3d model.glb');
  const audioPath = resolve(root, 'public/assets/audio/marcio_oi_gente_1.ogg');
  assert.ok((await stat(modelPath)).size > 1_000_000);
  assert.ok((await stat(audioPath)).size > 1_000);
  const bytes = await readFile(modelPath);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
});

test('agradecimento encerra o trabalho com mascote e áudio local', async () => {
  const html = await read('index.html');
  const layout = await read('src/sections/layout.js');
  const conclusions = html.indexOf('id="conclusoes"');
  const thanks = html.indexOf('id="agradecimento"');
  assert.ok(conclusions > -1 && conclusions < thanks);
  for (const content of ['Esse foi o nosso trabalho', 'Obrigado pela atenção!', 'id="thank-you-mascot-canvas"', 'Falar tchau pro Márcio']) assert.match(html, new RegExp(content));
  const main = await read('src/main.js');
  assert.match(layout, /export function initThankYou/);
  assert.match(layout, /marcio_tchau_gente\.ogg/);
  assert.match(main, /experience-started.*initThankYou/);
  assert.ok((await stat(resolve(root, 'public/assets/audio/marcio_tchau_gente.ogg'))).size > 1_000);
});

test('botões dos instrumentos usam os áudios locais dos vídeos e alternam tocar e pausar', async () => {
  const layout = await read('src/sections/layout.js');
  for (const id of ['violino', 'piccolo', 'caixa', 'gongo']) {
    assert.ok((await stat(resolve(root, `public/assets/audio/instrumentos/${id}.mp4`))).size > 1_000_000);
  }
  assert.match(layout, /assets\/audio\/instrumentos/);
  assert.match(layout, /activeInstrumentAudio\.pause\(\)/);
  assert.match(layout, /currentTime = 0/);
  assert.match(layout, /Pausar instrumento/);
  assert.match(layout, /Som não disponível/);
});

test('construtor de instrumento substitui os laboratórios por família', async () => {
  const html = await read('index.html');
  const labs = await read('src/sections/labs.js');
  for (const control of ['builder-width', 'builder-height', 'builder-neck', 'builder-strings', 'builder-waist', 'builder-hole']) assert.match(html, new RegExp(`id="${control}"`));
  assert.match(html, /id="instrument-builder-canvas"/);
  assert.match(html, /id="builder-play"/);
  assert.match(html, /id="builder-formula"/);
  assert.match(labs, /function initInstrumentBuilder/);
  assert.match(labs, /text\(\$\('#builder-formula-values'\)/);
  for (const removedControl of ['data-lab=', 'string-length', 'tube-length', 'brass-semitones', 'membrane-radius']) assert.doesNotMatch(html, new RegExp(removedControl));
});

test('Three.js está incluído localmente e o inicializador não instala pacotes', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const html = await read('index.html');
  const launcher = await read('rodar-site.bat');
  const moduleCode = await read('src/vendor/three.module.min.js');
  const coreCode = await read('src/vendor/three.core.min.js');
  assert.equal(packageJson.dependencies, undefined);
  assert.match(html, /\.\/src\/vendor\/three\.module\.min\.js/);
  assert.doesNotMatch(launcher, /npm install/i);
  assert.match(moduleCode, /three\.core\.min\.js/);
  assert.match(coreCode, /REVISION = '185'/);
  assert.ok((await stat(resolve(root, 'src/vendor/three.module.min.js'))).size > 300_000);
  assert.ok((await stat(resolve(root, 'src/vendor/three.core.min.js'))).size > 1_000_000);
});
