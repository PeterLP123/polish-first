// Mission copy is authored separately from dialogue construction so every
// existing scene can gain a production-first goal without changing its id or
// the persisted dialogue statistics keyed by that id.
export const DIALOGUE_MISSIONS = {
  cafe: {
    goal: "Order a drink, choose where to have it, respond to an extra offer, pay, and close politely.",
    canDo: "I can order and pay in a Polish café.",
  },
  meeting: {
    goal: "Introduce yourself, exchange a few personal details, and make a friendly plan to meet again.",
    canDo: "I can start a friendly conversation with a new neighbour.",
  },
  directions: {
    goal: "Ask for the station, check the route and landmarks, then confirm that you understand.",
    canDo: "I can ask for and follow simple directions.",
  },
  restaurant: {
    goal: "Get a table, ask for a recommendation, order food and drink, then handle the bill.",
    canDo: "I can order a meal and respond naturally in a restaurant.",
  },
  tickets: {
    goal: "Buy a train ticket, pay, understand the platform and departure details, then present the ticket for inspection.",
    canDo: "I can buy and use a Polish train ticket.",
  },
  pharmacy: {
    goal: "Describe a symptom, share safety information, check the leaflet and price, then pay.",
    canDo: "I can ask for basic help at a pharmacy.",
  },
  "hotel-check-in": {
    goal: "Check in, ask about breakfast and Wi-Fi, locate your room, and confirm check-out.",
    canDo: "I can check into a hotel and ask practical questions.",
  },
  "train-platform": {
    goal: "Find the correct platform and carriage, handle a ticket check, and respond to a seat question.",
    canDo: "I can handle platform, ticket and seat questions on a train journey.",
  },
  "market-stall": {
    goal: "Buy fruit by weight, respond to an extra offer, choose how to pay, and handle the receipt.",
    canDo: "I can shop at a Polish market stall.",
  },
  "doctor-visit": {
    goal: "Describe your symptoms and timing, understand the treatment, and answer follow-up questions.",
    canDo: "I can explain a simple health problem to a doctor.",
  },
  "birthday-invitation": {
    goal: "Accept the invitation, confirm the time, offer to bring something, and close the plan naturally.",
    canDo: "I can respond to an invitation and make a social plan.",
  },
  "apartment-repair": {
    goal: "Report a household problem, explain the urgency, arrange access, and confirm the repair worked.",
    canDo: "I can report an urgent repair to a landlord.",
  },
  "post-office": {
    goal: "Choose a postal service, give the destination, complete the form, pay, and request confirmation.",
    canDo: "I can send a tracked item from a Polish post office.",
  },
  "currency-exchange": {
    goal: "Ask for an exchange, check the rate and fee, show identification, and verify the transaction.",
    canDo: "I can exchange money and check the terms.",
  },
  "car-rental": {
    goal: "Arrange the rental, choose the car, discuss insurance and fuel, then check its condition.",
    canDo: "I can collect a rental car and clarify the conditions.",
  },
  "museum-visit": {
    goal: "Buy admission, ask about tours and rules, find an exhibition, and plan the remaining time.",
    canDo: "I can organise a visit to a Polish museum.",
  },
  "clothes-return": {
    goal: "Explain why the jacket is unsuitable, show proof of purchase, and agree an exchange or refund.",
    canDo: "I can return or exchange an item in a shop.",
  },
  "course-enrolment": {
    goal: "Find the right course, check its timetable, length and price, then complete the enrolment steps.",
    canDo: "I can ask about and enrol on a course.",
  },
  "office-deadline": {
    goal: "Acknowledge a delay, agree a realistic new time, accept useful help, and close with a clear commitment.",
    canDo: "I can renegotiate a work deadline responsibly.",
  },
  "internet-support": {
    goal: "Identify your account, describe the fault, explain what you tried, and confirm when service should return.",
    canDo: "I can handle a basic technical-support call.",
  },
  "flat-viewing": {
    goal: "Inspect the flat, clarify rent and bills, ask about house rules, and decide the next step.",
    canDo: "I can ask practical questions while viewing a flat.",
  },
  "event-tickets": {
    goal: "Choose the concert, ticket quantity, seating area, and delivery method.",
    canDo: "I can choose and buy tickets for an event.",
  },
  "weekend-hike": {
    goal: "Choose a suitable route, check conditions and equipment, follow directions, and confirm a safe return.",
    canDo: "I can plan a safe hike at a visitor centre.",
  },
  "choosing-hotel": {
    goal: "Compare price, location, comfort, breakfast and reviews, then reach a shared decision.",
    canDo: "I can compare options and agree a travel choice.",
  },
  "telling-a-story": {
    goal: "Set the scene, order the main events, explain how you reacted, and bring the story to a close.",
    canDo: "I can tell a connected story about a difficult journey.",
  },
  "making-arrangements": {
    goal: "Explain why the plan must change, suggest a new time, agree the details, and confirm the meeting.",
    canDo: "I can rearrange a social plan by phone.",
  },
  "clarifying-call": {
    goal: "Ask for repetition, confirm the key details, provide a precise address, and close the call clearly.",
    canDo: "I can repair a difficult phone conversation.",
  },
  "damaged-order": {
    goal: "Describe the damage, provide evidence, choose a remedy, arrange collection, and confirm the outcome.",
    canDo: "I can report a damaged delivery and request a solution.",
  },
  "office-application": {
    goal: "State your purpose, present the documents, correct a missing detail, pay, and confirm when and how the document will be ready.",
    canDo: "I can submit an application at a public office.",
  },
  "giving-advice": {
    goal: "Recommend equipment, money and timing, explain what to do in bad weather, and close supportively.",
    canDo: "I can give clear, practical travel advice.",
  },
  "project-delay": {
    goal: "Clarify the impact of a problem, adjust priorities, assign communication, and agree the recovery plan.",
    canDo: "I can negotiate a practical response to a project delay.",
  },
  "doctor-follow-up": {
    goal: "Describe progress and side effects accurately, answer treatment questions, and clarify the next test and treatment.",
    canDo: "I can give a useful update at a follow-up appointment.",
  },
  "travel-rebooking": {
    goal: "Explain your arrival need, compare the replacement route, confirm luggage, and verify the replacement documents.",
    canDo: "I can rebook a cancelled journey and verify the details.",
  },
  "formal-complaint": {
    goal: "Identify the complaint, provide the case number, resolve missing evidence, and secure a response timeframe.",
    canDo: "I can follow up a formal complaint firmly and politely.",
  },
  "community-meeting": {
    goal: "State a balanced view, ask for evidence, shape a trial, and agree how the result should be assessed.",
    canDo: "I can contribute constructively to a community discussion.",
  },
  "clearing-the-air": {
    goal: "Name the problem calmly, acknowledge the apology, set a future need, and agree a practical solution.",
    canDo: "I can resolve tension without escalating it.",
  },
  "presentation-questions": {
    goal: "Defend a recommendation with evidence, acknowledge limits, manage risk, and commit to a clear next step.",
    canDo: "I can answer difficult questions without overstating the evidence.",
  },
  "interview-follow-up": {
    goal: "Give a structured example covering challenge, responsibility, action, result, and honest reflection.",
    canDo: "I can answer a probing interview question with evidence.",
  },
  "contract-terms": {
    goal: "Clarify renewal and notice, request written confirmation, identify fees, and decide what must change before signing.",
    canDo: "I can question contract terms before agreeing to them.",
  },
  "negotiating-compromise": {
    goal: "Identify the real constraints, trade time fairly, resolve remaining needs, and record the agreement.",
    canDo: "I can negotiate a workable compromise between competing teams.",
  },
  "policy-consultation": {
    goal: "Question the evidence, test local assumptions, ask about funding and timing, then propose accountability.",
    canDo: "I can challenge a public proposal with precise, constructive questions.",
  },
  "explaining-breakdown": {
    goal: "Diagnose the failed application, find the missing step, recover expired access, and prevent a repeat.",
    canDo: "I can guide someone through a failed administrative process.",
  },
};

export function dialogueMission(dialogueId) {
  return DIALOGUE_MISSIONS[dialogueId] ?? null;
}
