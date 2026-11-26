# VARION Airlines

Código-fonte da versão 16 do site, publicado em 26/11/2026. Revisão de origem: `6fc935d14030c10701f9f719f273a70e2f3693a2`.

## Executar no computador

1. Extraia o ZIP e abra no VS Code a pasta que contém este README.
2. Com Python 3 instalado, abra um terminal nessa pasta e execute:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
   ```

   No Windows, você também pode usar `py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist`.
3. Abra <http://127.0.0.1:8000/> em um navegador moderno. Para encerrar o servidor, pressione Ctrl+C.

O código em `dist/` é o próprio fonte editável. As alterações entram em vigor ao recarregar a página. O projeto usa HTML, CSS e JavaScript de navegador. Dispensa instalação de pacotes, compilação, banco de dados e variáveis de ambiente.

## Onde editar

| Parte do site | Arquivos em dist/ |
| --- | --- |
| Estrutura, menu, navegação por fragmentos (#), formulários de passageiros e reservas | index.html, app.js |
| Página inicial, destinos, mapa de rotas e painel de voos | explorar.js, geografia.js |
| Aeroportos, malha, horários e geração de voos simulados | voos.js |
| Busca, seletores de aeroportos e passageiros, calendário e trechos | passagens.js, seletores.js, calendario.js |
| Preços dinâmicos, planos gratuitos e famílias tarifárias | precos.js, beneficios.js, tarifas.js |
| Aeronaves, disponibilidade, mapas de cabine e seleção de poltronas | frota.js, assentos.js |
| Apresentação em Companhia → Quem somos | tecnologia.js, tecnologia.css e seção correspondente em index.html |
| Identidade visual, layouts e animações | Arquivos .css, imagens e fonte Montserrat em assets/ |

Os créditos de fotografias e a licença da fonte acompanham os arquivos em `dist/assets/`.

## Continuar o desenvolvimento no GitHub

Para um repositório já inicializado, clone-o e copie os arquivos deste ZIP para a pasta clonada. Execute:

```sh
git add README.md dist/
git commit -m "Importa a versão 16 da VARION Airlines"
git push origin main
```

O ZIP contém os arquivos da revisão publicada, com o crédito pessoal substituído pelo setor de TI e sem o manifesto interno do Sites. O Git pode solicitar sua autenticação durante o envio.

## Publicar

**Hospedagem estática:** configure `dist` como diretório de publicação, sem comando de build. Para enviar os arquivos manualmente a um servidor, copie o conteúdo dessa pasta mantendo sua estrutura e coloque `index.html` na raiz pública.

**GitHub Pages:** para manter o repositório com a estrutura original, publique a pasta `dist` em uma branch separada. Após o primeiro push da seção anterior, execute:

```sh
git subtree push --prefix dist origin gh-pages
```

Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, a branch **gh-pages** e a pasta **/(root)**. Salve e abra o endereço exibido pelo GitHub. Para atualizar, faça commit das alterações em `main`, envie com `git push` e repita o comando de subtree. As rotas usam fragmentos, como `/#beneficios`, e os recursos usam caminhos relativos. Isso permite hospedar o site também sob o nome do repositório.

[Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Dependências externas e dados locais

- **ChatGPT Sites:** o manifesto original `.openai/hosting.json` foi omitido desta distribuição pública. O site executa inteiramente no navegador, independentemente do ChatGPT.
- **Canva:** a página usa o endereço público de visualização fornecido pelo grupo em um iframe. A integração acompanha o código. Os slides e suas animações são carregados pelo Canva e dependem de internet e da permissão de visualização do design. Se sua hospedagem definir uma política CSP, permita a origem https://www.canva.com em frame-src.
- **Dados da viagem:** a malha, os preços, os planos, os assentos e os voos simulados estão no JavaScript. Buscas e trechos em andamento usam sessionStorage. As reservas confirmadas usam localStorage. Cada navegador e origem mantêm seus próprios registros. Ao mudar de domínio, as reservas feitas no domínio antigo continuam vinculadas a ele.

## Transporte terrestre

O serviço fica em Serviços → Transporte ao aeroporto, ou como adicional na revisão da reserva aérea. As rotas, tarifas em centavos, horários e margens estão em `dist/transporte-core.js`; a interface fica em `dist/transporte.js` e `dist/transporte.css`. O desconto de 10% é aplicado aos pares de trechos da mesma rota para o mesmo passageiro. As reservas de transporte também são consultáveis pelo código no mesmo navegador. Para verificar as regras sem dependências, execute `node tests/transporte.test.cjs` com Node.js. O site continua estático e sem comando de build.
