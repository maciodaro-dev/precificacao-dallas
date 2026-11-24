// Teste de ida e volta: botão "← Voltar" da tela e botão voltar do navegador, nos três fluxos.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const er = []; const linhas = []; let falhas = 0;
  const novo = async () => { const ctx = await b.newContext({ viewport: { width: 1300, height: 900 }, offline: true }); const pg = await ctx.newPage(); pg.on('pageerror', e => er.push(String(e))); await pg.goto('file://' + process.argv[2]); await pg.waitForSelector('#pp-sim'); return pg; };
  const rota = pg => pg.evaluate(() => location.hash.slice(1));
  const ok = (fluxo, passo, esperado, obtido, extra = '') => { const c = esperado === obtido; if (!c) falhas++; linhas.push(`| ${fluxo} | ${passo} | ${esperado} | ${obtido} | ${c ? 'ok' : '**FALHOU**'} | ${extra} |`); };
  const marcado = async (pg, sel) => (await pg.locator(sel).getAttribute('aria-pressed')) === 'true';
  const voltarTela = pg => pg.locator('button.voltar').first().click();
  const espera = pg => pg.waitForTimeout(120);

  // ---------- A. MODO GUIADO ----------
  for (const modo of ['botão da tela', 'voltar do navegador']) {
    const pg = await novo(); const F = 'Guiado · ' + modo;
    await pg.click('#pp-nao'); await espera(pg); await pg.click('#modo-leigo'); await espera(pg);
    await pg.click('#q-faixa-F3'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-casas-5a10'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-construcao-sequencia'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-preco-2'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-vender_rapido-nao'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-valorizacao-sim'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-comecar_logo-nao'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-agua_esgoto-nao'); await pg.click('.nav-perg .primario'); await espera(pg);
    await pg.click('#q-escola-nao'); await pg.click('.nav-perg .primario'); await pg.waitForSelector('.cartoes');
    ok(F, 'ida até o resultado', 'guiado-resultado', await rota(pg), (await pg.locator('.frase').innerText()).slice(0, 90) + '…');
    const volta = modo === 'botão da tela' ? () => voltarTela(pg) : () => pg.goBack();
    const esperados = [['guiado-9', '#q-escola-nao'], ['guiado-8', '#q-agua_esgoto-nao'], ['guiado-7', '#q-comecar_logo-nao'], ['guiado-6', '#q-valorizacao-sim'], ['guiado-5', '#q-vender_rapido-nao'], ['guiado-4', '#q-preco-2'], ['guiado-3', '#q-construcao-sequencia'], ['guiado-2', '#q-casas-5a10'], ['guiado-1', '#q-faixa-F3']];
    for (const [r, sel] of esperados) { await volta(); await espera(pg); ok(F, 'voltar', r, await rota(pg), 'resposta mantida: ' + ((await marcado(pg, sel)) ? 'sim' : 'NÃO')); if (!(await marcado(pg, sel))) falhas++; }
    await volta(); await espera(pg); ok(F, 'voltar', 'onde-construir', await rota(pg), 'título: ' + await pg.locator('.inicio h1').innerText());
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio', await rota(pg), '"Não" mantido: ' + ((await marcado(pg, '#pp-nao')) ? 'sim' : 'NÃO'));
    // refaz a ida: o que vinha depois continua lá
    await pg.click('#pp-nao'); await espera(pg); await pg.click('#modo-leigo'); await espera(pg); await pg.click('text=Pular para o resultado'); await pg.waitForSelector('.cartoes');
    ok(F, 'ida de novo, pulando', 'guiado-resultado', await rota(pg), 'frase igual: ' + (/5 a 10 casas, uma de cada vez/.test(await pg.locator('.frase').innerText()) ? 'sim' : 'NÃO'));
    await pg.context().close();
  }
  // ---------- B. MODO ESPECIALISTA ----------
  for (const modo of ['botão da tela', 'voltar do navegador']) {
    const pg = await novo(); const F = 'Especialista · ' + modo; const volta = modo === 'botão da tela' ? () => voltarTela(pg) : () => pg.goBack();
    await pg.click('#pp-nao'); await espera(pg); await pg.click('#modo-expert'); await pg.waitForSelector('.form-criterios');
    await pg.click('#o-isd-0'); await pg.click('#w-imposto-alto'); await pg.fill('#n-casas', '4');
    await pg.click('.cab-passo >> text=Ver resultado'); await pg.waitForSelector('table.ranking');
    ok(F, 'ida até o ranking', 'especialista-resultado', await rota(pg), (await pg.locator('table.ranking tbody tr').count()) + ' unidades');
    await volta(); await pg.waitForSelector('.form-criterios');
    ok(F, 'voltar', 'especialista', await rota(pg), 'ISD "A": ' + ((await marcado(pg, '#o-isd-0')) ? 'mantido' : 'PERDIDO') + '; peso do imposto alto: ' + ((await pg.locator('#w-imposto-alto.ativo').count()) ? 'mantido' : 'PERDIDO') + '; casas: ' + await pg.inputValue('#n-casas'));
    await volta(); await espera(pg); ok(F, 'voltar', 'onde-construir', await rota(pg));
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio', await rota(pg));
    await pg.click('#pp-nao'); await espera(pg); await pg.click('#modo-expert'); await pg.waitForSelector('.form-criterios');
    ok(F, 'ida de novo', 'especialista', await rota(pg), 'ISD "A" ainda: ' + ((await marcado(pg, '#o-isd-0')) ? 'sim' : 'NÃO') + '; casas: ' + await pg.inputValue('#n-casas'));
    await pg.context().close();
  }
  // ---------- C. JÁ TENHO O TERRENO ----------
  for (const modo of ['botão da tela', 'voltar do navegador']) {
    const pg = await novo(); const F = 'Já tenho o terreno · ' + modo; const volta = modo === 'botão da tela' ? () => voltarTela(pg) : () => pg.goBack();
    await pg.click('#pp-sim'); await espera(pg); await pg.fill('#pp-endereco', '123 Main St'); await pg.selectOption('#pp-cidade', 'Celina'); await pg.locator('.opcoes button', { hasText: 'Celina ISD' }).click(); await pg.waitForSelector('.retrato h1');
    await pg.click('text=Continuar →'); await espera(pg); await pg.fill('#pp-pago', '180000'); await pg.fill('#pp-data', '2025-03-10'); await pg.fill('#pp-atual', '230000'); await pg.click('text=Próxima →'); await espera(pg);
    await pg.click('#pp-aprovacoes-sim'); await pg.fill('#pp-aprovacoes-valor', '12000'); await pg.click('text=Próxima →'); await espera(pg);
    await pg.click('#pp-projeto_casa-nao'); await pg.click('text=Próxima →'); await espera(pg);
    await pg.click('#pp-terreno_pronto-nao_sei'); await pg.click('text=Ver resumo →'); await pg.waitForSelector('.retrato table');
    ok(F, 'ida até o resumo', 'inicio-resumo', await rota(pg), (await pg.locator('.retrato table tbody tr').nth(1).innerText()).replace(/\s+/g, ' '));
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-p4', await rota(pg), '"Não sei" mantido: ' + ((await marcado(pg, '#pp-terreno_pronto-nao_sei')) ? 'sim' : 'NÃO'));
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-p3', await rota(pg), '"Não" mantido: ' + ((await marcado(pg, '#pp-projeto_casa-nao')) ? 'sim' : 'NÃO'));
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-p2', await rota(pg), '"Sim" mantido: ' + ((await marcado(pg, '#pp-aprovacoes-sim')) ? 'sim' : 'NÃO') + '; valor: ' + await pg.inputValue('#pp-aprovacoes-valor'));
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-compra', await rota(pg), `pago ${await pg.inputValue('#pp-pago')}, data ${await pg.inputValue('#pp-data')}, hoje ${await pg.inputValue('#pp-atual')}`);
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-retrato', await rota(pg), await pg.locator('.retrato h1').innerText());
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio-onde', await rota(pg), `endereço "${await pg.inputValue('#pp-endereco')}", cidade ${await pg.inputValue('#pp-cidade')}`);
    await volta(); await espera(pg); ok(F, 'voltar', 'inicio', await rota(pg), '"Sim" mantido: ' + ((await marcado(pg, '#pp-sim')) ? 'sim' : 'NÃO'));
    // muda para "não" e confere que os lançamentos não se perdem; depois volta para "sim"
    await pg.click('#pp-nao'); await espera(pg); ok(F, 'mudar para "não"', 'onde-construir', await rota(pg), 'linhas de custo guardadas: ' + await pg.evaluate(() => JSON.parse(localStorage.getItem('pd.projetos.v1'))[0].linhas_custo.length));
    await volta(); await espera(pg); await pg.click('#pp-sim'); await espera(pg); ok(F, 'voltar e responder "sim" de novo', 'inicio-onde', await rota(pg), `endereço "${await pg.inputValue('#pp-endereco')}", cidade ${await pg.inputValue('#pp-cidade')}`);
    await pg.context().close();
  }
  const md = ['# Teste de ida e volta da navegação', '', `Rodado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC, no navegador Chromium, sem rede, com o arquivo único da ferramenta.`, '',
    `**${linhas.length} verificações, ${falhas} falhas. Erros de página: ${er.length}.**`, '', '| Fluxo | Passo | Tela esperada | Tela obtida | Resultado | O que foi conferido |', '|---|---|---|---|:-:|---|', ...linhas].join('\n');
  fs.writeFileSync(process.argv[3], md); console.log(`${linhas.length} verificações, ${falhas} falhas, erros de página: ${er.length}`); if (falhas || er.length) { console.log(linhas.filter(l => /FALHOU|NÃO|PERDIDO/.test(l)).join('\n')); console.log(er.slice(0, 3)); }
  await b.close();
})();
