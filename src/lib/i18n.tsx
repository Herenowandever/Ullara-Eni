import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// English, Hindi and Kannada for the screens workers and supervisors use.
// Admin pages stay in English for now. Native speakers should review these before launch.

export type Lang = 'en' | 'hi' | 'kn'
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

type Entry = [en: string, hi: string, kn: string]

const D: Record<string, Entry> = {
  // Navigation and shared
  'nav.clock': ['Clock in', 'हाज़िरी लगाएँ', 'ಹಾಜರಿ ಹಾಕಿ'],
  'nav.history': ['My history', 'मेरा रिकॉर्ड', 'ನನ್ನ ದಾಖಲೆ'],
  'nav.crew': ['Crew', 'टीम', 'ತಂಡ'],
  'nav.attendance': ['Attendance', 'हाज़िरी', 'ಹಾಜರಾತಿ'],
  'nav.team': ['Team', 'स्टाफ़', 'ಸಿಬ್ಬಂದಿ'],
  'nav.shifts': ['Shifts', 'शिफ़्ट', 'ಶಿಫ್ಟ್‌ಗಳು'],
  'nav.offices': ['Sites & QR', 'साइट और QR', 'ಸೈಟ್ ಮತ್ತು QR'],
  'nav.reports': ['Reports', 'रिपोर्ट', 'ವರದಿಗಳು'],
  'nav.company': ['Company', 'कंपनी', 'ಕಂಪನಿ'],
  'nav.activity': ['Activity', 'गतिविधि', 'ಚಟುವಟಿಕೆ'],
  'nav.account': ['Account', 'खाता', 'ಖಾತೆ'],
  signOut: ['Sign out', 'साइन आउट', 'ಸೈನ್ ಔಟ್'],
  loading: ['Loading…', 'लोड हो रहा है…', 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…'],
  pleaseWait: ['Please wait…', 'कृपया रुकें…', 'ದಯವಿಟ್ಟು ಕಾಯಿರಿ…'],
  language: ['Language', 'भाषा', 'ಭಾಷೆ'],
  cancel: ['Cancel', 'रद्द करें', 'ರದ್ದುಮಾಡಿ'],

  // Sign in
  'auth.tagline': ["Attendance that knows you're here", 'हाज़िरी, जो जानती है कि आप यहाँ हैं', 'ನೀವು ಇಲ್ಲಿದ್ದೀರಿ ಎಂದು ತಿಳಿಯುವ ಹಾಜರಾತಿ'],
  'auth.signIn': ['Sign in', 'साइन इन करें', 'ಸೈನ್ ಇನ್ ಮಾಡಿ'],
  'auth.create': ['Create account', 'खाता बनाएँ', 'ಖಾತೆ ತೆರೆಯಿರಿ'],
  'auth.email': ['Email', 'ईमेल', 'ಇಮೇಲ್'],
  'auth.password': ['Password', 'पासवर्ड', 'ಪಾಸ್‌ವರ್ಡ್'],
  'auth.forgot': ['Forgot your password?', 'पासवर्ड भूल गए?', 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?'],
  'auth.back': ['Back to sign in', 'वापस साइन इन पर', 'ಸೈನ್ ಇನ್‌ಗೆ ಹಿಂತಿರುಗಿ'],
  'auth.sendReset': ['Send reset link', 'रीसेट लिंक भेजें', 'ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಿ'],
  'auth.confirmSent': [
    'We sent a confirmation link to {email}. Open it, then sign in here.',
    'हमने {email} पर पुष्टि लिंक भेजा है। उसे खोलें, फिर यहाँ साइन इन करें।',
    '{email} ಗೆ ದೃಢೀಕರಣ ಲಿಂಕ್ ಕಳುಹಿಸಿದ್ದೇವೆ. ಅದನ್ನು ತೆರೆದು, ನಂತರ ಇಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  ],
  'auth.resetSent': [
    'If {email} has an account, a password reset link is on its way.',
    'अगर {email} का खाता है, तो पासवर्ड रीसेट लिंक भेज दिया गया है।',
    '{email} ಗೆ ಖಾತೆ ಇದ್ದರೆ, ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸಲಾಗಿದೆ.',
  ],
  'auth.worker': ['Worker', 'कर्मचारी', 'ಕಾರ್ಮಿಕ'],
  'auth.google': ['Continue with Google', 'Google से जारी रखें', 'Google ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ'],
  'auth.or': ['or', 'या', 'ಅಥವಾ'],
  'auth.coCode': ['Company code', 'कंपनी कोड', 'ಕಂಪನಿ ಕೋಡ್'],
  'auth.workerId': ['Worker ID', 'कर्मचारी ID', 'ಕಾರ್ಮಿಕ ID'],
  'auth.pin': ['6-digit PIN', '6 अंकों का PIN', '6 ಅಂಕಿಯ PIN'],
  'auth.workerHint': [
    'Get these from your admin or supervisor. No email needed.',
    'ये आपके एडमिन या सुपरवाइज़र से मिलेंगे। ईमेल की ज़रूरत नहीं।',
    'ಇವು ನಿಮ್ಮ ಅಡ್ಮಿನ್ ಅಥವಾ ಸೂಪರ್‌ವೈಸರ್ ಬಳಿ ಸಿಗುತ್ತವೆ. ಇಮೇಲ್ ಬೇಕಿಲ್ಲ.',
  ],
  'auth.workerWrong': [
    "That company code, worker ID or PIN didn't match. Check them, or ask your admin to reset your PIN.",
    'कंपनी कोड, कर्मचारी ID या PIN मेल नहीं खाया। जाँचें, या एडमिन से PIN रीसेट करने को कहें।',
    'ಕಂಪನಿ ಕೋಡ್, ಕಾರ್ಮಿಕ ID ಅಥವಾ PIN ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ. ಪರಿಶೀಲಿಸಿ, ಅಥವಾ PIN ಮರುಹೊಂದಿಸಲು ಅಡ್ಮಿನ್‌ಗೆ ಹೇಳಿ.',
  ],
  'auth.googleNote': [
    'Workers without email: use the Worker tab.',
    'बिना ईमेल वाले कर्मचारी: "कर्मचारी" टैब इस्तेमाल करें।',
    'ಇಮೇಲ್ ಇಲ್ಲದ ಕಾರ್ಮಿಕರು: "ಕಾರ್ಮಿಕ" ಟ್ಯಾಬ್ ಬಳಸಿ.',
  ],
  'auth.afterCreate': [
    "After creating your account you'll set up your company or join one with a code from your admin.",
    'खाता बनाने के बाद आप अपनी कंपनी सेट करेंगे या एडमिन से मिले कोड से जुड़ेंगे।',
    'ಖಾತೆ ತೆರೆದ ನಂತರ ನಿಮ್ಮ ಕಂಪನಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿ, ಅಥವಾ ಅಡ್ಮಿನ್ ನೀಡಿದ ಕೋಡ್‌ನಿಂದ ಸೇರಿಕೊಳ್ಳಿ.',
  ],

  // Onboarding
  'ob.join': ['Join your company', 'अपनी कंपनी से जुड़ें', 'ನಿಮ್ಮ ಕಂಪನಿಗೆ ಸೇರಿ'],
  'ob.setup': ['Set up your company', 'अपनी कंपनी सेट करें', 'ನಿಮ್ಮ ಕಂಪನಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿ'],
  'ob.haveCode': ['I have a company code', 'मेरे पास कंपनी कोड है', 'ನನ್ನ ಬಳಿ ಕಂಪನಿ ಕೋಡ್ ಇದೆ'],
  'ob.settingUp': ["I'm setting up my company", 'मैं अपनी कंपनी सेट कर रहा हूँ', 'ನಾನು ಕಂಪನಿಯನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದೇನೆ'],
  'ob.name': ['Your full name', 'आपका पूरा नाम', 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು'],
  'ob.code': ['Company code', 'कंपनी कोड', 'ಕಂಪನಿ ಕೋಡ್'],
  'ob.codeHint': ['Your admin can find this under Team.', 'यह कोड आपके एडमिन के पास "स्टाफ़" पेज पर है।', 'ಈ ಕೋಡ್ ನಿಮ್ಮ ಅಡ್ಮಿನ್ ಬಳಿ "ಸಿಬ್ಬಂದಿ" ಪುಟದಲ್ಲಿದೆ.'],
  'ob.codePh': ['8 letters and numbers', '8 अक्षर और अंक', '8 ಅಕ್ಷರ ಮತ್ತು ಅಂಕೆಗಳು'],
  'ob.company': ['Company name', 'कंपनी का नाम', 'ಕಂಪನಿಯ ಹೆಸರು'],
  'ob.tz': ['Time zone', 'टाइम ज़ोन', 'ಸಮಯ ವಲಯ'],
  'ob.adminNote': [
    "You'll be the admin. Next you'll add your site location so people can clock in.",
    'आप एडमिन होंगे। इसके बाद अपनी साइट की लोकेशन जोड़ें ताकि लोग हाज़िरी लगा सकें।',
    'ನೀವು ಅಡ್ಮಿನ್ ಆಗುತ್ತೀರಿ. ನಂತರ ನಿಮ್ಮ ಸೈಟ್‌ನ ಸ್ಥಳವನ್ನು ಸೇರಿಸಿ, ಆಗ ಸಿಬ್ಬಂದಿ ಹಾಜರಿ ಹಾಕಬಹುದು.',
  ],
  'ob.joinBtn': ['Join company', 'कंपनी से जुड़ें', 'ಕಂಪನಿಗೆ ಸೇರಿ'],
  'ob.createBtn': ['Create company', 'कंपनी बनाएँ', 'ಕಂಪನಿ ರಚಿಸಿ'],
  'ob.other': ['Use a different account', 'दूसरा खाता इस्तेमाल करें', 'ಬೇರೆ ಖಾತೆ ಬಳಸಿ'],

  // Access turned off
  'gate.offTitle': ['Your access is turned off', 'आपकी पहुँच बंद कर दी गई है', 'ನಿಮ್ಮ ಪ್ರವೇಶ ನಿಲ್ಲಿಸಲಾಗಿದೆ'],
  'gate.offBody': [
    'An admin at {company} has deactivated your account. Ask them to turn it back on if this is a mistake.',
    '{company} के एडमिन ने आपका खाता बंद कर दिया है। अगर यह गलती है, तो उनसे दोबारा चालू करने को कहें।',
    '{company} ಅಡ್ಮಿನ್ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿದ್ದಾರೆ. ಇದು ತಪ್ಪಾಗಿದ್ದರೆ ಮತ್ತೆ ಸಕ್ರಿಯಗೊಳಿಸಲು ಅವರನ್ನು ಕೇಳಿ.',
  ],

  // Account
  'acc.title': ['Your account', 'आपका खाता', 'ನಿಮ್ಮ ಖಾತೆ'],
  'acc.name': ['Name', 'नाम', 'ಹೆಸರು'],
  'acc.method': ['Signed in with', 'साइन इन का तरीका', 'ಸೈನ್ ಇನ್ ವಿಧಾನ'],
  'acc.m.google': ['Google', 'Google', 'Google'],
  'acc.m.email': ['Email and password', 'ईमेल और पासवर्ड', 'ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್'],
  'acc.m.pin': ['Worker ID and PIN', 'कर्मचारी ID और PIN', 'ಕಾರ್ಮಿಕ ID ಮತ್ತು PIN'],
  'acc.email': ['Email', 'ईमेल', 'ಇಮೇಲ್'],
  'acc.company': ['Company', 'कंपनी', 'ಕಂಪನಿ'],
  'acc.role': ['Role', 'भूमिका', 'ಪಾತ್ರ'],
  'acc.r.admin': ['Admin', 'एडमिन', 'ಅಡ್ಮಿನ್'],
  'acc.r.supervisor': ['Supervisor', 'सुपरवाइज़र', 'ಸೂಪರ್‌ವೈಸರ್'],
  'acc.r.employee': ['Employee', 'कर्मचारी', 'ಉದ್ಯೋಗಿ'],
  'acc.signOut': ['Sign out', 'साइन आउट करें', 'ಸೈನ್ ಔಟ್ ಮಾಡಿ'],
  'acc.signOutAll': ['Sign out on all devices', 'सभी डिवाइस से साइन आउट करें', 'ಎಲ್ಲಾ ಸಾಧನಗಳಿಂದ ಸೈನ್ ಔಟ್ ಮಾಡಿ'],
  'acc.signOutHint': [
    'Use this if you lost a phone or signed in on someone else\'s.',
    'अगर फ़ोन खो गया हो या किसी और के फ़ोन पर साइन इन किया हो, तो इसका इस्तेमाल करें।',
    'ಫೋನ್ ಕಳೆದುಹೋದರೆ ಅಥವಾ ಬೇರೆಯವರ ಫೋನ್‌ನಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿದ್ದರೆ ಇದನ್ನು ಬಳಸಿ.',
  ],
  'acc.delTitle': ['Delete account', 'खाता हटाएँ', 'ಖಾತೆ ಅಳಿಸಿ'],
  'acc.delStart': ['Delete my account', 'मेरा खाता हटाएँ', 'ನನ್ನ ಖಾತೆ ಅಳಿಸಿ'],
  'acc.del.deactivated': [
    "Your login will be deleted and you'll be removed from {company}. Your past attendance stays with {company} for their payroll records.",
    'आपका लॉगिन हटा दिया जाएगा और आप {company} से हट जाएँगे। आपकी पुरानी हाज़िरी {company} के वेतन रिकॉर्ड के लिए रहेगी।',
    'ನಿಮ್ಮ ಲಾಗಿನ್ ಅಳಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ನಿಮ್ಮನ್ನು {company} ನಿಂದ ತೆಗೆಯಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಹಳೆಯ ಹಾಜರಾತಿ {company} ಸಂಬಳ ದಾಖಲೆಗಾಗಿ ಉಳಿಯುತ್ತದೆ.',
  ],
  'acc.del.company_removed': [
    "You're the only person left in {company}, so {company} and all its sites, shifts, attendance and pay records will be deleted too.",
    '{company} में अब सिर्फ़ आप हैं, इसलिए {company} और उसकी सारी साइट, शिफ़्ट, हाज़िरी और वेतन रिकॉर्ड भी हट जाएँगे।',
    '{company} ನಲ್ಲಿ ಈಗ ನೀವು ಮಾತ್ರ ಇದ್ದೀರಿ, ಆದ್ದರಿಂದ {company} ಮತ್ತು ಅದರ ಎಲ್ಲಾ ಸೈಟ್, ಶಿಫ್ಟ್, ಹಾಜರಾತಿ ಮತ್ತು ಸಂಬಳ ದಾಖಲೆಗಳೂ ಅಳಿಸಲಾಗುತ್ತವೆ.',
  ],
  'acc.del.request_removed': [
    'Your request to join {company} will be cancelled and your login deleted.',
    '{company} से जुड़ने का आपका अनुरोध रद्द होगा और लॉगिन हटा दिया जाएगा।',
    '{company} ಸೇರುವ ನಿಮ್ಮ ವಿನಂತಿ ರದ್ದಾಗುತ್ತದೆ ಮತ್ತು ಲಾಗಿನ್ ಅಳಿಸಲಾಗುತ್ತದೆ.',
  ],
  'acc.del.no_profile': ['Your login will be deleted.', 'आपका लॉगिन हटा दिया जाएगा।', 'ನಿಮ್ಮ ಲಾಗಿನ್ ಅಳಿಸಲಾಗುತ್ತದೆ.'],
  'acc.del.last_admin': [
    "You're the only admin of {company}. Make someone else an admin on the Team page first, then you can delete your account.",
    'आप {company} के अकेले एडमिन हैं। पहले "स्टाफ़" पेज पर किसी और को एडमिन बनाएँ, फिर अपना खाता हटा सकते हैं।',
    'ನೀವು {company} ನ ಏಕೈಕ ಅಡ್ಮಿನ್. ಮೊದಲು "ಸಿಬ್ಬಂದಿ" ಪುಟದಲ್ಲಿ ಬೇರೆಯವರನ್ನು ಅಡ್ಮಿನ್ ಮಾಡಿ, ನಂತರ ನಿಮ್ಮ ಖಾತೆ ಅಳಿಸಬಹುದು.',
  ],
  'acc.del.pin_account': [
    'Your login is managed by your admin. Ask them to remove you from the team.',
    'आपका लॉगिन आपके एडमिन संभालते हैं। उनसे आपको टीम से हटाने को कहें।',
    'ನಿಮ್ಮ ಲಾಗಿನ್ ಅನ್ನು ನಿಮ್ಮ ಅಡ್ಮಿನ್ ನಿರ್ವಹಿಸುತ್ತಾರೆ. ತಂಡದಿಂದ ತೆಗೆಯಲು ಅವರಿಗೆ ಹೇಳಿ.',
  ],
  'acc.del.check': ['I understand this cannot be undone', 'मैं समझता/समझती हूँ कि इसे वापस नहीं किया जा सकता', 'ಇದನ್ನು ಹಿಂಪಡೆಯಲು ಆಗುವುದಿಲ್ಲ ಎಂದು ನನಗೆ ಅರ್ಥವಾಗಿದೆ'],
  'acc.del.confirm': ['Delete permanently', 'हमेशा के लिए हटाएँ', 'ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ'],
  'acc.del.busy': ['Deleting…', 'हटाया जा रहा है…', 'ಅಳಿಸಲಾಗುತ್ತಿದೆ…'],
  'acc.del.done': ['Your account has been deleted.', 'आपका खाता हटा दिया गया है।', 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ.'],

  // Waiting for approval
  'pend.title': ['Waiting for approval', 'मंज़ूरी का इंतज़ार', 'ಅನುಮೋದನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ'],
  'pend.body': [
    'Your request to join {company} has been sent. An admin needs to approve it before you can clock in.',
    '{company} से जुड़ने का आपका अनुरोध भेज दिया गया है। हाज़िरी लगाने से पहले एडमिन को इसे मंज़ूर करना होगा।',
    '{company} ಗೆ ಸೇರುವ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ. ಹಾಜರಿ ಹಾಕುವ ಮೊದಲು ಅಡ್ಮಿನ್ ಅನುಮೋದಿಸಬೇಕು.',
  ],
  'pend.check': ['Check again', 'फिर से देखें', 'ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ'],
  'pend.cancel': ['Cancel request', 'अनुरोध रद्द करें', 'ವಿನಂತಿ ರದ್ದುಮಾಡಿ'],
  'pend.unknown': ['your company', 'आपकी कंपनी', 'ನಿಮ್ಮ ಕಂಪನಿ'],

  // Clock in
  'clk.hi': ['Hi {name}', 'नमस्ते {name}', 'ನಮಸ್ಕಾರ {name}'],
  'clk.shift': ['{name} shift', '{name} शिफ़्ट', '{name} ಶಿಫ್ಟ್'],
  'clk.noShift': ['No shift assigned yet', 'अभी कोई शिफ़्ट तय नहीं', 'ಇನ್ನೂ ಶಿಫ್ಟ್ ನಿಗದಿಯಾಗಿಲ್ಲ'],
  'clk.inAt': ['Clocked in at {time}', '{time} बजे हाज़िरी लगी', '{time} ಕ್ಕೆ ಹಾಜರಿ ಹಾಕಲಾಗಿದೆ'],
  'clk.lateAt': ['Clocked in late at {time}', '{time} बजे देर से हाज़िरी', '{time} ಕ್ಕೆ ತಡವಾಗಿ ಹಾಜರಿ'],
  'clk.dayDone': ['Day complete', 'आज का काम पूरा', 'ಇಂದಿನ ಕೆಲಸ ಮುಗಿದಿದೆ'],
  'clk.notIn': ['Not clocked in', 'हाज़िरी नहीं लगी', 'ಹಾಜರಿ ಹಾಕಿಲ್ಲ'],
  'clk.beforeTitle': ['Before you clock in', 'हाज़िरी लगाने से पहले', 'ಹಾಜರಿ ಹಾಕುವ ಮೊದಲು'],
  'clk.notice1': [
    'Ullara-Eni checks your location only at the moment you clock in or out. It does not track you during the day.',
    'Ullara-Eni आपकी लोकेशन सिर्फ़ हाज़िरी लगाते और छुट्टी करते समय देखता है। दिन भर आपको ट्रैक नहीं करता।',
    'Ullara-Eni ನೀವು ಹಾಜರಿ ಹಾಕುವಾಗ ಮತ್ತು ಹೊರಡುವಾಗ ಮಾತ್ರ ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ನೋಡುತ್ತದೆ. ದಿನವಿಡೀ ನಿಮ್ಮನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದಿಲ್ಲ.',
  ],
  'clk.notice2': [
    'Your check-in selfie is visible to you and to the admins at {company}.',
    'आपकी सेल्फ़ी सिर्फ़ आप और {company} के एडमिन देख सकते हैं।',
    'ನಿಮ್ಮ ಸೆಲ್ಫಿಯನ್ನು ನೀವು ಮತ್ತು {company} ಅಡ್ಮಿನ್‌ಗಳು ಮಾತ್ರ ನೋಡಬಹುದು.',
  ],
  'clk.notice3': [
    'Your records are used for attendance and payroll at {company}.',
    'आपका रिकॉर्ड {company} में हाज़िरी और वेतन के लिए इस्तेमाल होता है।',
    'ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು {company} ನಲ್ಲಿ ಹಾಜರಾತಿ ಮತ್ತು ಸಂಬಳಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.',
  ],
  'clk.understand': ['I understand', 'मैं समझ गया/गई', 'ನನಗೆ ಅರ್ಥವಾಯಿತು'],
  'clk.scanTitle': ['Scan the site QR code', 'साइट का QR कोड स्कैन करें', 'ಸೈಟ್‌ನ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ'],
  'clk.scanHint': [
    'Point your camera at the Ullara-Eni QR screen.',
    'कैमरा Ullara-Eni की QR स्क्रीन की ओर करें।',
    'ಕ್ಯಾಮೆರಾವನ್ನು Ullara-Eni QR ಪರದೆಯ ಕಡೆ ತೋರಿಸಿ.',
  ],
  'clk.doneTitle': ['All done for today', 'आज का काम पूरा', 'ಇಂದಿನ ಕೆಲಸ ಮುಗಿಯಿತು'],
  'clk.doneBody': [
    'You worked {hours} hours, from {from} to {to}.',
    'आपने {from} से {to} तक {hours} घंटे काम किया।',
    'ನೀವು {from} ರಿಂದ {to} ವರೆಗೆ {hours} ಗಂಟೆ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ.',
  ],
  'clk.noOffice': [
    "Your company hasn't added a site location yet, so clocking in won't work until an admin sets one up.",
    'आपकी कंपनी ने अभी साइट की लोकेशन नहीं जोड़ी है। एडमिन के जोड़ने तक हाज़िरी नहीं लगेगी।',
    'ನಿಮ್ಮ ಕಂಪನಿ ಇನ್ನೂ ಸೈಟ್ ಸ್ಥಳ ಸೇರಿಸಿಲ್ಲ. ಅಡ್ಮಿನ್ ಸೇರಿಸುವವರೆಗೆ ಹಾಜರಿ ಹಾಕಲು ಆಗುವುದಿಲ್ಲ.',
  ],
  'clk.step1': ['Step 1 · Selfie', 'चरण 1 · सेल्फ़ी', 'ಹಂತ 1 · ಸೆಲ್ಫಿ'],
  'clk.step2': ["Step 2 · Confirm you're at work", 'चरण 2 · पुष्टि करें कि आप काम पर हैं', 'ಹಂತ 2 · ನೀವು ಕೆಲಸದ ಸ್ಥಳದಲ್ಲಿದ್ದೀರಿ ಎಂದು ದೃಢೀಕರಿಸಿ'],
  'clk.inGps': ['Clock in with my location', 'लोकेशन से हाज़िरी लगाएँ', 'ನನ್ನ ಸ್ಥಳದಿಂದ ಹಾಜರಿ ಹಾಕಿ'],
  'clk.outGps': ['Clock out with my location', 'लोकेशन से छुट्टी दर्ज करें', 'ನನ್ನ ಸ್ಥಳದಿಂದ ಹೊರಡುವಿಕೆ ದಾಖಲಿಸಿ'],
  'clk.useQr': ['Scan site QR instead', 'इसके बजाय QR स्कैन करें', 'ಬದಲಿಗೆ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ'],
  'clk.uploading': ['Uploading photo…', 'फ़ोटो अपलोड हो रही है…', 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ…'],
  'clk.locating': ['Finding your location…', 'आपकी लोकेशन ढूँढ रहे हैं…', 'ನಿಮ್ಮ ಸ್ಥಳ ಹುಡುಕುತ್ತಿದೆ…'],
  'clk.clockingIn': ['Clocking you in…', 'हाज़िरी लग रही है…', 'ಹಾಜರಿ ಹಾಕಲಾಗುತ್ತಿದೆ…'],
  'clk.clockingOut': ['Clocking you out…', 'छुट्टी दर्ज हो रही है…', 'ಹೊರಡುವಿಕೆ ದಾಖಲಾಗುತ್ತಿದೆ…'],
  'clk.saving': ['Saving…', 'सेव हो रहा है…', 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…'],
  'clk.okIn': [
    'Clocked in at {time} by {via}. Have a good day.',
    '{time} बजे {via} से हाज़िरी लग गई। आपका दिन अच्छा हो।',
    '{time} ಕ್ಕೆ {via} ಮೂಲಕ ಹಾಜರಿ ಹಾಕಲಾಗಿದೆ. ಶುಭ ದಿನ.',
  ],
  'clk.lateIn': [
    "Clocked in at {time} by {via}. That's after your shift start, so it's marked late.",
    '{time} बजे {via} से हाज़िरी लगी। यह शिफ़्ट शुरू होने के बाद है, इसलिए देर मानी गई।',
    '{time} ಕ್ಕೆ {via} ಮೂಲಕ ಹಾಜರಿ ಹಾಕಲಾಗಿದೆ. ಶಿಫ್ಟ್ ಆರಂಭದ ನಂತರವಾದ್ದರಿಂದ ತಡ ಎಂದು ದಾಖಲಾಗಿದೆ.',
  ],
  'clk.okOut': [
    'Clocked out at {time}. You worked {hours} hours today.',
    '{time} बजे छुट्टी दर्ज हुई। आज आपने {hours} घंटे काम किया।',
    '{time} ಕ್ಕೆ ಹೊರಡುವಿಕೆ ದಾಖಲಾಗಿದೆ. ಇಂದು ನೀವು {hours} ಗಂಟೆ ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ.',
  ],
  'via.location': ['location', 'लोकेशन', 'ಸ್ಥಳ'],
  'via.qr': ['site QR', 'साइट QR', 'ಸೈಟ್ QR'],
  'fence.inside': ['Inside the zone', 'दायरे के अंदर', 'ವಲಯದ ಒಳಗೆ'],
  'fence.outside': ['Outside the zone', 'दायरे के बाहर', 'ವಲಯದ ಹೊರಗೆ'],
  'fence.detail': ['{d} m away · zone {r} m · GPS ±{a} m', '{d} मी दूर · दायरा {r} मी · GPS ±{a} मी', '{d} ಮೀ ದೂರ · ವಲಯ {r} ಮೀ · GPS ±{a} ಮೀ'],

  // Camera
  'cam.takeSelfie': ['Take selfie', 'सेल्फ़ी लें', 'ಸೆಲ್ಫಿ ತೆಗೆಯಿರಿ'],
  'cam.groupPhoto': ['Take group photo', 'ग्रुप फ़ोटो लें', 'ಗುಂಪು ಫೋಟೋ ತೆಗೆಯಿರಿ'],
  'cam.takePhoto': ['Take photo', 'फ़ोटो लें', 'ಫೋಟೋ ತೆಗೆಯಿರಿ'],
  'cam.starting': ['Starting camera…', 'कैमरा चालू हो रहा है…', 'ಕ್ಯಾಮೆರಾ ಆರಂಭವಾಗುತ್ತಿದೆ…'],
  'cam.retake': ['Retake', 'फिर से लें', 'ಮತ್ತೆ ತೆಗೆಯಿರಿ'],
  'cam.open': ['Open camera', 'कैमरा खोलें', 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ'],
  'cam.blocked': [
    'Camera access is blocked. Allow it in your browser settings, or use your camera app below.',
    'कैमरा की अनुमति बंद है। ब्राउज़र सेटिंग में अनुमति दें, या नीचे कैमरा ऐप इस्तेमाल करें।',
    'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಅನುಮತಿಸಿ, ಅಥವಾ ಕೆಳಗಿನ ಕ್ಯಾಮೆರಾ ಆ್ಯಪ್ ಬಳಸಿ.',
  ],
  'cam.unreadable': ["That photo couldn't be read. Try taking it again.", 'फ़ोटो पढ़ी नहीं जा सकी। फिर से लें।', 'ಫೋಟೋ ಓದಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ತೆಗೆಯಿರಿ.'],
  'cam.alt': ['Your photo', 'आपकी फ़ोटो', 'ನಿಮ್ಮ ಫೋಟೋ'],

  // QR scanner
  'qr.typePh': ['Or type code', 'या कोड लिखें', 'ಅಥವಾ ಕೋಡ್ ಟೈಪ್ ಮಾಡಿ'],
  'qr.use': ['Use code', 'कोड इस्तेमाल करें', 'ಕೋಡ್ ಬಳಸಿ'],
  'qr.noCamera': [
    "This browser can't open the camera here. Type the code shown under the QR instead.",
    'यह ब्राउज़र कैमरा नहीं खोल पा रहा। QR के नीचे लिखा कोड टाइप करें।',
    'ಈ ಬ್ರೌಸರ್ ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಆಗುತ್ತಿಲ್ಲ. QR ಕೆಳಗಿನ ಕೋಡ್ ಟೈಪ್ ಮಾಡಿ.',
  ],
  'qr.blocked': [
    'Camera access is blocked. Type the code shown under the QR instead.',
    'कैमरा की अनुमति बंद है। QR के नीचे लिखा कोड टाइप करें।',
    'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. QR ಕೆಳಗಿನ ಕೋಡ್ ಟೈಪ್ ಮಾಡಿ.',
  ],

  // History
  'his.title': ['My attendance', 'मेरी हाज़िरी', 'ನನ್ನ ಹಾಜರಾತಿ'],
  'his.summary': ['Last {n} days · {hours} hours · {late} late', 'पिछले {n} दिन · {hours} घंटे · {late} बार देर', 'ಕಳೆದ {n} ದಿನ · {hours} ಗಂಟೆ · {late} ಬಾರಿ ತಡ'],
  'his.empty': ['No records yet. Your first clock-in will show up here.', 'अभी कोई रिकॉर्ड नहीं। आपकी पहली हाज़िरी यहाँ दिखेगी।', 'ಇನ್ನೂ ದಾಖಲೆಗಳಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಹಾಜರಿ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.'],
  'col.date': ['Date', 'तारीख़', 'ದಿನಾಂಕ'],
  'col.in': ['In', 'आए', 'ಬಂದದ್ದು'],
  'col.out': ['Out', 'गए', 'ಹೋದದ್ದು'],
  'col.hours': ['Hours', 'घंटे', 'ಗಂಟೆ'],
  'col.status': ['Status', 'स्थिति', 'ಸ್ಥಿತಿ'],
  'st.late': ['Late', 'देर', 'ತಡ'],
  'st.onTime': ['On time', 'समय पर', 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ'],

  // Crew
  'crew.title': ['Crew at {site}', '{site} की टीम', '{site} ತಂಡ'],
  'crew.site': ['Site', 'साइट', 'ಸೈಟ್'],
  'crew.noSite': [
    "You haven't been assigned to a site yet. Ask your admin to set your site on the Team page.",
    'आपको अभी कोई साइट नहीं दी गई है। एडमिन से "स्टाफ़" पेज पर साइट तय करने को कहें।',
    'ನಿಮಗೆ ಇನ್ನೂ ಸೈಟ್ ನಿಗದಿಯಾಗಿಲ್ಲ. "ಸಿಬ್ಬಂದಿ" ಪುಟದಲ್ಲಿ ಸೈಟ್ ನಿಗದಿಪಡಿಸಲು ಅಡ್ಮಿನ್‌ಗೆ ಹೇಳಿ.',
  ],
  'crew.noSites': [
    'Add a site first under Sites & QR, then add workers to it on the Team page.',
    'पहले "साइट और QR" में साइट जोड़ें, फिर "स्टाफ़" पेज पर उसमें कर्मचारी जोड़ें।',
    'ಮೊದಲು "ಸೈಟ್ ಮತ್ತು QR" ನಲ್ಲಿ ಸೈಟ್ ಸೇರಿಸಿ, ನಂತರ "ಸಿಬ್ಬಂದಿ" ಪುಟದಲ್ಲಿ ಕಾರ್ಮಿಕರನ್ನು ಸೇರಿಸಿ.',
  ],
  'crew.empty': [
    'No workers at this site yet. The admin adds them on the Team page.',
    'इस साइट पर अभी कोई कर्मचारी नहीं। एडमिन उन्हें "स्टाफ़" पेज पर जोड़ते हैं।',
    'ಈ ಸೈಟ್‌ನಲ್ಲಿ ಇನ್ನೂ ಕಾರ್ಮಿಕರಿಲ್ಲ. ಅಡ್ಮಿನ್ "ಸಿಬ್ಬಂದಿ" ಪುಟದಲ್ಲಿ ಸೇರಿಸುತ್ತಾರೆ.',
  ],
  'crew.selectNotIn': ['Select everyone not in', 'जो नहीं आए, उन्हें चुनें', 'ಬಾರದವರನ್ನು ಆಯ್ಕೆಮಾಡಿ'],
  'crew.selectOnSite': ['Select everyone on site', 'साइट पर मौजूद सभी चुनें', 'ಸೈಟ್‌ನಲ್ಲಿರುವ ಎಲ್ಲರನ್ನೂ ಆಯ್ಕೆಮಾಡಿ'],
  'crew.clear': ['Clear', 'हटाएँ', 'ತೆರವುಗೊಳಿಸಿ'],
  'crew.stats': ['{in} on site · {out} not in · {done} left', '{in} साइट पर · {out} नहीं आए · {done} चले गए', '{in} ಸೈಟ್‌ನಲ್ಲಿ · {out} ಬಂದಿಲ್ಲ · {done} ಹೊರಟಿದ್ದಾರೆ'],
  'crew.photoStep': ['Group photo', 'ग्रुप फ़ोटो', 'ಗುಂಪು ಫೋಟೋ'],
  'crew.photoHint': [
    'Get everyone you are marking in the picture.',
    'जिन्हें मार्क कर रहे हैं, उन सबको फ़ोटो में लें।',
    'ನೀವು ಗುರುತಿಸುತ್ತಿರುವ ಎಲ್ಲರನ್ನೂ ಫೋಟೋದಲ್ಲಿ ಸೇರಿಸಿ.',
  ],
  'crew.adminNote': [
    'As an admin you can mark from anywhere, and the photo is optional. These entries are labelled "manual".',
    'एडमिन होने के नाते आप कहीं से भी मार्क कर सकते हैं, फ़ोटो ज़रूरी नहीं। ये "मैनुअल" के रूप में दर्ज होंगे।',
    'ಅಡ್ಮಿನ್ ಆಗಿ ನೀವು ಎಲ್ಲಿಂದಲಾದರೂ ಗುರುತಿಸಬಹುದು, ಫೋಟೋ ಕಡ್ಡಾಯವಲ್ಲ. ಇವು "ಮ್ಯಾನುವಲ್" ಎಂದು ದಾಖಲಾಗುತ್ತವೆ.',
  ],
  'crew.markIn': ['Mark {n} in', '{n} की हाज़िरी लगाएँ', '{n} ಜನರ ಹಾಜರಿ ಹಾಕಿ'],
  'crew.markOut': ['Mark {n} out', '{n} की छुट्टी दर्ज करें', '{n} ಜನರ ಹೊರಡುವಿಕೆ ದಾಖಲಿಸಿ'],
  'crew.useQr': ['Use site QR instead of GPS', 'GPS की जगह साइट QR इस्तेमाल करें', 'GPS ಬದಲು ಸೈಟ್ QR ಬಳಸಿ'],
  'crew.marking': ['Marking…', 'दर्ज हो रहा है…', 'ದಾಖಲಾಗುತ್ತಿದೆ…'],
  'crew.result': ['{ok} of {n} marked.', '{n} में से {ok} दर्ज हुए।', '{n} ರಲ್ಲಿ {ok} ದಾಖಲಾಗಿದೆ.'],
  'crew.status.in': ['On site', 'साइट पर', 'ಸೈಟ್‌ನಲ್ಲಿ'],
  'crew.status.late': ['Late', 'देर से आए', 'ತಡವಾಗಿ ಬಂದರು'],
  'crew.status.out': ['Not in', 'नहीं आए', 'ಬಂದಿಲ್ಲ'],
  'crew.status.done': ['Left', 'चले गए', 'ಹೊರಟಿದ್ದಾರೆ'],
  'crew.noPhone': ['no phone', 'बिना फ़ोन', 'ಫೋನ್ ಇಲ್ಲ'],
  'res.ok': ['Done', 'हो गया', 'ಆಯಿತು'],
  'res.late': ['Done · late', 'हो गया · देर', 'ಆಯಿತು · ತಡ'],
  'res.already_in': ['Already in', 'पहले से हाज़िर', 'ಈಗಾಗಲೇ ಹಾಜರು'],
  'res.already_done': ['Already finished today', 'आज का काम पहले ही पूरा', 'ಇಂದು ಈಗಾಗಲೇ ಮುಗಿದಿದೆ'],
  'res.not_in': ["Wasn't clocked in", 'हाज़िरी नहीं लगी थी', 'ಹಾಜರಿ ಹಾಕಿರಲಿಲ್ಲ'],
  'res.not_allowed': ['Not on your site', 'आपकी साइट पर नहीं', 'ನಿಮ್ಮ ಸೈಟ್‌ನಲ್ಲಿಲ್ಲ'],

  // Errors (params are {0}, {1}, … from the server message)
  'err.OUTSIDE_ZONE': [
    "You're {0} m from {2}. Move within {1} m and try again, or scan the site QR code.",
    'आप {2} से {0} मी दूर हैं। {1} मी के अंदर आकर फिर कोशिश करें, या साइट का QR स्कैन करें।',
    'ನೀವು {2} ನಿಂದ {0} ಮೀ ದೂರದಲ್ಲಿದ್ದೀರಿ. {1} ಮೀ ಒಳಗೆ ಬಂದು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಸೈಟ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  ],
  'err.WEAK_GPS': [
    'Your location is only accurate to about {0} m right now. Move into the open and try again, or scan the site QR code.',
    'अभी आपकी लोकेशन सिर्फ़ लगभग {0} मी तक सटीक है। खुली जगह पर जाकर फिर कोशिश करें, या QR स्कैन करें।',
    'ಈಗ ನಿಮ್ಮ ಸ್ಥಳ ಸುಮಾರು {0} ಮೀ ವರೆಗೆ ಮಾತ್ರ ನಿಖರವಾಗಿದೆ. ತೆರೆದ ಜಾಗಕ್ಕೆ ಹೋಗಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  ],
  'err.GEO_DENIED': [
    'Ullara-Eni needs your location. Allow location for this site in your browser settings, or scan the site QR code.',
    'Ullara-Eni को आपकी लोकेशन चाहिए। ब्राउज़र सेटिंग में लोकेशन की अनुमति दें, या QR स्कैन करें।',
    'Ullara-Eni ಗೆ ನಿಮ್ಮ ಸ್ಥಳ ಬೇಕು. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಸ್ಥಳ ಅನುಮತಿ ನೀಡಿ, ಅಥವಾ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  ],
  'err.GEO_FAILED': [
    "Your phone couldn't find your location. Try again in the open, or scan the site QR code.",
    'फ़ोन आपकी लोकेशन नहीं ढूँढ पाया। खुली जगह पर फिर कोशिश करें, या QR स्कैन करें।',
    'ಫೋನ್‌ಗೆ ನಿಮ್ಮ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ತೆರೆದ ಜಾಗದಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  ],
  'err.INVALID_QR': ["That isn't today's site code. Scan the QR screen again.", 'यह आज का कोड नहीं है। QR स्क्रीन फिर से स्कैन करें।', 'ಇದು ಇಂದಿನ ಕೋಡ್ ಅಲ್ಲ. QR ಪರದೆಯನ್ನು ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'],
  'err.NO_OFFICE': [
    'Your company has not set up a site location yet. Ask your admin to add one.',
    'आपकी कंपनी ने अभी साइट लोकेशन नहीं जोड़ी। एडमिन से जोड़ने को कहें।',
    'ನಿಮ್ಮ ಕಂಪನಿ ಇನ್ನೂ ಸೈಟ್ ಸ್ಥಳ ಸೇರಿಸಿಲ್ಲ. ಅಡ್ಮಿನ್‌ಗೆ ಸೇರಿಸಲು ಹೇಳಿ.',
  ],
  'err.NEEDS_SELFIE': ['Take a selfie first, then clock in.', 'पहले सेल्फ़ी लें, फिर हाज़िरी लगाएँ।', 'ಮೊದಲು ಸೆಲ್ಫಿ ತೆಗೆಯಿರಿ, ನಂತರ ಹಾಜರಿ ಹಾಕಿ.'],
  'err.NEEDS_PHOTO': ['Take a group photo first.', 'पहले ग्रुप फ़ोटो लें।', 'ಮೊದಲು ಗುಂಪು ಫೋಟೋ ತೆಗೆಯಿರಿ.'],
  'err.NEEDS_CONSENT': ['Please read and accept the privacy notice first.', 'पहले गोपनीयता सूचना पढ़कर स्वीकार करें।', 'ಮೊದಲು ಗೌಪ್ಯತಾ ಸೂಚನೆಯನ್ನು ಓದಿ ಒಪ್ಪಿಕೊಳ್ಳಿ.'],
  'err.ALREADY_IN': ["You're already clocked in.", 'आपकी हाज़िरी पहले से लगी है।', 'ನೀವು ಈಗಾಗಲೇ ಹಾಜರಿ ಹಾಕಿದ್ದೀರಿ.'],
  'err.ALREADY_DONE': [
    "You've already completed a shift today. Ask your admin if this needs correcting.",
    'आज की शिफ़्ट पहले ही पूरी हो चुकी है। सुधार चाहिए तो एडमिन से कहें।',
    'ಇಂದಿನ ಶಿಫ್ಟ್ ಈಗಾಗಲೇ ಮುಗಿದಿದೆ. ತಿದ್ದುಪಡಿ ಬೇಕಿದ್ದರೆ ಅಡ್ಮಿನ್‌ಗೆ ಹೇಳಿ.',
  ],
  'err.NOT_IN': [
    "You're not clocked in, so there's nothing to clock out of.",
    'आपकी हाज़िरी नहीं लगी है, इसलिए छुट्टी दर्ज नहीं हो सकती।',
    'ನೀವು ಹಾಜರಿ ಹಾಕಿಲ್ಲ, ಆದ್ದರಿಂದ ಹೊರಡುವಿಕೆ ದಾಖಲಿಸಲು ಆಗದು.',
  ],
  'err.NOT_A_MEMBER': [
    'Your account is not active in a company. Ask your admin for help.',
    'आपका खाता किसी कंपनी में सक्रिय नहीं है। एडमिन से मदद लें।',
    'ನಿಮ್ಮ ಖಾತೆ ಯಾವುದೇ ಕಂಪನಿಯಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ಅಡ್ಮಿನ್ ಸಹಾಯ ಪಡೆಯಿರಿ.',
  ],
  'err.BAD_JOIN_CODE': [
    "That company code wasn't found. Check it with your admin; it's 8 letters and numbers.",
    'यह कंपनी कोड नहीं मिला। एडमिन से जाँच लें; यह 8 अक्षर और अंक का होता है।',
    'ಈ ಕಂಪನಿ ಕೋಡ್ ಸಿಗಲಿಲ್ಲ. ಅಡ್ಮಿನ್ ಬಳಿ ಪರಿಶೀಲಿಸಿ; ಇದು 8 ಅಕ್ಷರ ಮತ್ತು ಅಂಕೆಗಳದ್ದು.',
  ],
  'err.ALREADY_IN_COMPANY': ['This account already belongs to a company.', 'यह खाता पहले से एक कंपनी में है।', 'ಈ ಖಾತೆ ಈಗಾಗಲೇ ಒಂದು ಕಂಪನಿಗೆ ಸೇರಿದೆ.'],
  'err.ADMIN_ONLY': ['Only company admins can do that.', 'यह सिर्फ़ एडमिन कर सकते हैं।', 'ಇದನ್ನು ಅಡ್ಮಿನ್ ಮಾತ್ರ ಮಾಡಬಹುದು.'],
  'err.SUPERVISOR_ONLY': [
    'Only supervisors and admins can mark a crew.',
    'टीम की हाज़िरी सिर्फ़ सुपरवाइज़र और एडमिन लगा सकते हैं।',
    'ತಂಡದ ಹಾಜರಿಯನ್ನು ಸೂಪರ್‌ವೈಸರ್ ಮತ್ತು ಅಡ್ಮಿನ್ ಮಾತ್ರ ಹಾಕಬಹುದು.',
  ],
  'err.SUPERVISOR_NEEDS_SITE': ['A supervisor needs a site. Choose one first.', 'सुपरवाइज़र के लिए साइट चुनना ज़रूरी है।', 'ಸೂಪರ್‌ವೈಸರ್‌ಗೆ ಸೈಟ್ ಆಯ್ಕೆ ಕಡ್ಡಾಯ.'],
  'err.WRONG_SITE': [
    "You're at a different site from the one you supervise. Mark your crew from your own site.",
    'आप अपनी साइट पर नहीं, किसी और साइट पर हैं। अपनी साइट से टीम मार्क करें।',
    'ನೀವು ನಿಮ್ಮ ಸೈಟ್‌ನಲ್ಲಿಲ್ಲ, ಬೇರೆ ಸೈಟ್‌ನಲ್ಲಿದ್ದೀರಿ. ನಿಮ್ಮ ಸೈಟ್‌ನಿಂದಲೇ ತಂಡವನ್ನು ಗುರುತಿಸಿ.',
  ],
  'err.NOBODY_SELECTED': ['Select at least one person.', 'कम से कम एक व्यक्ति चुनें।', 'ಕನಿಷ್ಠ ಒಬ್ಬರನ್ನು ಆಯ್ಕೆಮಾಡಿ.'],
  'err.NEEDS_LOGIN': [
    'Workers without a phone can only be employees, not supervisors or admins.',
    'बिना फ़ोन वाले कर्मचारी सुपरवाइज़र या एडमिन नहीं बन सकते।',
    'ಫೋನ್ ಇಲ್ಲದ ಕಾರ್ಮಿಕರು ಸೂಪರ್‌ವೈಸರ್ ಅಥವಾ ಅಡ್ಮಿನ್ ಆಗಲು ಆಗದು.',
  ],
  'err.CANNOT_DEMOTE_SELF': [
    "You can't remove your own admin access. Ask another admin to do it.",
    'आप अपनी एडमिन पहुँच खुद नहीं हटा सकते।',
    'ನಿಮ್ಮ ಅಡ್ಮಿನ್ ಪ್ರವೇಶವನ್ನು ನೀವೇ ತೆಗೆಯಲು ಆಗದು.',
  ],
  'err.BAD_TIMES': ['Clock-out must be after clock-in.', 'छुट्टी का समय आने के समय के बाद होना चाहिए।', 'ಹೊರಡುವ ಸಮಯ ಬಂದ ಸಮಯದ ನಂತರ ಇರಬೇಕು.'],
  'err.LOGIN': [
    'That email and password do not match. Check them and try again.',
    'ईमेल और पासवर्ड मेल नहीं खाते। जाँचकर फिर कोशिश करें।',
    'ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  ],
  'err.OFFLINE': [
    "Couldn't reach Ullara-Eni's server. Check your internet connection and try again. If it keeps happening, tell your admin.",
    'Ullara-Eni के सर्वर से जुड़ नहीं पाए। इंटरनेट जाँचकर फिर कोशिश करें। बार-बार हो तो एडमिन को बताएँ।',
    'Ullara-Eni ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಆಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. ಮತ್ತೆ ಮತ್ತೆ ಆದರೆ ಅಡ್ಮಿನ್‌ಗೆ ತಿಳಿಸಿ.',
  ],
  'err.GENERIC': [
    'Something went wrong. Check your connection and try again.',
    'कुछ गड़बड़ हुई। इंटरनेट जाँचकर फिर कोशिश करें।',
    'ಏನೋ ತಪ್ಪಾಗಿದೆ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  ],
}

const KEY = 'herenow_lang'
const IDX: Record<Lang, number> = { en: 0, hi: 1, kn: 2 }

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'hi' || saved === 'kn') return saved
  } catch {
    /* storage unavailable */
  }
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('hi')) return 'hi'
  if (nav.startsWith('kn')) return 'kn'
  return 'en'
}

let current: Lang = initial()

export function has(key: string) {
  return key in D
}

/** Translate outside React (used by error messages). */
export function tr(key: string, vars?: Record<string, string | number>): string {
  const e = D[key]
  let s = e ? e[IDX[current]] || e[0] : key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: current, setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>(current)
  const setLang = useCallback((l: Lang) => {
    current = l
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l
    set(l)
  }, [])
  document.documentElement.lang = lang
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

/** Returns a translate function that re-renders the component when the language changes. */
export function useT() {
  const { lang } = useContext(Ctx)
  // `lang` is read so the returned function changes identity with the language.
  return useCallback((key: string, vars?: Record<string, string | number>) => (void lang, tr(key, vars)), [lang])
}

export function useLang() {
  return useContext(Ctx)
}

export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <select
      id="lang-switch"
      className="lang-switch"
      aria-label="Language / भाषा / ಭಾಷೆ"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  )
}
