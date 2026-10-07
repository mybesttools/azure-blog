import type { Lang } from '@/app/ghiffa/i18n';

export type ResetDictionary = {
  requestTitle: string;
  requestIntro: string;
  usernamePlaceholder: string;
  sending: string;
  sendLink: string;
  requestSent: string;
  backToSignIn: string;
  confirmTitle: string;
  incompleteLink: string;
  requestNewOne: string;
  passwordChanged: string;
  signIn: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  saving: string;
  setPassword: string;
  requestNewLink: string;
  genericError: string;
  // Keyed by the `code` the password-reset API routes return.
  errors: Record<
    'username_required' | 'password_mismatch' | 'password_too_short' | 'invalid_token' | 'password_complexity' | 'reset_failed',
    string
  >;
};

export const RESET_DICTIONARIES: Record<Lang, ResetDictionary> = {
  pl: {
    requestTitle: 'Resetowanie hasła',
    requestIntro:
      'Podaj nazwę użytkownika, a wyślemy link do ustawienia nowego hasła na adres e-mail przypisany do Twojego konta.',
    usernamePlaceholder: 'Nazwa użytkownika',
    sending: 'Wysyłanie...',
    sendLink: 'Wyślij link',
    requestSent:
      'Jeśli to konto istnieje i ma przypisany adres e-mail, wysłaliśmy na niego link do zresetowania hasła.',
    backToSignIn: '← Powrót do logowania',
    confirmTitle: 'Ustaw nowe hasło',
    incompleteLink: 'Ten link jest niekompletny. Użyj pełnego linku z wiadomości e-mail lub',
    requestNewOne: 'poproś o nowy',
    passwordChanged: 'Twoje hasło zostało zmienione.',
    signIn: 'Zaloguj się',
    newPasswordPlaceholder: 'Nowe hasło (co najmniej 8 znaków)',
    confirmPasswordPlaceholder: 'Powtórz nowe hasło',
    saving: 'Zapisywanie...',
    setPassword: 'Ustaw nowe hasło',
    requestNewLink: 'Poproś o nowy link',
    genericError: 'Wystąpił błąd',
    errors: {
      username_required: 'Podaj nazwę użytkownika',
      password_mismatch: 'Hasła nie są takie same',
      password_too_short: 'Hasło musi mieć co najmniej 8 znaków',
      invalid_token: 'Ten link jest nieprawidłowy lub wygasł.',
      password_complexity:
        'To hasło nie spełnia wymagań. Użyj co najmniej 8 znaków, łącząc wielkie i małe litery, cyfry i symbole.',
      reset_failed: 'Nie udało się zmienić hasła. Spróbuj ponownie później.',
    },
  },
  en: {
    requestTitle: 'Reset password',
    requestIntro:
      "Enter your username and we'll send a link to choose a new password to the email address configured for your account.",
    usernamePlaceholder: 'Username',
    sending: 'Sending...',
    sendLink: 'Send reset link',
    requestSent: 'If that account exists and has an email address configured, a password reset link has been sent to it.',
    backToSignIn: '← Back to sign in',
    confirmTitle: 'Choose a new password',
    incompleteLink: 'This reset link is incomplete. Please use the full link from the email, or',
    requestNewOne: 'request a new one',
    passwordChanged: 'Your password has been changed.',
    signIn: 'Sign in',
    newPasswordPlaceholder: 'New password (at least 8 characters)',
    confirmPasswordPlaceholder: 'Confirm new password',
    saving: 'Saving...',
    setPassword: 'Set new password',
    requestNewLink: 'Request a new link',
    genericError: 'An error occurred',
    errors: {
      username_required: 'Username is required',
      password_mismatch: 'Passwords do not match',
      password_too_short: 'Password must be at least 8 characters',
      invalid_token: 'This reset link is invalid or has expired.',
      password_complexity:
        'That password does not meet the requirements. Use at least 8 characters with a mix of upper and lower case letters, numbers and symbols.',
      reset_failed: 'Your password could not be changed. Please try again later.',
    },
  },
  de: {
    requestTitle: 'Passwort zurücksetzen',
    requestIntro:
      'Gib deinen Benutzernamen ein, und wir senden einen Link zum Festlegen eines neuen Passworts an die für dein Konto hinterlegte E-Mail-Adresse.',
    usernamePlaceholder: 'Benutzername',
    sending: 'Wird gesendet...',
    sendLink: 'Link senden',
    requestSent:
      'Falls dieses Konto existiert und eine E-Mail-Adresse hinterlegt ist, wurde ein Link zum Zurücksetzen des Passworts dorthin gesendet.',
    backToSignIn: '← Zurück zur Anmeldung',
    confirmTitle: 'Neues Passwort festlegen',
    incompleteLink: 'Dieser Link ist unvollständig. Bitte verwende den vollständigen Link aus der E-Mail oder',
    requestNewOne: 'fordere einen neuen an',
    passwordChanged: 'Dein Passwort wurde geändert.',
    signIn: 'Anmelden',
    newPasswordPlaceholder: 'Neues Passwort (mindestens 8 Zeichen)',
    confirmPasswordPlaceholder: 'Neues Passwort bestätigen',
    saving: 'Wird gespeichert...',
    setPassword: 'Neues Passwort festlegen',
    requestNewLink: 'Neuen Link anfordern',
    genericError: 'Ein Fehler ist aufgetreten',
    errors: {
      username_required: 'Bitte gib einen Benutzernamen ein',
      password_mismatch: 'Die Passwörter stimmen nicht überein',
      password_too_short: 'Das Passwort muss mindestens 8 Zeichen lang sein',
      invalid_token: 'Dieser Link ist ungültig oder abgelaufen.',
      password_complexity:
        'Dieses Passwort erfüllt die Anforderungen nicht. Verwende mindestens 8 Zeichen mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.',
      reset_failed: 'Dein Passwort konnte nicht geändert werden. Bitte versuche es später erneut.',
    },
  },
};

// The reset email is sent in the language the request was made in.
export const RESET_EMAIL: Record<Lang, (name: string, upn: string, url: string) => { subject: string; text: string }> = {
  pl: (name, upn, url) => ({
    subject: 'Resetowanie hasła MyBestTools',
    text: [
      `Cześć ${name},`,
      '',
      `Ktoś (mamy nadzieję, że Ty) poprosił o zresetowanie hasła do konta ${upn}.`,
      'Użyj tego linku, aby ustawić nowe hasło. Link wygasa po 1 godzinie i można go użyć tylko raz:',
      '',
      url,
      '',
      'Jeśli to nie Ty, zignoruj tę wiadomość - Twoje hasło się nie zmieni.',
    ].join('\n'),
  }),
  en: (name, upn, url) => ({
    subject: 'Reset your MyBestTools password',
    text: [
      `Hi ${name},`,
      '',
      `Someone (hopefully you) asked to reset the password for ${upn}.`,
      'Use this link to choose a new password. It expires in 1 hour and can only be used once:',
      '',
      url,
      '',
      "If you didn't ask for this, you can ignore this email - your password won't change.",
    ].join('\n'),
  }),
  de: (name, upn, url) => ({
    subject: 'Dein MyBestTools-Passwort zurücksetzen',
    text: [
      `Hallo ${name},`,
      '',
      `Jemand (hoffentlich du) hat das Zurücksetzen des Passworts für ${upn} angefordert.`,
      'Über diesen Link kannst du ein neues Passwort festlegen. Er läuft nach 1 Stunde ab und kann nur einmal verwendet werden:',
      '',
      url,
      '',
      'Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren - dein Passwort bleibt unverändert.',
    ].join('\n'),
  }),
};
