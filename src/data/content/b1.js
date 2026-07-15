const POLISH_ASCII = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (value) => value.toLocaleLowerCase("pl").replace(/[ąćęłńóśźż]/g, (letter) => POLISH_ASCII[letter]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const phonetic = (value) => value.toLocaleLowerCase("pl")
  .replace(/dź|dzi/g, "jy").replace(/dż/g, "j").replace(/cz/g, "ch").replace(/sz/g, "sh")
  .replace(/rz|ż/g, "zh").replace(/ś/g, "sh").replace(/ć/g, "ch").replace(/ń/g, "ny")
  .replace(/ł/g, "W").replace(/w/g, "v").replace(/W/g, "w").replace(/j/g, "y").replace(/c/g, "ts")
  .replace(/ó/g, "oo").replace(/ą/g, "on").replace(/ę/g, "en");

const reading = (text, questions) => ({ type: "reading", content: { text, questions } });
const writing = (prompt, kind, model, requiredTokens) => ({
  type: "writing",
  content: { prompt, kind, acceptedAnswers: [model], requiredTokens },
});

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
    eyebrow: stage === "B1 foundations" ? "Build your B1" : "Use your B1",
    time: 28,
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

export const b1Units = [
  unit("explaining-decisions", "Explain a decision", "Next steps", "B1 foundations", "🧩", "Give reasons, weigh alternatives, and explain how you reached a choice.", "Use dlatego, ponieważ, mimo że, and dzięki temu to connect causes, contrasts, and results.", "grammar-b1-cause-result", reading(
    "Od kilku miesięcy myślałam o zmianie pracy. Obecne stanowisko było stabilne, ale nie dawało mi możliwości rozwoju. Dostałam ofertę w mniejszej firmie, która proponowała ciekawsze projekty. Mimo że pensja była trochę niższa, przyjęłam ofertę, ponieważ zależało mi na zdobyciu nowych umiejętności. Teraz mam więcej obowiązków, ale czuję, że podjęłam dobrą decyzję.",
    [
      { prompt: "Dlaczego autorka rozważała zmianę pracy?", options: ["Chciała się przeprowadzić", "Brakowało jej możliwości rozwoju", "Nie lubiła swoich kolegów"], answerIndex: 1 },
      { prompt: "Co było wadą nowej oferty?", options: ["Niższa pensja", "Nudniejsze projekty", "Dłuższy urlop"], answerIndex: 0 },
      { prompt: "Jak autorka ocenia decyzję teraz?", options: ["Żałuje jej", "Jeszcze nie wie", "Uważa ją za dobrą"], answerIndex: 2 },
    ],
  ), [
    ["Rozważałem kilka możliwości", "I considered several possibilities"],
    ["Ostatecznie zdecydowałam się na zmianę", "In the end I decided on a change"],
    ["Głównym powodem była możliwość rozwoju", "The main reason was the opportunity to develop"],
    ["Z jednej strony było taniej", "On the one hand it was cheaper"],
    ["Z drugiej strony dojazd był dłuższy", "On the other hand the commute was longer"],
    ["Mimo że miałem wątpliwości, spróbowałem", "Although I had doubts, I tried"],
    ["Wybrałam tę opcję, ponieważ była bezpieczniejsza", "I chose this option because it was safer"],
    ["Dzięki temu zaoszczędzimy czas", "Thanks to that we'll save time"],
    ["To rozwiązanie ma więcej zalet niż wad", "This solution has more advantages than disadvantages"],
    ["Najważniejsze było dla mnie zdrowie", "Health was the most important thing for me"],
    ["Gdybym miał wybierać ponownie, zrobiłbym to samo", "If I had to choose again, I'd do the same"],
    ["Nie była to łatwa decyzja", "It wasn't an easy decision"],
  ]),

  unit("telling-anecdotes", "Tell a memorable story", "Social", "B1 foundations", "🎬", "Tell an anecdote with background, interruption, reaction, and a clear ending.", "Contrast an action in progress with the event that interrupted it: kiedy czekałem, zadzwonił telefon.", "grammar-b1-past-background", writing(
    "Write a 4–6 sentence message about a journey that did not go to plan. Include what you were doing, what suddenly happened, and how it ended.",
    "description",
    "Kiedy jechałem na lotnisko, autobus nagle się zepsuł. Najpierw zadzwoniłem po taksówkę, ale musiałem długo czekać. Na szczęście kierowca znał szybszą drogę. Ostatecznie zdążyłem na samolot w ostatniej chwili.",
    ["kiedy", "nagle", "ostatecznie"],
  ), [
    ["Wszystko zaczęło się w piątek rano", "It all started on Friday morning"],
    ["Właśnie wychodziłem z domu, kiedy zadzwonił telefon", "I was just leaving home when the phone rang"],
    ["Nagle zorientowałam się, że nie mam kluczy", "Suddenly I realised I didn't have my keys"],
    ["Na początku nie wiedziałem, co zrobić", "At first I didn't know what to do"],
    ["Okazało się, że pociąg został odwołany", "It turned out the train had been cancelled"],
    ["W międzyczasie zaczęło padać", "In the meantime it started raining"],
    ["Ku mojemu zdziwieniu ktoś mi pomógł", "To my surprise someone helped me"],
    ["Na szczęście miałam przy sobie telefon", "Luckily I had my phone with me"],
    ["Po chwili sytuacja się wyjaśniła", "After a moment the situation became clear"],
    ["Ostatecznie wszystko dobrze się skończyło", "In the end everything ended well"],
    ["Do dziś śmiejemy się z tej historii", "We still laugh about that story today"],
    ["Nigdy wcześniej nic takiego mi się nie zdarzyło", "Nothing like that had ever happened to me before"],
  ]),

  unit("work-projects", "Projects and priorities", "Daily life", "B1 foundations", "📊", "Report progress, flag risks, negotiate priorities, and agree next steps at work.", "Impersonal forms such as trzeba, udało się, and zostało zrobione keep the focus on the task.", "grammar-b1-impersonal", reading(
    "Zespół zakończył pierwszy etap projektu zgodnie z planem. Udało się przygotować nową wersję aplikacji, ale testy wykazały problem z płatnościami. Dlatego wdrożenie zostało przesunięte o tydzień. Najpierw trzeba usunąć błąd, a następnie ponownie przeprowadzić testy. Klient został już poinformowany i zaakceptował nowy termin.",
    [
      { prompt: "Co udało się przygotować?", options: ["Nową wersję aplikacji", "Nową umowę", "Kampanię reklamową"], answerIndex: 0 },
      { prompt: "Dlaczego przesunięto wdrożenie?", options: ["Klient zmienił zdanie", "Zespół był na urlopie", "Testy wykazały problem z płatnościami"], answerIndex: 2 },
      { prompt: "Co należy zrobić przed kolejnymi testami?", options: ["Poinformować klienta", "Usunąć błąd", "Zatrudnić nową osobę"], answerIndex: 1 },
    ],
  ), [
    ["Na jakim etapie jest projekt?", "What stage is the project at?"],
    ["Większość zadań została już wykonana", "Most tasks have already been completed"],
    ["Udało nam się dotrzymać terminu", "We managed to meet the deadline"],
    ["Pojawiło się kilka nieprzewidzianych problemów", "Several unforeseen problems came up"],
    ["To może wpłynąć na harmonogram", "This may affect the schedule"],
    ["Musimy ustalić, co jest najważniejsze", "We need to decide what is most important"],
    ["Proponuję przesunąć mniej pilne zadania", "I suggest moving the less urgent tasks"],
    ["Kto jest odpowiedzialny za ten obszar?", "Who is responsible for this area?"],
    ["Potrzebujemy dodatkowych informacji od klienta", "We need additional information from the client"],
    ["Omówmy możliwe rozwiązania", "Let's discuss possible solutions"],
    ["Podsumuję ustalenia po spotkaniu", "I'll summarise what we agreed after the meeting"],
    ["Kolejny krok to przeprowadzenie testów", "The next step is to run the tests"],
  ]),

  unit("housing-neighbours", "Housing and neighbours", "Daily life", "B1 foundations", "🏘️", "Describe an ongoing housing problem, negotiate politely, and propose a fair solution.", "Use odkąd and od kiedy with ongoing situations; zanim and dopóki organise actions in time.", "grammar-b1-time-clauses", writing(
    "Write a polite email to a landlord about repeated noise or a repair problem. Explain how long it has continued, how it affects you, and what action you want.",
    "email",
    "Dzień dobry, odkąd rozpoczął się remont, hałas trwa codziennie do późnego wieczora. Trudno mi przez to pracować i odpoczywać. Czy mogliby Państwo ustalić z ekipą wcześniejszą godzinę zakończenia prac? Proszę o informację, kiedy sytuacja się poprawi.",
    ["odkąd", "trudno", "proszę"],
  ), [
    ["Problem powtarza się od kilku tygodni", "The problem has been recurring for several weeks"],
    ["Odkąd rozpoczął się remont, jest bardzo głośno", "It has been very loud since the renovation started"],
    ["Hałas utrudnia mi pracę", "The noise makes it difficult for me to work"],
    ["Rozumiem, że remont jest konieczny", "I understand the renovation is necessary"],
    ["Czy moglibyśmy ustalić spokojniejsze godziny?", "Could we agree on quieter hours?"],
    ["Wolałbym rozwiązać to bez konfliktu", "I'd prefer to solve this without conflict"],
    ["Zgłosiłam usterkę już dwa razy", "I've already reported the fault twice"],
    ["Do tej pory nikt się ze mną nie skontaktował", "No one has contacted me so far"],
    ["Proszę o naprawę w najbliższym terminie", "Please arrange a repair at the earliest opportunity"],
    ["Jeżeli problem się powtórzy, napiszę ponownie", "If the problem happens again, I'll write again"],
    ["Mam nadzieję, że znajdziemy rozwiązanie", "I hope we'll find a solution"],
    ["Dziękuję za szybkie zajęcie się sprawą", "Thank you for dealing with the matter quickly"],
  ]),

  unit("healthcare-detail", "A detailed health visit", "Health", "B1 foundations", "🩺", "Describe symptoms precisely, answer follow-up questions, and understand a treatment plan.", "Use od with a time span and gdy or kiedy for conditions: boli od tygodnia; nasila się, gdy chodzę.", "grammar-b1-symptom-time", reading(
    "Od około tygodnia boli mnie prawe kolano. Ból pojawił się po długim spacerze i nasila się, gdy wchodzę po schodach. Kolano nie jest spuchnięte, ale rano trudno mi je zgiąć. Lekarz zalecił odpoczynek, zimne okłady i lek przeciwzapalny. Jeśli ból nie minie w ciągu kilku dni, mam umówić się na badanie.",
    [
      { prompt: "Kiedy ból jest silniejszy?", options: ["Podczas wchodzenia po schodach", "Po zimnym okładzie", "Podczas snu"], answerIndex: 0 },
      { prompt: "Czego lekarz nie zalecił?", options: ["Odpoczynku", "Intensywnego biegania", "Leku przeciwzapalnego"], answerIndex: 1 },
      { prompt: "Kiedy potrzebne będzie badanie?", options: ["Jeśli ból szybko minie", "Jeszcze tego samego dnia", "Jeśli ból nie minie po kilku dniach"], answerIndex: 2 },
    ],
  ), [
    ["Od kilku dni mam silny kaszel", "I've had a bad cough for several days"],
    ["Objawy zaczęły się w zeszłym tygodniu", "The symptoms started last week"],
    ["Ból nasila się wieczorem", "The pain gets worse in the evening"],
    ["Najbardziej boli, kiedy się schylam", "It hurts most when I bend down"],
    ["Nie zauważyłam żadnej poprawy", "I haven't noticed any improvement"],
    ["Czy przyjmuje pan jakieś leki?", "Are you taking any medication?"],
    ["Nie mam chorób przewlekłych", "I don't have any chronic illnesses"],
    ["Miałem podobny problem rok temu", "I had a similar problem a year ago"],
    ["Czy potrzebne są dodatkowe badania?", "Are additional tests needed?"],
    ["Jak długo mam stosować ten lek?", "How long should I use this medicine?"],
    ["Proszę przyjmować jedną tabletkę dwa razy dziennie", "Please take one tablet twice a day"],
    ["Jeśli objawy się nasilą, proszę wrócić", "If the symptoms get worse, please come back"],
  ]),

  unit("media-information", "News and information", "Daily life", "B1 foundations", "📰", "Discuss where information comes from, summarise a report, and express uncertainty.", "Reported speech uses że after verbs such as powiedzieć, twierdzić, and wyjaśnić.", "grammar-b1-reported-speech", writing(
    "Write a short message summarising a news item. Say where you heard it, what was reported, and whether the information is confirmed.",
    "sms",
    "W lokalnym radiu podano, że od poniedziałku most będzie zamknięty. Reporter wyjaśnił, że powodem jest pilny remont. Informacja wygląda wiarygodnie, ale miasto jeszcze jej nie potwierdziło.",
    ["podano", "że", "potwierdziło"],
  ), [
    ["Czytałem o tym w porannych wiadomościach", "I read about it in the morning news"],
    ["Według artykułu ceny mają wzrosnąć", "According to the article prices are expected to rise"],
    ["Reporter powiedział, że droga jest zamknięta", "The reporter said the road was closed"],
    ["Nie wiadomo jeszcze, co było przyczyną", "It isn't known yet what the cause was"],
    ["Ta informacja nie została potwierdzona", "This information has not been confirmed"],
    ["Źródło wydaje się wiarygodne", "The source seems reliable"],
    ["Nagłówek brzmi sensacyjnie", "The headline sounds sensational"],
    ["Warto sprawdzić to w kilku miejscach", "It's worth checking this in several places"],
    ["Autor pomija ważny szczegół", "The author leaves out an important detail"],
    ["Artykuł przedstawia dwa punkty widzenia", "The article presents two points of view"],
    ["Trudno powiedzieć, czy to prawda", "It's hard to say whether it's true"],
    ["Dam ci znać, kiedy dowiem się więcej", "I'll let you know when I find out more"],
  ]),

  unit("travel-disruptions", "Travel when plans change", "Travel", "B1 in action", "🚧", "Handle cancellations, missed connections, compensation, and alternative routes.", "Relative clauses with który connect details to a noun: pociąg, który miał odjechać.", "grammar-b1-relative-clauses", reading(
    "Pociąg do Gdańska, który miał odjechać o 14:20, został odwołany z powodu awarii. Pasażerowie mogą pojechać następnym pociągiem o 15:05 bez zmiany biletu. Osoby, które nie chcą czekać, mogą otrzymać pełny zwrot kosztów. Bilet kupiony przez internet można zwrócić w aplikacji, natomiast pozostałe bilety należy oddać w kasie.",
    [
      { prompt: "Dlaczego odwołano pociąg?", options: ["Z powodu pogody", "Z powodu awarii", "Z powodu strajku"], answerIndex: 1 },
      { prompt: "O której odjedzie następny pociąg?", options: ["O 14:20", "O 14:50", "O 15:05"], answerIndex: 2 },
      { prompt: "Gdzie można zwrócić bilet internetowy?", options: ["W aplikacji", "Tylko u konduktora", "Na peronie"], answerIndex: 0 },
    ],
  ), [
    ["Mój lot został odwołany", "My flight has been cancelled"],
    ["Przez opóźnienie nie zdążę na przesiadkę", "Because of the delay I won't make my connection"],
    ["Jaki jest najbliższy dostępny pociąg?", "What is the next available train?"],
    ["Czy może mnie pan przenieść na późniejszy lot?", "Can you move me to a later flight?"],
    ["Potrzebuję noclegu na jedną noc", "I need accommodation for one night"],
    ["Kto pokrywa koszt hotelu?", "Who covers the cost of the hotel?"],
    ["Chciałabym złożyć wniosek o zwrot kosztów", "I'd like to submit a claim for reimbursement"],
    ["Gdzie znajdę formularz reklamacyjny?", "Where can I find the complaint form?"],
    ["Zachowaj wszystkie rachunki", "Keep all the receipts"],
    ["Pociąg, którym miałem jechać, został odwołany", "The train I was meant to take was cancelled"],
    ["Zaproponowano nam połączenie zastępcze", "We were offered an alternative connection"],
    ["Ostatecznie dotarliśmy trzy godziny później", "In the end we arrived three hours later"],
  ]),

  unit("formal-correspondence", "Write formally and clearly", "Daily life", "B1 in action", "✉️", "Write requests, complaints, and follow-ups with the right level of formality.", "Formal Polish uses fixed openings, impersonal requests, and Państwo forms instead of direct informal language.", "grammar-b1-formal-register", writing(
    "Write a formal email asking a company to correct an invoice. Include the invoice number, describe the error, and request a corrected document.",
    "email",
    "Szanowni Państwo, piszę w sprawie faktury numer 184/07. Na dokumencie widnieje nieprawidłowy adres firmy. Uprzejmie proszę o poprawienie danych i przesłanie skorygowanej faktury. Z góry dziękuję za pomoc. Z poważaniem, Alex Taylor",
    ["sprawie", "proszę", "faktury"],
  ), [
    ["Szanowni Państwo", "Dear Sir or Madam"],
    ["Piszę w sprawie zamówienia numer sto osiem", "I am writing about order number 108"],
    ["Zwracam się z prośbą o informację", "I am writing to request information"],
    ["Niestety otrzymany dokument zawiera błąd", "Unfortunately the document I received contains an error"],
    ["W załączniku przesyłam potwierdzenie", "I am attaching the confirmation"],
    ["Uprzejmie proszę o wyjaśnienie sytuacji", "I kindly request an explanation of the situation"],
    ["Proszę o odpowiedź do końca tygodnia", "Please reply by the end of the week"],
    ["Będę wdzięczny za możliwie szybki kontakt", "I would appreciate contact as soon as possible"],
    ["W razie pytań pozostaję do dyspozycji", "I remain available in case of questions"],
    ["Z góry dziękuję za pomoc", "Thank you in advance for your help"],
    ["Z poważaniem", "Yours faithfully"],
    ["Chciałbym nawiązać do naszej rozmowy", "I would like to refer back to our conversation"],
  ]),

  unit("discussing-issues", "Discuss an issue", "Social", "B1 in action", "🗣️", "State a position, respond to disagreement, and find common ground without sounding abrupt.", "Use chociaż, jednak, natomiast, and za to to qualify and contrast ideas.", "grammar-b1-discourse-contrast", reading(
    "Mieszkańcy dyskutowali o zamknięciu ulicy dla samochodów. Zwolennicy projektu twierdzili, że dzięki temu okolica będzie bezpieczniejsza i cichsza. Przeciwnicy obawiali się jednak, że klienci przestaną odwiedzać lokalne sklepy. Ostatecznie zaproponowano kompromis: ulica ma być zamknięta tylko w weekendy przez trzy miesiące, a potem miasto oceni rezultaty.",
    [
      { prompt: "Jaką zaletę wskazali zwolennicy?", options: ["Niższe ceny", "Więcej parkingów", "Bezpieczniejszą i cichszą okolicę"], answerIndex: 2 },
      { prompt: "Czego obawiali się przeciwnicy?", options: ["Mniejszej liczby klientów", "Większego hałasu", "Budowy nowych sklepów"], answerIndex: 0 },
      { prompt: "Na czym polega kompromis?", options: ["Ulica pozostanie zawsze otwarta", "Zamknięcie będzie weekendowe i próbne", "Projekt przeniesiono do innej dzielnicy"], answerIndex: 1 },
    ],
  ), [
    ["Rozumiem ten argument, ale widzę to inaczej", "I understand that argument, but I see it differently"],
    ["Zgadzam się tylko częściowo", "I only partly agree"],
    ["Moim zdaniem korzyści są większe niż ryzyko", "In my opinion the benefits are greater than the risk"],
    ["Chociaż pomysł jest ciekawy, może być kosztowny", "Although the idea is interesting, it may be expensive"],
    ["To prawda, jednak potrzebujemy więcej danych", "That's true; however, we need more data"],
    ["Pierwsza opcja jest szybsza, natomiast druga tańsza", "The first option is faster, whereas the second is cheaper"],
    ["Nie jestem przekonany, że to rozwiąże problem", "I'm not convinced that this will solve the problem"],
    ["Czy możesz podać konkretny przykład?", "Can you give a specific example?"],
    ["Spójrzmy na to z innej strony", "Let's look at it from another angle"],
    ["W tej kwestii możemy się zgodzić", "We can agree on this point"],
    ["Spróbujmy znaleźć rozwiązanie pośrednie", "Let's try to find a compromise"],
    ["Podsumowując, warto przeprowadzić próbę", "To sum up, it's worth running a trial"],
  ]),

  unit("relationships-boundaries", "Relationships and boundaries", "Social", "B1 in action", "🤝", "Talk about expectations, express feelings, apologise, and resolve everyday tension.", "Verbs such as zależeć, przeszkadzać, and ufać require particular pronoun or case forms learned as chunks.", "grammar-b1-verb-complements", writing(
    "Write a calm message to a friend who repeatedly changes plans at the last minute. Say how it affects you and suggest a better arrangement.",
    "sms",
    "Cześć, chcę ci powiedzieć, że częste zmiany planów w ostatniej chwili są dla mnie trudne. Zależy mi na naszych spotkaniach, ale potrzebuję wiedzieć wcześniej, czy termin jest aktualny. Może od teraz potwierdzajmy spotkanie dzień wcześniej?",
    ["zależy", "potrzebuję", "wcześniej"],
  ), [
    ["Zależy mi na naszej relacji", "Our relationship matters to me"],
    ["Chciałbym spokojnie o tym porozmawiać", "I'd like to talk about it calmly"],
    ["Było mi przykro, kiedy to usłyszałam", "I felt hurt when I heard that"],
    ["Nie chciałem cię urazić", "I didn't mean to hurt you"],
    ["Przepraszam, że nie dałem znać wcześniej", "I'm sorry I didn't let you know earlier"],
    ["Potrzebuję trochę czasu dla siebie", "I need some time to myself"],
    ["Proszę, nie podejmuj decyzji za mnie", "Please don't make decisions for me"],
    ["Rozumiem, dlaczego tak zareagowałeś", "I understand why you reacted that way"],
    ["Co mogę zrobić, żeby to naprawić?", "What can I do to make this right?"],
    ["Następnym razem powiedz mi od razu", "Next time tell me straight away"],
    ["Ustalmy coś, co odpowiada nam obojgu", "Let's agree on something that suits us both"],
    ["Cieszę się, że to wyjaśniliśmy", "I'm glad we cleared that up"],
  ]),

  unit("community-environment", "Community and environment", "Next steps", "B1 in action", "🌍", "Discuss local change, environmental habits, and practical community action.", "The passive and impersonal się describe rules and processes without naming the actor.", "grammar-b1-passive-process", reading(
    "W naszej dzielnicy uruchomiono punkt wymiany rzeczy używanych. Można tam zostawić książki, ubrania i drobny sprzęt, którego już się nie potrzebuje. Przedmioty są sprawdzane, a następnie udostępniane innym mieszkańcom bez opłat. W pierwszym miesiącu przekazano ponad pięćset rzeczy. Dzięki inicjatywie mniej odpadów trafia na wysypisko, a sąsiedzi częściej się spotykają.",
    [
      { prompt: "Co można zostawić w punkcie?", options: ["Tylko żywność", "Używane książki, ubrania i drobny sprzęt", "Odpady budowlane"], answerIndex: 1 },
      { prompt: "Czy za rzeczy trzeba płacić?", options: ["Nie", "Tak, zawsze", "Tylko w weekend"], answerIndex: 0 },
      { prompt: "Jaki dodatkowy skutek ma inicjatywa?", options: ["Rośnie ruch samochodowy", "Sklepy są dłużej otwarte", "Sąsiedzi częściej się spotykają"], answerIndex: 2 },
    ],
  ), [
    ["W naszej okolicy brakuje terenów zielonych", "Our area lacks green spaces"],
    ["Miasto planuje posadzić sto drzew", "The city plans to plant one hundred trees"],
    ["Odpady są odbierane raz w tygodniu", "Waste is collected once a week"],
    ["Tutaj segreguje się szkło i papier", "Glass and paper are sorted here"],
    ["Zużyte baterie należy oddać do specjalnego punktu", "Used batteries should be taken to a special collection point"],
    ["Coraz więcej osób jeździ do pracy rowerem", "More and more people cycle to work"],
    ["Dzięki temu powietrze będzie czystsze", "Thanks to that the air will be cleaner"],
    ["Projekt został sfinansowany przez mieszkańców", "The project was funded by residents"],
    ["Potrzebni są wolontariusze do sobotniej akcji", "Volunteers are needed for Saturday's event"],
    ["Możemy zgłosić ten pomysł do rady dzielnicy", "We can submit this idea to the district council"],
    ["Warto zacząć od małych zmian", "It's worth starting with small changes"],
    ["Każdy może się zaangażować", "Everyone can get involved"],
  ]),

  unit("plans-hypotheses", "Plans, wishes, and what-ifs", "Next steps", "B1 in action", "🔮", "Discuss ambitions, imagined situations, and conditions that may change a plan.", "The conditional uses by attached to the verb: zrobiłbym, chciałabym, moglibyśmy.", "grammar-b1-conditional", writing(
    "Write a short description of a change you would make if you had six free months. Explain what you would do, why, and one condition that might affect the plan.",
    "description",
    "Gdybym miał sześć wolnych miesięcy, pojechałbym do Polski i zapisałbym się na intensywny kurs. Chciałbym mieszkać z polskimi współlokatorami, ponieważ szybciej nauczyłbym się mówić. Jeśli znalazłbym pracę zdalną, mógłbym zostać dłużej.",
    ["gdybym", "chciałbym", "mógłbym"],
  ), [
    ["Gdybym miał więcej czasu, częściej bym podróżował", "If I had more time, I would travel more often"],
    ["Chciałabym kiedyś założyć własną firmę", "I'd like to start my own company one day"],
    ["Na twoim miejscu porozmawiałbym z kierownikiem", "In your place I'd talk to the manager"],
    ["Moglibyśmy zacząć od mniejszego projektu", "We could start with a smaller project"],
    ["Co byś zrobił w takiej sytuacji?", "What would you do in that situation?"],
    ["Gdyby pogoda była lepsza, pojechalibyśmy nad morze", "If the weather were better, we'd go to the seaside"],
    ["Jeśli dostanę urlop, zarezerwuję bilety", "If I get leave, I'll book the tickets"],
    ["O ile nic się nie zmieni, zaczniemy w maju", "Provided nothing changes, we'll start in May"],
    ["Marzę o tym, żeby płynnie mówić po polsku", "I dream of speaking Polish fluently"],
    ["Mam zamiar zdać egzamin w przyszłym roku", "I intend to pass the exam next year"],
    ["Najpierw muszę zdobyć więcej doświadczenia", "First I need to gain more experience"],
    ["Zobaczymy, jak rozwinie się sytuacja", "We'll see how the situation develops"],
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

export const b1Dialogues = [
  dialogue("project-delay", "📊", "A project delay", "You agree a recovery plan with a colleague.", "Colleague", [
    ["Niestety testy wykazały poważny błąd.", "Unfortunately the tests found a serious bug.", "Jak to wpłynie na termin?", "How will that affect the deadline?", "Czy wiemy już, co go powoduje?", "Do we know what causes it yet?", "Poproszę rachunek.", "The bill, please."],
    ["Naprawa zajmie prawdopodobnie trzy dni.", "The fix will probably take three days.", "W takim razie musimy zmienić harmonogram.", "In that case we need to change the schedule.", "Które zadania możemy przesunąć?", "Which tasks can we move?", "Boli mnie gardło.", "My throat hurts."],
    ["Proponuję odłożyć prezentację dla zespołu.", "I suggest postponing the team presentation.", "Zgadzam się, klient jest teraz ważniejszy.", "I agree; the client is more important now.", "Dobrze, poinformuję uczestników.", "Okay, I'll inform the attendees.", "Gdzie jest peron trzeci?", "Where is platform three?"],
    ["Czy możesz dziś napisać do klienta?", "Can you write to the client today?", "Tak, wyjaśnię sytuację i podam nowy termin.", "Yes, I'll explain the situation and give a new date.", "Najpierw przygotuję krótkie podsumowanie.", "First I'll prepare a short summary.", "Lubię zupę pomidorową.", "I like tomato soup."],
    ["Świetnie. Jutro sprawdzimy postępy.", "Great. Tomorrow we'll review progress.", "Podsumuję ustalenia po spotkaniu.", "I'll summarise what we agreed after the meeting.", "Dobrze, odezwę się rano.", "Okay, I'll get in touch in the morning.", "Poproszę większy rozmiar.", "A larger size, please."],
  ]),
  dialogue("doctor-follow-up", "🩺", "A follow-up appointment", "You describe whether a treatment has helped.", "Doctor", [
    ["Jak się pan czuje po tygodniu leczenia?", "How do you feel after a week of treatment?", "Jest trochę lepiej, ale ból nie minął.", "It's a little better, but the pain hasn't gone.", "Objawy nadal nasilają się wieczorem.", "The symptoms still get worse in the evening.", "Pociąg został odwołany.", "The train was cancelled."],
    ["Czy regularnie przyjmował pan lek?", "Did you take the medicine regularly?", "Tak, dwa razy dziennie zgodnie z zaleceniem.", "Yes, twice a day as instructed.", "Pominąłem tylko jedną dawkę.", "I only missed one dose.", "Szukam wolnego pokoju.", "I'm looking for a vacant room."],
    ["Czy pojawiły się skutki uboczne?", "Did any side effects appear?", "Czasami boli mnie brzuch.", "Sometimes my stomach hurts.", "Nie zauważyłem żadnych nowych objawów.", "I haven't noticed any new symptoms.", "Zapłacę gotówką.", "I'll pay cash."],
    ["Zlecę dodatkowe badanie krwi.", "I'll order an additional blood test.", "Kiedy mogę je wykonać?", "When can I have it done?", "Czy muszę być na czczo?", "Do I need to fast?", "Ten film był świetny.", "That film was great."],
    ["Proszę wrócić z wynikami za tydzień.", "Please come back with the results in a week.", "Dobrze, umówię wizytę w recepcji.", "Okay, I'll book at reception.", "Czy do tego czasu mam dalej brać lek?", "Should I keep taking the medicine until then?", "Zgubiłem bagaż.", "I lost my luggage."],
  ]),
  dialogue("travel-rebooking", "🚧", "Rebooking a cancelled journey", "You arrange an alternative after a cancellation.", "Agent", [
    ["Pański lot został odwołany z powodu burzy.", "Your flight was cancelled because of a storm.", "Jakie połączenie zastępcze mogą mi państwo zaoferować?", "What alternative connection can you offer me?", "Muszę dotrzeć na miejsce jutro rano.", "I need to arrive tomorrow morning.", "Poproszę stolik dla dwóch osób.", "A table for two, please."],
    ["Mamy wolne miejsce na lot dziś o dwudziestej drugiej.", "We have a seat on a flight at ten tonight.", "Czy jest to lot bezpośredni?", "Is it a direct flight?", "Proszę mnie na niego przenieść.", "Please move me onto it.", "Ten sweter jest za mały.", "This jumper is too small."],
    ["Lot ma przesiadkę w Wiedniu.", "The flight has a connection in Vienna.", "Ile czasu trwa przesiadka?", "How long is the connection?", "Czy bagaż zostanie przeniesiony automatycznie?", "Will the luggage be transferred automatically?", "Mieszkam w Londynie.", "I live in London."],
    ["Przesiadka trwa dwie godziny, a bagaż poleci dalej.", "The connection is two hours and the luggage will continue.", "Dobrze, ta opcja mi odpowiada.", "Okay, that option suits me.", "Czy otrzymam nowe karty pokładowe?", "Will I receive new boarding passes?", "Nie jem mięsa.", "I don't eat meat."],
    ["Wyślę wszystkie dokumenty na pana adres e-mail.", "I'll send all documents to your email address.", "Dziękuję. Czy przysługuje mi też posiłek?", "Thank you. Am I also entitled to a meal?", "Świetnie, sprawdzę wiadomość.", "Great, I'll check the message.", "Spotkajmy się w sobotę.", "Let's meet on Saturday."],
  ]),
  dialogue("formal-complaint", "✉️", "Following up a complaint", "You call after receiving no reply to a formal complaint.", "Adviser", [
    ["W czym mogę pomóc?", "How can I help?", "Dzwonię w sprawie reklamacji z zeszłego tygodnia.", "I'm calling about last week's complaint.", "Chciałbym sprawdzić, na jakim etapie jest sprawa.", "I'd like to check the status of the case.", "Czy ten autobus jedzie do centrum?", "Does this bus go to the centre?"],
    ["Proszę podać numer zgłoszenia.", "Please give the case number.", "Numer zgłoszenia to cztery osiem jeden dwa.", "The case number is 4812.", "Już szukam potwierdzenia.", "I'm looking for the confirmation now.", "Kawę bez cukru, proszę.", "Coffee without sugar, please."],
    ["Widzę, że brakuje zdjęcia uszkodzenia.", "I see that a photo of the damage is missing.", "Wysłałem je w załączniku do pierwszej wiadomości.", "I sent it attached to the first message.", "Mogę przesłać zdjęcie ponownie.", "I can send the photo again.", "Jutro będzie słonecznie.", "It will be sunny tomorrow."],
    ["Proszę wysłać je na ten sam adres.", "Please send it to the same address.", "Dobrze, zrobię to od razu po rozmowie.", "Okay, I'll do that straight after the call.", "Czy dostanę potwierdzenie odbioru?", "Will I receive confirmation of receipt?", "Mam dwóch braci.", "I have two brothers."],
    ["Tak, odpowiemy w ciągu trzech dni roboczych.", "Yes, we'll reply within three working days.", "Dziękuję, będę czekać na odpowiedź.", "Thank you, I'll wait for the reply.", "Proszę zanotować, że sprawa jest pilna.", "Please note that the matter is urgent.", "Chętnie pójdę do kina.", "I'd happily go to the cinema."],
  ]),
  dialogue("community-meeting", "🌍", "A community meeting", "You discuss a neighbourhood traffic proposal.", "Resident", [
    ["Miasto chce zamknąć tę ulicę w weekendy.", "The city wants to close this street at weekends.", "Moim zdaniem okolica będzie dzięki temu bezpieczniejsza.", "In my opinion the area will be safer as a result.", "Rozumiem pomysł, ale martwię się o lokalne sklepy.", "I understand the idea, but I'm worried about local shops.", "Potrzebuję nowego hasła.", "I need a new password."],
    ["Właściciele sklepów obawiają się mniejszego ruchu.", "Shop owners fear less footfall.", "Czy zebrano dane z podobnych projektów?", "Has data from similar projects been collected?", "Można zacząć od krótkiego okresu próbnego.", "We could start with a short trial period.", "Poproszę bilet normalny.", "A standard ticket, please."],
    ["Próba miałaby potrwać trzy miesiące.", "The trial would last three months.", "To rozsądny kompromis.", "That's a reasonable compromise.", "Jak zostaną ocenione rezultaty?", "How will the results be assessed?", "Boli mnie kolano.", "My knee hurts."],
    ["Miasto zmierzy ruch, hałas i sprzedaż w sklepach.", "The city will measure traffic, noise, and shop sales.", "W takim razie popieram przeprowadzenie próby.", "In that case I support running the trial.", "Warto też zapytać mieszkańców o opinię.", "It's also worth asking residents for their opinion.", "Szukam lekkiej kurtki.", "I'm looking for a light jacket."],
    ["Uwagi można wysyłać do końca miesiąca.", "Comments can be sent until the end of the month.", "Dobrze, prześlę krótkie podsumowanie.", "Okay, I'll send a short summary.", "Czy adres formularza jest na stronie miasta?", "Is the form address on the city website?", "Rachunek, proszę.", "The bill, please."],
  ]),
  dialogue("clearing-the-air", "🤝", "Clearing the air", "You resolve tension after plans changed repeatedly.", "Friend", [
    ["Mam wrażenie, że jesteś na mnie zły.", "I have the impression you're angry with me.", "Nie jestem zły, ale było mi przykro.", "I'm not angry, but I felt hurt.", "Chciałbym spokojnie wyjaśnić, co się stało.", "I'd like to explain calmly what happened.", "Gdzie jest najbliższy bank?", "Where is the nearest bank?"],
    ["Przepraszam, że znów odwołałam spotkanie.", "I'm sorry I cancelled again.", "Dziękuję, że to mówisz.", "Thank you for saying that.", "Rozumiem, że miałaś trudny tydzień.", "I understand you had a difficult week.", "Poproszę zupę dnia.", "The soup of the day, please."],
    ["Powinnam była dać ci znać wcześniej.", "I should have let you know earlier.", "Właśnie tego potrzebuję następnym razem.", "That's exactly what I need next time.", "Zmiana planów jest łatwiejsza, kiedy wiem wcześniej.", "Changing plans is easier when I know earlier.", "Pociąg odjeżdża o ósmej.", "The train leaves at eight."],
    ["Może będziemy potwierdzać spotkania dzień wcześniej?", "Maybe we can confirm meetings a day earlier?", "To dobre i konkretne rozwiązanie.", "That's a good, practical solution.", "Zgoda, spróbujmy tak robić.", "Agreed, let's try doing that.", "Ta koszula jest niebieska.", "This shirt is blue."],
    ["Cieszę się, że o tym porozmawialiśmy.", "I'm glad we talked about it.", "Ja też. Zależy mi na naszej przyjaźni.", "Me too. Our friendship matters to me.", "Dziękuję, że mnie wysłuchałaś.", "Thank you for listening to me.", "Jestem z Anglii.", "I'm from England."],
  ]),
];

export const b1GrammarGuides = [
  { id: "grammar-b1-cause-result", title: "Connect cause and result", example: "ponieważ… · dlatego… · dzięki temu…", meaning: "because… · therefore… · thanks to that…", body: "Ponieważ introduces a reason. Dlatego and dzięki temu point to a result; use mimo że when the result contrasts with what was expected." },
  { id: "grammar-b1-past-background", title: "Background and interruption", example: "Kiedy czekałem, zadzwonił telefon", meaning: "While I was waiting, the phone rang", body: "Use an ongoing imperfective past for the background and a completed perfective event for what happened during it." },
  { id: "grammar-b1-impersonal", title: "Keep the focus on the task", example: "trzeba zrobić · udało się zrobić", meaning: "it needs doing · we managed to do it", body: "Trzeba, można, udało się, and passive forms let you report work without repeatedly naming the person responsible." },
  { id: "grammar-b1-time-clauses", title: "Link events in time", example: "odkąd mieszkam · zanim wyjdę · dopóki czekam", meaning: "since I have lived · before I leave · while I wait", body: "Odkąd gives a starting point, zanim marks the earlier event, and dopóki describes how long a situation continues." },
  { id: "grammar-b1-symptom-time", title: "Describe symptoms precisely", example: "boli od tygodnia · nasila się, gdy chodzę", meaning: "it has hurt for a week · it gets worse when I walk", body: "Use od plus a time period for duration and gdy or kiedy to explain the conditions in which a symptom changes." },
  { id: "grammar-b1-reported-speech", title: "Report what someone said", example: "Powiedział, że droga jest zamknięta", meaning: "He said that the road was closed", body: "After powiedzieć, twierdzić, wyjaśnić, or podać, że introduces the content being reported without English-style tense backshifting." },
  { id: "grammar-b1-relative-clauses", title: "Add identifying detail", example: "pociąg, który… · osoba, która…", meaning: "the train which… · the person who…", body: "Który agrees with the noun it refers to, then changes form according to its role inside the relative clause." },
  { id: "grammar-b1-formal-register", title: "Write in a formal register", example: "Szanowni Państwo · Uprzejmie proszę", meaning: "Dear Sir or Madam · I kindly request", body: "Fixed openings, Państwo forms, and impersonal requests create a neutral professional tone. Close with Z poważaniem." },
  { id: "grammar-b1-discourse-contrast", title: "Qualify and contrast", example: "chociaż… · jednak… · natomiast…", meaning: "although… · however… · whereas…", body: "These connectors help you acknowledge another point before adding a limitation, contrast, or different perspective." },
  { id: "grammar-b1-verb-complements", title: "Learn the verb with its partner", example: "zależy mi na · przeszkadza mi · ufam ci", meaning: "I care about · it bothers me · I trust you", body: "Many common Polish verbs select a particular pronoun or case. Learn the complete rhythm rather than translating each word separately." },
  { id: "grammar-b1-passive-process", title: "Describe rules and processes", example: "odpady są odbierane · tutaj segreguje się szkło", meaning: "waste is collected · glass is sorted here", body: "A passive form highlights the result; impersonal się describes what people generally do without naming them." },
  { id: "grammar-b1-conditional", title: "Imagine with the conditional", example: "gdybym miał · zrobiłbym · moglibyśmy", meaning: "if I had · I would do · we could", body: "The movable by element carries the conditional meaning and combines with past-style forms that agree with the speaker or group." },
];
