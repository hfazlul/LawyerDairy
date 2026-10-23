class AuthCopy {
  static String loginFailed(bool en) => en ? 'Login failed' : 'লগইন ব্যর্থ';
  static String signupFailed(bool en) => en ? 'Sign-up failed' : 'সাইনআপ ব্যর্থ';
  static String notLoggedIn(bool en) => en ? 'Not signed in' : 'লগইন নেই';
  static String bypassNoDelete(bool en) =>
      en ? 'Cannot delete a local test session' : 'লোকাল টেস্ট সেশনে অ্যাকাউন্ট মুছা যায় না';
  static String deleteFailed(bool en) => en ? 'Could not delete' : 'মুছা যায়নি';
  static String restoreFailed(bool en) => en ? 'Could not restore' : 'পুনরুদ্ধার হয়নি';
  static String localTestName(bool en) => en ? 'Local test' : 'লোকাল টেস্ট';
  static String myDiary(bool en) => en ? 'My Diary' : 'আমার ডায়েরি';
}
