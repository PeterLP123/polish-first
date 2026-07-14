const phonetic = (value) => value.toLocaleLowerCase("pl").replace(/cz/g, "ch").replace(/sz/g, "sh").replace(/rz|ż/g, "zh").replace(/ł/g, "w").replace(/w/g, "v").replace(/j/g, "y").replace(/c/g, "ts").replace(/ó/g, "u");
const choice = (polish, english, good) => ({ polish, phonetic: phonetic(polish), english, good });

function dialogue(id, icon, title, setting, speaker, exchanges) {
  return {
    id,
    icon,
    title,
    setting,
    lines: exchanges.map(([prompt, translation, response, responseTranslation, alternative, alternativeTranslation]) => ({
      speaker,
      polish: prompt,
      phonetic: phonetic(prompt),
      english: translation,
      choices: [
        choice(response, responseTranslation, true),
        choice(alternative, alternativeTranslation, true),
        choice("Poproszę kawę z mlekiem.", "A coffee with milk, please.", false),
      ],
    })),
  };
}

export const expansionDialogues = [
  dialogue("clothes-return", "👕", "Returning a jacket", "You return an unsuitable jacket with the receipt.", "Assistant", [
    ["W czym mogę pomóc?", "How can I help?", "Chciałbym zwrócić tę kurtkę.", "I'd like to return this jacket.", "Chcę wymienić ją na większą.", "I want to exchange it for a larger one."],
    ["Co jest z nią nie tak?", "What is wrong with it?", "Rozmiar jest za mały.", "The size is too small.", "Nie podoba mi się kolor.", "I don't like the colour."],
    ["Czy ma pan paragon?", "Do you have the receipt?", "Tak, proszę bardzo.", "Yes, here it is.", "Mam potwierdzenie w telefonie.", "I have confirmation on my phone."],
    ["Woli pan wymianę czy zwrot?", "Would you prefer an exchange or refund?", "Poproszę zwrot pieniędzy.", "A refund, please.", "Chętnie zobaczę większy rozmiar.", "I'd like to see a larger size."],
    ["Zwrot pojawi się w ciągu trzech dni.", "The refund will appear within three days.", "Dziękuję za pomoc.", "Thank you for your help.", "Dobrze, będę czekać.", "Okay, I'll wait."]]),
  dialogue("course-enrolment", "📚", "Joining a course", "You ask a language school about an evening course.", "Coordinator", [
    ["Jakiego kursu pan szuka?", "What course are you looking for?", "Szukam kursu polskiego na poziomie A2.", "I'm looking for an A2 Polish course.", "Interesuje mnie kurs wieczorowy.", "I'm interested in an evening course."],
    ["Zajęcia są we wtorki i czwartki.", "Classes are Tuesdays and Thursdays.", "O której się zaczynają?", "What time do they start?", "Czy zajęcia są też online?", "Are classes also online?"],
    ["Kurs trwa dwanaście tygodni.", "The course lasts twelve weeks.", "Ile kosztuje cały kurs?", "How much is the full course?", "Czy podręcznik jest w cenie?", "Is the textbook included?"],
    ["Najpierw proszę zrobić test poziomujący.", "First please take a placement test.", "Gdzie znajdę ten test?", "Where can I find the test?", "Zrobię go jeszcze dziś.", "I'll do it today."],
    ["Potem może się pan zapisać przez stronę.", "Then you can enrol through the website.", "Dziękuję, wszystko rozumiem.", "Thank you, I understand everything.", "Świetnie, zapiszę się wieczorem.", "Great, I'll enrol this evening."]]),
  dialogue("office-deadline", "💼", "Moving a deadline", "You coordinate a delayed task with a colleague.", "Colleague", [
    ["Czy raport jest już gotowy?", "Is the report ready?", "Jeszcze nie, potrzebuję kilku godzin.", "Not yet, I need a few hours.", "Jest prawie gotowy.", "It is almost ready."],
    ["Mieliśmy wysłać go do południa.", "We were meant to send it by noon.", "Wiem, przepraszam za opóźnienie.", "I know, sorry for the delay.", "Czy możemy przesunąć termin?", "Can we move the deadline?"],
    ["Do której godziny go skończysz?", "What time will you finish it?", "Wyślę go przed czwartą.", "I'll send it before four.", "Potrzebuję czasu do końca dnia.", "I need until the end of the day."],
    ["Czy mam sprawdzić ostatnią wersję?", "Should I check the final version?", "Tak, to bardzo pomoże.", "Yes, that will help a lot.", "Proszę sprawdzić liczby.", "Please check the numbers."],
    ["Dobrze, daj mi znać, kiedy skończysz.", "Okay, let me know when you finish.", "Oczywiście, napiszę od razu.", "Of course, I'll message immediately.", "Dziękuję za wyrozumiałość.", "Thank you for understanding."]]),
  dialogue("internet-support", "📱", "Calling internet support", "Your home internet stopped working.", "Support", [
    ["Proszę podać numer klienta.", "Please give your customer number.", "Już go szukam.", "I'm looking for it now.", "Numer to osiem pięć trzy dwa.", "The number is eight five three two."],
    ["Jaki jest problem?", "What is the problem?", "Internet nie działa od rana.", "The internet hasn't worked since morning.", "Router ciągle miga na czerwono.", "The router keeps flashing red."],
    ["Czy próbował pan uruchomić router ponownie?", "Have you tried restarting the router?", "Tak, ale to nie pomogło.", "Yes, but it didn't help.", "Nie, zrobię to teraz.", "No, I'll do that now."],
    ["W okolicy jest mała awaria.", "There is a small outage in the area.", "Kiedy usługa wróci?", "When will the service return?", "Czy dostanę powiadomienie?", "Will I receive a notification?"],
    ["Powinna działać przed osiemnastą.", "It should work before six.", "Dziękuję za informację.", "Thank you for the information.", "Dobrze, sprawdzę wieczorem.", "Okay, I'll check this evening."]]),
  dialogue("flat-viewing", "🏢", "Viewing a flat", "You ask a landlord practical questions.", "Landlord", [
    ["Mieszkanie ma dwa pokoje i balkon.", "The flat has two rooms and a balcony.", "Czy mogę zobaczyć kuchnię?", "Can I see the kitchen?", "Balkon wygląda bardzo dobrze.", "The balcony looks very good."],
    ["Czynsz wynosi trzy tysiące złotych.", "The rent is three thousand zloty.", "Czy rachunki są wliczone?", "Are bills included?", "Ile wynosi kaucja?", "How much is the deposit?"],
    ["Rachunki płaci się osobno.", "Bills are paid separately.", "Ile kosztują średnio?", "How much do they cost on average?", "Czy ogrzewanie jest miejskie?", "Is the heating municipal?"],
    ["W budynku obowiązuje cisza po dziesiątej.", "The building is quiet after ten.", "Rozumiem, to nie problem.", "I understand, that's not a problem.", "Czy można mieć kota?", "Are cats allowed?"],
    ["Mieszkanie jest wolne od przyszłego tygodnia.", "The flat is available next week.", "Chciałbym je wynająć.", "I'd like to rent it.", "Kiedy możemy podpisać umowę?", "When can we sign the contract?"]]),
  dialogue("event-tickets", "🎭", "Buying event tickets", "You choose seats for a concert.", "Cashier", [
    ["Na który koncert potrzebuje pan biletów?", "Which concert do you need tickets for?", "Na sobotni koncert jazzowy.", "For Saturday's jazz concert.", "Na koncert o ósmej.", "For the concert at eight."],
    ["Ile miejsc?", "How many seats?", "Poproszę dwa miejsca.", "Two seats, please.", "Potrzebuję jednego biletu ulgowego.", "I need one reduced ticket."],
    ["Woli pan parter czy balkon?", "Do you prefer stalls or balcony?", "Wolę miejsca na parterze.", "I prefer seats in the stalls.", "Balkon też będzie w porządku.", "The balcony will also be fine."],
    ["Zostały miejsca w piątym rzędzie.", "Seats remain in row five.", "Te miejsca mi odpowiadają.", "Those seats suit me.", "Czy dobrze widać scenę?", "Can you see the stage well?"],
    ["Bilety wyślę na podany adres.", "I'll send the tickets to the address provided.", "Dziękuję, zaraz zapłacę.", "Thank you, I'll pay now.", "Proszę wysłać je mailem.", "Please send them by email."]]),
  dialogue("weekend-hike", "🌲", "Planning a hike", "You ask at a visitor centre about a route.", "Ranger", [
    ["Jakiej trasy państwo szukają?", "What kind of route are you looking for?", "Szukamy łatwej trasy na trzy godziny.", "We're looking for an easy three-hour route.", "Chcemy wejść na pobliski szczyt.", "We want to climb the nearby summit."],
    ["Dziś szlak może być mokry.", "The trail may be wet today.", "Czy potrzebujemy specjalnych butów?", "Do we need special shoes?", "Czy trasa jest bezpieczna?", "Is the route safe?"],
    ["Proszę zabrać wodę i kurtkę.", "Please take water and a jacket.", "Mamy wszystko w plecaku.", "We have everything in the backpack.", "Gdzie można kupić mapę?", "Where can we buy a map?"],
    ["Na rozwidleniu proszę skręcić w prawo.", "At the fork please turn right.", "Czy szlak jest oznaczony?", "Is the trail marked?", "Rozumiem, pójdziemy w prawo.", "I understand, we'll go right."],
    ["Proszę wrócić przed zachodem słońca.", "Please return before sunset.", "Oczywiście, będziemy uważać.", "Of course, we'll be careful.", "Dziękujemy za radę.", "Thank you for the advice."]]),
  dialogue("choosing-hotel", "⚖️", "Choosing a hotel", "You compare two places with a friend.", "Friend", [
    ["Który hotel bardziej ci się podoba?", "Which hotel do you like more?", "Wolę ten bliżej centrum.", "I prefer the one closer to the centre.", "Pierwszy wygląda wygodniej.", "The first looks more comfortable."],
    ["Drugi jest o sto złotych tańszy.", "The second is one hundred zloty cheaper.", "Cena jest ważna, ale wolę lepszą lokalizację.", "Price matters, but I prefer a better location.", "To rzeczywiście duża różnica.", "That really is a big difference."],
    ["Pierwszy ma śniadanie w cenie.", "The first includes breakfast.", "To dla mnie duża zaleta.", "That's a big advantage for me.", "Sprawdźmy jeszcze opinie.", "Let's also check the reviews."],
    ["Oba mają dobre oceny.", "Both have good ratings.", "W takim razie wybierzmy pierwszy.", "In that case let's choose the first.", "Nadal wolę tańszą opcję.", "I still prefer the cheaper option."],
    ["Dobrze, zrobię rezerwację.", "Okay, I'll make the booking.", "Świetnie, wyślę ci swoje dane.", "Great, I'll send you my details.", "Dziękuję, to dobry wybór.", "Thank you, that's a good choice."]]),
  dialogue("telling-a-story", "🕰️", "Telling what happened", "A friend asks about your difficult journey.", "Friend", [
    ["Jak minęła podróż?", "How was the journey?", "Była ciekawa, ale dość trudna.", "It was interesting but quite difficult.", "Dużo się wydarzyło.", "A lot happened."],
    ["Co stało się najpierw?", "What happened first?", "Najpierw spóźnił się pociąg.", "First the train was late.", "Na początku zgubiłem bilet.", "At first I lost my ticket."],
    ["I co zrobiłeś?", "And what did you do?", "Poprosiłem konduktora o pomoc.", "I asked the conductor for help.", "Znalazłem bilet w kieszeni.", "I found the ticket in my pocket."],
    ["Czy potem było już spokojnie?", "Was it calm after that?", "Nie, później pociąg się zatrzymał.", "No, later the train stopped.", "Tak, reszta podróży była łatwa.", "Yes, the rest of the journey was easy."],
    ["Najważniejsze, że dotarłeś.", "The main thing is that you arrived.", "Dokładnie, na końcu wszystko się udało.", "Exactly, everything worked out in the end.", "Tak, teraz mogę się z tego śmiać.", "Yes, now I can laugh about it."]]),
  dialogue("making-arrangements", "📅", "Changing plans", "You rearrange a weekend meeting by phone.", "Friend", [
    ["Czy nasze spotkanie w sobotę jest aktualne?", "Is our Saturday meeting still on?", "Tak, ale muszę zmienić godzinę.", "Yes, but I need to change the time.", "Chciałem właśnie do ciebie zadzwonić.", "I was just about to call you."],
    ["Co się stało?", "What happened?", "Muszę rano pracować.", "I have to work in the morning.", "Mam inne spotkanie do południa.", "I have another meeting until noon."],
    ["Możemy spotkać się później.", "We can meet later.", "Czy pasuje ci piąta?", "Does five suit you?", "Może spotkajmy się wieczorem.", "Maybe let's meet in the evening."],
    ["Piąta jest idealna.", "Five is perfect.", "Świetnie, zarezerwuję stolik.", "Great, I'll reserve a table.", "Dobrze, wyślę ci adres.", "Okay, I'll send you the address."],
    ["Do zobaczenia w sobotę.", "See you on Saturday.", "Do zobaczenia, dzięki za zmianę.", "See you, thanks for changing it.", "Będę tam kilka minut wcześniej.", "I'll be there a few minutes early."]]),
  dialogue("clarifying-call", "🔧", "Clarifying a call", "You repair a difficult phone conversation.", "Caller", [
    ["Dzwonię w sprawie jutrzejszej dostawy.", "I'm calling about tomorrow's delivery.", "Przepraszam, nie dosłyszałem.", "Sorry, I didn't hear that.", "Czy może pani powtórzyć?", "Could you repeat that?"],
    ["Chodzi o dostawę między drugą a czwartą.", "It's about delivery between two and four.", "Czy dobrze rozumiem, że jutro?", "Do I understand correctly that it's tomorrow?", "Między drugą a czwartą, tak?", "Between two and four, yes?"],
    ["Tak, ale kierowca nie ma numeru mieszkania.", "Yes, but the driver has no flat number.", "Mieszkam pod numerem osiem.", "I live at number eight.", "Już podaję pełny adres.", "I'll give the full address now."],
    ["Czy wejście jest od ulicy?", "Is the entrance from the street?", "Nie, wejście jest od podwórza.", "No, the entrance is from the courtyard.", "Proszę wejść przez drugą bramę.", "Please enter through the second gate."],
    ["Dziękuję, teraz wszystko jest jasne.", "Thank you, everything is clear now.", "Świetnie, będę czekać.", "Great, I'll wait.", "Dziękuję za telefon.", "Thank you for calling."]]),
  dialogue("damaged-order", "🧾", "A damaged order", "You report a damaged delivery.", "Agent", [
    ["Proszę opisać problem z zamówieniem.", "Please describe the problem with the order.", "Produkt dotarł uszkodzony.", "The product arrived damaged.", "Pudełko było otwarte.", "The box was open."],
    ["Czy może pan wysłać zdjęcia?", "Can you send photos?", "Tak, wyślę je od razu.", "Yes, I'll send them immediately.", "Mam już kilka zdjęć.", "I already have several photos."],
    ["Woli pan wymianę czy naprawę?", "Would you prefer replacement or repair?", "Poproszę nowy produkt.", "A new product, please.", "Wolałbym pełny zwrot.", "I'd prefer a full refund."],
    ["Musimy najpierw odebrać uszkodzony produkt.", "We must collect the damaged product first.", "Kiedy przyjedzie kurier?", "When will the courier come?", "Będę w domu jutro po południu.", "I'll be home tomorrow afternoon."],
    ["Wyślę potwierdzenie mailem.", "I'll send confirmation by email.", "Dziękuję za rozwiązanie problemu.", "Thank you for solving the problem.", "Dobrze, czekam na wiadomość.", "Okay, I'll wait for the message."]]),
  dialogue("office-application", "🏛️", "Submitting an application", "You submit a form at a public office.", "Clerk", [
    ["W jakiej sprawie pan przyszedł?", "What have you come about?", "Chcę złożyć ten wniosek.", "I want to submit this application.", "Potrzebuję nowego dokumentu.", "I need a new document."],
    ["Proszę pokazać formularz i paszport.", "Please show the form and passport.", "Proszę, oto dokumenty.", "Here are the documents.", "Mam też kopię paszportu.", "I also have a passport copy."],
    ["Brakuje podpisu na drugiej stronie.", "The signature on page two is missing.", "Gdzie mam podpisać?", "Where should I sign?", "Już uzupełniam podpis.", "I'll add the signature now."],
    ["Trzeba jeszcze zapłacić opłatę.", "You still need to pay the fee.", "Czy mogę zapłacić kartą?", "Can I pay by card?", "Ile wynosi opłata?", "How much is the fee?"],
    ["Dokument będzie gotowy za dwa tygodnie.", "The document will be ready in two weeks.", "Czy dostanę powiadomienie?", "Will I receive a notification?", "Dziękuję, zapiszę termin.", "Thank you, I'll note the date."]]),
  dialogue("giving-advice", "🧭", "Giving practical advice", "A friend asks how to prepare for a trip.", "Friend", [
    ["Co powinienem zabrać w góry?", "What should I take to the mountains?", "Weź ciepłą kurtkę i dobre buty.", "Take a warm jacket and good shoes.", "Pamiętaj o wodzie i mapie.", "Remember water and a map."],
    ["Czy potrzebuję gotówki?", "Do I need cash?", "Warto mieć trochę gotówki.", "It's worth having some cash.", "Karta nie wszędzie działa.", "Cards don't work everywhere."],
    ["Kiedy najlepiej wyjść?", "When is it best to leave?", "Najlepiej wcześnie rano.", "Early morning is best.", "Sprawdź pogodę przed wyjściem.", "Check the weather before leaving."],
    ["A jeśli zacznie padać?", "What if it starts raining?", "Wtedy wróć na główny szlak.", "Then return to the main trail.", "Nie idź dalej podczas burzy.", "Don't continue during a storm."],
    ["Dzięki, to bardzo pomaga.", "Thanks, that helps a lot.", "Nie ma sprawy, baw się dobrze.", "No problem, have fun.", "Napisz, kiedy bezpiecznie wrócisz.", "Message when you return safely."]]),
];

export const expansionGrammarGuides = [
  { id: "grammar-agreement-review", title: "Agreement across a description", example: "lekka kurtka · lekkie buty", meaning: "a light jacket · light shoes", body: "Adjectives change to match the gender, number, and case of the noun." },
  { id: "grammar-plural-patterns", title: "Useful plural patterns", example: "dwa bilety · pięć biletów", meaning: "two tickets · five tickets", body: "Polish number phrases change after quantities. Learn frequent combinations as complete chunks." },
  { id: "grammar-comparison", title: "Comparing two things", example: "tańszy niż · lepszy od", meaning: "cheaper than · better than", body: "Use niż or od after a comparative; naj- forms the superlative." },
  { id: "grammar-modals", title: "Can, must, and should", example: "mogę · muszę · powinienem", meaning: "I can · I must · I should", body: "A modal is normally followed by an infinitive such as zrobić or zadzwonić." },
  { id: "grammar-pronoun-forms", title: "Pronouns near the verb", example: "wyślij mi · słyszę cię", meaning: "send me · I hear you", body: "Short pronoun forms usually stay close to the verb and do not carry sentence stress." },
  { id: "grammar-movement-place", title: "Movement and location", example: "idę do biura · jestem w biurze", meaning: "I'm going to the office · I'm in the office", body: "Movement and location select different prepositions and noun endings." },
  { id: "grammar-aspect-stories", title: "Aspect in a story", example: "robiłem · zrobiłem", meaning: "I was doing · I completed", body: "Imperfective verbs describe process or repetition; perfective partners emphasize a completed result." },
  { id: "grammar-aspect-plans", title: "Aspect in plans", example: "będę pisać · napiszę", meaning: "I'll be writing · I'll write and finish", body: "Choose an ongoing future or a completed future according to the intended result." },
  { id: "grammar-polite-instructions", title: "Polite instructions", example: "Proszę podpisać tutaj", meaning: "Please sign here", body: "Proszę plus an infinitive is a neutral formal instruction used in services and offices." },
  { id: "grammar-sequencing", title: "Sequence a short account", example: "najpierw · potem · na końcu", meaning: "first · then · finally", body: "Connectors make a short account easier to follow without requiring complex grammar." },
  { id: "grammar-contrast", title: "Add a contrast", example: "ale · jednak · chociaż", meaning: "but · however · although", body: "Use a contrast word to connect two different facts or opinions." },
  { id: "grammar-relative-repair", title: "Describe and repair", example: "ten, który… · mam na myśli…", meaning: "the one which… · I mean…", body: "Relative descriptions identify a person or thing; repair phrases correct an unclear message." },
];
