# VARION Airlines

Projeto acadêmico de companhia aérea fictícia. Voos e reservas simulados para demonstração.

## Executar no computador

O código editável da versão 16 ficará em `dist/`. Com Python 3 instalado, execute na raiz do projeto:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

No Windows, também é possível usar `py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist`.

Abra http://127.0.0.1:8000/. O projeto usa HTML, CSS e JavaScript, sem compilação, instalação de pacotes ou banco de dados.

## Publicação

Hospedagem estática: diretório de saída `dist`, sem comando de build. A apresentação incorporada depende do acesso ao Canva.

## Status da migração

Repositório inicializado. A importação integral dos arquivos da versão 16 ainda está pendente.
