# Passphrase italiane

Generatore **statico e open source** di passphrase italiane con una modalità dedicata ai vincoli dichiarati dal portale **Telemaco / InfoCamere**.

## Funzionalità

- **Passphrase italiane:** da 4 a 10 voci indipendenti selezionate dalla lista Diceware italiana v4 di Tarin Gamberini. Predefinita la selezione fra le **6.859 voci alfabetiche** di lunghezza 3–6 caratteri; disponibile anche la lista integrale di 7.776 voci (che include numeri e simboli).
- Separatore configurabile, maiuscole iniziali e cifra finale opzionale.
- Stima dell'entropia teorica calcolata sul numero effettivo di voci selezionabili.
- **Telemaco:** 20 caratteri, quattro gruppi pronunciabili da 4 lettere CVCV non presenti come parole complete nella lista Diceware, due cifre e due simboli estratti da `!?*:.`. Maiuscola casuale facoltativa; verifica facoltativa dello user ID.
- Risultato e user ID conservati solo in memoria finché la pagina è aperta.

**Attenzione:** la modalità Telemaco verifica esclusivamente le regole note implementabili localmente. Non può conoscere le password precedenti, il grado di somiglianza con la password attuale, tutti i nomi propri o gli eventuali dizionari proprietari adottati da InfoCamere. Un risultato potrebbe comunque essere rifiutato dal sito.

## Sicurezza e modello di minaccia

- Tutte le estrazioni utilizzano `crypto.getRandomValues()` e **rejection sampling**, non `Math.random()`.
- Nessun server genera, riceve o memorizza password: l'algoritmo viene eseguito nel browser.
- Nessun framework, pacchetto npm per il runtime, CDN, analytics, cookie o localStorage.
- La configurazione `public/_headers` imposta una CSP restrittiva in Cloudflare Pages (incluso `connect-src 'none'`).
- **Non è una garanzia assoluta:** chi compromette il repository, il deploy o il browser potrebbe compromettere anche i risultati. Per credenziali particolarmente sensibili utilizzare codice verificato in locale e un dispositivo attendibile.
- Il tasto **Copia** inserisce la passphrase nella clipboard del sistema. La clipboard può essere letta da software presenti sul dispositivo; cancellarla secondo le proprie necessità.

## Sviluppo e test

Necessario Node.js per i test, non per utilizzare il sito.

```sh
npm test
```

Per provare la versione locale dal computer (anche senza accesso a Internet, una volta scaricata la cartella):

```sh
python3 -m http.server 8000 --directory public
```

Aprire `http://localhost:8000`. Non sono necessarie dipendenze.

## Deploy su Cloudflare Pages

1. Collega questo repository GitHub a un progetto **Cloudflare Pages**.
2. Framework preset: **None**; production branch: `main`.
3. Build command: lascia vuoto (oppure `exit 0`).
4. **Build output directory: `public`**.
5. Dopo il primo deploy verifica che la risposta HTTP includa la CSP in `public/_headers`.

Le pull request possono ricevere anteprime; non pubblicare in produzione codice non revisionato.

## Licenze e attribuzioni

- Codice di questo progetto: **MIT**, come da `LICENSE` nella radice del repository.
- Dizionario: **Tarin Gamberini, lista italiana Diceware versione 4 (29 settembre 2019)**, copyright 2007–2019, **GNU GPL v3 o successiva**, distinta dalla licenza del codice. `public/data/italiano-v4.js` è una conversione meccanica della lista, con le 7.776 voci originali nello stesso ordine.
- Testo originale: `third_party/word_list_diceware_it-IT-4.txt`; licenza completa: `third_party/GPL-3.0.txt`.
- Fonte autore: https://www.taringamberini.com/it/diceware_it_IT/lista-di-parole-diceware-in-italiano/

La modifica del formato da TXT a JavaScript non cambia la licenza delle voci: il file derivato rimane sotto GPL-3.0-or-later.
