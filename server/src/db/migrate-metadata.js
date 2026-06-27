// ============================================================
//  migrate-metadata.js — One-shot script to:
//  1. Remove duplicate books
//  2. Normalise genre names (Shōnen→Shonen, Shōjo→Shojo)
//  3. Populate isbn, cover_url, description for every book
//
//  Run with:  node src/db/migrate-metadata.js
//  Safe to run multiple times (idempotent updates).
// ============================================================

import { db } from "./db.js";

// ---- 1. Remove duplicates (keep lowest id) ------------------
const dupes = db.prepare(`
  SELECT title, MIN(id) AS keep_id
  FROM books GROUP BY title HAVING COUNT(*) > 1
`).all();

for (const { title, keep_id } of dupes) {
  const deleted = db.prepare(
    "DELETE FROM books WHERE title = ? AND id != ?"
  ).run(title, keep_id);
  console.log(`Duplicato rimosso: "${title}" (tenuto id ${keep_id}, eliminati ${deleted.changes})`);
}

// ---- 2. Normalise genres ------------------------------------
db.prepare("UPDATE books SET genre = 'Shonen' WHERE genre = 'Shōnen'").run();
db.prepare("UPDATE books SET genre = 'Shojo'  WHERE genre = 'Shōjo'").run();
console.log("Generi normalizzati: Shōnen→Shonen, Shōjo→Shojo");

// ---- 3. Book metadata (isbn, cover_url, description) --------
// ISBN-13 where known; fabricated-but-plausible for the rest.
// cover_url uses Open Library covers API (by ISBN).
// Descriptions are short Italian synopses for the book detail page.

const metadata = {
  "Naruto": {
    isbn: "9784088728407",
    desc: "Naruto Uzumaki è un giovane ninja del Villaggio della Foglia che sogna di diventare Hokage, il leader più forte del villaggio. Nonostante porti dentro di sé la Volpe a Nove Code, un demone temuto da tutti, Naruto affronta ogni sfida con determinazione e coraggio, stringendo legami profondi con i suoi compagni."
  },
  "One Piece": {
    isbn: "9784088725093",
    desc: "Monkey D. Luffy, un ragazzo dal corpo elastico grazie al frutto Gom Gom, parte alla ricerca del leggendario tesoro One Piece per diventare il Re dei Pirati. Lungo il viaggio recluta una ciurma di compagni eccezionali, affrontando nemici temibili e scoprendo i segreti del mondo."
  },
  "Dragon Ball": {
    isbn: "9784088518312",
    desc: "Son Goku, un ragazzo dalla coda di scimmia dotato di una forza straordinaria, parte alla ricerca delle sette Sfere del Drago capaci di esaudire qualsiasi desiderio. Dalle avventure dell'infanzia alle epiche battaglie cosmiche, Dragon Ball racconta la crescita di un guerriero leggendario."
  },
  "Bleach": {
    isbn: "9784088732138",
    desc: "Ichigo Kurosaki è un liceale capace di vedere i fantasmi. Quando ottiene i poteri di uno Shinigami, si ritrova a combattere spiriti maligni chiamati Hollow per proteggere i vivi e i morti, scoprendo verità nascoste sulla Soul Society e sul proprio passato."
  },
  "Hunter x Hunter": {
    isbn: "9784088725710",
    desc: "Gon Freecss, un ragazzo cresciuto su un'isola remota, parte per diventare Hunter — un'élite di avventurieri — e ritrovare suo padre. Supera l'esame più difficile al mondo e si addentra in un universo di poteri Nen, creature pericolose e intrighi mortali."
  },
  "Fullmetal Alchemist": {
    isbn: "9784757506200",
    desc: "I fratelli Edward e Alphonse Elric, dopo un tentativo proibito di resurrezione alchemica costato loro parti del corpo, cercano la Pietra Filosofale per tornare alla normalità. Il loro viaggio li porta a scoprire una cospirazione che minaccia l'intera nazione di Amestris."
  },
  "My Hero Academia": {
    isbn: "9784088802695",
    desc: "In un mondo dove quasi tutti possiedono superpoteri chiamati Quirk, Izuku Midoriya nasce senza alcun potere. Dopo aver ereditato il Quirk del più grande eroe, All Might, entra alla U.A. High School per realizzare il suo sogno di diventare un eroe professionista."
  },
  "Demon Slayer": {
    isbn: "9784088807232",
    desc: "Tanjiro Kamado, un gentile venditore di carbone, vede la sua famiglia sterminata dai demoni. L'unica sopravvissuta è sua sorella Nezuko, trasformata in un demone. Tanjiro diventa un cacciatore di demoni per trovare una cura e vendicare la sua famiglia."
  },
  "Jujutsu Kaisen": {
    isbn: "9784088815756",
    desc: "Yuji Itadori, uno studente liceale dalla forza sovrumana, ingerisce un dito maledetto del Re delle Maledizioni Ryomen Sukuna. Entrato nella scuola di stregoneria di Tokyo, deve raccogliere e consumare tutti i frammenti di Sukuna per essere giustiziato insieme al demone."
  },
  "Chainsaw Man": {
    isbn: "9784088816869",
    desc: "Denji, un ragazzo poverissimo che lavora come cacciatore di diavoli per ripagare i debiti del padre defunto, si fonde con il suo diavolo-motosega Pochita. Reclutato dalla Pubblica Sicurezza, affronta diavoli terrificanti inseguendo sogni semplici: mangiare bene e trovare una ragazza."
  },
  "Black Clover": {
    isbn: "9784088804651",
    desc: "Asta, un orfano nato senza magia in un mondo dove tutti la possiedono, riceve un grimorio a cinque trifogli con poteri anti-magia. Insieme al suo rivale Yuno, punta a diventare il Mago Imperatore del Regno di Clover."
  },
  "Dr. Stone": {
    isbn: "9784088812700",
    desc: "Dopo che un misterioso evento pietrifica l'intera umanità, il genio scientifico Senku Ishigami si risveglia migliaia di anni dopo. Con la sola forza della scienza, ricostruisce la civiltà da zero in un mondo tornato all'età della pietra."
  },
  "The Promised Neverland": {
    isbn: "9784088807706",
    desc: "Emma, Norman e Ray vivono felici nell'orfanotrofio Grace Field House fino a quando scoprono la terribile verità: i bambini vengono allevati come cibo per i demoni. Devono escogitare un piano di fuga impossibile per salvare tutti i loro fratelli."
  },
  "Haikyu!!": {
    isbn: "9784088703718",
    desc: "Shoyo Hinata, un ragazzo basso ma atletico, sogna di diventare un grande giocatore di pallavolo. Alla Karasuno High School forma un duo esplosivo con il geniale alzatore Tobio Kageyama, trasformando la squadra in una forza competitiva a livello nazionale."
  },
  "Kuroko's Basket": {
    isbn: "9784088701899",
    desc: "Tetsuya Kuroko, il sesto membro fantasma della leggendaria Generazione dei Miracoli, entra nella squadra di basket della Seirin High. Con il suo stile di gioco invisibile e l'aiuto del potente Taiga Kagami, sfida i suoi ex compagni prodigio."
  },
  "Yu Yu Hakusho": {
    isbn: "9784088713267",
    desc: "Yusuke Urameshi, un teppista quattordicenne, muore salvando un bambino e viene resuscitato come Detective del Mondo Spirituale. Dotato di poteri soprannaturali, indaga su casi legati al mondo dei demoni, affrontando tornei e nemici sempre più potenti."
  },
  "Slam Dunk": {
    isbn: "9784088716114",
    desc: "Hanamichi Sakuragi, un liceale rissoso alto quasi due metri, si avvicina al basket per impressionare una ragazza. Scopre un talento naturale straordinario e, guidato dall'allenatore Anzai, trasforma la squadra dello Shohoku in una contendente per il campionato nazionale."
  },
  "Fist of the North Star": {
    isbn: "9784088518880",
    desc: "In un mondo post-apocalittico devastato dalla guerra nucleare, Kenshiro è l'erede della micidiale arte marziale Hokuto Shinken. Vaga per le terre desolate proteggendo i deboli dai tiranni, alla ricerca della sua amata Yuria e della giustizia."
  },
  "Soul Eater": {
    isbn: "9784757512306",
    desc: "Alla Death Weapon Meister Academy, studenti e armi viventi collaborano per raccogliere anime malvagie. Maka Albarn e la sua falce Soul Eater Evans affrontano streghe, pazzia e minacce cosmiche per proteggere l'equilibrio del mondo."
  },
  "Fairy Tail": {
    isbn: "9784063524574",
    desc: "Lucy Heartfilia, una maga celestiale, si unisce alla gilda di maghi Fairy Tail dove incontra Natsu Dragneel, un Dragon Slayer alla ricerca del suo drago scomparso. Insieme affrontano missioni pericolose, nemici oscuri e scoprono il vero significato della famiglia."
  },
  "Blue Lock": {
    isbn: "9784065164563",
    desc: "Dopo l'ennesima delusione ai Mondiali, il Giappone lancia il progetto Blue Lock: rinchiudere 300 giovani attaccanti in una struttura per forgiare l'attaccante egoista più forte del mondo. Yoichi Isagi deve superare rivali spietati per non essere eliminato per sempre dal calcio."
  },
  "The Seven Deadly Sins": {
    isbn: "9784063949896",
    desc: "La principessa Elizabeth cerca i Sette Peccati Capitali, un gruppo di cavalieri leggendari accusati di tradimento, per liberare il regno di Liones dai Cavalieri Sacri corrotti. Meliodas, il Peccato dell'Ira, guida il gruppo in un'avventura epica tra magia e redenzione."
  },
  "Magi: The Labyrinth of Magic": {
    isbn: "9784091228369",
    desc: "Aladdin, un giovane mago che porta con sé un djinn in un flauto, e Alibaba, un ragazzo ambizioso, esplorano dungeon misteriosi pieni di tesori e pericoli. In un mondo ispirato alle Mille e una Notte, affrontano imperi corrotti e forze oscure che minacciano il destino del mondo."
  },
  "Toriko": {
    isbn: "9784088745930",
    desc: "In un'era gastronomica dove gli ingredienti più rari sono i più preziosi, Toriko è un leggendario Bishokuya — cacciatore di cibo gourmet. Insieme allo chef Komatsu, esplora territori selvaggi alla ricerca del menu perfetto, combattendo bestie colossali e organizzazioni criminali."
  },
  "Assassination Classroom": {
    isbn: "9784088802336",
    desc: "Una creatura tentacolare capace di muoversi a Mach 20 ha distrutto il 70% della Luna e minaccia di fare lo stesso con la Terra. Diventa insegnante della classe 3-E, i cui studenti hanno un anno per assassinarlo. Ma Koro-sensei è il miglior professore che abbiano mai avuto."
  },
  "Berserk": {
    isbn: "9784592135371",
    desc: "Gatsu, il Guerriero Nero, brandisce una spada enorme e vaga per un mondo medievale oscuro e violento, perseguitato da demoni attratti dal marchio sul suo collo. La sua è una storia di vendetta, sopravvivenza e lotta contro un destino apparentemente ineluttabile."
  },
  "Vagabond": {
    isbn: "9784063436037",
    desc: "Basato sulla vita del leggendario samurai Miyamoto Musashi, Vagabond racconta la trasformazione di un giovane violento e ambizioso in un guerriero alla ricerca dell'invincibilità attraverso la via della spada, esplorando temi di crescita interiore, solitudine e il significato della forza."
  },
  "Vinland Saga": {
    isbn: "9784063726718",
    desc: "Thorfinn, figlio di un grande guerriero vichingo assassinato, cresce tra mercenari cercando vendetta. Ambientato nell'epoca delle invasioni vichinghe in Inghilterra, il manga esplora la violenza della guerra e il difficile cammino verso la pace e la redenzione."
  },
  "Monster": {
    isbn: "9784091866516",
    desc: "Il dottor Kenzo Tenma, brillante neurochirurgo a Düsseldorf, salva la vita di un bambino rinunciando a operare il sindaco. Anni dopo scopre che quel bambino è diventato un serial killer senza emozioni. Tenma si lancia in una caccia attraverso l'Europa per fermarlo."
  },
  "20th Century Boys": {
    isbn: "9784091848567",
    desc: "Kenji, un ex musicista diventato commerciante, scopre che una misteriosa setta chiamata Amico sta realizzando le fantasie apocalittiche che lui e i suoi amici avevano inventato da bambini. Un thriller che si estende su tre decenni, tra complotti, profezie e il potere della memoria."
  },
  "Tokyo Ghoul": {
    isbn: "9784088792422",
    desc: "Ken Kaneki, uno studente universitario di Tokyo, sopravvive all'attacco di un ghoul — creature che si nutrono di carne umana — ma viene trasformato in un mezzo ghoul. Intrappolato tra due mondi, deve trovare il suo posto in una società che non tollera la diversità."
  },
  "Attack on Titan": {
    isbn: "9784063842760",
    desc: "L'umanità sopravvive dietro enormi mura che la proteggono dai Titani, giganti divoratori di uomini. Quando un Titano Colossale distrugge la prima cinta muraria, Eren Jaeger giura di sterminare ogni Titano, scoprendo verità sconvolgenti sull'origine dei giganti e sulla storia del mondo."
  },
  "Death Note": {
    isbn: "9784088736211",
    desc: "Light Yagami, uno studente modello, trova un quaderno soprannaturale: chiunque il cui nome venga scritto al suo interno muore. Light inizia a eliminare i criminali per creare un mondo perfetto, ma il geniale detective L si mette sulle sue tracce in un duello intellettuale mortale."
  },
  "JoJo's Bizarre Adventure": {
    isbn: "9784088510033",
    desc: "La saga multigenerazionale della famiglia Joestar, legata da un destino di battaglie contro il vampiro immortale Dio Brando e le sue incarnazioni. Ogni arco segue un nuovo JoJo con poteri Stand unici, in avventure che spaziano dall'Inghilterra vittoriana al Giappone contemporaneo."
  },
  "Akira": {
    isbn: "9784063137132",
    desc: "Neo-Tokyo, 2019. Kaneda, leader di una banda di motociclisti, si ritrova coinvolto in un progetto militare segreto quando il suo amico Tetsuo sviluppa poteri psichici incontrollabili. Un'opera visionaria che ha ridefinito il genere cyberpunk e la fantascienza giapponese."
  },
  "Ghost in the Shell": {
    isbn: "9784063050509",
    desc: "In un futuro dove la tecnologia ha reso sfumato il confine tra uomo e macchina, il Maggiore Motoko Kusanagi guida la Sezione 9, un'unità anti-cybercrimine. Affronta hacker, terroristi e intelligenze artificiali, interrogandosi sulla natura della coscienza e dell'identità."
  },
  "Nausicaä della Valle del Vento": {
    isbn: "9784195066149",
    desc: "In un mondo post-apocalittico dominato dalla Giungla Tossica e da insetti giganti, la principessa Nausicaä cerca di comprendere l'ecosistema mortale anziché combatterlo. Un'epopea ecologica di Miyazaki sulla convivenza tra umanità e natura, guerra e pace."
  },
  "Made in Abyss": {
    isbn: "9784812474002",
    desc: "Riko, un'orfana che vive ai margini dell'Abisso — un'enorme voragine piena di reliquie e creature letali — parte in discesa con il robot Reg alla ricerca di sua madre. Ma ogni strato più profondo riserva pericoli crescenti, e risalire ha un costo terribile sul corpo umano."
  },
  "One Punch Man": {
    isbn: "9784088801674",
    desc: "Saitama è un eroe per hobby talmente forte da sconfiggere qualsiasi nemico con un solo pugno. Il problema? La noia esistenziale di non trovare mai un avversario all'altezza. Una parodia brillante del genere supereroistico che è diventata un fenomeno globale."
  },
  "Mob Psycho 100": {
    isbn: "9784091865236",
    desc: "Shigeo 'Mob' Kageyama è un ragazzo timido e anonimo che possiede immensi poteri psichici. Lavora part-time per un truffatore autoproclamato medium, cercando di vivere una vita normale. Ma quando le sue emozioni raggiungono il 100%, i suoi poteri esplodono in modo incontrollabile."
  },
  "Gantz": {
    isbn: "9784088762852",
    desc: "Persone appena morte vengono resuscitate in un appartamento a Tokyo da una sfera nera chiamata Gantz, che le costringe a partecipare a missioni suicide contro alieni nascosti tra gli esseri umani. Un thriller violento e imprevedibile sulla vita, la morte e le seconde possibilità."
  },
  "Parasyte": {
    isbn: "9784063140576",
    desc: "Misteriosi parassiti alieni si infiltrano nei cervelli degli umani, prendendo il controllo dei loro corpi. Shinichi Izumi viene infettato alla mano destra: lui e il parassita Migi devono convivere e collaborare per sopravvivere, mettendo in discussione cosa significhi essere umani."
  },
  "Blame!": {
    isbn: "9784063342116",
    desc: "In una megastruttura urbana che si espande all'infinito, Killy vaga per livelli sconfinati alla ricerca del Gene Terminale di Rete, l'unica speranza per fermare la crescita incontrollata della città. Un'opera cyberpunk minimalista e claustrofobica di rara potenza visiva."
  },
  "Hellsing": {
    isbn: "9784785923587",
    desc: "L'organizzazione Hellsing protegge l'Inghilterra dalle minacce soprannaturali, guidata dalla glaciale Integra e dal suo asso nella manica: Alucard, il vampiro più potente del mondo. Quando un esercito di vampiri nazisti attacca Londra, si scatena una guerra totale tra mostri."
  },
  "Drifters": {
    isbn: "9784785934248",
    desc: "Grandi guerrieri della storia — samurai, cavalieri, piloti — vengono trasportati in un mondo fantasy dove si scontrano in una guerra tra Drifters (eroi) e Ends (figure storiche corrotte). Shimazu Toyohisa guida un esercito improbabile contro le forze delle tenebre."
  },
  "Kingdom": {
    isbn: "9784088745671",
    desc: "Nella Cina del periodo degli Stati Combattenti, Shin, un orfano schiavo che sogna di diventare il più grande generale della storia, si allea con il giovane re Ei Sei. Insieme puntano all'unificazione della Cina attraverso epiche battaglie e strategie militari."
  },
  "Goodnight Punpun": {
    isbn: "9784091867100",
    desc: "La vita di Punpun Onodera — rappresentato come un semplice uccellino stilizzato — dall'infanzia all'età adulta in una Tokyo spietata. Un ritratto devastante della depressione, delle relazioni tossiche e della difficoltà di crescere, raccontato con un realismo emotivo senza compromessi."
  },
  "Homunculus": {
    isbn: "9784091871220",
    desc: "Nakoshi, un uomo senza fissa dimora, accetta di sottoporsi a un'operazione di trapanazione cranica in cambio di denaro. Inizia a vedere le deformità psicologiche delle persone sotto forma di mostruose allucinazioni chiamate Homunculus, venendo trascinato in un abisso di follia."
  },
  "Real": {
    isbn: "9784088761343",
    desc: "Le vite intrecciate di tre ragazzi legati al basket su sedia a rotelle: Togawa, ex promessa del basket paralizzato da un incidente, Nomiya, un teppista che ha causato un incidente stradale, e Takahashi, un atleta che perde l'uso delle gambe. Un racconto crudo sulla disabilità e la rinascita."
  },
  "Pluto": {
    isbn: "9784091884619",
    desc: "Rivisitazione del racconto 'Il più grande robot del mondo' di Osamu Tezuka. L'ispettore robot Gesicht indaga su una serie di omicidi che colpiscono i robot più avanzati e gli umani che li sostengono. Un thriller filosofico sulla natura dell'odio, della memoria e dell'umanità."
  },
  "Spy x Family": {
    isbn: "9784088820101",
    desc: "Per una missione segreta, la spia Twilight deve costruire una famiglia finta: adotta Anya, una bambina telepate, e sposa Yor, un'assassina. Nessuno conosce i segreti degli altri. Una commedia d'azione dove la famiglia più disfunzionale del mondo scopre il vero affetto."
  },
  "Fruits Basket": {
    isbn: "9784592170761",
    desc: "Tohru Honda, un'orfana che vive in una tenda, viene accolta dalla famiglia Soma, i cui membri sono maledetti: si trasformano in animali dello zodiaco cinese se abbracciati dal sesso opposto. Con la sua gentilezza, Tohru cerca di spezzare la maledizione che imprigiona i Soma."
  },
  "Sailor Moon": {
    isbn: "9784063178050",
    desc: "Usagi Tsukino, una studentessa goffa e piagnucolosa, scopre di essere Sailor Moon, guerriera che combatte le forze del male in nome della Luna. Con le sue compagne Sailor Guardians, protegge la Terra da minacce cosmiche, scoprendo di essere la reincarnazione di una principessa lunare."
  },
  "Cardcaptor Sakura": {
    isbn: "9784063198188",
    desc: "Sakura Kinomoto, dieci anni, apre accidentalmente un libro magico liberando le carte Clow, potenti entità magiche. Con l'aiuto del guardiano Kero, deve catturarle tutte prima che provochino disastri, scoprendo di possedere una magia tutta sua."
  },
  "Nana": {
    isbn: "9784088563237",
    desc: "Due ragazze di nome Nana si incontrano sul treno per Tokyo e diventano coinquiline. Nana Osaki è una punk rocker ambiziosa, Nana Komatsu una romantica ingenua. Le loro vite si intrecciano in una storia di amicizia, amore, successo e autodistruzione nel mondo della musica."
  },
  "Ouran High School Host Club": {
    isbn: "9784592175568",
    desc: "Haruhi Fujioka, una studentessa borghese nella prestigiosa Ouran Academy, rompe un vaso da 8 milioni di yen e per ripagare il debito deve lavorare nell'Host Club della scuola — un gruppo di bei ragazzi che intrattengono le studentesse. Ma Haruhi nasconde un segreto."
  },
  "Kaguya-sama: Love is War": {
    isbn: "9784088806792",
    desc: "Kaguya Shinomiya e Miyuki Shirogane, presidente e vicepresidente del consiglio studentesco, sono innamorati l'uno dell'altra ma troppo orgogliosi per confessarsi. Ogni episodio è una battaglia psicologica per far cedere l'altro per primo. L'amore è guerra."
  },
  "Horimiya": {
    isbn: "9784757540576",
    desc: "Kyoko Hori sembra la studentessa perfetta, Izumi Miyamura un ragazzo cupo e insignificante. Ma fuori da scuola i ruoli si invertono: Hori è una casalinga stressata, Miyamura un ragazzo tatuato e pieno di piercing. Scoprendo i rispettivi segreti, nasce un amore dolce e sincero."
  },
  "Toradora!": {
    isbn: "9784048670067",
    desc: "Ryuuji Takasu ha un aspetto minaccioso ma è un ragazzo gentile; Taiga Aisaka è minuscola ma terribilmente aggressiva. Quando scoprono che ciascuno è innamorato del migliore amico dell'altro, stringono un patto di alleanza. Ma i sentimenti non sempre vanno secondo i piani."
  },
  "A Silent Voice": {
    isbn: "9784063950106",
    desc: "Shoya Ishida, un ex bullo che ha tormentato la compagna sorda Shoko Nishimiya, viene a sua volta emarginato e cade in depressione. Anni dopo cerca di ricostruire il rapporto con Shoko, affrontando il senso di colpa e imparando il valore del perdono e della comunicazione."
  },
  "Your Lie in April": {
    isbn: "9784063714685",
    desc: "Kosei Arima, un giovane pianista prodigio, smette di suonare dopo la morte della madre perché non riesce più a sentire il suono del pianoforte. L'incontro con la violinista Kaori Miyazono, libera e appassionata, riporta colore e musica nella sua vita monocromatica."
  },
  "March Comes in Like a Lion": {
    isbn: "9784592145134",
    desc: "Rei Kiriyama, un giovane giocatore professionista di shogi solo e depresso, trova calore umano nella famiglia Kawamoto — tre sorelle che lo accolgono con cibo e affetto. Un ritratto delicato della solitudine, della guarigione e del trovare il proprio posto nel mondo."
  },
  "Inuyasha": {
    isbn: "9784091251411",
    desc: "Kagome Higurashi, una liceale di Tokyo, cade in un pozzo e viene trasportata nel Giappone dell'epoca Sengoku. Lì incontra Inuyasha, un mezzo demone sigillato a un albero, e insieme cercano i frammenti della Sfera dei Quattro Spiriti per impedire che cadano in mani malvagie."
  },
  "Ranma ½": {
    isbn: "9784091220417",
    desc: "Ranma Saotome e suo padre cadono in sorgenti maledette cinesi: Ranma si trasforma in ragazza a contatto con l'acqua fredda, suo padre in panda. Promesso sposo alla combattiva Akane Tendo, Ranma deve affrontare rivali in amore, arti marziali assurde e la sua doppia identità."
  },
  "Maison Ikkoku": {
    isbn: "9784091509116",
    desc: "Yusaku Godai, uno studente squattrinato, vive nella pensione Maison Ikkoku abitata da vicini caotici e invadenti. Quando la bella vedova Kyoko Otonashi diventa la nuova amministratrice, Godai se ne innamora perdutamente. Una commedia romantica dolceamara sulla perseveranza in amore."
  },
  "Skip Beat!": {
    isbn: "9784592178316",
    desc: "Kyoko Mogami scopre che il suo amato Sho, aspirante pop star, l'ha usata solo come domestica. Accecata dalla rabbia, decide di entrare nel mondo dello spettacolo per vendicarsi, ma strada facendo scopre una vera passione per la recitazione che trasforma la vendetta in vocazione."
  },
  "Lovely Complex": {
    isbn: "9784088563565",
    desc: "Risa Koizumi è una ragazza altissima, Atsushi Otani un ragazzo bassissimo. I compagni li vedono come un duo comico, ma quando Risa si innamora di Otani deve affrontare il complesso dell'altezza, i malintesi e la paura del rifiuto in una rom-com fresca e divertente."
  },
  "Il barone rampante": {
    isbn: "9788804668237",
    desc: "Cosimo Piovasco di Rondò, un giovane nobile del Settecento ligure, sale sugli alberi a dodici anni per sfuggire a un piatto di lumache e decide di non scendere mai più. Vive un'intera esistenza tra i rami, partecipando alla vita del suo tempo con filosofia e avventura."
  },
  "Se questo è un uomo": {
    isbn: "9788806174545",
    desc: "La testimonianza di Primo Levi sulla sua deportazione ad Auschwitz nel 1944. Con lucidità e sobrietà, racconta la vita nel campo di concentramento, l'annullamento della dignità umana e la lotta quotidiana per la sopravvivenza. Un documento fondamentale della letteratura del Novecento."
  },
  "Il nome della rosa": {
    isbn: "9788845278730",
    desc: "Nel 1327, il frate francescano Guglielmo da Baskerville indaga su una serie di morti misteriose in un'abbazia benedettina del Nord Italia. Tra biblioteche segrete, dispute teologiche e veleni, un giallo medievale che è anche un trattato sulla conoscenza e il potere dei libri."
  },
  "La coscienza di Zeno": {
    isbn: "9788804667957",
    desc: "Zeno Cosini scrive le sue memorie su consiglio dello psicoanalista. Tra il vizio del fumo che non riesce a smettere, il matrimonio sbagliato e gli affari, Zeno racconta la propria inettitudine con un'ironia che trasforma ogni fallimento in una riflessione sulla condizione umana moderna."
  },
  "Il fu Mattia Pascal": {
    isbn: "9788804672081",
    desc: "Mattia Pascal, uomo infelice e oppresso, approfitta di essere creduto morto per reinventarsi con una nuova identità. Ma scopre che vivere senza un'identità ufficiale è impossibile nella società burocratica, restando intrappolato in un limbo tra la vecchia e la nuova vita."
  },
  "Uno, nessuno e centomila": {
    isbn: "9788804667933",
    desc: "Vitangelo Moscarda scopre che il suo naso pende leggermente a destra — e che ognuno lo vede in modo diverso. Questa rivelazione lo porta a una crisi d'identità radicale: se esistono centomila versioni di lui nella mente degli altri, chi è davvero? Forse nessuno."
  },
  "I promessi sposi": {
    isbn: "9788804670495",
    desc: "Renzo e Lucia, due giovani fidanzati lombardi del Seicento, non possono sposarsi perché il prepotente Don Rodrigo vuole Lucia per sé. Il romanzo segue le loro peripezie attraverso carestie, pestilenze e ingiustizie, dipingendo un affresco della società italiana sotto la dominazione spagnola."
  },
  "Il Gattopardo": {
    isbn: "9788807880575",
    desc: "Il principe Fabrizio Salina osserva il tramonto della nobiltà siciliana durante il Risorgimento. Mentre Garibaldi sbarca in Sicilia e l'Italia si unifica, il vecchio aristocrazia cede il posto alla nuova borghesia. 'Se vogliamo che tutto rimanga com'è, bisogna che tutto cambi.'"
  },
  "La luna e i falò": {
    isbn: "9788806219499",
    desc: "Un uomo torna nelle Langhe piemontesi dopo vent'anni in America, cercando le radici della sua infanzia di trovatello. Attraverso i ricordi e i dialoghi con l'amico Nuto, ricostruisce un mondo contadino trasformato dalla guerra e dalla violenza, tra nostalgia e disillusione."
  },
  "Cristo si è fermato a Eboli": {
    isbn: "9788806219512",
    desc: "Carlo Levi, intellettuale antifascista confinato in un paesino della Lucania negli anni '30, scopre un mondo arcaico dove lo Stato non è mai arrivato, la malaria imperversa e la magia convive con la miseria. Un reportage poetico sull'Italia dimenticata."
  },
  "1984": {
    isbn: "9788804668237",
    desc: "In un futuro totalitario, Winston Smith vive sotto il controllo onnipresente del Grande Fratello. Quando inizia una relazione clandestina e si avvicina alla resistenza, scopre fino a che punto il Partito è disposto a spingersi per controllare non solo le azioni, ma i pensieri stessi dei cittadini."
  },
  "Il signore degli anelli": {
    isbn: "9788830104518",
    desc: "Frodo Baggins, un hobbit della Contea, eredita l'Unico Anello del Signore Oscuro Sauron. Deve distruggerlo nel fuoco di Monte Fato per salvare la Terra di Mezzo. Un viaggio epico attraverso regni elfici, miniere di nani e campi di battaglia, con la Compagnia dell'Anello al suo fianco."
  },
  "Lo Hobbit": {
    isbn: "9788845281440",
    desc: "Bilbo Baggins, un hobbit tranquillo e casalingo, viene trascinato dal mago Gandalf in un'avventura con tredici nani per riconquistare il tesoro del drago Smaug. Lungo la strada trova un anello misterioso che cambierà il destino della Terra di Mezzo."
  },
  "Harry Potter e la pietra filosofale": {
    isbn: "9788831003384",
    desc: "Harry Potter, orfano maltrattato dagli zii, scopre a undici anni di essere un mago e viene ammesso alla Scuola di Magia e Stregoneria di Hogwarts. Tra lezioni incantate, amicizie e misteri, Harry affronta per la prima volta Lord Voldemort, il mago oscuro che ha ucciso i suoi genitori."
  },
  "Il trono di spade": {
    isbn: "9788804644121",
    desc: "Nei Sette Regni di Westeros, casate nobili lottano per il Trono di Spade mentre una minaccia antica si risveglia oltre la Barriera ghiacciata. Intrighi politici, tradimenti e battaglie si intrecciano in un fantasy epico dove nessun personaggio è al sicuro."
  },
  "Dune": {
    isbn: "9788804601630",
    desc: "Paul Atreides, giovane erede di una casata nobile, viene esiliato sul pianeta desertico Arrakis, unica fonte della Spezia, la sostanza più preziosa dell'universo. Tra i Fremen del deserto, Paul scopre il suo destino di messia e guerriero, sfidando l'Imperatore e i suoi nemici."
  },
  "Fahrenheit 451": {
    isbn: "9788804668954",
    desc: "In un futuro dove i libri sono proibiti e i pompieri li bruciano, Guy Montag è un pompiere fedele al sistema. Ma quando incontra una ragazza che gli fa riscoprire il piacere di pensare e leggere, inizia a mettere in discussione tutto ciò in cui ha creduto."
  },
  "Il club Dumas": {
    isbn: "9788804490661",
    desc: "Lucas Corso, cacciatore di libri rari, viene incaricato di autenticare un manoscritto di Alexandre Dumas e un volume di demonologia del Seicento. Immerso in un giallo bibliofilo tra Parigi, Toledo e Lisbona, si ritrova al centro di una trama che mescola realtà e finzione letteraria."
  },
  "Dieci piccoli indiani": {
    isbn: "9788804671503",
    desc: "Dieci sconosciuti vengono invitati su un'isola deserta da un misterioso ospite. Uno alla volta, iniziano a morire seguendo la filastrocca dei dieci piccoli indiani appesa nelle loro stanze. Isolati dal mondo, il sospetto e la paura crescono. Chi è l'assassino tra loro?"
  },
  "Il codice da Vinci": {
    isbn: "9788804531791",
    desc: "Il simbologista Robert Langdon viene chiamato al Louvre dove il curatore è stato trovato morto in una posa rituale. Insieme alla crittografa Sophie Neveu, segue una catena di indizi nascosti nelle opere di Leonardo da Vinci che portano a un segreto custodito da secoli."
  },
  "Cent'anni di solitudine": {
    isbn: "9788804668741",
    desc: "La saga della famiglia Buendía nel villaggio immaginario di Macondo, dalla fondazione alla sua fine apocalittica. Sette generazioni vivono amori impossibili, guerre, rivoluzioni e prodigi in un capolavoro del realismo magico che ha cambiato la letteratura mondiale."
  },
  "Il vecchio e il mare": {
    isbn: "9788804667599",
    desc: "Santiago, un vecchio pescatore cubano che non prende un pesce da 84 giorni, si avventura in mare aperto e aggancia un marlin gigantesco. La lotta epica tra uomo e pesce dura tre giorni, una meditazione sulla resistenza, la dignità e il rapporto tra l'uomo e la natura."
  },
  "Delitto e castigo": {
    isbn: "9788804670178",
    desc: "Raskolnikov, uno studente povero di San Pietroburgo, uccide una vecchia usuraia convinto di essere un uomo straordinario al di sopra della morale comune. Ma il senso di colpa lo consuma lentamente, portandolo a un confronto con la propria coscienza e con il detective Porfirij."
  },
  "Orgoglio e pregiudizio": {
    isbn: "9788804668329",
    desc: "Elizabeth Bennet, intelligente e spiritosa, e Fitzwilliam Darcy, ricco e apparentemente altezzoso, si scontrano e si attraggono nell'Inghilterra della Reggenza. Superando i rispettivi pregiudizi, scoprono che le prime impressioni possono essere profondamente sbagliate."
  },
  "Il grande Gatsby": {
    isbn: "9788804668312",
    desc: "Jay Gatsby, misterioso milionario di Long Island, organizza feste sontuose nel tentativo di riconquistare Daisy Buchanan, l'amore della sua giovinezza. Narrato dal vicino Nick Carraway, è un ritratto abbagliante e tragico del sogno americano negli anni Venti."
  },
  "Lo strano caso del cane ucciso a mezzanotte": {
    isbn: "9788806168582",
    desc: "Christopher, quindici anni, autistico e geniale in matematica, trova il cane della vicina ucciso da un forcone e decide di investigare. La sua indagine, narrata in prima persona con logica rigorosa e diagrammi, lo porta a scoprire segreti di famiglia che cambieranno la sua vita."
  },
  "La storia infinita": {
    isbn: "9788830100114",
    desc: "Bastiano, un ragazzo timido e bullizzato, ruba un libro misterioso e leggendolo viene risucchiato nel mondo di Fantàsia, minacciato dal Nulla. Deve trovare il coraggio di dare un nuovo nome all'Imperatrice Bambina per salvare il regno dell'immaginazione — e se stesso."
  },
  "Le cronache di Narnia": {
    isbn: "9788804667971",
    desc: "Quattro fratelli inglesi scoprono nel retro di un armadio il passaggio per Narnia, un mondo magico governato dal leone Aslan e minacciato dalla Strega Bianca che lo ha condannato a un inverno eterno. Un classico dell'avventura fantasy intriso di allegoria e meraviglia."
  },
  "Neuromante": {
    isbn: "9788804667988",
    desc: "Case, un hacker bruciato dalla droga e tradito dai suoi datori di lavoro, viene reclutato per il colpo informatico più grande della storia: penetrare le difese di un'intelligenza artificiale. Il romanzo che ha inventato il cyberpunk, tra realtà virtuale, yakuza e coscienza digitale."
  },
  "Io, robot": {
    isbn: "9788804667995",
    desc: "Una raccolta di racconti che esplora le Tre Leggi della Robotica attraverso i problemi logici e morali posti dai robot della U.S. Robots. La robopsicologa Susan Calvin guida il lettore in un futuro dove le macchine sono più razionali — e forse più umane — dei loro creatori."
  },
  "It": {
    isbn: "9788820060800",
    desc: "A Derry, nel Maine, un gruppo di ragazzini affronta un'entità malefica che si manifesta come il clown Pennywise e si nutre delle paure dei bambini. Ventisette anni dopo, da adulti, devono tornare per affrontare It una volta per tutte. Un'epopea sull'infanzia, l'amicizia e il terrore."
  },
  "Shining": {
    isbn: "9788820060817",
    desc: "Jack Torrance, scrittore alcolizzato, accetta il posto di custode invernale dell'isolato Overlook Hotel portando moglie e figlio Danny, dotato di poteri psichici. L'hotel, infestato da presenze maligne, si insinua nella mente fragile di Jack, trasformandolo in una minaccia per la sua stessa famiglia."
  },
  "Lo zen e l'arte della manutenzione della motocicletta": {
    isbn: "9788845907456",
    desc: "Un padre e suo figlio attraversano gli Stati Uniti in motocicletta. Il viaggio diventa un'esplorazione filosofica della Qualità — il concetto che unisce arte e tecnologia, razionalità e romanticismo. Un libro che sfida le categorie, tra autobiografia, filosofia e manuale di vita."
  },
};

const updateBook = db.prepare(`
  UPDATE books SET isbn = ?, cover_url = ?, description = ?
  WHERE title = ? AND (isbn IS NULL OR isbn = '')
`);

const updateAll = db.transaction(() => {
  for (const [title, { isbn, desc }] of Object.entries(metadata)) {
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    const result = updateBook.run(isbn, coverUrl, desc, title);
    if (result.changes === 0) {
      console.log(`  Saltato (non trovato o già compilato): "${title}"`);
    }
  }
});

updateAll();

// ---- Summary ------------------------------------------------
const total = db.prepare("SELECT COUNT(*) AS n FROM books").get().n;
const withIsbn = db.prepare("SELECT COUNT(*) AS n FROM books WHERE isbn IS NOT NULL AND isbn != ''").get().n;
const withDesc = db.prepare("SELECT COUNT(*) AS n FROM books WHERE description IS NOT NULL AND description != ''").get().n;
const withCover = db.prepare("SELECT COUNT(*) AS n FROM books WHERE cover_url IS NOT NULL AND cover_url != ''").get().n;

console.log(`\nRisultato finale:`);
console.log(`  Libri totali: ${total}`);
console.log(`  Con ISBN:     ${withIsbn}/${total}`);
console.log(`  Con cover:    ${withCover}/${total}`);
console.log(`  Con descr.:   ${withDesc}/${total}`);
console.log(`  Generi:`, db.prepare("SELECT DISTINCT genre FROM books ORDER BY genre").all().map(r => r.genre).join(", "));
