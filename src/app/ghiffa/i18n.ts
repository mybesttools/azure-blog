export type Lang = 'pl' | 'en' | 'de';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

export const DEFAULT_LANG: Lang = 'pl';

export const LOCALES: Record<Lang, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
  de: 'de-DE',
};

export type Dictionary = {
  title: string;
  intro: (address: string) => string;
  pendingHeading: string;
  noPending: string;
  calendarHeading: string;
  legendConfirmed: string;
  legendPending: string;
  legendFree: string;
  galleryPrev: string;
  galleryNext: string;
  prevYear: string;
  nextYear: string;
  upcomingHeading: string;
  noUpcoming: string;
  statusConfirmed: string;
  statusPending: string;
  statusDeclined: string;
  myRequestsHeading: string;
  noMyRequests: string;
  editNotice: string;
  edit: string;
  save: string;
  cancel: string;
  saveError: string;
  requestHeading: string;
  formName: string;
  formEmail: string;
  formFrom: string;
  formTo: string;
  formNotes: string;
  formNotesOptional: string;
  submitIdle: string;
  submitBusy: string;
  successMessage: string;
  successMessageOwner: string;
  genericError: string;
  approve: string;
  decline: string;
  approveError: string;
  months: string[];
};

const en: Dictionary = {
  title: 'Ghiffa Apartment',
  intro: (address) =>
    `Our family apartment at ${address}. See who's planning to stay below, or request your own dates.`,
  pendingHeading: 'Requests awaiting your approval',
  noPending: 'No requests waiting on you right now.',
  calendarHeading: 'Availability calendar',
  legendConfirmed: 'Confirmed',
  legendPending: 'Pending',
  legendFree: 'Free',
  galleryPrev: 'Previous photo',
  galleryNext: 'Next photo',
  prevYear: 'Previous year',
  nextYear: 'Next year',
  upcomingHeading: 'Upcoming stays',
  noUpcoming: 'No upcoming stays yet. Be the first to request one below!',
  statusConfirmed: 'Confirmed',
  statusPending: 'Pending approval',
  statusDeclined: 'Declined',
  myRequestsHeading: 'Your requests',
  noMyRequests: "You haven't requested a stay yet.",
  editNotice: 'Editing sends this back for approval.',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  saveError: 'Something went wrong saving your changes. Try again.',
  requestHeading: 'Request a stay',
  formName: 'Name',
  formEmail: 'Email',
  formFrom: 'From',
  formTo: 'To',
  formNotes: 'Notes',
  formNotesOptional: '(optional)',
  submitIdle: 'Request a stay',
  submitBusy: 'Sending request...',
  successMessage: "Your request has been sent for approval. You'll get an email once it's confirmed.",
  successMessageOwner: "Your stay is confirmed - it's on the calendar now, no approval needed.",
  genericError: 'Something went wrong. Please try again.',
  approve: 'Approve',
  decline: 'Decline',
  approveError: 'Something went wrong updating this request. Try again.',
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const pl: Dictionary = {
  title: 'Apartament w Ghiffie',
  intro: (address) =>
    `Nasz rodzinny apartament pod adresem ${address}. Sprawdź poniżej, kto planuje pobyt, albo zgłoś własny termin.`,
  pendingHeading: 'Prośby czekające na Twoją akceptację',
  noPending: 'Żadne prośby nie czekają obecnie na decyzję.',
  calendarHeading: 'Kalendarz dostępności',
  legendConfirmed: 'Potwierdzone',
  legendPending: 'Oczekujące',
  legendFree: 'Wolne',
  galleryPrev: 'Poprzednie zdjęcie',
  galleryNext: 'Następne zdjęcie',
  prevYear: 'Poprzedni rok',
  nextYear: 'Następny rok',
  upcomingHeading: 'Nadchodzące pobyty',
  noUpcoming: 'Brak nadchodzących pobytów. Zgłoś pierwszy termin poniżej!',
  statusConfirmed: 'Potwierdzone',
  statusPending: 'Oczekuje na akceptację',
  statusDeclined: 'Odrzucone',
  myRequestsHeading: 'Twoje zgłoszenia',
  noMyRequests: 'Nie zgłosiłeś jeszcze żadnego pobytu.',
  editNotice: 'Edycja wysyła zgłoszenie ponownie do akceptacji.',
  edit: 'Edytuj',
  save: 'Zapisz',
  cancel: 'Anuluj',
  saveError: 'Nie udało się zapisać zmian. Spróbuj ponownie.',
  requestHeading: 'Zgłoś pobyt',
  formName: 'Imię i nazwisko',
  formEmail: 'Email',
  formFrom: 'Od',
  formTo: 'Do',
  formNotes: 'Uwagi',
  formNotesOptional: '(opcjonalnie)',
  submitIdle: 'Zgłoś pobyt',
  submitBusy: 'Wysyłanie zgłoszenia...',
  successMessage: 'Twoje zgłoszenie zostało wysłane do akceptacji. Otrzymasz e-mail po potwierdzeniu.',
  successMessageOwner: 'Twój pobyt jest potwierdzony - jest już w kalendarzu, bez potrzeby akceptacji.',
  genericError: 'Coś poszło nie tak. Spróbuj ponownie.',
  approve: 'Akceptuj',
  decline: 'Odrzuć',
  approveError: 'Nie udało się zaktualizować zgłoszenia. Spróbuj ponownie.',
  months: [
    'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
    'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
  ],
};

const de: Dictionary = {
  title: 'Wohnung in Ghiffa',
  intro: (address) =>
    `Unsere Familienwohnung in ${address}. Sieh unten, wer einen Aufenthalt plant, oder beantrage deine eigenen Termine.`,
  pendingHeading: 'Anfragen, die auf deine Freigabe warten',
  noPending: 'Derzeit warten keine Anfragen auf eine Entscheidung.',
  calendarHeading: 'Verfügbarkeitskalender',
  legendConfirmed: 'Bestätigt',
  legendPending: 'Ausstehend',
  legendFree: 'Frei',
  galleryPrev: 'Vorheriges Foto',
  galleryNext: 'Nächstes Foto',
  prevYear: 'Vorheriges Jahr',
  nextYear: 'Nächstes Jahr',
  upcomingHeading: 'Anstehende Aufenthalte',
  noUpcoming: 'Noch keine anstehenden Aufenthalte. Beantrage unten den ersten Termin!',
  statusConfirmed: 'Bestätigt',
  statusPending: 'Warten auf Freigabe',
  statusDeclined: 'Abgelehnt',
  myRequestsHeading: 'Deine Anfragen',
  noMyRequests: 'Du hast noch keinen Aufenthalt beantragt.',
  editNotice: 'Eine Bearbeitung sendet die Anfrage erneut zur Freigabe.',
  edit: 'Bearbeiten',
  save: 'Speichern',
  cancel: 'Abbrechen',
  saveError: 'Änderungen konnten nicht gespeichert werden. Bitte versuche es erneut.',
  requestHeading: 'Aufenthalt beantragen',
  formName: 'Name',
  formEmail: 'E-Mail',
  formFrom: 'Von',
  formTo: 'Bis',
  formNotes: 'Notizen',
  formNotesOptional: '(optional)',
  submitIdle: 'Aufenthalt beantragen',
  submitBusy: 'Anfrage wird gesendet...',
  successMessage: 'Deine Anfrage wurde zur Freigabe gesendet. Du erhältst eine E-Mail, sobald sie bestätigt ist.',
  successMessageOwner: 'Dein Aufenthalt ist bestätigt - er steht bereits im Kalender, keine Freigabe nötig.',
  genericError: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  approve: 'Annehmen',
  decline: 'Ablehnen',
  approveError: 'Aktualisierung der Anfrage fehlgeschlagen. Bitte versuche es erneut.',
  months: [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ],
};

export const DICTIONARIES: Record<Lang, Dictionary> = { pl, en, de };
