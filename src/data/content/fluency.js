const POLISH_ASCII = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (value) => value.toLocaleLowerCase("pl").replace(/[ąćęłńóśźż]/g, (letter) => POLISH_ASCII[letter]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const phonetic = (value) => value.toLocaleLowerCase("pl")
  .replace(/dź|dzi/g, "jy").replace(/dż/g, "j").replace(/cz/g, "ch").replace(/sz/g, "sh")
  .replace(/rz|ż/g, "zh").replace(/ś/g, "sh").replace(/ć/g, "ch").replace(/ń/g, "ny")
  .replace(/ł/g, "W").replace(/w/g, "v").replace(/W/g, "w").replace(/j/g, "y").replace(/c/g, "ts")
  .replace(/ó/g, "oo").replace(/ą/g, "on").replace(/ę/g, "en");

const reading = (text, questions) => ({ type: "reading", content: { text, questions } });
const writing = (prompt, kind, model, requiredTokens) => ({ type: "writing", content: { prompt, kind, acceptedAnswers: [model], requiredTokens } });

function unit(slug, title, topic, stage, icon, description, grammar, guideId, activity, pairs) {
  return {
    id: slug,
    slug,
    title,
    topic,
    stage,
    icon,
    description,
    grammar,
    grammarIds: [guideId],
    eyebrow: stage === "B1 confidence" ? "Speak with confidence" : "Bridge towards B2",
    time: 32,
    activity,
    phrases: pairs.map(([polish, english, tip = ""]) => ({
      id: `${slug}-${slugify(polish)}`,
      unitId: slug,
      polish,
      phonetic: phonetic(polish),
      english,
      tip,
      stage,
      topic,
      skills: ["recall", "listening", "speaking"],
      grammarIds: [guideId],
    })),
  };
}

export const fluencyUnits = [
  unit("evaluating-information", "Evaluate information", "Next steps", "B1 confidence", "🔎", "Compare claims, signal uncertainty, and explain why a source deserves trust.", "Hedging expressions such as prawdopodobnie, wydaje się, and o ile wiadomo separate evidence from certainty.", "grammar-fluency-hedging", reading(
    "W mediach społecznościowych pojawiła się informacja, że od przyszłego miesiąca wszystkie bilety komunikacji miejskiej zdrożeją o połowę. Wiadomość szybko udostępniono, chociaż nie podano w niej żadnego źródła. Rzecznik miasta wyjaśnił później, że rozważana jest jedynie niewielka podwyżka cen niektórych biletów. Ostateczna decyzja jeszcze nie zapadła. Przykład pokazuje, jak niepotwierdzona wiadomość może zmienić się w pozornie pewny fakt, jeśli wiele osób powtarza ją bez sprawdzenia.",
    [
      { prompt: "Czego brakowało w pierwszej wiadomości?", options: ["Zdjęcia", "Źródła", "Daty publikacji"], answerIndex: 1 },
      { prompt: "Co naprawdę rozważa miasto?", options: ["Bezpłatne przejazdy", "Podwyżkę wszystkich cen o połowę", "Niewielką podwyżkę niektórych biletów"], answerIndex: 2 },
      { prompt: "Jaki jest główny wniosek tekstu?", options: ["Powtarzanie nie czyni informacji pewną", "Media społecznościowe są zawsze wiarygodne", "Decyzja miasta jest już ostateczna"], answerIndex: 0 },
    ],
  ), [
    ["O ile mi wiadomo, decyzja jeszcze nie zapadła", "As far as I know, the decision hasn't been made yet"],
    ["Wydaje się, że dane są niepełne", "It seems that the data is incomplete"],
    ["Prawdopodobnie doszło do nieporozumienia", "There was probably a misunderstanding"],
    ["Nie ma wystarczających dowodów, żeby to potwierdzić", "There isn't enough evidence to confirm it"],
    ["To twierdzenie opiera się na jednym źródle", "This claim is based on one source"],
    ["Autor nie wyjaśnia, skąd pochodzą liczby", "The author doesn't explain where the figures come from"],
    ["Wyniki można interpretować na kilka sposobów", "The results can be interpreted in several ways"],
    ["Trzeba odróżnić fakt od opinii", "We need to distinguish fact from opinion"],
    ["Ta wersja wydarzeń brzmi wiarygodnie", "This version of events sounds credible"],
    ["Nowsze dane podważają wcześniejszy wniosek", "Newer data calls the earlier conclusion into question"],
    ["Na razie podchodziłbym do tej informacji ostrożnie", "For now I would treat this information cautiously"],
    ["Sprawdźmy, czy potwierdzają to niezależne źródła", "Let's check whether independent sources confirm it"],
  ]),

  unit("persuasive-proposals", "Make a persuasive proposal", "Daily life", "B1 confidence", "💡", "Present a proposal, anticipate concerns, and ask for a concrete decision.", "Żeby introduces an intended result, while dzięki temu explains the benefit that follows.", "grammar-fluency-purpose", writing(
    "Write a short proposal to your manager for one work-from-home day each week. Give a reason, address one possible concern, and suggest a trial period.",
    "email",
    "Chciałbym zaproponować jeden stały dzień pracy z domu w tygodniu, żeby łatwiej było mi skupić się na zadaniach wymagających ciszy. Rozumiem, że ważny jest kontakt z zespołem, dlatego wybrałbym dzień bez wspólnych spotkań. Możemy wprowadzić to rozwiązanie na miesiąc próbny, a potem ocenić jego efekty.",
    ["zaproponować", "żeby", "próbny"],
  ), [
    ["Chciałbym przedstawić konkretną propozycję", "I'd like to present a specific proposal"],
    ["Głównym celem jest skrócenie czasu oczekiwania", "The main aim is to reduce waiting time"],
    ["Proponuję, żebyśmy zaczęli od małej próby", "I suggest that we start with a small trial"],
    ["Dzięki temu szybciej sprawdzimy, co działa", "This will let us check more quickly what works"],
    ["Rozwiązanie nie wymaga dodatkowego budżetu", "The solution doesn't require an additional budget"],
    ["Rozumiem obawy dotyczące kosztów", "I understand the concerns about costs"],
    ["Możemy ograniczyć ryzyko, wprowadzając zmianę stopniowo", "We can limit the risk by introducing the change gradually"],
    ["Największą korzyścią byłaby większa elastyczność", "The biggest benefit would be greater flexibility"],
    ["Podobne rozwiązanie sprawdziło się w innych zespołach", "A similar solution worked in other teams"],
    ["Warto porównać efekty przed podjęciem stałej decyzji", "It's worth comparing the effects before making a permanent decision"],
    ["Czy możemy uzgodnić miesięczny okres próbny?", "Can we agree on a one-month trial period?"],
    ["Jeśli nie będzie poprawy, wrócimy do obecnego systemu", "If there is no improvement, we'll return to the current system"],
  ]),

  unit("presentations-questions", "Present and answer questions", "Daily life", "B1 confidence", "🎤", "Structure a short presentation, guide listeners through evidence, and handle questions.", "Discourse markers announce structure and help listeners follow a longer contribution.", "grammar-fluency-signposting", reading(
    "Podczas prezentacji Marta najpierw określiła cel projektu, a następnie przedstawiła trzy najważniejsze wyniki. Zamiast czytać wszystkie liczby ze slajdów, wyjaśniła, co oznaczają dla klientów. Gdy jeden ze słuchaczy zakwestionował metodę badania, przyznała, że próba była niewielka, i pokazała dodatkowe dane. Na zakończenie podsumowała dwa wnioski oraz wskazała decyzję, którą zespół powinien podjąć. Dzięki jasnej strukturze nawet trudna dyskusja pozostała rzeczowa.",
    [
      { prompt: "Co Marta zrobiła zamiast czytać wszystkie liczby?", options: ["Pominęła wyniki", "Wyjaśniła ich znaczenie dla klientów", "Zmieniła temat"], answerIndex: 1 },
      { prompt: "Jak odpowiedziała na krytyczne pytanie?", options: ["Przerwała prezentację", "Zignorowała słuchacza", "Uznała ograniczenie i pokazała dodatkowe dane"], answerIndex: 2 },
      { prompt: "Co pomogło utrzymać rzeczową dyskusję?", options: ["Jasna struktura", "Duża liczba slajdów", "Brak pytań"], answerIndex: 0 },
    ],
  ), [
    ["Na początek krótko przedstawię cel spotkania", "To begin, I'll briefly present the aim of the meeting"],
    ["Moja prezentacja składa się z trzech części", "My presentation consists of three parts"],
    ["Przejdźmy teraz do najważniejszych wyników", "Let's now move on to the most important results"],
    ["Ten wykres pokazuje wyraźną zmianę", "This chart shows a clear change"],
    ["Warto zwrócić uwagę na dwie kwestie", "It's worth paying attention to two issues"],
    ["Innymi słowy, klienci oczekują prostszego procesu", "In other words, customers expect a simpler process"],
    ["Zanim przejdę dalej, chętnie odpowiem na pytania", "Before I continue, I'll be happy to answer questions"],
    ["To trafne pytanie, na które nie mamy jeszcze pełnej odpowiedzi", "That's a fair question that we don't yet have a full answer to"],
    ["Na podstawie obecnych danych możemy stwierdzić, że…", "Based on the current data, we can conclude that…"],
    ["To badanie ma również pewne ograniczenia", "This study also has some limitations"],
    ["Podsumowując, rekomenduję dalsze testy", "To sum up, I recommend further testing"],
    ["Szczegółowe dane prześlę po spotkaniu", "I'll send the detailed data after the meeting"],
  ]),

  unit("interviews-achievements", "Interviews and achievements", "Daily life", "B1 confidence", "🏆", "Describe responsibilities and achievements with specific evidence and reflection.", "Participial phrases and kiedy clauses connect an action to the context in which it happened.", "grammar-fluency-participles", writing(
    "Write a five-sentence interview answer about a difficult project. Explain the situation, your responsibility, what you did, the result, and what you learned.",
    "description",
    "W poprzedniej pracy odpowiadałam za projekt, który miał duże opóźnienie. Analizując harmonogram, zauważyłam, że zespół czekał zbyt długo na decyzje. Wprowadziłam krótkie codzienne spotkania i jasno podzieliłam odpowiedzialność. Dzięki temu zakończyliśmy projekt tydzień przed nowym terminem. Nauczyłam się, jak ważna jest szybka komunikacja.",
    ["odpowiadałam", "dzięki", "nauczyłam"],
  ), [
    ["W mojej poprzedniej roli odpowiadałem za pięcioosobowy zespół", "In my previous role I was responsible for a team of five"],
    ["Największym wyzwaniem był bardzo krótki termin", "The biggest challenge was a very short deadline"],
    ["Moim zadaniem było uporządkowanie procesu", "My task was to organise the process"],
    ["Analizując dane, zauważyłam powtarzający się problem", "While analysing the data, I noticed a recurring problem"],
    ["Zaproponowałem zmianę sposobu pracy", "I proposed a change in the way we worked"],
    ["Przekonałam zespół, przedstawiając konkretne wyniki", "I persuaded the team by presenting specific results"],
    ["Udało nam się zmniejszyć liczbę błędów o jedną trzecią", "We managed to reduce the number of errors by a third"],
    ["Projekt został ukończony przed terminem", "The project was completed ahead of schedule"],
    ["Otrzymałem pozytywną informację zwrotną od klienta", "I received positive feedback from the client"],
    ["Patrząc z perspektywy czasu, wcześniej poprosiłabym o pomoc", "Looking back, I would have asked for help earlier"],
    ["To doświadczenie nauczyło mnie lepiej ustalać priorytety", "That experience taught me to prioritise better"],
    ["Mogę podać konkretny przykład", "I can give a specific example"],
  ]),

  unit("money-contracts", "Money, terms, and contracts", "Daily life", "B1 confidence", "🧾", "Clarify fees, compare contractual terms, and question obligations before agreeing.", "Formal noun-and-verb combinations such as zawrzeć umowę and ponieść koszt are best learned as collocations.", "grammar-fluency-collocations", reading(
    "Umowa na dostęp do siłowni jest zawierana na dwanaście miesięcy. Klient płaci dziewięćdziesiąt złotych miesięcznie, ale pierwsza opłata obejmuje również jednorazowy koszt karty członkowskiej. Rezygnacja przed końcem umowy jest możliwa wyłącznie z przyczyn zdrowotnych lub po przeprowadzce do miejscowości, w której firma nie ma oddziału. W obu przypadkach trzeba przedstawić odpowiedni dokument. Jeśli klient nie zrezygnuje najpóźniej miesiąc przed końcem okresu, umowa zostanie automatycznie przedłużona.",
    [
      { prompt: "Co zawiera pierwsza opłata?", options: ["Koszt karty członkowskiej", "Roczny trening z instruktorem", "Ubezpieczenie"], answerIndex: 0 },
      { prompt: "Kiedy można wcześniej zakończyć umowę?", options: ["Bez podania przyczyny", "Między innymi po przeprowadzce poza obszar firmy", "Tylko po podwyżce ceny"], answerIndex: 1 },
      { prompt: "Jak uniknąć automatycznego przedłużenia?", options: ["Oddać kartę pierwszego dnia", "Nie płacić ostatniej raty", "Zrezygnować co najmniej miesiąc wcześniej"], answerIndex: 2 },
    ],
  ), [
    ["Chciałbym dokładnie zrozumieć warunki umowy", "I'd like to understand the terms of the contract precisely"],
    ["Czy ta opłata jest jednorazowa czy miesięczna?", "Is this fee one-off or monthly?"],
    ["Jaki jest całkowity koszt w skali roku?", "What is the total annual cost?"],
    ["Umowa zostanie automatycznie przedłużona", "The contract will be renewed automatically"],
    ["Obowiązuje miesięczny okres wypowiedzenia", "A one-month notice period applies"],
    ["W jakich okolicznościach mogę zrezygnować wcześniej?", "Under what circumstances can I cancel early?"],
    ["Nie widzę tej opłaty w przedstawionej ofercie", "I don't see this fee in the offer presented"],
    ["Proszę wskazać odpowiedni punkt regulaminu", "Please indicate the relevant clause in the terms"],
    ["Czy istnieje możliwość negocjacji ceny?", "Is there any possibility of negotiating the price?"],
    ["Wolałbym nie podejmować decyzji od razu", "I'd prefer not to make a decision straight away"],
    ["Najpierw porównam warunki z innymi ofertami", "First I'll compare the terms with other offers"],
    ["Podpiszę umowę po otrzymaniu poprawionej wersji", "I'll sign the contract after receiving the corrected version"],
  ]),

  unit("emotions-reflection", "Reflect on feelings and change", "Social", "B1 confidence", "🌤️", "Describe mixed emotions, changing perspective, and lessons learned without oversimplifying.", "What would have happened is expressed with gdybym plus był and a conditional past-style result.", "grammar-fluency-past-conditional", writing(
    "Write a reflective message about a decision that initially worried you but worked out well. Include your earlier concern, what changed, and what you would do differently.",
    "description",
    "Kiedy zdecydowałam się przeprowadzić, czułam jednocześnie ekscytację i niepokój. Obawiałam się, że trudno będzie mi poznać nowych ludzi, ale z czasem zaczęłam czuć się swobodniej. Gdybym została w poprzednim mieście, prawdopodobnie żałowałabym niewykorzystanej okazji. Dziś wcześniej poprosiłabym innych o wsparcie.",
    ["obawiałam", "z czasem", "gdybym"],
  ), [
    ["Mam mieszane uczucia w tej sprawie", "I have mixed feelings about this"],
    ["Z jednej strony czułem ulgę, z drugiej rozczarowanie", "On the one hand I felt relief, on the other disappointment"],
    ["Początkowo trudno było mi się z tym pogodzić", "Initially it was hard for me to come to terms with it"],
    ["Z czasem spojrzałam na sytuację inaczej", "Over time I looked at the situation differently"],
    ["Najbardziej obawiałem się utraty stabilności", "I was most afraid of losing stability"],
    ["Okazało się, że zmiana była mi potrzebna", "It turned out that I needed the change"],
    ["Gdybym wtedy zrezygnowała, dziś bym tego żałowała", "If I had given up then, I would regret it today"],
    ["Nie wszystko potoczyło się zgodnie z planem", "Not everything went according to plan"],
    ["Mimo trudności jestem zadowolony z tej decyzji", "Despite the difficulties, I'm happy with that decision"],
    ["Nauczyłam się być bardziej cierpliwa wobec siebie", "I learned to be more patient with myself"],
    ["Teraz wiem, że warto było zaryzykować", "Now I know it was worth taking the risk"],
    ["Następnym razem wcześniej poproszę o wsparcie", "Next time I'll ask for support earlier"],
  ]),

  unit("layered-stories", "Tell a layered story", "Social", "B2 bridge", "📖", "Move between background, sequence, reported speech, and hindsight in a coherent story.", "Aspect and time markers let the listener distinguish background, repeated action, and the decisive completed event.", "grammar-fluency-aspect-narrative", reading(
    "Kiedy Paweł wracał wieczorem do domu, zauważył portfel leżący przy przystanku. Przez chwilę zastanawiał się, czy zanieść go na policję, ale wtedy zadzwonił telefon znajdujący się w środku. Dzwoniła właścicielka, która od godziny szukała zguby. Powiedziała, że wysiadła z autobusu w pośpiechu i prawdopodobnie upuściła portfel, wyjmując bilet. Paweł poczekał na nią w pobliskiej kawiarni. Dopiero gdy zobaczył jej ulgę, zrozumiał, jak stresujące musiało być to zdarzenie.",
    [
      { prompt: "Co przerwało Pawłowi zastanawianie się?", options: ["Przyjazd policji", "Telefon w znalezionym portfelu", "Odjazd autobusu"], answerIndex: 1 },
      { prompt: "Jak właścicielka prawdopodobnie zgubiła portfel?", options: ["Upuściła go przy wyjmowaniu biletu", "Zostawiła go w kawiarni", "Dała go Pawłowi"], answerIndex: 0 },
      { prompt: "Co Paweł zrozumiał na końcu?", options: ["Że spóźnił się do domu", "Że powinien był iść na policję", "Jak stresująca była sytuacja dla właścicielki"], answerIndex: 2 },
    ],
  ), [
    ["Zanim doszło do głównego wydarzenia, wszystko wyglądało zwyczajnie", "Before the main event, everything looked ordinary"],
    ["Od pewnego czasu miałem wrażenie, że coś jest nie tak", "For some time I had the feeling something was wrong"],
    ["W chwili gdy otworzyłam drzwi, telefon przestał dzwonić", "The moment I opened the door, the phone stopped ringing"],
    ["Dopiero później zrozumiałem znaczenie tych słów", "Only later did I understand the meaning of those words"],
    ["Twierdził, że nigdy wcześniej tam nie był", "He claimed that he had never been there before"],
    ["Jak się później okazało, oboje mieliśmy rację", "As it later turned out, we were both right"],
    ["Przez cały ten czas czekała w sąsiednim budynku", "All that time she was waiting in the neighbouring building"],
    ["To, co wydarzyło się potem, całkowicie zmieniło sytuację", "What happened next completely changed the situation"],
    ["Gdy emocje opadły, mogliśmy spokojnie porozmawiać", "When emotions subsided, we could talk calmly"],
    ["Patrząc z perspektywy czasu, sygnały były oczywiste", "Looking back, the signs were obvious"],
    ["Gdybym wiedziała to wcześniej, zareagowałabym inaczej", "If I had known that earlier, I would have reacted differently"],
    ["Ta historia przypomniała mi, żeby nie wyciągać pochopnych wniosków", "This story reminded me not to jump to conclusions"],
  ]),

  unit("negotiating-conflict", "Negotiate through conflict", "Daily life", "B2 bridge", "⚖️", "Separate positions from needs, reframe disagreement, and build a workable compromise.", "Concessive structures acknowledge a real limitation before defending a different conclusion.", "grammar-fluency-concession", writing(
    "Write a response to two teams that both need the same meeting room. Acknowledge both needs, propose a compromise, and explain why it is fair.",
    "email",
    "Rozumiem, że oba zespoły potrzebują dużej sali w tym samym czasie. Chociaż szkolenie było zaplanowane wcześniej, spotkanie z klientem wymaga sprzętu dostępnego tylko w tej sali. Proponuję, żeby szkolenie odbyło się rano, a spotkanie po południu. Dzięki temu żadna grupa nie musi całkowicie zmieniać terminu.",
    ["rozumiem", "chociaż", "proponuję"],
  ), [
    ["Spróbujmy oddzielić fakty od emocji", "Let's try to separate facts from emotions"],
    ["Rozumiem, że zależy wam przede wszystkim na terminie", "I understand that the deadline is your main concern"],
    ["Naszym głównym ograniczeniem jest dostępność ludzi", "Our main constraint is people's availability"],
    ["Chociaż nie jest to idealne rozwiązanie, pozwala uniknąć opóźnienia", "Although it isn't an ideal solution, it avoids a delay"],
    ["Nie możemy zgodzić się na ten warunek w obecnej formie", "We can't agree to this condition in its current form"],
    ["Co musiałoby się zmienić, żeby propozycja była do przyjęcia?", "What would need to change for the proposal to be acceptable?"],
    ["Jesteśmy gotowi ustąpić w kwestii ceny", "We're prepared to compromise on price"],
    ["W zamian potrzebujemy większej elastyczności terminów", "In return we need greater flexibility on dates"],
    ["To rozwiązanie częściowo odpowiada potrzebom obu stron", "This solution partly meets both sides' needs"],
    ["Ustalmy, które elementy nie podlegają negocjacji", "Let's establish which elements are non-negotiable"],
    ["Mogę zaakceptować kompromis pod jednym warunkiem", "I can accept the compromise on one condition"],
    ["Zapiszmy ustalenia, żeby uniknąć kolejnych nieporozumień", "Let's write down the agreement to avoid further misunderstandings"],
  ]),

  unit("society-policy", "Discuss society and policy", "Next steps", "B2 bridge", "🏛️", "Compare competing public priorities and discuss likely consequences with nuance.", "Passive constructions foreground policy actions, while przez introduces the person or institution responsible when needed.", "grammar-fluency-passive-agent", reading(
    "Rada miasta rozważa wprowadzenie opłaty za wjazd samochodem do centrum. Zwolennicy argumentują, że rozwiązanie ograniczyłoby korki i poprawiło jakość powietrza. Krytycy zwracają uwagę, że wyższe koszty najbardziej odczują osoby dojeżdżające z miejsc słabo obsługiwanych przez transport publiczny. W odpowiedzi zaproponowano, by dochody z opłaty zostały przeznaczone na częstsze autobusy oraz parkingi przy stacjach kolejowych. Przed podjęciem decyzji projekt ma zostać oceniony przez niezależnych ekspertów i poddany konsultacjom społecznym.",
    [
      { prompt: "Jaki cel wskazują zwolennicy opłaty?", options: ["Zwiększenie ruchu", "Ograniczenie korków i zanieczyszczenia", "Likwidację autobusów"], answerIndex: 1 },
      { prompt: "Kto może najmocniej odczuć koszty?", options: ["Osoby bez dobrego transportu publicznego", "Mieszkańcy centrum bez samochodów", "Turyści kolejowi"], answerIndex: 0 },
      { prompt: "Co ma się stać przed decyzją?", options: ["Natychmiastowe pobieranie opłat", "Sprzedaż parkingów", "Ocena ekspertów i konsultacje"], answerIndex: 2 },
    ],
  ), [
    ["Projekt ma na celu ograniczenie ruchu w centrum", "The project aims to reduce traffic in the centre"],
    ["Rozwiązanie zostało zaproponowane przez radę miasta", "The solution was proposed by the city council"],
    ["Największe koszty poniosą osoby o niższych dochodach", "People on lower incomes will bear the greatest costs"],
    ["Zwolennicy wskazują na długoterminowe korzyści", "Supporters point to long-term benefits"],
    ["Przeciwnicy podważają skuteczność tego rozwiązania", "Opponents question the effectiveness of this solution"],
    ["Nie można pominąć wpływu na małe firmy", "The impact on small businesses cannot be overlooked"],
    ["Skutki zależą od sposobu wprowadzenia zmian", "The effects depend on how the changes are introduced"],
    ["Dochody powinny zostać przeznaczone na transport publiczny", "The revenue should be allocated to public transport"],
    ["Potrzebne są zabezpieczenia dla najbardziej dotkniętych grup", "Safeguards are needed for the most affected groups"],
    ["Projekt powinien zostać poddany konsultacjom", "The project should be subject to consultation"],
    ["Po roku należałoby ocenić rzeczywiste rezultaty", "After a year, the actual results should be assessed"],
    ["Debata nie sprowadza się wyłącznie do kosztów", "The debate isn't solely about costs"],
  ]),

  unit("culture-subtext", "Culture, tone, and subtext", "Social", "B2 bridge", "🎭", "Recognise indirectness, soften disagreement, and adapt language to relationship and context.", "Word order and particles such as jednak, właśnie, przecież, and chyba change emphasis and interpersonal tone.", "grammar-fluency-emphasis", writing(
    "Rewrite a direct refusal as a warm message to a colleague. Decline an invitation, give a brief reason, show appreciation, and leave open another opportunity.",
    "sms",
    "Bardzo dziękuję, że o mnie pomyślałaś. Tym razem chyba nie dam rady przyjść, bo następnego dnia wcześnie wyjeżdżam. Naprawdę żałuję, bo zapowiada się świetny wieczór. Mam nadzieję, że następnym razem uda nam się spotkać.",
    ["dziękuję", "chyba", "nadzieję"],
  ), [
    ["To chyba nie jest najlepszy moment", "This probably isn't the best moment"],
    ["Nie jestem pewien, czy dobrze cię rozumiem", "I'm not sure I understand you correctly"],
    ["Może warto byłoby spojrzeć na to inaczej", "Perhaps it would be worth looking at it differently"],
    ["Nie tyle się nie zgadzam, ile mam pewne wątpliwości", "It's not so much that I disagree as that I have some doubts"],
    ["Właśnie o to mi chodziło", "That's exactly what I meant"],
    ["Przecież możemy jeszcze zmienić zdanie", "After all, we can still change our minds"],
    ["Rozumiem sugestię, choć brzmi dość bezpośrednio", "I understand the suggestion, though it sounds quite direct"],
    ["W tej sytuacji lepiej użyć bardziej neutralnego tonu", "In this situation it's better to use a more neutral tone"],
    ["Między przyjaciółmi zabrzmiałoby to naturalnie", "Among friends this would sound natural"],
    ["W oficjalnej rozmowie wybrałabym inne słowa", "In a formal conversation I would choose different words"],
    ["Czasami milczenie oznacza wahanie, a nie zgodę", "Sometimes silence means hesitation, not agreement"],
    ["Znaczenie zależy od tonu i kontekstu", "The meaning depends on tone and context"],
  ]),

  unit("explaining-processes", "Explain how something works", "Daily life", "B2 bridge", "⚙️", "Give a clear process explanation with prerequisites, exceptions, and recovery steps.", "Relative pronoun forms such as którego, którym, and której reflect their function inside the added clause.", "grammar-fluency-relative-forms", reading(
    "System rezerwacji przydziela każdemu zgłoszeniu numer, za pomocą którego można później sprawdzić jego status. Po wysłaniu formularza dane są automatycznie weryfikowane. Jeżeli brakuje dokumentu, użytkownik otrzymuje wiadomość z linkiem, przez który może uzupełnić zgłoszenie bez rozpoczynania całego procesu od nowa. Wnioski, których nie poprawiono w ciągu czternastu dni, są zamykane. W takim przypadku trzeba utworzyć nowe zgłoszenie, dlatego warto regularnie sprawdzać skrzynkę pocztową.",
    [
      { prompt: "Do czego służy numer zgłoszenia?", options: ["Do sprawdzania statusu", "Do zmiany nazwiska", "Do opłacania rachunków"], answerIndex: 0 },
      { prompt: "Co pozwala zrobić link w wiadomości?", options: ["Usunąć konto", "Uzupełnić zgłoszenie", "Pominąć weryfikację"], answerIndex: 1 },
      { prompt: "Co dzieje się po czternastu dniach bez poprawy?", options: ["Wniosek jest automatycznie zatwierdzany", "Termin się podwaja", "Wniosek zostaje zamknięty"], answerIndex: 2 },
    ],
  ), [
    ["Najpierw trzeba utworzyć konto", "First you need to create an account"],
    ["Po zalogowaniu wybiera się odpowiedni formularz", "After logging in, the appropriate form is selected"],
    ["System sprawdza, czy wszystkie pola zostały wypełnione", "The system checks whether all fields have been completed"],
    ["Otrzymasz numer, za pomocą którego sprawdzisz status", "You'll receive a number with which you can check the status"],
    ["Dokument, którego brakuje, można dodać później", "The missing document can be added later"],
    ["Jeśli pojawi się błąd, proces zostanie zatrzymany", "If an error appears, the process will be stopped"],
    ["W takim przypadku należy wrócić do poprzedniego kroku", "In that case you should return to the previous step"],
    ["Nie trzeba ponownie wprowadzać wszystkich danych", "You don't need to enter all the data again"],
    ["Wyjątkiem są zgłoszenia wysłane po terminie", "The exception is applications submitted after the deadline"],
    ["Cały proces zwykle zajmuje kilka minut", "The whole process usually takes a few minutes"],
    ["Na końcu pojawi się ekran z potwierdzeniem", "At the end a confirmation screen will appear"],
    ["W razie problemów można skontaktować się z pomocą techniczną", "In case of problems you can contact technical support"],
  ]),

  unit("predictions-uncertainty", "Predict with uncertainty", "Next steps", "B2 bridge", "🌐", "Discuss likely futures, alternative scenarios, and the limits of any forecast.", "Future perfective forms predict completed outcomes; conditional forms explore less certain alternatives.", "grammar-fluency-scenarios", writing(
    "Write a short forecast about how remote work may change cities over the next decade. Give a likely development, a condition, an alternative scenario, and one uncertainty.",
    "description",
    "Prawdopodobnie więcej firm utrzyma elastyczny model pracy, dlatego część osób wyprowadzi się dalej od centrów miast. Jeśli transport publiczny się poprawi, mniejsze miejscowości mogą na tym skorzystać. Gdyby jednak firmy masowo wróciły do biur, ten trend szybko by osłabł. Trudno przewidzieć, jak duży wpływ będą miały koszty mieszkań.",
    ["prawdopodobnie", "jeśli", "trudno"],
  ), [
    ["Wiele wskazuje na to, że ten trend się utrzyma", "There are many indications that this trend will continue"],
    ["Najbardziej prawdopodobny scenariusz zakłada powolny wzrost", "The most likely scenario assumes slow growth"],
    ["Jeśli obecne warunki się nie zmienią, popyt wzrośnie", "If current conditions don't change, demand will rise"],
    ["W krótkim okresie skutki będą prawdopodobnie niewielkie", "In the short term the effects will probably be small"],
    ["Z czasem różnica może stać się bardziej widoczna", "Over time the difference may become more visible"],
    ["Nie można wykluczyć nagłej zmiany kierunku", "A sudden change of direction cannot be ruled out"],
    ["Gdyby koszty spadły, rozwój znacznie by przyspieszył", "If costs fell, development would accelerate significantly"],
    ["Alternatywny scenariusz jest mniej korzystny", "The alternative scenario is less favourable"],
    ["Prognoza zależy od kilku trudnych do przewidzenia czynników", "The forecast depends on several hard-to-predict factors"],
    ["Na tym etapie każda dokładna liczba byłaby zgadywaniem", "At this stage any exact figure would be guesswork"],
    ["Będziemy mogli ocenić sytuację dopiero za rok", "We'll only be able to assess the situation in a year"],
    ["Niezależnie od scenariusza warto przygotować plan awaryjny", "Regardless of the scenario, it's worth preparing a contingency plan"],
  ]),
];

function choice(polish, english, good) {
  return { polish, phonetic: phonetic(polish), english, good };
}

function dialogue(id, icon, title, setting, speaker, turns) {
  return {
    id,
    icon,
    title,
    setting,
    lines: turns.map(([polish, english, goodOne, goodOneEnglish, goodTwo, goodTwoEnglish, wrong, wrongEnglish]) => ({
      speaker,
      polish,
      phonetic: phonetic(polish),
      english,
      choices: [choice(goodOne, goodOneEnglish, true), choice(goodTwo, goodTwoEnglish, true), choice(wrong, wrongEnglish, false)],
    })),
  };
}

export const fluencyDialogues = [
  dialogue("presentation-questions", "🎤", "Questions after a presentation", "You defend a recommendation without overstating the evidence.", "Director", [
    ["Na jakiej podstawie rekomenduje pani ten wariant?", "On what basis do you recommend this option?", "Opieram rekomendację na wynikach trzymiesięcznego testu.", "I base the recommendation on the results of a three-month test.", "Ten wariant osiągnął najlepszy wynik w dwóch kluczowych obszarach.", "This option achieved the best result in two key areas.", "Poproszę dwa bilety.", "Two tickets, please."],
    ["Czy próba nie była zbyt mała?", "Wasn't the sample too small?", "To prawda, wielkość próby jest istotnym ograniczeniem.", "That's true; the sample size is an important limitation.", "Dlatego proponuję kolejny, większy test.", "That's why I propose another, larger test.", "Nie lubię zimnej kawy.", "I don't like cold coffee."],
    ["Co się stanie, jeśli wynik się nie powtórzy?", "What happens if the result isn't repeated?", "Wtedy wrócimy do obecnego rozwiązania.", "Then we'll return to the current solution.", "Możemy wcześniej ustalić kryterium zatrzymania testu.", "We can establish a stop criterion in advance.", "Gdzie jest moja walizka?", "Where is my suitcase?"],
    ["Ile będzie kosztował kolejny etap?", "How much will the next stage cost?", "Szczegółowy budżet prześlę po spotkaniu.", "I'll send the detailed budget after the meeting.", "Wstępnie szacujemy koszt na dwadzieścia tysięcy złotych.", "We initially estimate the cost at twenty thousand zloty.", "Mam wizytę u dentysty.", "I have a dentist appointment."],
    ["Dobrze, proszę przygotować plan testu.", "Okay, please prepare the test plan.", "Prześlę projekt planu do piątku.", "I'll send a draft plan by Friday.", "Uwzględnię budżet, terminy i kryteria oceny.", "I'll include the budget, dates, and evaluation criteria.", "Ta kurtka jest za duża.", "This jacket is too big."],
  ]),
  dialogue("interview-follow-up", "🏆", "A probing job interview", "You give evidence and reflect honestly on a project.", "Interviewer", [
    ["Proszę opowiedzieć o trudnym projekcie.", "Please tell me about a difficult project.", "Mogę podać przykład projektu, który przejąłem z dużym opóźnieniem.", "I can give an example of a project I took over with a major delay.", "Największym wyzwaniem był brak jasnych priorytetów.", "The biggest challenge was a lack of clear priorities.", "Rachunek, proszę.", "The bill, please."],
    ["Za co konkretnie był pan odpowiedzialny?", "What specifically were you responsible for?", "Odpowiadałem za harmonogram i komunikację z klientem.", "I was responsible for the schedule and client communication.", "Moim zadaniem było również podzielenie pracy w zespole.", "My task was also to divide the work in the team.", "Pada śnieg.", "It's snowing."],
    ["Jakie działania pan podjął?", "What action did you take?", "Wprowadziłem codzienne krótkie spotkania i listę ryzyk.", "I introduced short daily meetings and a risk list.", "Najpierw uzgodniłem z klientem realistyczny zakres.", "First I agreed a realistic scope with the client.", "Poproszę pokój z balkonem.", "A room with a balcony, please."],
    ["Jaki był rezultat?", "What was the result?", "Zakończyliśmy projekt przed nowym terminem.", "We completed the project before the new deadline.", "Liczba pilnych poprawek spadła o połowę.", "The number of urgent fixes fell by half.", "Boli mnie głowa.", "My head hurts."],
    ["Co zrobiłby pan inaczej?", "What would you do differently?", "Wcześniej porozmawiałbym indywidualnie z członkami zespołu.", "I would speak individually with team members earlier.", "Szybciej poprosiłbym o dodatkowe wsparcie.", "I would ask for additional support sooner.", "Pociąg jest na peronie drugim.", "The train is at platform two."],
  ]),
  dialogue("contract-terms", "🧾", "Clarifying contract terms", "You question an unexpected renewal clause before signing.", "Adviser", [
    ["Czy zapoznał się pan z warunkami umowy?", "Have you read the contract terms?", "Tak, ale potrzebuję wyjaśnienia dwóch punktów.", "Yes, but I need clarification on two clauses.", "Chciałbym upewnić się, jak działa przedłużenie.", "I'd like to make sure how renewal works.", "Poproszę kawę z mlekiem.", "Coffee with milk, please."],
    ["Umowa przedłuża się automatycznie po roku.", "The contract renews automatically after a year.", "Z jakim wyprzedzeniem muszę złożyć wypowiedzenie?", "How much notice do I need to give?", "Czy otrzymam przypomnienie przed przedłużeniem?", "Will I receive a reminder before renewal?", "Mieszkam niedaleko centrum.", "I live near the centre."],
    ["Wypowiedzenie trzeba złożyć miesiąc wcześniej.", "Notice must be given one month earlier.", "Proszę wskazać ten zapis w umowie.", "Please show me that provision in the contract.", "Rozumiem. Chcę mieć ten termin na piśmie.", "I understand. I want that date in writing.", "Film zaczyna się o ósmej.", "The film starts at eight."],
    ["Mogę dodać datę do potwierdzenia.", "I can add the date to the confirmation.", "Dziękuję, to rozwiązuje moją wątpliwość.", "Thank you, that resolves my concern.", "Czy wszystkie opłaty są już uwzględnione?", "Are all fees already included?", "Nie mam parasola.", "I don't have an umbrella."],
    ["Tak, poza jednorazową opłatą aktywacyjną.", "Yes, apart from a one-off activation fee.", "Nie widziałem jej w ofercie, więc proszę ją dopisać.", "I didn't see it in the offer, so please add it.", "Podpiszę umowę po otrzymaniu poprawionej wersji.", "I'll sign after receiving the corrected version.", "Szukam apteki.", "I'm looking for a pharmacy."],
  ]),
  dialogue("negotiating-compromise", "⚖️", "Negotiating a compromise", "Two teams need the same specialist at the same time.", "Team lead", [
    ["Oba projekty potrzebują Ani w przyszłym tygodniu.", "Both projects need Ania next week.", "Ustalmy najpierw, które zadania naprawdę wymagają jej udziału.", "Let's first establish which tasks truly require her involvement.", "Rozumiem, że oba terminy są ważne.", "I understand that both deadlines matter.", "Poproszę większy rozmiar.", "A larger size, please."],
    ["Dla nas kluczowy jest poniedziałkowy warsztat.", "Monday's workshop is crucial for us.", "Czy po warsztacie mogłaby przejść do drugiego projektu?", "Could she move to the other project after the workshop?", "Ile godzin potrzebujecie w poniedziałek?", "How many hours do you need on Monday?", "Lubię chodzić po górach.", "I like hiking."],
    ["Potrzebujemy jej przez cały dzień.", "We need her for the whole day.", "W takim razie ustąpimy w poniedziałek, jeśli dostaniemy wtorek.", "In that case we'll give way on Monday if we get Tuesday.", "Możemy przygotować pytania wcześniej, żeby oszczędzić czas.", "We can prepare questions in advance to save time.", "Gdzie jest toaleta?", "Where is the toilet?"],
    ["Wtorek możemy wam oddać bez problemu.", "We can give you Tuesday without a problem.", "To częściowo rozwiązuje konflikt.", "That partly resolves the conflict.", "Potrzebujemy jeszcze krótkiej konsultacji w czwartek.", "We still need a short consultation on Thursday.", "Jestem wegetarianinem.", "I'm vegetarian."],
    ["Czwartek po południu jest dostępny.", "Thursday afternoon is available.", "Dobrze, zapiszmy dokładne godziny.", "Okay, let's write down the exact times.", "Dziękuję, ten podział odpowiada obu zespołom.", "Thank you, this division suits both teams.", "Bilet kosztuje dziesięć złotych.", "The ticket costs ten zloty."],
  ]),
  dialogue("policy-consultation", "🏛️", "A public consultation", "You question a proposed city-centre traffic charge.", "Official", [
    ["Opłata ma ograniczyć ruch i poprawić jakość powietrza.", "The charge is intended to reduce traffic and improve air quality.", "Czy zbadano wpływ na osoby spoza miasta?", "Has the impact on people from outside the city been studied?", "Jakie dane wskazują, że opłata zmniejszy ruch?", "What data indicates that the charge will reduce traffic?", "Poproszę paragon.", "A receipt, please."],
    ["Podobny system zmniejszył ruch w innych miastach.", "A similar system reduced traffic in other cities.", "Czy te miasta mają porównywalny transport publiczny?", "Do those cities have comparable public transport?", "Warto też uwzględnić lokalne warunki.", "Local conditions are also worth considering.", "Mam rezerwację na dwie noce.", "I have a reservation for two nights."],
    ["Planujemy zwiększyć liczbę autobusów.", "We plan to increase the number of buses.", "Czy nastąpi to przed wprowadzeniem opłaty?", "Will that happen before the charge is introduced?", "Jak zostaną sfinansowane dodatkowe połączenia?", "How will the additional services be funded?", "Jutro pracuję z domu.", "I'm working from home tomorrow."],
    ["Część dochodów z opłaty pokryje te koszty.", "Part of the revenue from the charge will cover those costs.", "To ważne, ale potrzebny jest konkretny harmonogram.", "That's important, but a specific schedule is needed.", "Czy dochody będą publicznie raportowane?", "Will the revenue be publicly reported?", "Ta zupa jest pyszna.", "This soup is delicious."],
    ["Raport zostanie opublikowany po pierwszym roku.", "A report will be published after the first year.", "Proponuję również przegląd po sześciu miesiącach.", "I also propose a review after six months.", "Dziękuję, prześlę uwagi przez formularz.", "Thank you, I'll submit comments through the form.", "Potrzebuję nowego telefonu.", "I need a new phone."],
  ]),
  dialogue("explaining-breakdown", "⚙️", "Explaining a failed process", "You help a colleague recover a rejected online application.", "Colleague", [
    ["System odrzucił mój wniosek bez wyjaśnienia.", "The system rejected my application without explanation.", "Sprawdźmy najpierw status i historię wiadomości.", "Let's first check the status and message history.", "Czy otrzymałeś numer zgłoszenia?", "Did you receive an application number?", "Poproszę bilet w jedną stronę.", "A one-way ticket, please."],
    ["Tak, numer kończy się na czterdzieści dwa.", "Yes, the number ends in 42.", "Za jego pomocą możemy otworzyć szczegóły.", "We can use it to open the details.", "Wpisz numer w polu śledzenia sprawy.", "Enter the number in the case-tracking field.", "Mam alergię na orzechy.", "I'm allergic to nuts."],
    ["Widzę informację o brakującym załączniku.", "I see a note about a missing attachment.", "Kliknij link, przez który można uzupełnić dokument.", "Click the link through which you can add the document.", "Nie musisz zaczynać całego wniosku od nowa.", "You don't need to start the whole application again.", "Spotkajmy się o szóstej.", "Let's meet at six."],
    ["Link niestety już wygasł.", "Unfortunately the link has expired.", "W takim przypadku trzeba poprosić o nowy link.", "In that case you need to request a new link.", "Zadzwońmy do pomocy technicznej i podajmy numer.", "Let's call technical support and give the number.", "Ta sukienka dobrze leży.", "This dress fits well."],
    ["Dobrze, teraz rozumiem, gdzie był problem.", "Okay, now I understand where the problem was.", "Zapiszmy też termin, żeby link znów nie wygasł.", "Let's also note the deadline so the link doesn't expire again.", "Po dodaniu dokumentu sprawdź ekran potwierdzenia.", "After adding the document, check the confirmation screen.", "Lubię polską muzykę.", "I like Polish music."],
  ]),
];

export const fluencyGrammarGuides = [
  { id: "grammar-fluency-hedging", title: "Show degrees of certainty", example: "wydaje się · prawdopodobnie · o ile wiadomo", meaning: "it seems · probably · as far as is known", body: "Hedging makes a claim match the available evidence. It is a strength, not vagueness, when the facts remain incomplete." },
  { id: "grammar-fluency-purpose", title: "Connect purpose and benefit", example: "żeby uprościć · dzięki temu oszczędzimy", meaning: "in order to simplify · this will save us", body: "Żeby introduces the intended purpose. Dzięki temu points forward to a useful consequence of the proposed action." },
  { id: "grammar-fluency-signposting", title: "Guide a longer contribution", example: "na początek · przejdźmy do · podsumowując", meaning: "to begin · let's move to · to sum up", body: "Signposts tell listeners where they are in your explanation and make complex information easier to process." },
  { id: "grammar-fluency-participles", title: "Connect simultaneous actions", example: "analizując dane · patrząc z perspektywy czasu", meaning: "while analysing data · looking back", body: "The -ąc form describes an action performed by the same person at the same time as the main verb." },
  { id: "grammar-fluency-collocations", title: "Use formal collocations", example: "zawrzeć umowę · ponieść koszt · złożyć wypowiedzenie", meaning: "enter a contract · bear a cost · give notice", body: "Fluent formal language relies on stable noun-and-verb partnerships. Learn the combination as a single reusable unit." },
  { id: "grammar-fluency-past-conditional", title: "Imagine a different past", example: "gdybym wiedział · zrobiłbym inaczej", meaning: "if I had known · I would have acted differently", body: "Gdybym plus a past form sets up the unreal condition; the conditional result explains the imagined alternative." },
  { id: "grammar-fluency-aspect-narrative", title: "Control narrative viewpoint", example: "wracał · zauważył · czekała od godziny", meaning: "was returning · noticed · had been waiting for an hour", body: "Imperfective forms establish background or duration, while perfective forms move the sequence forward with completed events." },
  { id: "grammar-fluency-concession", title: "Concede without abandoning your point", example: "chociaż nie jest idealne · mimo ograniczeń", meaning: "although it isn't ideal · despite the limitations", body: "A concession acknowledges a genuine weakness before explaining why your conclusion or proposal still stands." },
  { id: "grammar-fluency-passive-agent", title: "Foreground an action or policy", example: "projekt został oceniony przez ekspertów", meaning: "the project was assessed by experts", body: "The passive highlights what happened. Add przez plus the instrumental when the responsible person or institution matters." },
  { id: "grammar-fluency-emphasis", title: "Shape tone through emphasis", example: "właśnie o to chodzi · to chyba nie wystarczy", meaning: "that's exactly the point · that probably isn't enough", body: "Particles and word order reveal attitude, correction, hesitation, or shared knowledge without changing the basic facts." },
  { id: "grammar-fluency-relative-forms", title: "Choose the relative form by function", example: "numer, którym… · dokument, którego…", meaning: "the number with which… · the document which…", body: "The noun sets the gender, but the relative pronoun's role inside its clause determines the case form." },
  { id: "grammar-fluency-scenarios", title: "Compare future scenarios", example: "jeśli wzrośnie · gdyby spadło · nie można wykluczyć", meaning: "if it rises · if it were to fall · it cannot be ruled out", body: "Use real conditions for plausible outcomes, the conditional for alternatives, and hedging to mark the limits of a forecast." },
];
