import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en')
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'MAMLAQ – Lawyer Diary'**
  String get appTitle;

  /// No description provided for @hubBrandTitle.
  ///
  /// In en, this message translates to:
  /// **'MAMLAQ – Lawyer Diary'**
  String get hubBrandTitle;

  /// No description provided for @hubTagline.
  ///
  /// In en, this message translates to:
  /// **'Everything in one: Lawyer Diary, Find a Lawyer, Legal Career'**
  String get hubTagline;

  /// No description provided for @hubDiaryTitle.
  ///
  /// In en, this message translates to:
  /// **'Lawyer Diary'**
  String get hubDiaryTitle;

  /// No description provided for @hubDiarySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Today’s hearings, cases, clients — everything. Works without internet.'**
  String get hubDiarySubtitle;

  /// No description provided for @hubFindTitle.
  ///
  /// In en, this message translates to:
  /// **'Find a lawyer'**
  String get hubFindTitle;

  /// No description provided for @hubFindSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Contact a lawyer in any district directly'**
  String get hubFindSubtitle;

  /// No description provided for @hubCareerTitle.
  ///
  /// In en, this message translates to:
  /// **'Legal Career Hub'**
  String get hubCareerTitle;

  /// No description provided for @hubCareerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Bar Council · BJS'**
  String get hubCareerSubtitle;

  /// No description provided for @loginPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Username or mobile + password. No OTP.'**
  String get loginPasswordHint;

  /// No description provided for @emptyNothing.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet'**
  String get emptyNothing;

  /// No description provided for @syncNow.
  ///
  /// In en, this message translates to:
  /// **'Sync now'**
  String get syncNow;

  /// No description provided for @officialCauselist.
  ///
  /// In en, this message translates to:
  /// **'Open official e-Causelist'**
  String get officialCauselist;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navClients.
  ///
  /// In en, this message translates to:
  /// **'Clients'**
  String get navClients;

  /// No description provided for @navCases.
  ///
  /// In en, this message translates to:
  /// **'Cases'**
  String get navCases;

  /// No description provided for @navLawDaily.
  ///
  /// In en, this message translates to:
  /// **'Law Daily'**
  String get navLawDaily;

  /// No description provided for @navTools.
  ///
  /// In en, this message translates to:
  /// **'Tools'**
  String get navTools;

  /// No description provided for @searchNameOrPhone.
  ///
  /// In en, this message translates to:
  /// **'Find client'**
  String get searchNameOrPhone;

  /// No description provided for @clientSearchTitle.
  ///
  /// In en, this message translates to:
  /// **'Search clients'**
  String get clientSearchTitle;

  /// No description provided for @allCases.
  ///
  /// In en, this message translates to:
  /// **'All cases'**
  String get allCases;

  /// No description provided for @clientIncompleteBanner.
  ///
  /// In en, this message translates to:
  /// **'Client details are incomplete — please finish the form'**
  String get clientIncompleteBanner;

  /// No description provided for @partiesLabel.
  ///
  /// In en, this message translates to:
  /// **'Parties (client vs opposite)'**
  String get partiesLabel;

  /// No description provided for @diaryHeaderTitle.
  ///
  /// In en, this message translates to:
  /// **'My Diary'**
  String get diaryHeaderTitle;

  /// No description provided for @menuTooltip.
  ///
  /// In en, this message translates to:
  /// **'Menu'**
  String get menuTooltip;

  /// No description provided for @backTooltip.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get backTooltip;

  /// No description provided for @hubBackTooltip.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get hubBackTooltip;

  /// No description provided for @notifTooltip.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifTooltip;

  /// No description provided for @darkModeTooltip.
  ///
  /// In en, this message translates to:
  /// **'Dark mode'**
  String get darkModeTooltip;

  /// No description provided for @lightModeTooltip.
  ///
  /// In en, this message translates to:
  /// **'Light mode'**
  String get lightModeTooltip;

  /// No description provided for @drawerTitle.
  ///
  /// In en, this message translates to:
  /// **'Diary'**
  String get drawerTitle;

  /// No description provided for @drawerAppointments.
  ///
  /// In en, this message translates to:
  /// **'Client appointments'**
  String get drawerAppointments;

  /// No description provided for @drawerGuide.
  ///
  /// In en, this message translates to:
  /// **'Video guide'**
  String get drawerGuide;

  /// No description provided for @drawerReferral.
  ///
  /// In en, this message translates to:
  /// **'Referral program'**
  String get drawerReferral;

  /// No description provided for @drawerMessaging.
  ///
  /// In en, this message translates to:
  /// **'Auto messaging'**
  String get drawerMessaging;

  /// No description provided for @drawerPremium.
  ///
  /// In en, this message translates to:
  /// **'Premium'**
  String get drawerPremium;

  /// No description provided for @drawerTeam.
  ///
  /// In en, this message translates to:
  /// **'Chamber/Team'**
  String get drawerTeam;

  /// No description provided for @drawerDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get drawerDashboard;

  /// No description provided for @drawerProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get drawerProfile;

  /// No description provided for @drawerLanguage.
  ///
  /// In en, this message translates to:
  /// **'বাংলা | English'**
  String get drawerLanguage;

  /// No description provided for @drawerShare.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get drawerShare;

  /// No description provided for @drawerRating.
  ///
  /// In en, this message translates to:
  /// **'Rating'**
  String get drawerRating;

  /// No description provided for @drawerSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get drawerSettings;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @settingsMasterNotif.
  ///
  /// In en, this message translates to:
  /// **'All notifications / alarms'**
  String get settingsMasterNotif;

  /// No description provided for @settingsMasterNotifSub.
  ///
  /// In en, this message translates to:
  /// **'Off also stops OS, FCM, and auto SMS'**
  String get settingsMasterNotifSub;

  /// No description provided for @settingsTerms.
  ///
  /// In en, this message translates to:
  /// **'Terms'**
  String get settingsTerms;

  /// No description provided for @settingsPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get settingsPrivacy;

  /// No description provided for @settingsBackup.
  ///
  /// In en, this message translates to:
  /// **'Backup / Store'**
  String get settingsBackup;

  /// No description provided for @settingsContact.
  ///
  /// In en, this message translates to:
  /// **'Contact us'**
  String get settingsContact;

  /// No description provided for @premiumTitle.
  ///
  /// In en, this message translates to:
  /// **'Premium subscription'**
  String get premiumTitle;

  /// No description provided for @premiumInactive.
  ///
  /// In en, this message translates to:
  /// **'Premium inactive'**
  String get premiumInactive;

  /// No description provided for @premiumActive.
  ///
  /// In en, this message translates to:
  /// **'Premium active'**
  String get premiumActive;

  /// No description provided for @premiumNoBuy.
  ///
  /// In en, this message translates to:
  /// **'Purchases are not available in this app. Status and benefits only.'**
  String get premiumNoBuy;

  /// No description provided for @premiumPayOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Pay on the website'**
  String get premiumPayOnWeb;

  /// No description provided for @premiumPayHelp.
  ///
  /// In en, this message translates to:
  /// **'Payment help: visit the website. Support WhatsApp is in Contact us — no wallet account numbers in this app.'**
  String get premiumPayHelp;

  /// No description provided for @referralTitle.
  ///
  /// In en, this message translates to:
  /// **'Referral program'**
  String get referralTitle;

  /// No description provided for @referralGenerate.
  ///
  /// In en, this message translates to:
  /// **'Your code'**
  String get referralGenerate;

  /// No description provided for @referralPaste.
  ///
  /// In en, this message translates to:
  /// **'Paste a friend’s code'**
  String get referralPaste;

  /// No description provided for @referralShare.
  ///
  /// In en, this message translates to:
  /// **'Share on WhatsApp'**
  String get referralShare;

  /// No description provided for @referralRules.
  ///
  /// In en, this message translates to:
  /// **'Rewards after the referred person installs and creates an account: 1 → 1 month Starter; 3 → 2 months; 5 → 3 months; 10 → 12 months.'**
  String get referralRules;

  /// No description provided for @guideTitle.
  ///
  /// In en, this message translates to:
  /// **'Video guide'**
  String get guideTitle;

  /// No description provided for @guideNotPublished.
  ///
  /// In en, this message translates to:
  /// **'Video is not published yet'**
  String get guideNotPublished;

  /// No description provided for @guidePart1.
  ///
  /// In en, this message translates to:
  /// **'1 · Features and turning on premium'**
  String get guidePart1;

  /// No description provided for @guidePart2.
  ///
  /// In en, this message translates to:
  /// **'2 · How to use (A)'**
  String get guidePart2;

  /// No description provided for @guidePart3.
  ///
  /// In en, this message translates to:
  /// **'3 · How to use (B)'**
  String get guidePart3;

  /// No description provided for @guidePromoGeneric.
  ///
  /// In en, this message translates to:
  /// **'Assalamu alaikum. A short guide to using the app will appear here.'**
  String get guidePromoGeneric;

  /// No description provided for @messagingTitle.
  ///
  /// In en, this message translates to:
  /// **'Auto messaging'**
  String get messagingTitle;

  /// No description provided for @messagingShellHint.
  ///
  /// In en, this message translates to:
  /// **'Client SMS one day before hearing (D-1) is full auto. Master alarm off also stops SMS.'**
  String get messagingShellHint;

  /// No description provided for @appointmentsTitle.
  ///
  /// In en, this message translates to:
  /// **'Client appointments'**
  String get appointmentsTitle;

  /// No description provided for @appointmentsEmpty.
  ///
  /// In en, this message translates to:
  /// **'No client has messaged you for an appointment yet'**
  String get appointmentsEmpty;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// No description provided for @profilePasswordHidden.
  ///
  /// In en, this message translates to:
  /// **'••••••••'**
  String get profilePasswordHidden;

  /// No description provided for @profileLogout.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get profileLogout;

  /// No description provided for @dashboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboardTitle;

  /// No description provided for @dashboardPrintCard.
  ///
  /// In en, this message translates to:
  /// **'Monthly / weekly diary print'**
  String get dashboardPrintCard;

  /// No description provided for @termsStub.
  ///
  /// In en, this message translates to:
  /// **'Terms of use will be published here.'**
  String get termsStub;

  /// No description provided for @contactEmpty.
  ///
  /// In en, this message translates to:
  /// **'Contact details are not set yet'**
  String get contactEmpty;

  /// No description provided for @backupHonest.
  ///
  /// In en, this message translates to:
  /// **'While logged in, data syncs over the network. After uninstall, log in again. JSON export available.'**
  String get backupHonest;

  /// No description provided for @enableNotifFromSettings.
  ///
  /// In en, this message translates to:
  /// **'Turn on notifications in Settings'**
  String get enableNotifFromSettings;

  /// No description provided for @switchWorkspace.
  ///
  /// In en, this message translates to:
  /// **'Switch workspace'**
  String get switchWorkspace;

  /// No description provided for @inboxTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get inboxTitle;

  /// No description provided for @dashSummarySection.
  ///
  /// In en, this message translates to:
  /// **'Summary'**
  String get dashSummarySection;

  /// No description provided for @dashClientsSection.
  ///
  /// In en, this message translates to:
  /// **'Clients'**
  String get dashClientsSection;

  /// No description provided for @dashCollected.
  ///
  /// In en, this message translates to:
  /// **'Collected'**
  String get dashCollected;

  /// No description provided for @dashDue.
  ///
  /// In en, this message translates to:
  /// **'Due'**
  String get dashDue;

  /// No description provided for @dashExpense.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get dashExpense;

  /// No description provided for @dashNet.
  ///
  /// In en, this message translates to:
  /// **'Net'**
  String get dashNet;

  /// No description provided for @dashPersonal.
  ///
  /// In en, this message translates to:
  /// **'Personal expenses'**
  String get dashPersonal;

  /// No description provided for @dashAddExpense.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get dashAddExpense;

  /// No description provided for @dashThisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get dashThisMonth;

  /// No description provided for @dashClientQty.
  ///
  /// In en, this message translates to:
  /// **'Client count'**
  String get dashClientQty;

  /// No description provided for @dashPaidCount.
  ///
  /// In en, this message translates to:
  /// **'Paid in full'**
  String get dashPaidCount;

  /// No description provided for @dashUnpaidCount.
  ///
  /// In en, this message translates to:
  /// **'With dues'**
  String get dashUnpaidCount;

  /// No description provided for @dashCaseCount.
  ///
  /// In en, this message translates to:
  /// **'Cases'**
  String get dashCaseCount;

  /// No description provided for @dashNoClients.
  ///
  /// In en, this message translates to:
  /// **'No clients yet'**
  String get dashNoClients;

  /// No description provided for @dashNoCases.
  ///
  /// In en, this message translates to:
  /// **'No cases yet'**
  String get dashNoCases;

  /// No description provided for @dashNoPersonal.
  ///
  /// In en, this message translates to:
  /// **'No personal expenses this month'**
  String get dashNoPersonal;

  /// No description provided for @dashExpenseHint.
  ///
  /// In en, this message translates to:
  /// **'Add daily / weekly / monthly with +.'**
  String get dashExpenseHint;

  /// No description provided for @dashJuniorBlocked.
  ///
  /// In en, this message translates to:
  /// **'This page is for the chamber owner.'**
  String get dashJuniorBlocked;

  /// No description provided for @dashAdd.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get dashAdd;

  /// No description provided for @dashAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'৳'**
  String get dashAmountLabel;

  /// No description provided for @dashExpOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get dashExpOther;

  /// No description provided for @dashExpVehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get dashExpVehicle;

  /// No description provided for @dashExpStamp.
  ///
  /// In en, this message translates to:
  /// **'Stamp'**
  String get dashExpStamp;

  /// No description provided for @dashExpCourt.
  ///
  /// In en, this message translates to:
  /// **'Court fee'**
  String get dashExpCourt;

  /// No description provided for @dashExpTamadi.
  ///
  /// In en, this message translates to:
  /// **'Limitation cost'**
  String get dashExpTamadi;

  /// No description provided for @dashExpSub.
  ///
  /// In en, this message translates to:
  /// **'Subscription'**
  String get dashExpSub;

  /// No description provided for @dashPeriodDaily.
  ///
  /// In en, this message translates to:
  /// **'Daily'**
  String get dashPeriodDaily;

  /// No description provided for @dashPeriodWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get dashPeriodWeekly;

  /// No description provided for @dashPeriodMonthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get dashPeriodMonthly;

  /// No description provided for @teamJoinCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Join with code'**
  String get teamJoinCodeLabel;

  /// No description provided for @teamJoinCodeHint.
  ///
  /// In en, this message translates to:
  /// **'Chamber code (6–8 characters)'**
  String get teamJoinCodeHint;

  /// No description provided for @teamJoinSubmit.
  ///
  /// In en, this message translates to:
  /// **'Request to join'**
  String get teamJoinSubmit;

  /// No description provided for @teamJoinBlocked.
  ///
  /// In en, this message translates to:
  /// **'Server does not accept join codes yet. Use an invite token.'**
  String get teamJoinBlocked;

  /// No description provided for @teamJoinSent.
  ///
  /// In en, this message translates to:
  /// **'Request sent. Wait for the owner to accept.'**
  String get teamJoinSent;

  /// No description provided for @teamJoinFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not send the request.'**
  String get teamJoinFailed;

  /// No description provided for @teamPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Join requests'**
  String get teamPendingTitle;

  /// No description provided for @teamPendingEmpty.
  ///
  /// In en, this message translates to:
  /// **'No pending requests.'**
  String get teamPendingEmpty;

  /// No description provided for @teamPendingBlocked.
  ///
  /// In en, this message translates to:
  /// **'Request list API is not on the server yet.'**
  String get teamPendingBlocked;

  /// No description provided for @teamAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get teamAccept;

  /// No description provided for @teamReject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get teamReject;

  /// No description provided for @teamAcceptBlocked.
  ///
  /// In en, this message translates to:
  /// **'Accept API is not available — not accepted.'**
  String get teamAcceptBlocked;

  /// No description provided for @teamInviteFallback.
  ///
  /// In en, this message translates to:
  /// **'Invite by phone (token fallback)'**
  String get teamInviteFallback;

  /// No description provided for @teamInvitePhone.
  ///
  /// In en, this message translates to:
  /// **'Invite phone (no OTP)'**
  String get teamInvitePhone;

  /// No description provided for @teamInviteToken.
  ///
  /// In en, this message translates to:
  /// **'Invite token'**
  String get teamInviteToken;

  /// No description provided for @teamSendInvite.
  ///
  /// In en, this message translates to:
  /// **'Send invite'**
  String get teamSendInvite;

  /// No description provided for @teamAcceptToken.
  ///
  /// In en, this message translates to:
  /// **'Invite token'**
  String get teamAcceptToken;

  /// No description provided for @teamAcceptTokenBtn.
  ///
  /// In en, this message translates to:
  /// **'Join with token'**
  String get teamAcceptTokenBtn;

  /// No description provided for @teamCreateChamber.
  ///
  /// In en, this message translates to:
  /// **'Create chamber'**
  String get teamCreateChamber;

  /// No description provided for @teamChamberName.
  ///
  /// In en, this message translates to:
  /// **'New chamber name'**
  String get teamChamberName;

  /// No description provided for @teamChamberCreated.
  ///
  /// In en, this message translates to:
  /// **'Chamber created — you can also switch from the selector'**
  String get teamChamberCreated;

  /// No description provided for @teamMembers.
  ///
  /// In en, this message translates to:
  /// **'Members'**
  String get teamMembers;

  /// No description provided for @teamActivity.
  ///
  /// In en, this message translates to:
  /// **'Activity log'**
  String get teamActivity;

  /// No description provided for @teamDigest.
  ///
  /// In en, this message translates to:
  /// **'Weekly digest'**
  String get teamDigest;

  /// No description provided for @teamLoadFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not load team'**
  String get teamLoadFailed;

  /// No description provided for @teamSeatsHint.
  ///
  /// In en, this message translates to:
  /// **'Seats besides owner'**
  String get teamSeatsHint;

  /// No description provided for @teamJoined.
  ///
  /// In en, this message translates to:
  /// **'Joined the team'**
  String get teamJoined;

  /// No description provided for @filePreviewMissing.
  ///
  /// In en, this message translates to:
  /// **'No file path'**
  String get filePreviewMissing;

  /// No description provided for @filePreviewUnreadable.
  ///
  /// In en, this message translates to:
  /// **'Could not open file'**
  String get filePreviewUnreadable;

  /// No description provided for @filePreviewNoRender.
  ///
  /// In en, this message translates to:
  /// **'No in-app render — share or open in another app.'**
  String get filePreviewNoRender;

  /// No description provided for @fileOpenShare.
  ///
  /// In en, this message translates to:
  /// **'Open / Share'**
  String get fileOpenShare;

  /// No description provided for @filePreviewEmptyDocs.
  ///
  /// In en, this message translates to:
  /// **'No files yet'**
  String get filePreviewEmptyDocs;

  /// No description provided for @teamGenerateCode.
  ///
  /// In en, this message translates to:
  /// **'Generate chamber code'**
  String get teamGenerateCode;

  /// No description provided for @teamYourCode.
  ///
  /// In en, this message translates to:
  /// **'Your code'**
  String get teamYourCode;

  /// No description provided for @teamJuniorPreset.
  ///
  /// In en, this message translates to:
  /// **'Junior preset (Home/Clients/Cases)'**
  String get teamJuniorPreset;

  /// No description provided for @teamJoinFirebaseHint.
  ///
  /// In en, this message translates to:
  /// **'Same screen on every phone: generate a code or paste one to request. Owner Accept/Reject here (Spark Firestore). Cases/clients stay on each phone until webapp sync.'**
  String get teamJoinFirebaseHint;

  /// No description provided for @teamCodeCopied.
  ///
  /// In en, this message translates to:
  /// **'Code copied'**
  String get teamCodeCopied;

  /// No description provided for @teamConnectedTo.
  ///
  /// In en, this message translates to:
  /// **'Connected to {name}'**
  String teamConnectedTo(String name);

  /// No description provided for @teamShareLater.
  ///
  /// In en, this message translates to:
  /// **'Cases and clients still stay on each phone until webapp sync.'**
  String get teamShareLater;

  /// No description provided for @teamWaitingOwner.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the owner to accept.'**
  String get teamWaitingOwner;

  /// No description provided for @teamRequestRejected.
  ///
  /// In en, this message translates to:
  /// **'The owner declined this request.'**
  String get teamRequestRejected;

  /// No description provided for @teamPendingWithCount.
  ///
  /// In en, this message translates to:
  /// **'Join requests ({count})'**
  String teamPendingWithCount(int count);

  /// No description provided for @messagingQuotaUnknown.
  ///
  /// In en, this message translates to:
  /// **'Credits: — (local count if server is down)'**
  String get messagingQuotaUnknown;

  /// No description provided for @messagingAutoBody.
  ///
  /// In en, this message translates to:
  /// **'Default D-1 full auto — no per-send confirm. Device sends when gateway is in Remote Config/.env.'**
  String get messagingAutoBody;

  /// No description provided for @forgotPhoneTab.
  ///
  /// In en, this message translates to:
  /// **'Phone OTP'**
  String get forgotPhoneTab;

  /// No description provided for @forgotEmailTab.
  ///
  /// In en, this message translates to:
  /// **'Email link'**
  String get forgotEmailTab;

  /// No description provided for @forgotSendOtp.
  ///
  /// In en, this message translates to:
  /// **'Send OTP'**
  String get forgotSendOtp;

  /// No description provided for @forgotOtpLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get forgotOtpLabel;

  /// No description provided for @forgotNewPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get forgotNewPassword;

  /// No description provided for @forgotConfirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get forgotConfirmPassword;

  /// No description provided for @forgotReset.
  ///
  /// In en, this message translates to:
  /// **'Set password'**
  String get forgotReset;

  /// No description provided for @forgotBlockedWebapp.
  ///
  /// In en, this message translates to:
  /// **'Server does not verify OTP — password unchanged. Use the email link.'**
  String get forgotBlockedWebapp;

  /// No description provided for @appointmentsCached.
  ///
  /// In en, this message translates to:
  /// **'Offline — last cache'**
  String get appointmentsCached;

  /// No description provided for @guideUrlPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Video URLs are empty (Firebase/admin later)'**
  String get guideUrlPlaceholder;

  /// No description provided for @commManualOnly.
  ///
  /// In en, this message translates to:
  /// **'Manual send only. D-1 auto is on Auto Messaging — no per-send confirm.'**
  String get commManualOnly;

  /// No description provided for @termsBody.
  ///
  /// In en, this message translates to:
  /// **'MAMLAQ – Lawyer Diary is a personal practice diary, not legal advice. While logged in, cases and clients sync over the network. This APK cannot buy plans. Find Lawyer Contact shares both parties’ phone numbers. Documents stay on the device. Camera is used only to scan files. Professional confidentiality remains yours.'**
  String get termsBody;

  /// No description provided for @privacyBody.
  ///
  /// In en, this message translates to:
  /// **'Login: username/phone + password (no OTP). Cases and clients live in on-device SQLite; sync uses TLS. v1 documents are local files. Find Lawyer Contact shares phones both ways; public cards hide phone. CAMERA (scan) and RECORD_AUDIO (voice notes) are declared. No ads SDK. Data is not sold. Uninstall means log in again.'**
  String get privacyBody;

  /// No description provided for @privacyOpenHosted.
  ///
  /// In en, this message translates to:
  /// **'Open hosted policy (if a URL exists)'**
  String get privacyOpenHosted;

  /// No description provided for @privacyHostedMissing.
  ///
  /// In en, this message translates to:
  /// **'No hosted URL is set'**
  String get privacyHostedMissing;

  /// No description provided for @contactShareHint.
  ///
  /// In en, this message translates to:
  /// **'Write a message and email/share it. If the owner adds a Play listing number, it will appear here too.'**
  String get contactShareHint;

  /// No description provided for @contactMessageHint.
  ///
  /// In en, this message translates to:
  /// **'Your message'**
  String get contactMessageHint;

  /// No description provided for @contactSend.
  ///
  /// In en, this message translates to:
  /// **'Send message'**
  String get contactSend;

  /// No description provided for @backupWifiOnly.
  ///
  /// In en, this message translates to:
  /// **'Sync files on Wi-Fi only'**
  String get backupWifiOnly;

  /// No description provided for @backupExportJson.
  ///
  /// In en, this message translates to:
  /// **'Export JSON'**
  String get backupExportJson;

  /// No description provided for @backupSyncDone.
  ///
  /// In en, this message translates to:
  /// **'Sync finished'**
  String get backupSyncDone;

  /// No description provided for @settingsOemNote.
  ///
  /// In en, this message translates to:
  /// **'OEM battery/force-stop settings can delay notifications.'**
  String get settingsOemNote;

  /// No description provided for @notifRationaleTitle.
  ///
  /// In en, this message translates to:
  /// **'Hearing notifications'**
  String get notifRationaleTitle;

  /// No description provided for @notifRationaleBody.
  ///
  /// In en, this message translates to:
  /// **'Allow notifications for today’s and tomorrow’s hearings, missing files, and premium expiry. You can turn this off later in Settings.'**
  String get notifRationaleBody;

  /// No description provided for @notifRationaleAllow.
  ///
  /// In en, this message translates to:
  /// **'Turn on'**
  String get notifRationaleAllow;

  /// No description provided for @notifRationaleLater.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get notifRationaleLater;

  /// No description provided for @emptyHearingsTitle.
  ///
  /// In en, this message translates to:
  /// **'No hearings on this date'**
  String get emptyHearingsTitle;

  /// No description provided for @emptyHearingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Pick another date on the calendar, or add a case from the Cases tab.'**
  String get emptyHearingsSubtitle;

  /// No description provided for @emptyClientsTitle.
  ///
  /// In en, this message translates to:
  /// **'No clients yet'**
  String get emptyClientsTitle;

  /// No description provided for @emptyClientsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Tap the green +. Add a name, type and mobile for the first client.'**
  String get emptyClientsSubtitle;

  /// No description provided for @emptyCasesTitle.
  ///
  /// In en, this message translates to:
  /// **'No cases yet'**
  String get emptyCasesTitle;

  /// No description provided for @emptyCasesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Tap the green +. Add a court, case number and client for the first case.'**
  String get emptyCasesSubtitle;

  /// No description provided for @findDistrictLabel.
  ///
  /// In en, this message translates to:
  /// **'District'**
  String get findDistrictLabel;

  /// No description provided for @findPracticeLabel.
  ///
  /// In en, this message translates to:
  /// **'Case type'**
  String get findPracticeLabel;

  /// No description provided for @findAllDistricts.
  ///
  /// In en, this message translates to:
  /// **'All districts'**
  String get findAllDistricts;

  /// No description provided for @findAllPractice.
  ///
  /// In en, this message translates to:
  /// **'All types'**
  String get findAllPractice;

  /// No description provided for @findSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name'**
  String get findSearchHint;

  /// No description provided for @findExpMin.
  ///
  /// In en, this message translates to:
  /// **'Minimum experience (years)'**
  String get findExpMin;

  /// No description provided for @clientIncompleteInbox.
  ///
  /// In en, this message translates to:
  /// **'{name} — open the client page and finish the details'**
  String clientIncompleteInbox(String name);

  /// No description provided for @homeHearingsToday.
  ///
  /// In en, this message translates to:
  /// **'Today’s hearings'**
  String get homeHearingsToday;

  /// No description provided for @homeHearingsTomorrow.
  ///
  /// In en, this message translates to:
  /// **'Tomorrow’s hearings'**
  String get homeHearingsTomorrow;

  /// No description provided for @homeCauseList.
  ///
  /// In en, this message translates to:
  /// **'Cause list'**
  String get homeCauseList;

  /// No description provided for @homeLastOutcome.
  ///
  /// In en, this message translates to:
  /// **'Last outcome: {value}'**
  String homeLastOutcome(String value);

  /// No description provided for @homePremiumNearExpiry.
  ///
  /// In en, this message translates to:
  /// **'Premium is close to expiry. Open the subscription page to see benefits.'**
  String get homePremiumNearExpiry;

  /// No description provided for @homeUpdateRequiredTitle.
  ///
  /// In en, this message translates to:
  /// **'Update required'**
  String get homeUpdateRequiredTitle;

  /// No description provided for @homeUpdateRequiredBody.
  ///
  /// In en, this message translates to:
  /// **'This version is no longer supported. Get the new version from Play Store.'**
  String get homeUpdateRequiredBody;

  /// No description provided for @homeUpdateOk.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get homeUpdateOk;

  /// No description provided for @guidePromptTitle.
  ///
  /// In en, this message translates to:
  /// **'Guide video'**
  String get guidePromptTitle;

  /// No description provided for @guidePromptBody.
  ///
  /// In en, this message translates to:
  /// **'Watch a short video on using the app?'**
  String get guidePromptBody;

  /// No description provided for @guidePromptLater.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get guidePromptLater;

  /// No description provided for @guidePromptWatch.
  ///
  /// In en, this message translates to:
  /// **'Watch'**
  String get guidePromptWatch;

  /// No description provided for @homeChecklistTrack.
  ///
  /// In en, this message translates to:
  /// **'Track case follow-ups here'**
  String get homeChecklistTrack;

  /// No description provided for @homeChecklistPrep.
  ///
  /// In en, this message translates to:
  /// **'Prepare for the hearing'**
  String get homeChecklistPrep;

  /// No description provided for @newClientTooltip.
  ///
  /// In en, this message translates to:
  /// **'New client'**
  String get newClientTooltip;

  /// No description provided for @newCaseTooltip.
  ///
  /// In en, this message translates to:
  /// **'New case'**
  String get newCaseTooltip;

  /// No description provided for @clientSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Find client'**
  String get clientSearchHint;

  /// No description provided for @caseSearchTitle.
  ///
  /// In en, this message translates to:
  /// **'Search cases'**
  String get caseSearchTitle;

  /// No description provided for @caseSearchHint.
  ///
  /// In en, this message translates to:
  /// **'client, phone, file, case no'**
  String get caseSearchHint;

  /// No description provided for @caseSearchHelp.
  ///
  /// In en, this message translates to:
  /// **'Find client to print every case for one client. You can also print/share a single case or a date.'**
  String get caseSearchHelp;

  /// No description provided for @caseGroupByDate.
  ///
  /// In en, this message translates to:
  /// **'By date'**
  String get caseGroupByDate;

  /// No description provided for @caseUngrouped.
  ///
  /// In en, this message translates to:
  /// **'All together'**
  String get caseUngrouped;

  /// No description provided for @caseMine.
  ///
  /// In en, this message translates to:
  /// **'My cases'**
  String get caseMine;

  /// No description provided for @caseChamber.
  ///
  /// In en, this message translates to:
  /// **'Chamber cases'**
  String get caseChamber;

  /// No description provided for @docsTitle.
  ///
  /// In en, this message translates to:
  /// **'Files'**
  String get docsTitle;

  /// No description provided for @docsScanPdf.
  ///
  /// In en, this message translates to:
  /// **'Scan PDF'**
  String get docsScanPdf;

  /// No description provided for @docsUploadFile.
  ///
  /// In en, this message translates to:
  /// **'Upload file'**
  String get docsUploadFile;

  /// No description provided for @docsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No files yet'**
  String get docsEmptyTitle;

  /// No description provided for @docsEmptySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Scan a PDF or upload a file to add evidence.'**
  String get docsEmptySubtitle;

  /// No description provided for @docsAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get docsAll;

  /// No description provided for @fileOpenWith.
  ///
  /// In en, this message translates to:
  /// **'Open with…'**
  String get fileOpenWith;

  /// No description provided for @fileOfficeUnsupported.
  ///
  /// In en, this message translates to:
  /// **'Word/Excel cannot be previewed here. Open with another app, or share.'**
  String get fileOfficeUnsupported;

  /// No description provided for @fileOpenFailed.
  ///
  /// In en, this message translates to:
  /// **'No app found for this file. Try Share.'**
  String get fileOpenFailed;

  /// No description provided for @guidePlay.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get guidePlay;

  /// No description provided for @guidePrev.
  ///
  /// In en, this message translates to:
  /// **'Previous'**
  String get guidePrev;

  /// No description provided for @guideNextPart.
  ///
  /// In en, this message translates to:
  /// **'Next part'**
  String get guideNextPart;

  /// No description provided for @guidePasteUrl.
  ///
  /// In en, this message translates to:
  /// **'Set URL'**
  String get guidePasteUrl;

  /// No description provided for @guidePasteHint.
  ///
  /// In en, this message translates to:
  /// **'https://… (this phone only)'**
  String get guidePasteHint;

  /// No description provided for @guideUrlSaved.
  ///
  /// In en, this message translates to:
  /// **'URL saved on this phone'**
  String get guideUrlSaved;

  /// No description provided for @guideUrlInvalid.
  ///
  /// In en, this message translates to:
  /// **'Need an http(s) URL'**
  String get guideUrlInvalid;

  /// No description provided for @guideEmptyBody.
  ///
  /// In en, this message translates to:
  /// **'No published video yet. When Remote Config or you set a URL, it is saved on this phone.'**
  String get guideEmptyBody;

  /// No description provided for @apptMobile.
  ///
  /// In en, this message translates to:
  /// **'Mobile'**
  String get apptMobile;

  /// No description provided for @apptEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get apptEmail;

  /// No description provided for @apptMessage.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get apptMessage;

  /// No description provided for @apptRead.
  ///
  /// In en, this message translates to:
  /// **'Read'**
  String get apptRead;

  /// No description provided for @apptUnread.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get apptUnread;

  /// No description provided for @apptDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get apptDelete;

  /// No description provided for @apptEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get apptEdit;

  /// No description provided for @apptEditLocal.
  ///
  /// In en, this message translates to:
  /// **'Edit (on this phone)'**
  String get apptEditLocal;

  /// No description provided for @commonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get commonCancel;

  /// No description provided for @commonSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get commonSave;

  /// No description provided for @teamPermTitle.
  ///
  /// In en, this message translates to:
  /// **'Role and permissions'**
  String get teamPermTitle;

  /// No description provided for @teamPermSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get teamPermSave;

  /// No description provided for @teamPermSuspend.
  ///
  /// In en, this message translates to:
  /// **'Suspend'**
  String get teamPermSuspend;

  /// No description provided for @teamJuniorHint.
  ///
  /// In en, this message translates to:
  /// **'Junior can use Home (cause-list + print), Clients and Cases (read/write). Fees, reports and team admin stay with the owner.'**
  String get teamJuniorHint;

  /// No description provided for @commTitle.
  ///
  /// In en, this message translates to:
  /// **'Messaging'**
  String get commTitle;

  /// No description provided for @commCreditsLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading credits…'**
  String get commCreditsLoading;

  /// No description provided for @commBuyOnWeb.
  ///
  /// In en, this message translates to:
  /// **'Hearing SMS is included on Pro+ (150/280/400 per month). No ৳399 SMS pack. Pay on the website.'**
  String get commBuyOnWeb;

  /// No description provided for @commWhatsApp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp (does not use credits)'**
  String get commWhatsApp;

  /// No description provided for @commMobile.
  ///
  /// In en, this message translates to:
  /// **'Mobile'**
  String get commMobile;

  /// No description provided for @commSmsBody.
  ///
  /// In en, this message translates to:
  /// **'SMS body'**
  String get commSmsBody;

  /// No description provided for @commSendSms.
  ///
  /// In en, this message translates to:
  /// **'Send SMS (uses credits)'**
  String get commSendSms;

  /// No description provided for @commBulkSms.
  ///
  /// In en, this message translates to:
  /// **'Bulk SMS (this body · credit check)'**
  String get commBulkSms;

  /// No description provided for @toolsTitle.
  ///
  /// In en, this message translates to:
  /// **'Tools'**
  String get toolsTitle;

  /// No description provided for @toolsTabCalc.
  ///
  /// In en, this message translates to:
  /// **'Calculators'**
  String get toolsTabCalc;

  /// No description provided for @toolsTabForms.
  ///
  /// In en, this message translates to:
  /// **'Legal forms & drafts'**
  String get toolsTabForms;

  /// No description provided for @toolsSecCourt.
  ///
  /// In en, this message translates to:
  /// **'Court'**
  String get toolsSecCourt;

  /// No description provided for @toolsSecLand.
  ///
  /// In en, this message translates to:
  /// **'Land'**
  String get toolsSecLand;

  /// No description provided for @toolsSecTax.
  ///
  /// In en, this message translates to:
  /// **'Tax'**
  String get toolsSecTax;

  /// No description provided for @toolsSecGeneral.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get toolsSecGeneral;

  /// No description provided for @toolLimitation.
  ///
  /// In en, this message translates to:
  /// **'Limitation'**
  String get toolLimitation;

  /// No description provided for @toolCourtFee.
  ///
  /// In en, this message translates to:
  /// **'Court fee'**
  String get toolCourtFee;

  /// No description provided for @toolInterest.
  ///
  /// In en, this message translates to:
  /// **'Interest'**
  String get toolInterest;

  /// No description provided for @toolLandUnit.
  ///
  /// In en, this message translates to:
  /// **'Units'**
  String get toolLandUnit;

  /// No description provided for @toolHissa.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get toolHissa;

  /// No description provided for @toolKhotiyan.
  ///
  /// In en, this message translates to:
  /// **'Khatian'**
  String get toolKhotiyan;

  /// No description provided for @toolLandMeasure.
  ///
  /// In en, this message translates to:
  /// **'Plot measure'**
  String get toolLandMeasure;

  /// No description provided for @toolFaraiz.
  ///
  /// In en, this message translates to:
  /// **'Faraiz'**
  String get toolFaraiz;

  /// No description provided for @toolAnaGonda.
  ///
  /// In en, this message translates to:
  /// **'Ana-gonda'**
  String get toolAnaGonda;

  /// No description provided for @toolKabin.
  ///
  /// In en, this message translates to:
  /// **'Kabin fee'**
  String get toolKabin;

  /// No description provided for @toolMouza.
  ///
  /// In en, this message translates to:
  /// **'Mouza rate'**
  String get toolMouza;

  /// No description provided for @toolStamp.
  ///
  /// In en, this message translates to:
  /// **'Stamp'**
  String get toolStamp;

  /// No description provided for @toolLandTax.
  ///
  /// In en, this message translates to:
  /// **'Land tax'**
  String get toolLandTax;

  /// No description provided for @toolMutation.
  ///
  /// In en, this message translates to:
  /// **'Mutation'**
  String get toolMutation;

  /// No description provided for @toolTax.
  ///
  /// In en, this message translates to:
  /// **'Income tax'**
  String get toolTax;

  /// No description provided for @toolDateDiff.
  ///
  /// In en, this message translates to:
  /// **'Date difference'**
  String get toolDateDiff;

  /// No description provided for @toolAge.
  ///
  /// In en, this message translates to:
  /// **'Age'**
  String get toolAge;

  /// No description provided for @toolPercentage.
  ///
  /// In en, this message translates to:
  /// **'Percentage'**
  String get toolPercentage;

  /// No description provided for @toolMath.
  ///
  /// In en, this message translates to:
  /// **'Math'**
  String get toolMath;

  /// No description provided for @toolCompensation.
  ///
  /// In en, this message translates to:
  /// **'Simple multiply'**
  String get toolCompensation;

  /// No description provided for @toolStats.
  ///
  /// In en, this message translates to:
  /// **'Income-expense'**
  String get toolStats;

  /// No description provided for @toolsCourtLocation.
  ///
  /// In en, this message translates to:
  /// **'Court locations'**
  String get toolsCourtLocation;

  /// No description provided for @toolsCourtLocationSub.
  ///
  /// In en, this message translates to:
  /// **'Dhaka judges’ court — building, floor, room'**
  String get toolsCourtLocationSub;

  /// No description provided for @toolsFormsHeading.
  ///
  /// In en, this message translates to:
  /// **'Plaint, written statement, wakalatnama, affidavit and draft petitions'**
  String get toolsFormsHeading;

  /// No description provided for @toolsFormsSub.
  ///
  /// In en, this message translates to:
  /// **'Skeletons from public CPC / Court Fees blanks · PDF'**
  String get toolsFormsSub;

  /// No description provided for @toolsSchedules.
  ///
  /// In en, this message translates to:
  /// **'Schedules / tafsil'**
  String get toolsSchedules;

  /// No description provided for @toolsCourtFeeSched.
  ///
  /// In en, this message translates to:
  /// **'Court-fee schedule'**
  String get toolsCourtFeeSched;

  /// No description provided for @toolsCourtFeeSchedSub.
  ///
  /// In en, this message translates to:
  /// **'2010 schedule · check the gazette'**
  String get toolsCourtFeeSchedSub;

  /// No description provided for @toolsLimitationSched.
  ///
  /// In en, this message translates to:
  /// **'Limitation schedule'**
  String get toolsLimitationSched;

  /// No description provided for @toolsLimitationSchedSub.
  ///
  /// In en, this message translates to:
  /// **'Limitation Act 1908 · First Schedule'**
  String get toolsLimitationSchedSub;

  /// No description provided for @toolsStampRef.
  ///
  /// In en, this message translates to:
  /// **'Stamp reference'**
  String get toolsStampRef;

  /// No description provided for @toolsStampRefSub.
  ///
  /// In en, this message translates to:
  /// **'No rate table — links only'**
  String get toolsStampRefSub;

  /// No description provided for @toolGuideTitle.
  ///
  /// In en, this message translates to:
  /// **'How to use'**
  String get toolGuideTitle;

  /// No description provided for @toolGuideNotThis.
  ///
  /// In en, this message translates to:
  /// **'This is not'**
  String get toolGuideNotThis;

  /// No description provided for @toolCompute.
  ///
  /// In en, this message translates to:
  /// **'Calculate'**
  String get toolCompute;

  /// No description provided for @toolDateStart.
  ///
  /// In en, this message translates to:
  /// **'Start date'**
  String get toolDateStart;

  /// No description provided for @toolDateEnd.
  ///
  /// In en, this message translates to:
  /// **'End date'**
  String get toolDateEnd;

  /// No description provided for @toolBirthDate.
  ///
  /// In en, this message translates to:
  /// **'Date of birth'**
  String get toolBirthDate;

  /// No description provided for @clientAddTitle.
  ///
  /// In en, this message translates to:
  /// **'New client'**
  String get clientAddTitle;

  /// No description provided for @clientEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit client'**
  String get clientEditTitle;

  /// No description provided for @clientNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Name *'**
  String get clientNameLabel;

  /// No description provided for @clientNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter a name'**
  String get clientNameRequired;

  /// No description provided for @clientTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get clientTypeLabel;

  /// No description provided for @clientTypeRequired.
  ///
  /// In en, this message translates to:
  /// **'Choose a type'**
  String get clientTypeRequired;

  /// No description provided for @clientRolePlaintiff.
  ///
  /// In en, this message translates to:
  /// **'Plaintiff'**
  String get clientRolePlaintiff;

  /// No description provided for @clientRoleAccused.
  ///
  /// In en, this message translates to:
  /// **'Accused'**
  String get clientRoleAccused;

  /// No description provided for @clientRoleComplainant.
  ///
  /// In en, this message translates to:
  /// **'Complainant'**
  String get clientRoleComplainant;

  /// No description provided for @clientRoleAppellant.
  ///
  /// In en, this message translates to:
  /// **'Appellant'**
  String get clientRoleAppellant;

  /// No description provided for @clientRoleDefendant.
  ///
  /// In en, this message translates to:
  /// **'Defendant'**
  String get clientRoleDefendant;

  /// No description provided for @clientRolePetitioner.
  ///
  /// In en, this message translates to:
  /// **'Petitioner'**
  String get clientRolePetitioner;

  /// No description provided for @clientRoleOpposite.
  ///
  /// In en, this message translates to:
  /// **'Opposite party'**
  String get clientRoleOpposite;

  /// No description provided for @clientRoleOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get clientRoleOther;

  /// No description provided for @clientRoleOtherHint.
  ///
  /// In en, this message translates to:
  /// **'Write other type'**
  String get clientRoleOtherHint;

  /// No description provided for @clientContactFromPhone.
  ///
  /// In en, this message translates to:
  /// **'Tap here to add from contacts'**
  String get clientContactFromPhone;

  /// No description provided for @clientPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Mobile'**
  String get clientPhoneLabel;

  /// No description provided for @clientPhoneInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid mobile'**
  String get clientPhoneInvalid;

  /// No description provided for @clientEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email (optional)'**
  String get clientEmailLabel;

  /// No description provided for @clientAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get clientAddressLabel;

  /// No description provided for @clientSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get clientSave;

  /// No description provided for @clientUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get clientUpdate;

  /// No description provided for @clientDupTitle.
  ///
  /// In en, this message translates to:
  /// **'Possible duplicate'**
  String get clientDupTitle;

  /// No description provided for @clientDupBody.
  ///
  /// In en, this message translates to:
  /// **'Same phone already has {name}. Add anyway?'**
  String clientDupBody(String name);

  /// No description provided for @clientDupNo.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get clientDupNo;

  /// No description provided for @clientDupYes.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get clientDupYes;

  /// No description provided for @clientPluginMissing.
  ///
  /// In en, this message translates to:
  /// **'Contacts plugin not found'**
  String get clientPluginMissing;

  /// No description provided for @caseAddTitle.
  ///
  /// In en, this message translates to:
  /// **'New case'**
  String get caseAddTitle;

  /// No description provided for @caseEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit case'**
  String get caseEditTitle;

  /// No description provided for @caseCourtLevel.
  ///
  /// In en, this message translates to:
  /// **'Court level'**
  String get caseCourtLevel;

  /// No description provided for @caseCourtType.
  ///
  /// In en, this message translates to:
  /// **'Court type'**
  String get caseCourtType;

  /// No description provided for @caseCourtName.
  ///
  /// In en, this message translates to:
  /// **'Court name'**
  String get caseCourtName;

  /// No description provided for @caseCourtNameHint.
  ///
  /// In en, this message translates to:
  /// **'Type — list appears below'**
  String get caseCourtNameHint;

  /// No description provided for @caseTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Case type'**
  String get caseTypeLabel;

  /// No description provided for @caseTypeHint.
  ///
  /// In en, this message translates to:
  /// **'Type — suggestions below'**
  String get caseTypeHint;

  /// No description provided for @caseLawLabel.
  ///
  /// In en, this message translates to:
  /// **'Section / law'**
  String get caseLawLabel;

  /// No description provided for @caseLawHint.
  ///
  /// In en, this message translates to:
  /// **'Type a section — suggestions below'**
  String get caseLawHint;

  /// No description provided for @caseNoLabel.
  ///
  /// In en, this message translates to:
  /// **'Case number *'**
  String get caseNoLabel;

  /// No description provided for @caseNoRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter a case number'**
  String get caseNoRequired;

  /// No description provided for @caseCourtNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter the court name'**
  String get caseCourtNameRequired;

  /// No description provided for @caseClientLabel.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get caseClientLabel;

  /// No description provided for @caseFind.
  ///
  /// In en, this message translates to:
  /// **'Find'**
  String get caseFind;

  /// No description provided for @caseNew.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get caseNew;

  /// No description provided for @caseOnBehalfOf.
  ///
  /// In en, this message translates to:
  /// **'Whose side am I on? (optional)'**
  String get caseOnBehalfOf;

  /// No description provided for @caseForClient.
  ///
  /// In en, this message translates to:
  /// **'For the client'**
  String get caseForClient;

  /// No description provided for @caseAgainst.
  ///
  /// In en, this message translates to:
  /// **'Against'**
  String get caseAgainst;

  /// No description provided for @caseOppName.
  ///
  /// In en, this message translates to:
  /// **'Opposite party name'**
  String get caseOppName;

  /// No description provided for @caseFileNo.
  ///
  /// In en, this message translates to:
  /// **'File no. (optional)'**
  String get caseFileNo;

  /// No description provided for @caseHearingStage.
  ///
  /// In en, this message translates to:
  /// **'Hearing stage'**
  String get caseHearingStage;

  /// No description provided for @caseStepNote.
  ///
  /// In en, this message translates to:
  /// **'Stage / note'**
  String get caseStepNote;

  /// No description provided for @caseEvidenceTitle.
  ///
  /// In en, this message translates to:
  /// **'Evidence or files'**
  String get caseEvidenceTitle;

  /// No description provided for @caseEvidenceHint.
  ///
  /// In en, this message translates to:
  /// **'If you already added the needed files, you do not need to add them again. Add extra documents here if you want.'**
  String get caseEvidenceHint;

  /// No description provided for @caseSave.
  ///
  /// In en, this message translates to:
  /// **'Save case'**
  String get caseSave;

  /// No description provided for @caseUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get caseUpdate;

  /// No description provided for @lawDailyLaws.
  ///
  /// In en, this message translates to:
  /// **'Essential laws'**
  String get lawDailyLaws;

  /// No description provided for @lawDailySites.
  ///
  /// In en, this message translates to:
  /// **'Law sites'**
  String get lawDailySites;

  /// No description provided for @lawDailyNews.
  ///
  /// In en, this message translates to:
  /// **'Law news'**
  String get lawDailyNews;

  /// No description provided for @lawDailySearch.
  ///
  /// In en, this message translates to:
  /// **'Search section, act or word'**
  String get lawDailySearch;

  /// No description provided for @lawDailyFullText.
  ///
  /// In en, this message translates to:
  /// **'Full text — bdlaws (link)'**
  String get lawDailyFullText;

  /// No description provided for @lawDailyFullTextSub.
  ///
  /// In en, this message translates to:
  /// **'No full statute text here — opens the government portal.'**
  String get lawDailyFullTextSub;

  /// No description provided for @lawDailyPracticeBlurb.
  ///
  /// In en, this message translates to:
  /// **'Daily practice · not a full code · not verified'**
  String get lawDailyPracticeBlurb;

  /// No description provided for @lawDailyPracticeNotes.
  ///
  /// In en, this message translates to:
  /// **'Practice notes'**
  String get lawDailyPracticeNotes;

  /// No description provided for @lawDailyOpenBdlaws.
  ///
  /// In en, this message translates to:
  /// **'Open bdlaws'**
  String get lawDailyOpenBdlaws;

  /// No description provided for @lawDailySection.
  ///
  /// In en, this message translates to:
  /// **'Section'**
  String get lawDailySection;

  /// No description provided for @lawDailyArticle.
  ///
  /// In en, this message translates to:
  /// **'Article'**
  String get lawDailyArticle;

  /// No description provided for @lawDailyPreamble.
  ///
  /// In en, this message translates to:
  /// **'Preamble'**
  String get lawDailyPreamble;

  /// No description provided for @lawDailyDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get lawDailyDetails;

  /// No description provided for @lawDailyNeedsNet.
  ///
  /// In en, this message translates to:
  /// **'Needs internet'**
  String get lawDailyNeedsNet;

  /// No description provided for @lawDailyDailyPractice.
  ///
  /// In en, this message translates to:
  /// **'Daily practice'**
  String get lawDailyDailyPractice;

  /// No description provided for @lawDailySitesIntro.
  ///
  /// In en, this message translates to:
  /// **'Law sites open inside the app. Turn the internet on first.'**
  String get lawDailySitesIntro;

  /// No description provided for @lawDailyNewsIntro.
  ///
  /// In en, this message translates to:
  /// **'News sites open inside the app. Turn the internet on first.'**
  String get lawDailyNewsIntro;

  /// No description provided for @messagingEnableTitle.
  ///
  /// In en, this message translates to:
  /// **'Turn on auto messaging?'**
  String get messagingEnableTitle;

  /// No description provided for @messagingEnableBody.
  ///
  /// In en, this message translates to:
  /// **'Client SMS will send itself one day before the hearing (D-1). No per-send confirm.'**
  String get messagingEnableBody;

  /// No description provided for @messagingEnable.
  ///
  /// In en, this message translates to:
  /// **'Turn on'**
  String get messagingEnable;

  /// No description provided for @messagingGatewayAll.
  ///
  /// In en, this message translates to:
  /// **'One gateway covers all operators (GP, Robi, Banglalink, Teletalk, Airtel).'**
  String get messagingGatewayAll;

  /// No description provided for @messagingGatewayReady.
  ///
  /// In en, this message translates to:
  /// **'Gateway is configured — this phone can send D-1.'**
  String get messagingGatewayReady;

  /// No description provided for @messagingGatewayEmpty.
  ///
  /// In en, this message translates to:
  /// **'Gateway empty — plug Remote Config/SMS_API_URL later.'**
  String get messagingGatewayEmpty;

  /// No description provided for @messagingQuietHours.
  ///
  /// In en, this message translates to:
  /// **'Quiet hours 21:00–08:00 — delay, do not drop. Auto WhatsApp is off; only SIM SMS.'**
  String get messagingQuietHours;

  /// No description provided for @messagingCreditsLeft.
  ///
  /// In en, this message translates to:
  /// **'Remaining {n} credits'**
  String messagingCreditsLeft(String n);

  /// No description provided for @messagingCreditsLocal.
  ///
  /// In en, this message translates to:
  /// **'Remaining {n} credits (local)'**
  String messagingCreditsLocal(String n);

  /// No description provided for @apptName.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get apptName;

  /// No description provided for @commCreditsLine.
  ///
  /// In en, this message translates to:
  /// **'Month {period} · included {included} · used {used} · left {remaining}'**
  String commCreditsLine(
      String period, String included, String used, String remaining);

  /// No description provided for @commSentAdapter.
  ///
  /// In en, this message translates to:
  /// **'Sent (adapter)'**
  String get commSentAdapter;

  /// No description provided for @commSentOk.
  ///
  /// In en, this message translates to:
  /// **'Sent · used {used} · left {remaining}'**
  String commSentOk(String used, String remaining);

  /// No description provided for @commSendFailed.
  ///
  /// In en, this message translates to:
  /// **'Gateway failed · credit returned · left {remaining}'**
  String commSendFailed(String remaining);

  /// No description provided for @commBulkOk.
  ///
  /// In en, this message translates to:
  /// **'Bulk: {n} sent (stopped when credits ran out)'**
  String commBulkOk(String n);

  /// No description provided for @commLogLabel.
  ///
  /// In en, this message translates to:
  /// **'Log'**
  String get commLogLabel;

  /// No description provided for @templateGenerate.
  ///
  /// In en, this message translates to:
  /// **'Create PDF'**
  String get templateGenerate;

  /// No description provided for @templateEduHint.
  ///
  /// In en, this message translates to:
  /// **'Educational draft {version} — verify law and facts before filing.'**
  String templateEduHint(String version);

  /// No description provided for @saveProblem.
  ///
  /// In en, this message translates to:
  /// **'Problem: {error}'**
  String saveProblem(String error);

  /// No description provided for @commonShare.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get commonShare;

  /// No description provided for @commonPrint.
  ///
  /// In en, this message translates to:
  /// **'Print'**
  String get commonPrint;

  /// No description provided for @commonAdd.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get commonAdd;

  /// No description provided for @contactHeading.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get contactHeading;

  /// No description provided for @notFound.
  ///
  /// In en, this message translates to:
  /// **'Not found'**
  String get notFound;

  /// No description provided for @tabInfo.
  ///
  /// In en, this message translates to:
  /// **'Info'**
  String get tabInfo;

  /// No description provided for @tabFees.
  ///
  /// In en, this message translates to:
  /// **'Fees'**
  String get tabFees;

  /// No description provided for @capsulePrev.
  ///
  /// In en, this message translates to:
  /// **'<< Previous'**
  String get capsulePrev;

  /// No description provided for @capsuleToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get capsuleToday;

  /// No description provided for @capsuleNext.
  ///
  /// In en, this message translates to:
  /// **'Next >>'**
  String get capsuleNext;

  /// No description provided for @feeAgreed.
  ///
  /// In en, this message translates to:
  /// **'Full contract'**
  String get feeAgreed;

  /// No description provided for @feeInstallment.
  ///
  /// In en, this message translates to:
  /// **'Installment'**
  String get feeInstallment;

  /// No description provided for @feeReceived.
  ///
  /// In en, this message translates to:
  /// **'Paid / collected'**
  String get feeReceived;

  /// No description provided for @feeExpCourt.
  ///
  /// In en, this message translates to:
  /// **'Court fee (expense)'**
  String get feeExpCourt;

  /// No description provided for @feeExpTamadi.
  ///
  /// In en, this message translates to:
  /// **'Limitation cost'**
  String get feeExpTamadi;

  /// No description provided for @feeExpDoc.
  ///
  /// In en, this message translates to:
  /// **'Document cost'**
  String get feeExpDoc;

  /// No description provided for @feeExpStamp.
  ///
  /// In en, this message translates to:
  /// **'Stamp'**
  String get feeExpStamp;

  /// No description provided for @feeExpOther.
  ///
  /// In en, this message translates to:
  /// **'Other expense'**
  String get feeExpOther;

  /// No description provided for @feeExpense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get feeExpense;

  /// No description provided for @ledgerFull.
  ///
  /// In en, this message translates to:
  /// **'Full'**
  String get ledgerFull;

  /// No description provided for @ledgerReceived.
  ///
  /// In en, this message translates to:
  /// **'Received'**
  String get ledgerReceived;

  /// No description provided for @ledgerDue.
  ///
  /// In en, this message translates to:
  /// **'Due'**
  String get ledgerDue;

  /// No description provided for @ledgerExpense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get ledgerExpense;

  /// No description provided for @ledgerNet.
  ///
  /// In en, this message translates to:
  /// **'Net'**
  String get ledgerNet;

  /// No description provided for @ledgerEntry.
  ///
  /// In en, this message translates to:
  /// **'Ledger entry'**
  String get ledgerEntry;

  /// No description provided for @ledgerDetails.
  ///
  /// In en, this message translates to:
  /// **'Full ledger'**
  String get ledgerDetails;

  /// No description provided for @ledgerEmpty.
  ///
  /// In en, this message translates to:
  /// **'No installment or expense yet'**
  String get ledgerEmpty;

  /// No description provided for @ledgerTitle.
  ///
  /// In en, this message translates to:
  /// **'Fee ledger'**
  String get ledgerTitle;

  /// No description provided for @ledgerKind.
  ///
  /// In en, this message translates to:
  /// **'Head'**
  String get ledgerKind;

  /// No description provided for @ledgerKindName.
  ///
  /// In en, this message translates to:
  /// **'Head name'**
  String get ledgerKindName;

  /// No description provided for @ledgerAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount (৳)'**
  String get ledgerAmount;

  /// No description provided for @ledgerNote.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get ledgerNote;

  /// No description provided for @ledgerCase.
  ///
  /// In en, this message translates to:
  /// **'Case *'**
  String get ledgerCase;

  /// No description provided for @ledgerPickCase.
  ///
  /// In en, this message translates to:
  /// **'Choose a case'**
  String get ledgerPickCase;

  /// No description provided for @feeScreenTitle.
  ///
  /// In en, this message translates to:
  /// **'Fees & accounts'**
  String get feeScreenTitle;

  /// No description provided for @feeMonthEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No fee entries this month'**
  String get feeMonthEmptyTitle;

  /// No description provided for @feeMonthEmptySub.
  ///
  /// In en, this message translates to:
  /// **'Add a ledger entry.'**
  String get feeMonthEmptySub;

  /// No description provided for @feeReport.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get feeReport;

  /// No description provided for @caseNoShort.
  ///
  /// In en, this message translates to:
  /// **'Case no.'**
  String get caseNoShort;

  /// No description provided for @caseFileNoShort.
  ///
  /// In en, this message translates to:
  /// **'File no.'**
  String get caseFileNoShort;

  /// No description provided for @caseStageLabel.
  ///
  /// In en, this message translates to:
  /// **'Stage'**
  String get caseStageLabel;

  /// No description provided for @caseNoteLabel.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get caseNoteLabel;

  /// No description provided for @casePartyClient.
  ///
  /// In en, this message translates to:
  /// **'Party (client)'**
  String get casePartyClient;

  /// No description provided for @caseOpposite.
  ///
  /// In en, this message translates to:
  /// **'Opposite party'**
  String get caseOpposite;

  /// No description provided for @caseOnBehalf.
  ///
  /// In en, this message translates to:
  /// **'Whose side I am on'**
  String get caseOnBehalf;

  /// No description provided for @caseLastOutcome.
  ///
  /// In en, this message translates to:
  /// **'Last outcome'**
  String get caseLastOutcome;

  /// No description provided for @caseFilingDate.
  ///
  /// In en, this message translates to:
  /// **'Filing date'**
  String get caseFilingDate;

  /// No description provided for @caseNextDate.
  ///
  /// In en, this message translates to:
  /// **'Next date'**
  String get caseNextDate;

  /// No description provided for @caseStatusLabel.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get caseStatusLabel;

  /// No description provided for @caseStatusActive.
  ///
  /// In en, this message translates to:
  /// **'● Active'**
  String get caseStatusActive;

  /// No description provided for @caseStatusDisposed.
  ///
  /// In en, this message translates to:
  /// **'✓ Disposed'**
  String get caseStatusDisposed;

  /// No description provided for @caseStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get caseStatusCancelled;

  /// No description provided for @caseNotFound.
  ///
  /// In en, this message translates to:
  /// **'Not found'**
  String get caseNotFound;

  /// No description provided for @caseAddDoc.
  ///
  /// In en, this message translates to:
  /// **'Add file'**
  String get caseAddDoc;

  /// No description provided for @casePrepTips.
  ///
  /// In en, this message translates to:
  /// **'Prep tips'**
  String get casePrepTips;

  /// No description provided for @caseReadLawDaily.
  ///
  /// In en, this message translates to:
  /// **'Read in Law Daily'**
  String get caseReadLawDaily;

  /// No description provided for @caseAddOutcome.
  ///
  /// In en, this message translates to:
  /// **'Today’s outcome / add stage'**
  String get caseAddOutcome;

  /// No description provided for @caseTimeline.
  ///
  /// In en, this message translates to:
  /// **'Stage / note history'**
  String get caseTimeline;

  /// No description provided for @timelineEmpty.
  ///
  /// In en, this message translates to:
  /// **'No history yet'**
  String get timelineEmpty;

  /// No description provided for @hearingFallback.
  ///
  /// In en, this message translates to:
  /// **'Hearing'**
  String get hearingFallback;

  /// No description provided for @noMobile.
  ///
  /// In en, this message translates to:
  /// **'No mobile'**
  String get noMobile;

  /// No description provided for @templatesBtn.
  ///
  /// In en, this message translates to:
  /// **'Templates'**
  String get templatesBtn;

  /// No description provided for @clientFallback.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get clientFallback;

  /// No description provided for @clientNotFound.
  ///
  /// In en, this message translates to:
  /// **'Client not found'**
  String get clientNotFound;

  /// No description provided for @clientIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Details incomplete'**
  String get clientIncomplete;

  /// No description provided for @clientCases.
  ///
  /// In en, this message translates to:
  /// **'Cases'**
  String get clientCases;

  /// No description provided for @clientNoCases.
  ///
  /// In en, this message translates to:
  /// **'This client has no cases'**
  String get clientNoCases;

  /// No description provided for @addCaseCta.
  ///
  /// In en, this message translates to:
  /// **'+ Add case'**
  String get addCaseCta;

  /// No description provided for @addCaseLong.
  ///
  /// In en, this message translates to:
  /// **'Add case'**
  String get addCaseLong;

  /// No description provided for @clientCasesHeading.
  ///
  /// In en, this message translates to:
  /// **'Cases:'**
  String get clientCasesHeading;

  /// No description provided for @clientMerge.
  ///
  /// In en, this message translates to:
  /// **'Merge with another client (match phone)'**
  String get clientMerge;

  /// No description provided for @clientMergeNone.
  ///
  /// In en, this message translates to:
  /// **'No other client to merge'**
  String get clientMergeNone;

  /// No description provided for @clientMergePick.
  ///
  /// In en, this message translates to:
  /// **'Merge into this one and delete'**
  String get clientMergePick;

  /// No description provided for @clientMerged.
  ///
  /// In en, this message translates to:
  /// **'Merged'**
  String get clientMerged;

  /// No description provided for @clientNoCasesLedger.
  ///
  /// In en, this message translates to:
  /// **'No cases — ledger empty'**
  String get clientNoCasesLedger;

  /// No description provided for @caseWord.
  ///
  /// In en, this message translates to:
  /// **'Case'**
  String get caseWord;

  /// No description provided for @caseBadgeActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get caseBadgeActive;

  /// No description provided for @caseBadgeExpired.
  ///
  /// In en, this message translates to:
  /// **'Overdue'**
  String get caseBadgeExpired;

  /// No description provided for @caseBadgeToday.
  ///
  /// In en, this message translates to:
  /// **'Hearing today'**
  String get caseBadgeToday;

  /// No description provided for @caseDaysLeft.
  ///
  /// In en, this message translates to:
  /// **'{n} days left'**
  String caseDaysLeft(String n);

  /// No description provided for @expiredOutcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'What is today’s outcome for your {caseNo} — {title} case?'**
  String expiredOutcomeTitle(String caseNo, String title);

  /// No description provided for @expiredDisposed.
  ///
  /// In en, this message translates to:
  /// **'Disposed'**
  String get expiredDisposed;

  /// No description provided for @expiredNextHearing.
  ///
  /// In en, this message translates to:
  /// **'Next hearing'**
  String get expiredNextHearing;

  /// No description provided for @expiredCancelCase.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get expiredCancelCase;

  /// No description provided for @expiredLater.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get expiredLater;

  /// No description provided for @expiredCancelConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel this case?'**
  String get expiredCancelConfirm;

  /// No description provided for @calcInterestStep1.
  ///
  /// In en, this message translates to:
  /// **'Enter principal and annual rate.'**
  String get calcInterestStep1;

  /// No description provided for @calcInterestStep2.
  ///
  /// In en, this message translates to:
  /// **'Choose year mode or day mode.'**
  String get calcInterestStep2;

  /// No description provided for @calcInterestStep3.
  ///
  /// In en, this message translates to:
  /// **'In day mode, interest = principal × rate/100 × days/365.'**
  String get calcInterestStep3;

  /// No description provided for @calcInterestNotThis.
  ///
  /// In en, this message translates to:
  /// **'Decree interest or compound interest.'**
  String get calcInterestNotThis;

  /// No description provided for @calcInterestDaysMode.
  ///
  /// In en, this message translates to:
  /// **'Day mode (365-day year)'**
  String get calcInterestDaysMode;

  /// No description provided for @calcInterestPrincipal.
  ///
  /// In en, this message translates to:
  /// **'Principal (৳)'**
  String get calcInterestPrincipal;

  /// No description provided for @calcInterestRate.
  ///
  /// In en, this message translates to:
  /// **'Annual rate %'**
  String get calcInterestRate;

  /// No description provided for @calcInterestDays.
  ///
  /// In en, this message translates to:
  /// **'Days'**
  String get calcInterestDays;

  /// No description provided for @calcInterestYears.
  ///
  /// In en, this message translates to:
  /// **'Years'**
  String get calcInterestYears;

  /// No description provided for @calcInterestResult.
  ///
  /// In en, this message translates to:
  /// **'Simple interest ৳{interest} · total ৳{total}'**
  String calcInterestResult(String interest, String total);

  /// No description provided for @calcInterestDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Disclaimer: simple interest; court decree interest may differ.'**
  String get calcInterestDisclaimer;

  /// No description provided for @calcDateStep1.
  ///
  /// In en, this message translates to:
  /// **'Pick start and end dates.'**
  String get calcDateStep1;

  /// No description provided for @calcDateStep2.
  ///
  /// In en, this message translates to:
  /// **'English calendar.'**
  String get calcDateStep2;

  /// No description provided for @calcDateStep3.
  ///
  /// In en, this message translates to:
  /// **'Shows weeks + leftover days.'**
  String get calcDateStep3;

  /// No description provided for @calcDateNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not the limitation engine.'**
  String get calcDateNotThis;

  /// No description provided for @calcDateEndBefore.
  ///
  /// In en, this message translates to:
  /// **'End date is earlier'**
  String get calcDateEndBefore;

  /// No description provided for @calcDateResult.
  ///
  /// In en, this message translates to:
  /// **'{days} days · {weeks} weeks {rem} days'**
  String calcDateResult(String days, String weeks, String rem);

  /// No description provided for @calcAgeStep1.
  ///
  /// In en, this message translates to:
  /// **'Pick date of birth.'**
  String get calcAgeStep1;

  /// No description provided for @calcAgeStep2.
  ///
  /// In en, this message translates to:
  /// **'Shows years/months/days.'**
  String get calcAgeStep2;

  /// No description provided for @calcAgeNotThis.
  ///
  /// In en, this message translates to:
  /// **'Whether 18 is complete — not a legal finding, only a note.'**
  String get calcAgeNotThis;

  /// No description provided for @calcAgeResult.
  ///
  /// In en, this message translates to:
  /// **'{years} years {months} months {days} days'**
  String calcAgeResult(String years, String months, String days);

  /// No description provided for @calcAgeNote18.
  ///
  /// In en, this message translates to:
  /// **' · 18 complete (note only)'**
  String get calcAgeNote18;

  /// No description provided for @calcAgeNoteUnder18.
  ///
  /// In en, this message translates to:
  /// **' · under 18 (note only)'**
  String get calcAgeNoteUnder18;

  /// No description provided for @calcPctStep1.
  ///
  /// In en, this message translates to:
  /// **'Mode 1: X% of Y'**
  String get calcPctStep1;

  /// No description provided for @calcPctStep2.
  ///
  /// In en, this message translates to:
  /// **'Mode 2: X is what % of Y'**
  String get calcPctStep2;

  /// No description provided for @calcPctStep3.
  ///
  /// In en, this message translates to:
  /// **'Mode 3: increase/decrease %'**
  String get calcPctStep3;

  /// No description provided for @calcPctIncrease.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get calcPctIncrease;

  /// No description provided for @calcPctYZero.
  ///
  /// In en, this message translates to:
  /// **'Y is zero'**
  String get calcPctYZero;

  /// No description provided for @calcPctChange.
  ///
  /// In en, this message translates to:
  /// **'Change {pct}%'**
  String calcPctChange(String pct);

  /// No description provided for @calcFaraizBody.
  ///
  /// In en, this message translates to:
  /// **'Hanafi/Quranic faraiz calculator is shipped — see assumptions in the tool. Hindu/Christian succession is not here.'**
  String get calcFaraizBody;

  /// No description provided for @calcMeasureStep1.
  ///
  /// In en, this message translates to:
  /// **'Rectangle: length × width.'**
  String get calcMeasureStep1;

  /// No description provided for @calcMeasureStep2.
  ///
  /// In en, this message translates to:
  /// **'Triangle: Heron’s formula (three sides).'**
  String get calcMeasureStep2;

  /// No description provided for @calcMeasureStep3.
  ///
  /// In en, this message translates to:
  /// **'Trapezoid: two parallels + height.'**
  String get calcMeasureStep3;

  /// No description provided for @calcMeasureNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a legal boundary or GPS.'**
  String get calcMeasureNotThis;

  /// No description provided for @calcMeasureRect.
  ///
  /// In en, this message translates to:
  /// **'Rectangle'**
  String get calcMeasureRect;

  /// No description provided for @calcMeasureTriangle.
  ///
  /// In en, this message translates to:
  /// **'Triangle'**
  String get calcMeasureTriangle;

  /// No description provided for @calcMeasureTrap.
  ///
  /// In en, this message translates to:
  /// **'Trapezoid'**
  String get calcMeasureTrap;

  /// No description provided for @calcMeasureLength.
  ///
  /// In en, this message translates to:
  /// **'Length (ft)'**
  String get calcMeasureLength;

  /// No description provided for @calcMeasureWidth.
  ///
  /// In en, this message translates to:
  /// **'Width (ft)'**
  String get calcMeasureWidth;

  /// No description provided for @calcMeasureSideA.
  ///
  /// In en, this message translates to:
  /// **'Side A (ft)'**
  String get calcMeasureSideA;

  /// No description provided for @calcMeasureSideB.
  ///
  /// In en, this message translates to:
  /// **'Side B (ft)'**
  String get calcMeasureSideB;

  /// No description provided for @calcMeasureSideC.
  ///
  /// In en, this message translates to:
  /// **'Side C (ft)'**
  String get calcMeasureSideC;

  /// No description provided for @calcMeasureParaA.
  ///
  /// In en, this message translates to:
  /// **'Parallel A (ft)'**
  String get calcMeasureParaA;

  /// No description provided for @calcMeasureParaB.
  ///
  /// In en, this message translates to:
  /// **'Parallel B (ft)'**
  String get calcMeasureParaB;

  /// No description provided for @calcMeasureHeight.
  ///
  /// In en, this message translates to:
  /// **'Height (ft)'**
  String get calcMeasureHeight;

  /// No description provided for @calcMeasureResult.
  ///
  /// In en, this message translates to:
  /// **'{sqft} sq ft · {decimal} decimal (approx)'**
  String calcMeasureResult(String sqft, String decimal);

  /// No description provided for @calcMeasureDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'No complex plot/GPS. Not a final khatian.'**
  String get calcMeasureDisclaimer;

  /// No description provided for @calcCompStep1.
  ///
  /// In en, this message translates to:
  /// **'Monthly × 12 × years.'**
  String get calcCompStep1;

  /// No description provided for @calcCompNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a motor-vehicle or labour-law compensation formula.'**
  String get calcCompNotThis;

  /// No description provided for @calcCompMonthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly (৳)'**
  String get calcCompMonthly;

  /// No description provided for @calcCompYears.
  ///
  /// In en, this message translates to:
  /// **'Years'**
  String get calcCompYears;

  /// No description provided for @calcCompResult.
  ///
  /// In en, this message translates to:
  /// **'Approx ৳{amount} (monthly × 12 × years)'**
  String calcCompResult(String amount);

  /// No description provided for @calcCompDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Disclaimer: this is not a court decree. Motor-vehicle/labour formulas depend on the case.'**
  String get calcCompDisclaimer;

  /// No description provided for @calcStampStep1.
  ///
  /// In en, this message translates to:
  /// **'Rates vary by deed and area.'**
  String get calcStampStep1;

  /// No description provided for @calcStampStep2.
  ///
  /// In en, this message translates to:
  /// **'A national 3%+2% answer is not shown.'**
  String get calcStampStep2;

  /// No description provided for @calcStampStep3.
  ///
  /// In en, this message translates to:
  /// **'Check IRD / land schedules.'**
  String get calcStampStep3;

  /// No description provided for @calcStampNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a complete stamp calculator.'**
  String get calcStampNotThis;

  /// No description provided for @calcStampQuarantine.
  ///
  /// In en, this message translates to:
  /// **'Stamp figures come from the table on this page. A deed without a gazette row is left out.'**
  String get calcStampQuarantine;

  /// No description provided for @calcOpenLandGov.
  ///
  /// In en, this message translates to:
  /// **'Open land.gov.bd'**
  String get calcOpenLandGov;

  /// No description provided for @calcCourtFeeStep1.
  ///
  /// In en, this message translates to:
  /// **'Pick a tab, then the case type.'**
  String get calcCourtFeeStep1;

  /// No description provided for @calcCourtFeeStep2.
  ///
  /// In en, this message translates to:
  /// **'Enter value if needed, then calculate.'**
  String get calcCourtFeeStep2;

  /// No description provided for @calcCourtFeeStep3.
  ///
  /// In en, this message translates to:
  /// **'Section 35A does not apply to some fixed fees.'**
  String get calcCourtFeeStep3;

  /// No description provided for @calcCourtFeeStep4.
  ///
  /// In en, this message translates to:
  /// **'Court Fees Act 1870 — indicative only.'**
  String get calcCourtFeeStep4;

  /// No description provided for @calcCourtFeeNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not the final gazette schedule fee.'**
  String get calcCourtFeeNotThis;

  /// No description provided for @calcCourtFeeTabCivil.
  ///
  /// In en, this message translates to:
  /// **'Civil'**
  String get calcCourtFeeTabCivil;

  /// No description provided for @calcCourtFeeTabAppeal.
  ///
  /// In en, this message translates to:
  /// **'Appeal'**
  String get calcCourtFeeTabAppeal;

  /// No description provided for @calcCourtFeeTabProbate.
  ///
  /// In en, this message translates to:
  /// **'Probate'**
  String get calcCourtFeeTabProbate;

  /// No description provided for @calcCourtFeeTabCopy.
  ///
  /// In en, this message translates to:
  /// **'Copy'**
  String get calcCourtFeeTabCopy;

  /// No description provided for @calcCourtFeeTabSch2.
  ///
  /// In en, this message translates to:
  /// **'Sch. II'**
  String get calcCourtFeeTabSch2;

  /// No description provided for @calcCourtFeeFixed.
  ///
  /// In en, this message translates to:
  /// **'Fixed fee'**
  String get calcCourtFeeFixed;

  /// No description provided for @calcCourtFeeNo35a.
  ///
  /// In en, this message translates to:
  /// **'Section 35A does not apply'**
  String get calcCourtFeeNo35a;

  /// No description provided for @calcCourtFeeValue.
  ///
  /// In en, this message translates to:
  /// **'Suit value (taka)'**
  String get calcCourtFeeValue;

  /// No description provided for @calcCourtFeeAmountHint.
  ///
  /// In en, this message translates to:
  /// **'Enter amount'**
  String get calcCourtFeeAmountHint;

  /// No description provided for @calcCourtFeeQuick5k.
  ///
  /// In en, this message translates to:
  /// **'5 thousand'**
  String get calcCourtFeeQuick5k;

  /// No description provided for @calcCourtFeeQuick10k.
  ///
  /// In en, this message translates to:
  /// **'10 thousand'**
  String get calcCourtFeeQuick10k;

  /// No description provided for @calcCourtFeeQuick50k.
  ///
  /// In en, this message translates to:
  /// **'50 thousand'**
  String get calcCourtFeeQuick50k;

  /// No description provided for @calcCourtFeeQuick1L.
  ///
  /// In en, this message translates to:
  /// **'1 lakh'**
  String get calcCourtFeeQuick1L;

  /// No description provided for @calcCourtFeeQuick5L.
  ///
  /// In en, this message translates to:
  /// **'5 lakh'**
  String get calcCourtFeeQuick5L;

  /// No description provided for @calcCourtFeeResultLabel.
  ///
  /// In en, this message translates to:
  /// **'Court fee'**
  String get calcCourtFeeResultLabel;

  /// No description provided for @calcCourtFee35aNote.
  ///
  /// In en, this message translates to:
  /// **'Section 35A extra fee may apply separately — check the schedule.'**
  String get calcCourtFee35aNote;

  /// No description provided for @calcCourtFeeFooter.
  ///
  /// In en, this message translates to:
  /// **'COURT FEES ACT 1870 · indicative'**
  String get calcCourtFeeFooter;

  /// No description provided for @calcLimStep1.
  ///
  /// In en, this message translates to:
  /// **'Enter the judgment/order date.'**
  String get calcLimStep1;

  /// No description provided for @calcLimStep2.
  ///
  /// In en, this message translates to:
  /// **'Pick the case type (appeal, revision, etc.).'**
  String get calcLimStep2;

  /// No description provided for @calcLimStep3.
  ///
  /// In en, this message translates to:
  /// **'If copy collection (s.12), wrong court (s.14) or stay (s.15) applies, add those dates below.'**
  String get calcLimStep3;

  /// No description provided for @calcLimStep4.
  ///
  /// In en, this message translates to:
  /// **'Fri–Sat and holidays may push the last day under s.4. Indicative only.'**
  String get calcLimStep4;

  /// No description provided for @calcLimNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not the final court filing deadline.'**
  String get calcLimNotThis;

  /// No description provided for @calcLimPickKind.
  ///
  /// In en, this message translates to:
  /// **'Choose case type'**
  String get calcLimPickKind;

  /// No description provided for @calcLimOrderDate.
  ///
  /// In en, this message translates to:
  /// **'Order / decree date'**
  String get calcLimOrderDate;

  /// No description provided for @calcLimPickDate.
  ///
  /// In en, this message translates to:
  /// **'Pick a date'**
  String get calcLimPickDate;

  /// No description provided for @calcLimFilingDate.
  ///
  /// In en, this message translates to:
  /// **'Appeal / revision / review filing date (optional)'**
  String get calcLimFilingDate;

  /// No description provided for @calcLimExclude.
  ///
  /// In en, this message translates to:
  /// **'Excludable time'**
  String get calcLimExclude;

  /// No description provided for @calcLimS12.
  ///
  /// In en, this message translates to:
  /// **'Section 12 (copy collection)'**
  String get calcLimS12;

  /// No description provided for @calcLimS14.
  ///
  /// In en, this message translates to:
  /// **'Section 14 (wrong court)'**
  String get calcLimS14;

  /// No description provided for @calcLimS15.
  ///
  /// In en, this message translates to:
  /// **'Section 15 (stay)'**
  String get calcLimS15;

  /// No description provided for @calcLimStart.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get calcLimStart;

  /// No description provided for @calcLimEnd.
  ///
  /// In en, this message translates to:
  /// **'End'**
  String get calcLimEnd;

  /// No description provided for @calcLimCompute.
  ///
  /// In en, this message translates to:
  /// **'Calculate period'**
  String get calcLimCompute;

  /// No description provided for @calcLimExpired.
  ///
  /// In en, this message translates to:
  /// **'Time has expired'**
  String get calcLimExpired;

  /// No description provided for @calcLimUrgent.
  ///
  /// In en, this message translates to:
  /// **'{n} days left — urgent!'**
  String calcLimUrgent(String n);

  /// No description provided for @calcLimLeft.
  ///
  /// In en, this message translates to:
  /// **'{n} days left'**
  String calcLimLeft(String n);

  /// No description provided for @calcLimLimit.
  ///
  /// In en, this message translates to:
  /// **'Limit'**
  String get calcLimLimit;

  /// No description provided for @calcLimDue.
  ///
  /// In en, this message translates to:
  /// **'Last date'**
  String get calcLimDue;

  /// No description provided for @calcLimBase.
  ///
  /// In en, this message translates to:
  /// **'Base date'**
  String get calcLimBase;

  /// No description provided for @calcLimRule.
  ///
  /// In en, this message translates to:
  /// **'Legal source'**
  String get calcLimRule;

  /// No description provided for @calcLimFiling.
  ///
  /// In en, this message translates to:
  /// **'Filing'**
  String get calcLimFiling;

  /// No description provided for @calcLimFilingLate.
  ///
  /// In en, this message translates to:
  /// **'{date} — limitation passed'**
  String calcLimFilingLate(String date);

  /// No description provided for @calcLimFilingOk.
  ///
  /// In en, this message translates to:
  /// **'{date} — in time'**
  String calcLimFilingOk(String date);

  /// No description provided for @calcLimDays.
  ///
  /// In en, this message translates to:
  /// **'{n} days'**
  String calcLimDays(String n);

  /// No description provided for @calcLimExcludeDays.
  ///
  /// In en, this message translates to:
  /// **'{ref} + excludable {n} days'**
  String calcLimExcludeDays(String ref, String n);

  /// No description provided for @calcUnitStep1.
  ///
  /// In en, this message translates to:
  /// **'Pick a preset, enter an amount.'**
  String get calcUnitStep1;

  /// No description provided for @calcUnitStep2.
  ///
  /// In en, this message translates to:
  /// **'Dhaka katha is 1.65 decimal; many districts use 1.5.'**
  String get calcUnitStep2;

  /// No description provided for @calcUnitStep3.
  ///
  /// In en, this message translates to:
  /// **'Khatian is final.'**
  String get calcUnitStep3;

  /// No description provided for @calcUnitNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a substitute for survey/khatian.'**
  String get calcUnitNotThis;

  /// No description provided for @calcUnitDhaka.
  ///
  /// In en, this message translates to:
  /// **'Dhaka katha 1.65'**
  String get calcUnitDhaka;

  /// No description provided for @calcUnitCommon.
  ///
  /// In en, this message translates to:
  /// **'Common 1.5'**
  String get calcUnitCommon;

  /// No description provided for @calcUnitCustom.
  ///
  /// In en, this message translates to:
  /// **'Custom'**
  String get calcUnitCustom;

  /// No description provided for @calcUnitKathaRate.
  ///
  /// In en, this message translates to:
  /// **'1 katha = how many decimal'**
  String get calcUnitKathaRate;

  /// No description provided for @calcUnitValue.
  ///
  /// In en, this message translates to:
  /// **'Value'**
  String get calcUnitValue;

  /// No description provided for @calcUnitDecimal.
  ///
  /// In en, this message translates to:
  /// **'Decimal'**
  String get calcUnitDecimal;

  /// No description provided for @calcUnitKatha.
  ///
  /// In en, this message translates to:
  /// **'Katha'**
  String get calcUnitKatha;

  /// No description provided for @calcUnitBigha.
  ///
  /// In en, this message translates to:
  /// **'Bigha'**
  String get calcUnitBigha;

  /// No description provided for @calcUnitAcre.
  ///
  /// In en, this message translates to:
  /// **'Acre'**
  String get calcUnitAcre;

  /// No description provided for @calcUnitSqft.
  ///
  /// In en, this message translates to:
  /// **'Sq ft'**
  String get calcUnitSqft;

  /// No description provided for @calcUnitDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Indicative only. Check local khatian/survey. 1 katha is now {rate} decimal.'**
  String calcUnitDisclaimer(String rate);

  /// No description provided for @calcHissaStep1.
  ///
  /// In en, this message translates to:
  /// **'Enter total land.'**
  String get calcHissaStep1;

  /// No description provided for @calcHissaStep2.
  ///
  /// In en, this message translates to:
  /// **'Enter share numerator and denominator (e.g. 1/4).'**
  String get calcHissaStep2;

  /// No description provided for @calcHissaStep3.
  ///
  /// In en, this message translates to:
  /// **'Result is in decimal.'**
  String get calcHissaStep3;

  /// No description provided for @calcHissaNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not an official khatian.'**
  String get calcHissaNotThis;

  /// No description provided for @calcHissaTotal.
  ///
  /// In en, this message translates to:
  /// **'Total land (decimal)'**
  String get calcHissaTotal;

  /// No description provided for @calcHissaNum.
  ///
  /// In en, this message translates to:
  /// **'Share numerator'**
  String get calcHissaNum;

  /// No description provided for @calcHissaDen.
  ///
  /// In en, this message translates to:
  /// **'Share denominator'**
  String get calcHissaDen;

  /// No description provided for @calcHissaResult.
  ///
  /// In en, this message translates to:
  /// **'Share = {share} decimal'**
  String calcHissaResult(String share);

  /// No description provided for @calcHissaKathaNote.
  ///
  /// In en, this message translates to:
  /// **'≈ {katha} katha (1 katha = 1.65 decimal)'**
  String calcHissaKathaNote(String katha);

  /// No description provided for @calcKhotStep1.
  ///
  /// In en, this message translates to:
  /// **'BS/BRS share = total land × fraction (numerator ÷ denominator).'**
  String get calcKhotStep1;

  /// No description provided for @calcKhotStep2.
  ///
  /// In en, this message translates to:
  /// **'Not an e-Porcha lookup — only the maths.'**
  String get calcKhotStep2;

  /// No description provided for @calcKhotStep3.
  ///
  /// In en, this message translates to:
  /// **'Dag/khatian numbers are not stored; check the portal.'**
  String get calcKhotStep3;

  /// No description provided for @calcKhotNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not the official khatian database.'**
  String get calcKhotNotThis;

  /// No description provided for @calcOpenEporcha.
  ///
  /// In en, this message translates to:
  /// **'Open e-Porcha'**
  String get calcOpenEporcha;

  /// No description provided for @calcKhotTabShare.
  ///
  /// In en, this message translates to:
  /// **'Land share'**
  String get calcKhotTabShare;

  /// No description provided for @calcKhotTabHeir.
  ///
  /// In en, this message translates to:
  /// **'Heirs'**
  String get calcKhotTabHeir;

  /// No description provided for @calcKhotTotalLand.
  ///
  /// In en, this message translates to:
  /// **'Total land (decimal)'**
  String get calcKhotTotalLand;

  /// No description provided for @calcKhotFractionHint.
  ///
  /// In en, this message translates to:
  /// **'Share (e.g. 1/3 → numerator=1, denominator=3)'**
  String get calcKhotFractionHint;

  /// No description provided for @calcKhotNumHint.
  ///
  /// In en, this message translates to:
  /// **'Numerator (1)'**
  String get calcKhotNumHint;

  /// No description provided for @calcKhotDenHint.
  ///
  /// In en, this message translates to:
  /// **'Denominator (3)'**
  String get calcKhotDenHint;

  /// No description provided for @calcKhotConvertNote.
  ///
  /// In en, this message translates to:
  /// **'Conversion (approx): 1 katha ≈ 1.65 decimal here. This tool does not store dag/khatian numbers.'**
  String get calcKhotConvertNote;

  /// No description provided for @calcKhotShareResult.
  ///
  /// In en, this message translates to:
  /// **'Share: {decimal} decimal\n= {katha} katha (approx)\n= {bigha} bigha'**
  String calcKhotShareResult(String decimal, String katha, String bigha);

  /// No description provided for @calcKhotEstate.
  ///
  /// In en, this message translates to:
  /// **'Total estate (৳)'**
  String get calcKhotEstate;

  /// No description provided for @calcKhotHeirList.
  ///
  /// In en, this message translates to:
  /// **'Heir list'**
  String get calcKhotHeirList;

  /// No description provided for @calcKhotSons.
  ///
  /// In en, this message translates to:
  /// **'Number of sons'**
  String get calcKhotSons;

  /// No description provided for @calcKhotDaughters.
  ///
  /// In en, this message translates to:
  /// **'Number of daughters'**
  String get calcKhotDaughters;

  /// No description provided for @calcKhotWifeAlive.
  ///
  /// In en, this message translates to:
  /// **'Wife living'**
  String get calcKhotWifeAlive;

  /// No description provided for @calcKhotFatherAlive.
  ///
  /// In en, this message translates to:
  /// **'Father living'**
  String get calcKhotFatherAlive;

  /// No description provided for @calcKhotMotherAlive.
  ///
  /// In en, this message translates to:
  /// **'Mother living'**
  String get calcKhotMotherAlive;

  /// No description provided for @calcKhotFather.
  ///
  /// In en, this message translates to:
  /// **'Father'**
  String get calcKhotFather;

  /// No description provided for @calcKhotMother.
  ///
  /// In en, this message translates to:
  /// **'Mother'**
  String get calcKhotMother;

  /// No description provided for @calcKhotWife.
  ///
  /// In en, this message translates to:
  /// **'Wife'**
  String get calcKhotWife;

  /// No description provided for @calcKhotSonsN.
  ///
  /// In en, this message translates to:
  /// **'{n} sons'**
  String calcKhotSonsN(String n);

  /// No description provided for @calcKhotDaughtersN.
  ///
  /// In en, this message translates to:
  /// **'{n} daughters'**
  String calcKhotDaughtersN(String n);

  /// No description provided for @calcKhotAsaba.
  ///
  /// In en, this message translates to:
  /// **'Asaba'**
  String get calcKhotAsaba;

  /// No description provided for @calcKhotShareLabel.
  ///
  /// In en, this message translates to:
  /// **'Share: {share}'**
  String calcKhotShareLabel(String share);

  /// No description provided for @calcKhotEach.
  ///
  /// In en, this message translates to:
  /// **'Each: ৳ {amount}'**
  String calcKhotEach(String amount);

  /// No description provided for @calcKhotHeirDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'* Simplified Hanafi method. Ask a lawyer. No DLRS/khatian lookup. Hindu/Christian succession is not here.'**
  String get calcKhotHeirDisclaimer;

  /// No description provided for @calcMathStep1.
  ///
  /// In en, this message translates to:
  /// **'Enter two numbers.'**
  String get calcMathStep1;

  /// No description provided for @calcMathStep2.
  ///
  /// In en, this message translates to:
  /// **'Pick + − × ÷ then calculate.'**
  String get calcMathStep2;

  /// No description provided for @calcMathStep3.
  ///
  /// In en, this message translates to:
  /// **'The result card shows Bangla digits.'**
  String get calcMathStep3;

  /// No description provided for @calcMathNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not income tax, court fee or limitation — math only.'**
  String get calcMathNotThis;

  /// No description provided for @calcMathFirst.
  ///
  /// In en, this message translates to:
  /// **'First number'**
  String get calcMathFirst;

  /// No description provided for @calcMathSecond.
  ///
  /// In en, this message translates to:
  /// **'Second number'**
  String get calcMathSecond;

  /// No description provided for @calcMathDivZero.
  ///
  /// In en, this message translates to:
  /// **'Cannot divide by zero'**
  String get calcMathDivZero;

  /// No description provided for @calcLandTaxStep1.
  ///
  /// In en, this message translates to:
  /// **'Rates differ by union / city corporation.'**
  String get calcLandTaxStep1;

  /// No description provided for @calcLandTaxStep2.
  ///
  /// In en, this message translates to:
  /// **'The app does not compute money without a district pack.'**
  String get calcLandTaxStep2;

  /// No description provided for @calcLandTaxStep3.
  ///
  /// In en, this message translates to:
  /// **'Match the government portal or local land office.'**
  String get calcLandTaxStep3;

  /// No description provided for @calcLandTaxNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a single national-rate calculator.'**
  String get calcLandTaxNotThis;

  /// No description provided for @calcLandTaxNoPack.
  ///
  /// In en, this message translates to:
  /// **'No verified rate pack — no number shown.'**
  String get calcLandTaxNoPack;

  /// No description provided for @calcMutStep1.
  ///
  /// In en, this message translates to:
  /// **'Enter NID, dag and mouza on the official e-Mutation portal.'**
  String get calcMutStep1;

  /// No description provided for @calcMutStep2.
  ///
  /// In en, this message translates to:
  /// **'Fee is whatever the portal shows — none invented here.'**
  String get calcMutStep2;

  /// No description provided for @calcMutStep3.
  ///
  /// In en, this message translates to:
  /// **'This screen is not a grant calculator.'**
  String get calcMutStep3;

  /// No description provided for @calcMutNotThis.
  ///
  /// In en, this message translates to:
  /// **'Does not claim mutation was granted.'**
  String get calcMutNotThis;

  /// No description provided for @calcOpenMutation.
  ///
  /// In en, this message translates to:
  /// **'Open mutation.land.gov.bd'**
  String get calcOpenMutation;

  /// No description provided for @taxWizardTitle.
  ///
  /// In en, this message translates to:
  /// **'Income-tax wizard — AY 2026-27'**
  String get taxWizardTitle;

  /// No description provided for @taxStep1.
  ///
  /// In en, this message translates to:
  /// **'Income year: 1 July–30 June (Dhaka).'**
  String get taxStep1;

  /// No description provided for @taxStep2.
  ///
  /// In en, this message translates to:
  /// **'Individual slabs: NBR Nirdeshika 2026-27 (published 2 Sep 2026).'**
  String get taxStep2;

  /// No description provided for @taxStep3.
  ///
  /// In en, this message translates to:
  /// **'Not an NBR return; no VAT, company or surcharge here.'**
  String get taxStep3;

  /// No description provided for @taxNotThis.
  ///
  /// In en, this message translates to:
  /// **'Not a full income-tax return — individual indicative compute.'**
  String get taxNotThis;

  /// No description provided for @taxUnpublished.
  ///
  /// In en, this message translates to:
  /// **'Unverified / unpublished pack'**
  String get taxUnpublished;

  /// No description provided for @taxPublished.
  ///
  /// In en, this message translates to:
  /// **'Published pack — Nirdeshika 2026-27'**
  String get taxPublished;

  /// No description provided for @taxPackLine.
  ///
  /// In en, this message translates to:
  /// **'Pack: {id}'**
  String taxPackLine(String id);

  /// No description provided for @taxYearLine.
  ///
  /// In en, this message translates to:
  /// **'Assessment {ay} · income year {iy}'**
  String taxYearLine(String ay, String iy);

  /// No description provided for @taxStatusLine.
  ///
  /// In en, this message translates to:
  /// **'Status {status} · compute {compute}'**
  String taxStatusLine(String status, String compute);

  /// No description provided for @taxComputeOn.
  ///
  /// In en, this message translates to:
  /// **'on'**
  String get taxComputeOn;

  /// No description provided for @taxComputeOff.
  ///
  /// In en, this message translates to:
  /// **'off'**
  String get taxComputeOff;

  /// No description provided for @taxIncomeYearExample.
  ///
  /// In en, this message translates to:
  /// **'Income-year example: {y} July – {y2} June'**
  String taxIncomeYearExample(String y, String y2);

  /// No description provided for @taxRetrieved.
  ///
  /// In en, this message translates to:
  /// **'Retrieved {date}'**
  String taxRetrieved(String date);

  /// No description provided for @taxBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get taxBack;

  /// No description provided for @taxNext.
  ///
  /// In en, this message translates to:
  /// **'Next step'**
  String get taxNext;

  /// No description provided for @taxComputeClosed.
  ///
  /// In en, this message translates to:
  /// **'Calculate (off)'**
  String get taxComputeClosed;

  /// No description provided for @taxComputeBtn.
  ///
  /// In en, this message translates to:
  /// **'Calculate'**
  String get taxComputeBtn;

  /// No description provided for @taxSources.
  ///
  /// In en, this message translates to:
  /// **'Government sources'**
  String get taxSources;

  /// No description provided for @taxSourceCite.
  ///
  /// In en, this message translates to:
  /// **'Source: Income-tax Nirdeshika 2026-27, NBR (published 2 Sep 2026).'**
  String get taxSourceCite;

  /// No description provided for @taxDotPack.
  ///
  /// In en, this message translates to:
  /// **'Pack'**
  String get taxDotPack;

  /// No description provided for @taxDotTaxpayer.
  ///
  /// In en, this message translates to:
  /// **'Taxpayer'**
  String get taxDotTaxpayer;

  /// No description provided for @taxDotIncome.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get taxDotIncome;

  /// No description provided for @taxDotInvest.
  ///
  /// In en, this message translates to:
  /// **'Investment'**
  String get taxDotInvest;

  /// No description provided for @taxDotResult.
  ///
  /// In en, this message translates to:
  /// **'Result'**
  String get taxDotResult;

  /// No description provided for @taxKindGeneral.
  ///
  /// In en, this message translates to:
  /// **'General individual'**
  String get taxKindGeneral;

  /// No description provided for @taxKindWoman.
  ///
  /// In en, this message translates to:
  /// **'Woman / 65+'**
  String get taxKindWoman;

  /// No description provided for @taxKindDisabled.
  ///
  /// In en, this message translates to:
  /// **'Person with disability'**
  String get taxKindDisabled;

  /// No description provided for @taxKindFreedom.
  ///
  /// In en, this message translates to:
  /// **'Gazetted war-wounded freedom fighter / July warrior'**
  String get taxKindFreedom;

  /// No description provided for @taxKindCompany.
  ///
  /// In en, this message translates to:
  /// **'Company (not computed in this wizard)'**
  String get taxKindCompany;

  /// No description provided for @taxStep1Body.
  ///
  /// In en, this message translates to:
  /// **'Step 1 — assessment year {year}. Individual slabs from NBR Nirdeshika 2026-27. No company/surcharge.'**
  String taxStep1Body(String year);

  /// No description provided for @taxStep2Title.
  ///
  /// In en, this message translates to:
  /// **'Step 2 — taxpayer type'**
  String get taxStep2Title;

  /// No description provided for @taxStep3Title.
  ///
  /// In en, this message translates to:
  /// **'Step 3 — income heads'**
  String get taxStep3Title;

  /// No description provided for @taxSalary.
  ///
  /// In en, this message translates to:
  /// **'Salary / employment (৳) — 1/3 exemption applies'**
  String get taxSalary;

  /// No description provided for @taxOtherIncome.
  ///
  /// In en, this message translates to:
  /// **'Other income / total if not salary (৳)'**
  String get taxOtherIncome;

  /// No description provided for @taxIncomeHint.
  ///
  /// In en, this message translates to:
  /// **'The Nirdeshika ৳50 lakh example is total income — salary field applies the 1/3 employment exemption.'**
  String get taxIncomeHint;

  /// No description provided for @taxDisabledDependents.
  ///
  /// In en, this message translates to:
  /// **'Disabled children/wards (count)'**
  String get taxDisabledDependents;

  /// No description provided for @taxFirstTimeFiler.
  ///
  /// In en, this message translates to:
  /// **'First-time filer (minimum tax ৳1,000)'**
  String get taxFirstTimeFiler;

  /// No description provided for @taxStep4Title.
  ///
  /// In en, this message translates to:
  /// **'Step 4 — investment / rebate (s.78 summary)'**
  String get taxStep4Title;

  /// No description provided for @taxInvestLabel.
  ///
  /// In en, this message translates to:
  /// **'Declared investment (৳)'**
  String get taxInvestLabel;

  /// No description provided for @taxStep5Title.
  ///
  /// In en, this message translates to:
  /// **'Step 5 — result'**
  String get taxStep5Title;

  /// No description provided for @taxTaxpayerLine.
  ///
  /// In en, this message translates to:
  /// **'Taxpayer: {kind}'**
  String taxTaxpayerLine(String kind);

  /// No description provided for @taxComputeResult.
  ///
  /// In en, this message translates to:
  /// **'Compute result: {result}'**
  String taxComputeResult(String result);

  /// No description provided for @taxComputeNone.
  ///
  /// In en, this message translates to:
  /// **'none — not computed for this kind'**
  String get taxComputeNone;

  /// No description provided for @taxNoSlab.
  ///
  /// In en, this message translates to:
  /// **'Company/surcharge are not in this wizard. Match NBR Nirdeshika.'**
  String get taxNoSlab;

  /// No description provided for @taxComputeNotOn.
  ///
  /// In en, this message translates to:
  /// **'Compute is off'**
  String get taxComputeNotOn;

  /// No description provided for @recordMissing.
  ///
  /// In en, this message translates to:
  /// **'No record'**
  String get recordMissing;

  /// No description provided for @outcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Today’s outcome'**
  String get outcomeTitle;

  /// No description provided for @outcomeWhatHappened.
  ///
  /// In en, this message translates to:
  /// **'What happened today?'**
  String get outcomeWhatHappened;

  /// No description provided for @outcomePickStage.
  ///
  /// In en, this message translates to:
  /// **'Pick a stage'**
  String get outcomePickStage;

  /// No description provided for @outcomeNoteHint.
  ///
  /// In en, this message translates to:
  /// **'Short note (optional)'**
  String get outcomeNoteHint;

  /// No description provided for @saveLong.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get saveLong;

  /// No description provided for @saveKeep.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get saveKeep;

  /// No description provided for @hearingDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Hearing details'**
  String get hearingDetailTitle;

  /// No description provided for @hearingPurposeLine.
  ///
  /// In en, this message translates to:
  /// **'Purpose: {value}'**
  String hearingPurposeLine(String value);

  /// No description provided for @hearingOutcomeLine.
  ///
  /// In en, this message translates to:
  /// **'Outcome: {value}'**
  String hearingOutcomeLine(String value);

  /// No description provided for @hearingAttendLine.
  ///
  /// In en, this message translates to:
  /// **'Attendance: {value}'**
  String hearingAttendLine(String value);

  /// No description provided for @hearingOutcomeNone.
  ///
  /// In en, this message translates to:
  /// **'Not recorded yet'**
  String get hearingOutcomeNone;

  /// No description provided for @commonYes.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get commonYes;

  /// No description provided for @commonNo.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get commonNo;

  /// No description provided for @noteAdd.
  ///
  /// In en, this message translates to:
  /// **'Add note'**
  String get noteAdd;

  /// No description provided for @noteEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit note'**
  String get noteEdit;

  /// No description provided for @fieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get fieldTitle;

  /// No description provided for @reportsByStatus.
  ///
  /// In en, this message translates to:
  /// **'Active / disposed'**
  String get reportsByStatus;

  /// No description provided for @reportsByCourt.
  ///
  /// In en, this message translates to:
  /// **'By court'**
  String get reportsByCourt;

  /// No description provided for @reportsByType.
  ///
  /// In en, this message translates to:
  /// **'Case type'**
  String get reportsByType;

  /// No description provided for @reportsMonthHearingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Hearings this month'**
  String get reportsMonthHearingsTitle;

  /// No description provided for @reportsMonthHearingsBody.
  ///
  /// In en, this message translates to:
  /// **'{n} · {d} days'**
  String reportsMonthHearingsBody(String n, String d);

  /// No description provided for @reportsFeeCollected.
  ///
  /// In en, this message translates to:
  /// **'Fees collected'**
  String get reportsFeeCollected;

  /// No description provided for @reportsFeeDue.
  ///
  /// In en, this message translates to:
  /// **'Fees due'**
  String get reportsFeeDue;

  /// No description provided for @reportsNoDue.
  ///
  /// In en, this message translates to:
  /// **'No dues'**
  String get reportsNoDue;

  /// No description provided for @reportsTeamActivity.
  ///
  /// In en, this message translates to:
  /// **'Team activity'**
  String get reportsTeamActivity;

  /// No description provided for @reportsTeamOffline.
  ///
  /// In en, this message translates to:
  /// **'Audit log needs internet — see activity on the Team screen. This card is empty offline.'**
  String get reportsTeamOffline;

  /// No description provided for @reportsPdfFooter.
  ///
  /// In en, this message translates to:
  /// **'PDF: practice-pdf online; CSV on this device. Internal summary — not a VAT invoice.'**
  String get reportsPdfFooter;

  /// No description provided for @reportsNoData.
  ///
  /// In en, this message translates to:
  /// **'No data'**
  String get reportsNoData;

  /// No description provided for @reportsLoadFail.
  ///
  /// In en, this message translates to:
  /// **'Report did not load: {error}'**
  String reportsLoadFail(String error);

  /// No description provided for @reportsPdfNeedLogin.
  ///
  /// In en, this message translates to:
  /// **'PDF needs login and internet'**
  String get reportsPdfNeedLogin;

  /// No description provided for @reportsPdfFail.
  ///
  /// In en, this message translates to:
  /// **'PDF was not created — check net/server; CSV is offline'**
  String get reportsPdfFail;

  /// No description provided for @searchFtsHint.
  ///
  /// In en, this message translates to:
  /// **'Case, client, section, tool… (FTS)'**
  String get searchFtsHint;

  /// No description provided for @searchVoiceHint.
  ///
  /// In en, this message translates to:
  /// **'Speak Bangla with the keyboard mic. No separate ASR SDK in v1.'**
  String get searchVoiceHint;

  /// No description provided for @searchEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing found'**
  String get searchEmptyTitle;

  /// No description provided for @searchEmptySub.
  ///
  /// In en, this message translates to:
  /// **'Try case number, client, or section. No voice commands — use the keyboard mic.'**
  String get searchEmptySub;

  /// No description provided for @searchCasesExact.
  ///
  /// In en, this message translates to:
  /// **'Cases (exact/LIKE)'**
  String get searchCasesExact;

  /// No description provided for @casesPrintAllTitle.
  ///
  /// In en, this message translates to:
  /// **'All cases? Or search first'**
  String get casesPrintAllTitle;

  /// No description provided for @casesPrintAllBody.
  ///
  /// In en, this message translates to:
  /// **'Without a search or status filter, the full list will print.'**
  String get casesPrintAllBody;

  /// No description provided for @casesPrintSearch.
  ///
  /// In en, this message translates to:
  /// **'Search first'**
  String get casesPrintSearch;

  /// No description provided for @casesPrintAll.
  ///
  /// In en, this message translates to:
  /// **'Print all'**
  String get casesPrintAll;

  /// No description provided for @casesListShareTitle.
  ///
  /// In en, this message translates to:
  /// **'Case list'**
  String get casesListShareTitle;

  /// No description provided for @casesListShareHeader.
  ///
  /// In en, this message translates to:
  /// **'Lawyer Diary — case list'**
  String get casesListShareHeader;

  /// No description provided for @caseGroupToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get caseGroupToday;

  /// No description provided for @caseGroupTomorrow.
  ///
  /// In en, this message translates to:
  /// **'Tomorrow (in 1 day)'**
  String get caseGroupTomorrow;

  /// No description provided for @caseGroupIn2Days.
  ///
  /// In en, this message translates to:
  /// **'In 2 days'**
  String get caseGroupIn2Days;

  /// No description provided for @caseGroupIn3Days.
  ///
  /// In en, this message translates to:
  /// **'In 3 days'**
  String get caseGroupIn3Days;

  /// No description provided for @caseGroupLater.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get caseGroupLater;

  /// No description provided for @caseGroupDisposed.
  ///
  /// In en, this message translates to:
  /// **'Disposed'**
  String get caseGroupDisposed;

  /// No description provided for @tasksTitle.
  ///
  /// In en, this message translates to:
  /// **'Tasks / reminders'**
  String get tasksTitle;

  /// No description provided for @tasksNewHint.
  ///
  /// In en, this message translates to:
  /// **'New task'**
  String get tasksNewHint;

  /// No description provided for @tasksRepeat.
  ///
  /// In en, this message translates to:
  /// **'Repeat'**
  String get tasksRepeat;

  /// No description provided for @tasksOnce.
  ///
  /// In en, this message translates to:
  /// **'Once'**
  String get tasksOnce;

  /// No description provided for @tasksDaily.
  ///
  /// In en, this message translates to:
  /// **'Daily'**
  String get tasksDaily;

  /// No description provided for @tasksWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get tasksWeekly;

  /// No description provided for @tasksEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No tasks'**
  String get tasksEmptyTitle;

  /// No description provided for @tasksEmptySub.
  ///
  /// In en, this message translates to:
  /// **'Type above to add'**
  String get tasksEmptySub;

  /// No description provided for @calendarTitle.
  ///
  /// In en, this message translates to:
  /// **'Calendar'**
  String get calendarTitle;

  /// No description provided for @calMonth.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get calMonth;

  /// No description provided for @calWeek.
  ///
  /// In en, this message translates to:
  /// **'Week'**
  String get calWeek;

  /// No description provided for @calAgenda30.
  ///
  /// In en, this message translates to:
  /// **'30 days'**
  String get calAgenda30;

  /// No description provided for @calDayEvents.
  ///
  /// In en, this message translates to:
  /// **'{date} — hearings and events'**
  String calDayEvents(String date);

  /// No description provided for @calDayEventsClosed.
  ///
  /// In en, this message translates to:
  /// **'{date} — hearings and events · usually closed'**
  String calDayEventsClosed(String date);

  /// No description provided for @calClosedEmpty.
  ///
  /// In en, this message translates to:
  /// **'Usually closed · hearings may not be listed'**
  String get calClosedEmpty;

  /// No description provided for @calDayEmpty.
  ///
  /// In en, this message translates to:
  /// **'No hearings/events on this day'**
  String get calDayEmpty;

  /// No description provided for @calAgendaEmpty.
  ///
  /// In en, this message translates to:
  /// **'No hearings in the next 30 days'**
  String get calAgendaEmpty;

  /// No description provided for @calKindHearing.
  ///
  /// In en, this message translates to:
  /// **'Hearing'**
  String get calKindHearing;

  /// No description provided for @calKindMeeting.
  ///
  /// In en, this message translates to:
  /// **'Client meeting'**
  String get calKindMeeting;

  /// No description provided for @calKindFiling.
  ///
  /// In en, this message translates to:
  /// **'Filing'**
  String get calKindFiling;

  /// No description provided for @calKindDeadline.
  ///
  /// In en, this message translates to:
  /// **'Deadline'**
  String get calKindDeadline;

  /// No description provided for @calKindReminder.
  ///
  /// In en, this message translates to:
  /// **'Reminder'**
  String get calKindReminder;

  /// No description provided for @calKindPayment.
  ///
  /// In en, this message translates to:
  /// **'Fee ledger'**
  String get calKindPayment;

  /// No description provided for @calKindPersonal.
  ///
  /// In en, this message translates to:
  /// **'Personal task'**
  String get calKindPersonal;

  /// No description provided for @scanRecordTitle.
  ///
  /// In en, this message translates to:
  /// **'File record'**
  String get scanRecordTitle;

  /// No description provided for @scanRecordHint.
  ///
  /// In en, this message translates to:
  /// **'Scanner and OCR are off in v1 (no CAMERA; AGP plugin commented). Only title and kind are saved — no photo capture.'**
  String get scanRecordHint;

  /// No description provided for @prepChecklist.
  ///
  /// In en, this message translates to:
  /// **'Checklist'**
  String get prepChecklist;

  /// No description provided for @prepHearing.
  ///
  /// In en, this message translates to:
  /// **'Hearing'**
  String get prepHearing;

  /// No description provided for @prepFiling.
  ///
  /// In en, this message translates to:
  /// **'Filing'**
  String get prepFiling;

  /// No description provided for @prepNewItem.
  ///
  /// In en, this message translates to:
  /// **'New item'**
  String get prepNewItem;

  /// No description provided for @composeNotifyClient.
  ///
  /// In en, this message translates to:
  /// **'Tell the client'**
  String get composeNotifyClient;

  /// No description provided for @composeTplNext.
  ///
  /// In en, this message translates to:
  /// **'Next hearing'**
  String get composeTplNext;

  /// No description provided for @composeTplToday.
  ///
  /// In en, this message translates to:
  /// **'Attend today'**
  String get composeTplToday;

  /// No description provided for @composeTplDate.
  ///
  /// In en, this message translates to:
  /// **'Date change'**
  String get composeTplDate;

  /// No description provided for @composeTplFee.
  ///
  /// In en, this message translates to:
  /// **'Fee due'**
  String get composeTplFee;

  /// No description provided for @composeTplDocs.
  ///
  /// In en, this message translates to:
  /// **'Ask for papers'**
  String get composeTplDocs;

  /// No description provided for @composeTplOrder.
  ///
  /// In en, this message translates to:
  /// **'Today’s order'**
  String get composeTplOrder;

  /// No description provided for @composeTplDisposed.
  ///
  /// In en, this message translates to:
  /// **'Disposed'**
  String get composeTplDisposed;

  /// No description provided for @composeTplMeeting.
  ///
  /// In en, this message translates to:
  /// **'Chamber meeting'**
  String get composeTplMeeting;

  /// No description provided for @composeSms.
  ///
  /// In en, this message translates to:
  /// **'SMS'**
  String get composeSms;

  /// No description provided for @composeBoth.
  ///
  /// In en, this message translates to:
  /// **'Both'**
  String get composeBoth;

  /// No description provided for @composeOptOut.
  ///
  /// In en, this message translates to:
  /// **'Want to stop? Ask the lawyer. WhatsApp does not use credits.'**
  String get composeOptOut;

  /// No description provided for @composeSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get composeSend;

  /// No description provided for @composeSmsCost.
  ///
  /// In en, this message translates to:
  /// **'SMS · cost {n}'**
  String composeSmsCost(String n);

  /// No description provided for @commonClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get commonClose;

  /// No description provided for @findLeadsBtn.
  ///
  /// In en, this message translates to:
  /// **'Leads'**
  String get findLeadsBtn;

  /// No description provided for @findProfileBtn.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get findProfileBtn;

  /// No description provided for @findFeaturedNote.
  ///
  /// In en, this message translates to:
  /// **'Featured placement is not sold in v1. Ratings appear only after contact; a count of 0 is hidden.'**
  String get findFeaturedNote;

  /// No description provided for @findEmptyList.
  ///
  /// In en, this message translates to:
  /// **'No lawyers match this filter. Most districts have nobody listed yet — a cold start, not a bug. Pick a district to be notified, or list yourself first. Ratings appear only after contact; 0 is hidden.'**
  String get findEmptyList;

  /// No description provided for @findCacheEmpty.
  ///
  /// In en, this message translates to:
  /// **'The last successful list is not offline — cache is empty.'**
  String get findCacheEmpty;

  /// No description provided for @findOfflineCache.
  ///
  /// In en, this message translates to:
  /// **'Offline cache — need the network for a new search'**
  String get findOfflineCache;

  /// No description provided for @findNotifyCta.
  ///
  /// In en, this message translates to:
  /// **'Tell me when someone joins this district'**
  String get findNotifyCta;

  /// No description provided for @findNotifyPickDistrict.
  ///
  /// In en, this message translates to:
  /// **'Pick a district and try again'**
  String get findNotifyPickDistrict;

  /// No description provided for @findNotifySaved.
  ///
  /// In en, this message translates to:
  /// **'We’ll tell you when a lawyer joins this district.'**
  String get findNotifySaved;

  /// No description provided for @findNotifyFailed.
  ///
  /// In en, this message translates to:
  /// **'Notify was not saved'**
  String get findNotifyFailed;

  /// No description provided for @findBeFirst.
  ///
  /// In en, this message translates to:
  /// **'Be the first listed'**
  String get findBeFirst;

  /// No description provided for @findContactTitle.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get findContactTitle;

  /// No description provided for @findContactFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not send the contact'**
  String get findContactFailed;

  /// No description provided for @findReportDone.
  ///
  /// In en, this message translates to:
  /// **'Report submitted'**
  String get findReportDone;

  /// No description provided for @findReportFailed.
  ///
  /// In en, this message translates to:
  /// **'Report failed'**
  String get findReportFailed;

  /// No description provided for @findProfileLoadFail.
  ///
  /// In en, this message translates to:
  /// **'Profile did not load'**
  String get findProfileLoadFail;

  /// No description provided for @findCompleteness.
  ///
  /// In en, this message translates to:
  /// **'Profile completeness: {pct}%'**
  String findCompleteness(int pct);

  /// No description provided for @findMedianReply.
  ///
  /// In en, this message translates to:
  /// **'Median reply time: {mins} minutes (collected data; not a guess)'**
  String findMedianReply(int mins);

  /// No description provided for @findRatingLine.
  ///
  /// In en, this message translates to:
  /// **'Rating {avg} · {count} people (only after contact; comments are not public)'**
  String findRatingLine(String avg, String count);

  /// No description provided for @findNoRating.
  ///
  /// In en, this message translates to:
  /// **'No ratings yet — left blank, not a guess.'**
  String get findNoRating;

  /// No description provided for @findPhoneHidden.
  ///
  /// In en, this message translates to:
  /// **'Phone is not shown on the profile. Up to 3 contacts in 14 days. Contact shares numbers both ways.'**
  String get findPhoneHidden;

  /// No description provided for @findIssueLabel.
  ///
  /// In en, this message translates to:
  /// **'Short description of the problem (optional)'**
  String get findIssueLabel;

  /// No description provided for @findContactBtn.
  ///
  /// In en, this message translates to:
  /// **'Contact / consult'**
  String get findContactBtn;

  /// No description provided for @findReportBtn.
  ///
  /// In en, this message translates to:
  /// **'Report / block'**
  String get findReportBtn;

  /// No description provided for @findRatingSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Rating saved — average shows only when count > 0'**
  String get findRatingSubmitted;

  /// No description provided for @findRatingFailed.
  ///
  /// In en, this message translates to:
  /// **'Rating was not saved'**
  String get findRatingFailed;

  /// No description provided for @findMyProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'My lawyer profile'**
  String get findMyProfileTitle;

  /// No description provided for @findCompletenessHint.
  ///
  /// In en, this message translates to:
  /// **'Completeness {pct}% — fill name, degree, district and about'**
  String findCompletenessHint(int pct);

  /// No description provided for @findFieldName.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get findFieldName;

  /// No description provided for @findFieldDegree.
  ///
  /// In en, this message translates to:
  /// **'Degree'**
  String get findFieldDegree;

  /// No description provided for @findFieldDistrict.
  ///
  /// In en, this message translates to:
  /// **'District'**
  String get findFieldDistrict;

  /// No description provided for @findFieldAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get findFieldAbout;

  /// No description provided for @findBarReg.
  ///
  /// In en, this message translates to:
  /// **'Bar registration no. (verify)'**
  String get findBarReg;

  /// No description provided for @findEnrolYear.
  ///
  /// In en, this message translates to:
  /// **'Year of enrolment'**
  String get findEnrolYear;

  /// No description provided for @findPhotoUrl.
  ///
  /// In en, this message translates to:
  /// **'Photo URL (upload server later)'**
  String get findPhotoUrl;

  /// No description provided for @findPhotoHint.
  ///
  /// In en, this message translates to:
  /// **'Presign upload is on the webapp. HTTPS URL only here. The account mobile is for the system — it will not show on the public profile.'**
  String get findPhotoHint;

  /// No description provided for @findPublish.
  ///
  /// In en, this message translates to:
  /// **'Publish'**
  String get findPublish;

  /// No description provided for @findVerifySubmitted.
  ///
  /// In en, this message translates to:
  /// **'Verify request submitted — manual review'**
  String get findVerifySubmitted;

  /// No description provided for @findVerifyFailed.
  ///
  /// In en, this message translates to:
  /// **'Verify was not submitted — save the profile first'**
  String get findVerifyFailed;

  /// No description provided for @findSubmitVerify.
  ///
  /// In en, this message translates to:
  /// **'Submit for verification'**
  String get findSubmitVerify;

  /// No description provided for @findLeadsTitle.
  ///
  /// In en, this message translates to:
  /// **'Leads / requests'**
  String get findLeadsTitle;

  /// No description provided for @findNeedLogin.
  ///
  /// In en, this message translates to:
  /// **'Sign in required'**
  String get findNeedLogin;

  /// No description provided for @findLeadsLoadFail.
  ///
  /// In en, this message translates to:
  /// **'Leads did not load'**
  String get findLeadsLoadFail;

  /// No description provided for @findMyRequests.
  ///
  /// In en, this message translates to:
  /// **'My requests'**
  String get findMyRequests;

  /// No description provided for @findNoRequestsTitle.
  ///
  /// In en, this message translates to:
  /// **'No requests yet'**
  String get findNoRequestsTitle;

  /// No description provided for @findNoRequestsSub.
  ///
  /// In en, this message translates to:
  /// **'They appear here after you Contact from the directory.'**
  String get findNoRequestsSub;

  /// No description provided for @findYourRating.
  ///
  /// In en, this message translates to:
  /// **'Your rating: {stars}★'**
  String findYourRating(String stars);

  /// No description provided for @findIncomingLeads.
  ///
  /// In en, this message translates to:
  /// **'Incoming leads (lawyer)'**
  String get findIncomingLeads;

  /// No description provided for @findNoIncomingTitle.
  ///
  /// In en, this message translates to:
  /// **'No incoming leads'**
  String get findNoIncomingTitle;

  /// No description provided for @findNoIncomingSub.
  ///
  /// In en, this message translates to:
  /// **'They appear here when your profile is listed.'**
  String get findNoIncomingSub;

  /// No description provided for @findClientFallback.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get findClientFallback;

  /// No description provided for @findCaseBtn.
  ///
  /// In en, this message translates to:
  /// **'Case'**
  String get findCaseBtn;

  /// No description provided for @findRatingPrefix.
  ///
  /// In en, this message translates to:
  /// **'Rating: '**
  String get findRatingPrefix;

  /// No description provided for @findVerified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get findVerified;

  /// No description provided for @findLawyerFallback.
  ///
  /// In en, this message translates to:
  /// **'Lawyer'**
  String get findLawyerFallback;

  /// No description provided for @findYearsExp.
  ///
  /// In en, this message translates to:
  /// **'{n} years’ experience'**
  String findYearsExp(int n);

  /// No description provided for @findSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'Save failed'**
  String get findSaveFailed;

  /// No description provided for @findPracticeCivil.
  ///
  /// In en, this message translates to:
  /// **'Civil'**
  String get findPracticeCivil;

  /// No description provided for @findPracticeCriminal.
  ///
  /// In en, this message translates to:
  /// **'Criminal'**
  String get findPracticeCriminal;

  /// No description provided for @findPracticeFamily.
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get findPracticeFamily;

  /// No description provided for @findPracticeLand.
  ///
  /// In en, this message translates to:
  /// **'Land'**
  String get findPracticeLand;

  /// No description provided for @findPracticeLabour.
  ///
  /// In en, this message translates to:
  /// **'Labour'**
  String get findPracticeLabour;

  /// No description provided for @findPracticeCheque.
  ///
  /// In en, this message translates to:
  /// **'Cheque / NI'**
  String get findPracticeCheque;

  /// No description provided for @findContactGreeting.
  ///
  /// In en, this message translates to:
  /// **'Assalamu alaikum, how are you? You can contact the lawyer at the number below to help with your problem.'**
  String get findContactGreeting;

  /// No description provided for @loginAppName.
  ///
  /// In en, this message translates to:
  /// **'Lawyer Diary'**
  String get loginAppName;

  /// No description provided for @loginIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Username or mobile'**
  String get loginIdLabel;

  /// No description provided for @loginIdHint.
  ///
  /// In en, this message translates to:
  /// **'username or 01XXXXXXXXX'**
  String get loginIdHint;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get loginPasswordLabel;

  /// No description provided for @loginSubmit.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginSubmit;

  /// No description provided for @loginForgot.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get loginForgot;

  /// No description provided for @loginSignup.
  ///
  /// In en, this message translates to:
  /// **'Create a new account'**
  String get loginSignup;

  /// No description provided for @loginRestoreBtn.
  ///
  /// In en, this message translates to:
  /// **'Restore account (30-day grace)'**
  String get loginRestoreBtn;

  /// No description provided for @loginRestored.
  ///
  /// In en, this message translates to:
  /// **'Restored — sign in now'**
  String get loginRestored;

  /// No description provided for @loginDevOnly.
  ///
  /// In en, this message translates to:
  /// **'Debug only — not production'**
  String get loginDevOnly;

  /// No description provided for @loginBypass.
  ///
  /// In en, this message translates to:
  /// **'Local test — enter without signing in'**
  String get loginBypass;

  /// No description provided for @signupTitle.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get signupTitle;

  /// No description provided for @signupHint.
  ///
  /// In en, this message translates to:
  /// **'No OTP. Email is optional — needed to reset the password.'**
  String get signupHint;

  /// No description provided for @signupName.
  ///
  /// In en, this message translates to:
  /// **'Name *'**
  String get signupName;

  /// No description provided for @signupPhone.
  ///
  /// In en, this message translates to:
  /// **'Mobile *'**
  String get signupPhone;

  /// No description provided for @signupEmail.
  ///
  /// In en, this message translates to:
  /// **'Email (optional)'**
  String get signupEmail;

  /// No description provided for @signupPassword.
  ///
  /// In en, this message translates to:
  /// **'Password *'**
  String get signupPassword;

  /// No description provided for @signupPassword2.
  ///
  /// In en, this message translates to:
  /// **'Confirm password *'**
  String get signupPassword2;

  /// No description provided for @signupTerms.
  ///
  /// In en, this message translates to:
  /// **'I accept the terms and privacy policy'**
  String get signupTerms;

  /// No description provided for @signupWait.
  ///
  /// In en, this message translates to:
  /// **'Please wait…'**
  String get signupWait;

  /// No description provided for @signupCreate.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get signupCreate;

  /// No description provided for @signupHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Sign in'**
  String get signupHaveAccount;

  /// No description provided for @signupNeedTerms.
  ///
  /// In en, this message translates to:
  /// **'Accept the terms first'**
  String get signupNeedTerms;

  /// No description provided for @signupPasswordMismatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get signupPasswordMismatch;

  /// No description provided for @forgotBackLogin.
  ///
  /// In en, this message translates to:
  /// **'Back to login'**
  String get forgotBackLogin;

  /// No description provided for @forgotPhoneHint.
  ///
  /// In en, this message translates to:
  /// **'Login has no OTP. A forgotten password uses phone OTP (it costs money). The password does not change without the server.'**
  String get forgotPhoneHint;

  /// No description provided for @forgotEmailHint.
  ///
  /// In en, this message translates to:
  /// **'If the account has email, a link will be sent (cheap backup).'**
  String get forgotEmailHint;

  /// No description provided for @forgotEmailSent.
  ///
  /// In en, this message translates to:
  /// **'If this account has email, a reset link was sent. No OTP.'**
  String get forgotEmailSent;

  /// No description provided for @forgotIdLabel.
  ///
  /// In en, this message translates to:
  /// **'Username, mobile or email'**
  String get forgotIdLabel;

  /// No description provided for @forgotAskLink.
  ///
  /// In en, this message translates to:
  /// **'Request link'**
  String get forgotAskLink;

  /// No description provided for @forgotOtpSent.
  ///
  /// In en, this message translates to:
  /// **'OTP sent (10 minutes).'**
  String get forgotOtpSent;

  /// No description provided for @forgotWaitRate.
  ///
  /// In en, this message translates to:
  /// **'Wait — too many attempts.'**
  String get forgotWaitRate;

  /// No description provided for @forgotResetDone.
  ///
  /// In en, this message translates to:
  /// **'Password updated. Sign in.'**
  String get forgotResetDone;

  /// No description provided for @lockUnlock.
  ///
  /// In en, this message translates to:
  /// **'Unlock'**
  String get lockUnlock;

  /// No description provided for @profileNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get profileNameLabel;

  /// No description provided for @profilePhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Mobile'**
  String get profilePhoneLabel;

  /// No description provided for @profileEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get profileEmailLabel;

  /// No description provided for @profileUsernameLabel.
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get profileUsernameLabel;

  /// No description provided for @profilePasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get profilePasswordLabel;

  /// No description provided for @profileFindSection.
  ///
  /// In en, this message translates to:
  /// **'Find Lawyer profile'**
  String get profileFindSection;

  /// No description provided for @profileFindHint.
  ///
  /// In en, this message translates to:
  /// **'Photo, years of experience, expertise, degree — public profile will not show mobile.'**
  String get profileFindHint;

  /// No description provided for @profileEditPro.
  ///
  /// In en, this message translates to:
  /// **'Edit professional profile'**
  String get profileEditPro;

  /// No description provided for @profileAppLock.
  ///
  /// In en, this message translates to:
  /// **'App lock'**
  String get profileAppLock;

  /// No description provided for @profileLockFail.
  ///
  /// In en, this message translates to:
  /// **'Biometric/PIN was not verified'**
  String get profileLockFail;

  /// No description provided for @profileDevicePin.
  ///
  /// In en, this message translates to:
  /// **'Device PIN / biometric'**
  String get profileDevicePin;

  /// No description provided for @profileLogoutAsk.
  ///
  /// In en, this message translates to:
  /// **'Log out?'**
  String get profileLogoutAsk;

  /// No description provided for @teamNoLogs.
  ///
  /// In en, this message translates to:
  /// **'No logs'**
  String get teamNoLogs;

  /// No description provided for @teamLogsFailed.
  ///
  /// In en, this message translates to:
  /// **'Logs did not load'**
  String get teamLogsFailed;

  /// No description provided for @teamDigestEmail.
  ///
  /// In en, this message translates to:
  /// **'Email: {note}'**
  String teamDigestEmail(String note);

  /// No description provided for @teamDigestFailed.
  ///
  /// In en, this message translates to:
  /// **'Weekly digest did not load (need network)'**
  String get teamDigestFailed;

  /// No description provided for @teamUpdateFailed.
  ///
  /// In en, this message translates to:
  /// **'Update failed'**
  String get teamUpdateFailed;

  /// No description provided for @teamWorkspaceTitle.
  ///
  /// In en, this message translates to:
  /// **'Workspace'**
  String get teamWorkspaceTitle;

  /// No description provided for @teamWorkspaceHint.
  ///
  /// In en, this message translates to:
  /// **'Switching changes cases, clients, cause list and calendar.'**
  String get teamWorkspaceHint;

  /// No description provided for @teamNoWorkspace.
  ///
  /// In en, this message translates to:
  /// **'No workspace'**
  String get teamNoWorkspace;

  /// No description provided for @teamKindChamber.
  ///
  /// In en, this message translates to:
  /// **'Chamber'**
  String get teamKindChamber;

  /// No description provided for @teamKindPersonal.
  ///
  /// In en, this message translates to:
  /// **'Personal'**
  String get teamKindPersonal;

  /// No description provided for @resourcesTitle.
  ///
  /// In en, this message translates to:
  /// **'Legal resources'**
  String get resourcesTitle;

  /// No description provided for @resourcesActs.
  ///
  /// In en, this message translates to:
  /// **'Acts / sections'**
  String get resourcesActs;

  /// No description provided for @resourcesActsSub.
  ///
  /// In en, this message translates to:
  /// **'Master pack; otherwise bdlaws'**
  String get resourcesActsSub;

  /// No description provided for @resourcesDailyLaw.
  ///
  /// In en, this message translates to:
  /// **'Law Daily'**
  String get resourcesDailyLaw;

  /// No description provided for @resourcesDailyLawSub.
  ///
  /// In en, this message translates to:
  /// **'Essential laws, sites and news — Law Daily tabs'**
  String get resourcesDailyLawSub;

  /// No description provided for @resourcesNews.
  ///
  /// In en, this message translates to:
  /// **'Legal news'**
  String get resourcesNews;

  /// No description provided for @resourcesNewsSub.
  ///
  /// In en, this message translates to:
  /// **'Familiar newspaper sites — not a live feed'**
  String get resourcesNewsSub;

  /// No description provided for @resourcesForms.
  ///
  /// In en, this message translates to:
  /// **'Court forms'**
  String get resourcesForms;

  /// No description provided for @resourcesFormsSub.
  ///
  /// In en, this message translates to:
  /// **'Drafts following public CPC / Court Fees blanks'**
  String get resourcesFormsSub;

  /// No description provided for @resourcesGovt.
  ///
  /// In en, this message translates to:
  /// **'Government services'**
  String get resourcesGovt;

  /// No description provided for @resourcesActsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Section list is empty'**
  String get resourcesActsEmptyTitle;

  /// No description provided for @resourcesActsEmptySub.
  ///
  /// In en, this message translates to:
  /// **'They appear here after the master pack syncs. There is no full Bare Acts corpus — use the bdlaws link.'**
  String get resourcesActsEmptySub;

  /// No description provided for @resourcesDailyBody.
  ///
  /// In en, this message translates to:
  /// **'Streak: {n} days. Same count as Career Hub. Full lessons appear here after ingest. Nothing is shown without a source.'**
  String resourcesDailyBody(String n);

  /// No description provided for @resourcesNewsBody.
  ///
  /// In en, this message translates to:
  /// **'Hand-picked backlog is empty — no live news pipeline (doc 41).'**
  String get resourcesNewsBody;

  /// No description provided for @resourcesFormsBody.
  ///
  /// In en, this message translates to:
  /// **'Core form set is not entered yet. Open bdlaws / court forms outside the app.'**
  String get resourcesFormsBody;

  /// No description provided for @resourcesGovtEmpty.
  ///
  /// In en, this message translates to:
  /// **'List is empty without network — open again later.'**
  String get resourcesGovtEmpty;

  /// No description provided for @resourcesSourceChip.
  ///
  /// In en, this message translates to:
  /// **'Source · lawyer-diary master pack · verify: pack version'**
  String get resourcesSourceChip;

  /// No description provided for @resourcesEffectiveMissing.
  ///
  /// In en, this message translates to:
  /// **'Effective date: not in the source (master JSON/column empty — not a guess).'**
  String get resourcesEffectiveMissing;

  /// No description provided for @resourcesEffective.
  ///
  /// In en, this message translates to:
  /// **'Effective date: {date}'**
  String resourcesEffective(String date);

  /// No description provided for @resourcesSectionsEmpty.
  ///
  /// In en, this message translates to:
  /// **'Section list is empty — use the bdlaws fallback.'**
  String get resourcesSectionsEmpty;

  /// No description provided for @resourcesSectionPrefix.
  ///
  /// In en, this message translates to:
  /// **'Section {n}'**
  String resourcesSectionPrefix(String n);

  /// No description provided for @resourcesTextMissing.
  ///
  /// In en, this message translates to:
  /// **'Text has not been ingested.'**
  String get resourcesTextMissing;

  /// No description provided for @resourcesRelatedEmpty.
  ///
  /// In en, this message translates to:
  /// **'No related links yet — none are added without a verified source.'**
  String get resourcesRelatedEmpty;

  /// No description provided for @resourcesActFallback.
  ///
  /// In en, this message translates to:
  /// **'Act'**
  String get resourcesActFallback;

  /// No description provided for @conflictTitle.
  ///
  /// In en, this message translates to:
  /// **'Sync conflict'**
  String get conflictTitle;

  /// No description provided for @conflictEmpty.
  ///
  /// In en, this message translates to:
  /// **'No conflicts'**
  String get conflictEmpty;

  /// No description provided for @conflictBody.
  ///
  /// In en, this message translates to:
  /// **'The server has a newer version. Your local edit was not dropped.'**
  String get conflictBody;

  /// No description provided for @conflictKeepLocal.
  ///
  /// In en, this message translates to:
  /// **'Keep local'**
  String get conflictKeepLocal;

  /// No description provided for @conflictTakeServer.
  ///
  /// In en, this message translates to:
  /// **'Take server'**
  String get conflictTakeServer;

  /// No description provided for @conflictClear.
  ///
  /// In en, this message translates to:
  /// **'Review done — clear the list'**
  String get conflictClear;

  /// No description provided for @conflictKeepQueued.
  ///
  /// In en, this message translates to:
  /// **'Local queued again — goes on the next sync'**
  String get conflictKeepQueued;

  /// No description provided for @conflictServerPulled.
  ///
  /// In en, this message translates to:
  /// **'Server version pulled'**
  String get conflictServerPulled;

  /// No description provided for @dbKeyTitle.
  ///
  /// In en, this message translates to:
  /// **'Database would not open'**
  String get dbKeyTitle;

  /// No description provided for @dbKeyTitleShort.
  ///
  /// In en, this message translates to:
  /// **'Database'**
  String get dbKeyTitleShort;

  /// No description provided for @dbKeyWipeConfirm.
  ///
  /// In en, this message translates to:
  /// **'Type WIPE to confirm'**
  String get dbKeyWipeConfirm;

  /// No description provided for @dbKeyCipherMissing.
  ///
  /// In en, this message translates to:
  /// **'This build has no sqlite3mc, but an encrypted database is present. The file was not deleted. Install a previous working APK.'**
  String get dbKeyCipherMissing;

  /// No description provided for @dbKeyUnlockFail.
  ///
  /// In en, this message translates to:
  /// **'The encrypted local database could not be unlocked after a secure-key reset. Your diary file was not deleted. Tap Try again, or wipe local data and sync from the server.'**
  String get dbKeyUnlockFail;

  /// No description provided for @dbKeySecureReset.
  ///
  /// In en, this message translates to:
  /// **'Secure storage was reset. Tap Try again — you may need to log in.'**
  String get dbKeySecureReset;

  /// No description provided for @dbKeyRetry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get dbKeyRetry;

  /// No description provided for @dbKeyWipeHint.
  ///
  /// In en, this message translates to:
  /// **'Last resort: delete the local database and sync from the server. Type WIPE'**
  String get dbKeyWipeHint;

  /// No description provided for @dbKeyWiping.
  ///
  /// In en, this message translates to:
  /// **'Wiping…'**
  String get dbKeyWiping;

  /// No description provided for @dbKeyWipeOpen.
  ///
  /// In en, this message translates to:
  /// **'Wipe and open again'**
  String get dbKeyWipeOpen;

  /// No description provided for @backupExportFail.
  ///
  /// In en, this message translates to:
  /// **'Export failed: {error}'**
  String backupExportFail(String error);

  /// No description provided for @inboxEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No notifications'**
  String get inboxEmptyTitle;

  /// No description provided for @inboxEmptySub.
  ///
  /// In en, this message translates to:
  /// **'Hearings, files and subscription news will appear here'**
  String get inboxEmptySub;

  /// No description provided for @versionTitle.
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get versionTitle;

  /// No description provided for @commonOk.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get commonOk;

  /// No description provided for @nextDateSelect.
  ///
  /// In en, this message translates to:
  /// **'Select next date'**
  String get nextDateSelect;

  /// No description provided for @ajaxHint.
  ///
  /// In en, this message translates to:
  /// **'Type to search — the list appears below'**
  String get ajaxHint;

  /// No description provided for @ajaxManage.
  ///
  /// In en, this message translates to:
  /// **'Add / edit'**
  String get ajaxManage;

  /// No description provided for @searchHintShort.
  ///
  /// In en, this message translates to:
  /// **'Search…'**
  String get searchHintShort;

  /// No description provided for @pickerWriteOwn.
  ///
  /// In en, this message translates to:
  /// **'Write yourself: {q}'**
  String pickerWriteOwn(String q);

  /// No description provided for @pickerNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing found'**
  String get pickerNone;

  /// No description provided for @errorHappened.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get errorHappened;

  /// No description provided for @errorRetry.
  ///
  /// In en, this message translates to:
  /// **'Please try again'**
  String get errorRetry;

  /// No description provided for @useAiBody.
  ///
  /// In en, this message translates to:
  /// **'If the case is hard to follow, open AI here. ChatGPT stays inside the app.'**
  String get useAiBody;

  /// No description provided for @useAiButton.
  ///
  /// In en, this message translates to:
  /// **'Use AI'**
  String get useAiButton;

  /// No description provided for @homeLawGlance.
  ///
  /// In en, this message translates to:
  /// **'Glance at this law'**
  String get homeLawGlance;

  /// No description provided for @homeLawForClient.
  ///
  /// In en, this message translates to:
  /// **'{law} — useful in {name}’s case'**
  String homeLawForClient(String law, String name);

  /// No description provided for @practicePetitions.
  ///
  /// In en, this message translates to:
  /// **'Petitions / applications'**
  String get practicePetitions;

  /// No description provided for @practiceCalcs.
  ///
  /// In en, this message translates to:
  /// **'Fee / calculator'**
  String get practiceCalcs;

  /// No description provided for @tmplBail.
  ///
  /// In en, this message translates to:
  /// **'Bail petition'**
  String get tmplBail;

  /// No description provided for @tmplHajira.
  ///
  /// In en, this message translates to:
  /// **'Appearance petition'**
  String get tmplHajira;

  /// No description provided for @tmplTime.
  ///
  /// In en, this message translates to:
  /// **'Time petition'**
  String get tmplTime;

  /// No description provided for @tmplPlaint.
  ///
  /// In en, this message translates to:
  /// **'Civil plaint'**
  String get tmplPlaint;

  /// No description provided for @statTotalCases.
  ///
  /// In en, this message translates to:
  /// **'Total cases'**
  String get statTotalCases;

  /// No description provided for @statDisposedCases.
  ///
  /// In en, this message translates to:
  /// **'Disposed cases'**
  String get statDisposedCases;

  /// No description provided for @statCancelledCases.
  ///
  /// In en, this message translates to:
  /// **'Cancelled cases'**
  String get statCancelledCases;

  /// No description provided for @statActiveCases.
  ///
  /// In en, this message translates to:
  /// **'Ongoing cases'**
  String get statActiveCases;

  /// No description provided for @printDiaryTitle.
  ///
  /// In en, this message translates to:
  /// **'Monthly / weekly diary print'**
  String get printDiaryTitle;

  /// No description provided for @printDiarySub.
  ///
  /// In en, this message translates to:
  /// **'Clients, cases, income and expense — PDF'**
  String get printDiarySub;

  /// No description provided for @printMonthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get printMonthly;

  /// No description provided for @printWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get printWeekly;

  /// No description provided for @printMonthLabel.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get printMonthLabel;

  /// No description provided for @printYearLabel.
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get printYearLabel;

  /// No description provided for @printWeekRange.
  ///
  /// In en, this message translates to:
  /// **'Sun {a}–Thu {b} {month} {year}'**
  String printWeekRange(String a, String b, String month, String year);

  /// No description provided for @printWeekOff.
  ///
  /// In en, this message translates to:
  /// **'Fri–Sat off (gazette holidays are separate)'**
  String get printWeekOff;

  /// No description provided for @printNeedOne.
  ///
  /// In en, this message translates to:
  /// **'Pick at least one'**
  String get printNeedOne;

  /// No description provided for @printNeedLogin.
  ///
  /// In en, this message translates to:
  /// **'PDF needs login and network'**
  String get printNeedLogin;

  /// No description provided for @printFail.
  ///
  /// In en, this message translates to:
  /// **'Problem: {error}'**
  String printFail(String error);

  /// No description provided for @printPdfMake.
  ///
  /// In en, this message translates to:
  /// **'Make PDF'**
  String get printPdfMake;

  /// No description provided for @printServerHonest.
  ///
  /// In en, this message translates to:
  /// **'Today’s server PDF is cases/hearings; income-expense is sent in the query — the web app will match later.'**
  String get printServerHonest;

  /// No description provided for @printIncludeIncome.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get printIncludeIncome;

  /// No description provided for @printIncludeExpense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get printIncludeExpense;

  /// No description provided for @monthJan.
  ///
  /// In en, this message translates to:
  /// **'January'**
  String get monthJan;

  /// No description provided for @monthFeb.
  ///
  /// In en, this message translates to:
  /// **'February'**
  String get monthFeb;

  /// No description provided for @monthMar.
  ///
  /// In en, this message translates to:
  /// **'March'**
  String get monthMar;

  /// No description provided for @monthApr.
  ///
  /// In en, this message translates to:
  /// **'April'**
  String get monthApr;

  /// No description provided for @monthMay.
  ///
  /// In en, this message translates to:
  /// **'May'**
  String get monthMay;

  /// No description provided for @monthJun.
  ///
  /// In en, this message translates to:
  /// **'June'**
  String get monthJun;

  /// No description provided for @monthJul.
  ///
  /// In en, this message translates to:
  /// **'July'**
  String get monthJul;

  /// No description provided for @monthAug.
  ///
  /// In en, this message translates to:
  /// **'August'**
  String get monthAug;

  /// No description provided for @monthSep.
  ///
  /// In en, this message translates to:
  /// **'September'**
  String get monthSep;

  /// No description provided for @monthOct.
  ///
  /// In en, this message translates to:
  /// **'October'**
  String get monthOct;

  /// No description provided for @monthNov.
  ///
  /// In en, this message translates to:
  /// **'November'**
  String get monthNov;

  /// No description provided for @monthDec.
  ///
  /// In en, this message translates to:
  /// **'December'**
  String get monthDec;

  /// No description provided for @printShortInfo.
  ///
  /// In en, this message translates to:
  /// **'Short information'**
  String get printShortInfo;

  /// No description provided for @printAllInfo.
  ///
  /// In en, this message translates to:
  /// **'All information'**
  String get printAllInfo;

  /// No description provided for @printSharePdf.
  ///
  /// In en, this message translates to:
  /// **'Share / print PDF'**
  String get printSharePdf;

  /// No description provided for @printShareWa.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp / share sheet'**
  String get printShareWa;

  /// No description provided for @scanPdfTitle.
  ///
  /// In en, this message translates to:
  /// **'PDF scanner'**
  String get scanPdfTitle;

  /// No description provided for @scanKindLabel.
  ///
  /// In en, this message translates to:
  /// **'File type'**
  String get scanKindLabel;

  /// No description provided for @scanPagePreview.
  ///
  /// In en, this message translates to:
  /// **'Page preview'**
  String get scanPagePreview;

  /// No description provided for @scanPageName.
  ///
  /// In en, this message translates to:
  /// **'Page name'**
  String get scanPageName;

  /// No description provided for @scanPageN.
  ///
  /// In en, this message translates to:
  /// **'Page {n}'**
  String scanPageN(String n);

  /// No description provided for @scanFileName.
  ///
  /// In en, this message translates to:
  /// **'File name'**
  String get scanFileName;

  /// No description provided for @scanCamera.
  ///
  /// In en, this message translates to:
  /// **'Camera'**
  String get scanCamera;

  /// No description provided for @scanGallery.
  ///
  /// In en, this message translates to:
  /// **'Gallery'**
  String get scanGallery;

  /// No description provided for @scanPdfShare.
  ///
  /// In en, this message translates to:
  /// **'Scan PDF'**
  String get scanPdfShare;

  /// No description provided for @scanFailed.
  ///
  /// In en, this message translates to:
  /// **'Scan failed: {error}'**
  String scanFailed(String error);

  /// No description provided for @scanSavePdf.
  ///
  /// In en, this message translates to:
  /// **'Save PDF'**
  String get scanSavePdf;

  /// No description provided for @scanUploadBtn.
  ///
  /// In en, this message translates to:
  /// **'Upload file'**
  String get scanUploadBtn;

  /// No description provided for @scanDeleteItem.
  ///
  /// In en, this message translates to:
  /// **'Delete · {title}'**
  String scanDeleteItem(String title);

  /// No description provided for @evidenceKindsHint.
  ///
  /// In en, this message translates to:
  /// **'Petition, Order, Judgment, FIR, Complaint, Evidence, Supporting paper, other Documents.'**
  String get evidenceKindsHint;

  /// No description provided for @courtDirTitle.
  ///
  /// In en, this message translates to:
  /// **'Dhaka judges’ court'**
  String get courtDirTitle;

  /// No description provided for @courtDirHint.
  ///
  /// In en, this message translates to:
  /// **'Search court, room or bench…'**
  String get courtDirHint;

  /// No description provided for @courtDirBuildings.
  ///
  /// In en, this message translates to:
  /// **'{n} buildings listed'**
  String courtDirBuildings(String n);

  /// No description provided for @courtDirJurisdiction.
  ///
  /// In en, this message translates to:
  /// **'Jurisdiction'**
  String get courtDirJurisdiction;

  /// No description provided for @courtDirRooms.
  ///
  /// In en, this message translates to:
  /// **'{n} rooms'**
  String courtDirRooms(String n);

  /// No description provided for @scheduleHonestBanner.
  ///
  /// In en, this message translates to:
  /// **'Schedule inventory ~40 rows: NBR individual slabs + Constitution 7 schedules (bdlaws Schedule PDF) + Court Fees act-21 PDF extract (15 Sep 2026). CPC/CrPC schedule tables still not on HTML — MBC not copied. Court-fee calculator remains indicative.'**
  String get scheduleHonestBanner;

  /// No description provided for @scheduleOfficialLinks.
  ///
  /// In en, this message translates to:
  /// **'Official links'**
  String get scheduleOfficialLinks;

  /// No description provided for @scheduleOfficialBody.
  ///
  /// In en, this message translates to:
  /// **'Constitution BN: https://bdlaws.minlaw.gov.bd/act-details-957.html\nLimitation HTML: https://bdlaws.minlaw.gov.bd/act-88.html\nLimitation First Schedule PDF: http://old.bdlaws.minlaw.gov.bd/upload/bdcodeact/2023-12-03-13-53-47-95.-The-Limitation-Act,-1908.pdf\nCourt Fees: https://bdlaws.minlaw.gov.bd/act-21.html\nCPC: https://bdlaws.minlaw.gov.bd/act-86.html\nNBR Nirdeshika 2026-27: nbr.gov.bd publications'**
  String get scheduleOfficialBody;

  /// No description provided for @scheduleOpenCourtFee.
  ///
  /// In en, this message translates to:
  /// **'Open court-fee calculator'**
  String get scheduleOpenCourtFee;

  /// No description provided for @scheduleOpenStamp.
  ///
  /// In en, this message translates to:
  /// **'Stamp reference'**
  String get scheduleOpenStamp;

  /// No description provided for @scheduleOpenLimit.
  ///
  /// In en, this message translates to:
  /// **'Open limitation calculator'**
  String get scheduleOpenLimit;

  /// No description provided for @calcPctOf.
  ///
  /// In en, this message translates to:
  /// **'X% of Y'**
  String get calcPctOf;

  /// No description provided for @calcPctIs.
  ///
  /// In en, this message translates to:
  /// **'X is % of Y'**
  String get calcPctIs;

  /// No description provided for @calcPctResultOf.
  ///
  /// In en, this message translates to:
  /// **'{a}% of {b} = {c}'**
  String calcPctResultOf(String a, String b, String c);

  /// No description provided for @calcPctResultIs.
  ///
  /// In en, this message translates to:
  /// **'{a} = {c}% of {b}'**
  String calcPctResultIs(String a, String b, String c);

  /// No description provided for @linkCopied.
  ///
  /// In en, this message translates to:
  /// **'Link copied'**
  String get linkCopied;

  /// No description provided for @otherSiteTitle.
  ///
  /// In en, this message translates to:
  /// **'Another site'**
  String get otherSiteTitle;

  /// No description provided for @otherSiteBody.
  ///
  /// In en, this message translates to:
  /// **'You are going to {host}. Continue?'**
  String otherSiteBody(String host);

  /// No description provided for @oauthWebviewBlocked.
  ///
  /// In en, this message translates to:
  /// **'Google login is blocked in the WebView — open Custom Tab / browser'**
  String get oauthWebviewBlocked;

  /// No description provided for @openAction.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get openAction;

  /// No description provided for @loginPopup.
  ///
  /// In en, this message translates to:
  /// **'Login / popup'**
  String get loginPopup;

  /// No description provided for @openCustomTab.
  ///
  /// In en, this message translates to:
  /// **'Open in Custom Tab'**
  String get openCustomTab;

  /// No description provided for @openBrowser.
  ///
  /// In en, this message translates to:
  /// **'Open in browser'**
  String get openBrowser;

  /// No description provided for @calcPctX.
  ///
  /// In en, this message translates to:
  /// **'X'**
  String get calcPctX;

  /// No description provided for @calcPctY.
  ///
  /// In en, this message translates to:
  /// **'Y'**
  String get calcPctY;

  /// No description provided for @calcPctXPercent.
  ///
  /// In en, this message translates to:
  /// **'X %'**
  String get calcPctXPercent;

  /// No description provided for @causeAttendOk.
  ///
  /// In en, this message translates to:
  /// **'Attendance recorded'**
  String get causeAttendOk;

  /// No description provided for @causeNoteTitle.
  ///
  /// In en, this message translates to:
  /// **'Add note'**
  String get causeNoteTitle;

  /// No description provided for @causeNoteHint.
  ///
  /// In en, this message translates to:
  /// **'New line — old notes stay'**
  String get causeNoteHint;

  /// No description provided for @causePdfNeedLogin.
  ///
  /// In en, this message translates to:
  /// **'PDF needs login and internet'**
  String get causePdfNeedLogin;

  /// No description provided for @causePdfFail.
  ///
  /// In en, this message translates to:
  /// **'PDF failed — check net/server; CSV works offline'**
  String get causePdfFail;

  /// No description provided for @causeOfficialInApp.
  ///
  /// In en, this message translates to:
  /// **'Official e-Causelist (in app)'**
  String get causeOfficialInApp;

  /// No description provided for @causeCourtDir.
  ///
  /// In en, this message translates to:
  /// **'Court location / room guide'**
  String get causeCourtDir;

  /// No description provided for @causeOpenBrowser.
  ///
  /// In en, this message translates to:
  /// **'Open in browser'**
  String get causeOpenBrowser;

  /// No description provided for @causeSharePdf.
  ///
  /// In en, this message translates to:
  /// **'Share this date as PDF'**
  String get causeSharePdf;

  /// No description provided for @causeShareCsv.
  ///
  /// In en, this message translates to:
  /// **'Share this date as CSV'**
  String get causeShareCsv;

  /// No description provided for @causeEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No cases of mine on this date'**
  String get causeEmptyTitle;

  /// No description provided for @causeEmptySub.
  ///
  /// In en, this message translates to:
  /// **'Official cause-list is not synced — only your nextDate'**
  String get causeEmptySub;

  /// No description provided for @causeAttend.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get causeAttend;

  /// No description provided for @causeNextDate.
  ///
  /// In en, this message translates to:
  /// **'Next date'**
  String get causeNextDate;

  /// No description provided for @causeNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get causeNote;

  /// No description provided for @causeOrder.
  ///
  /// In en, this message translates to:
  /// **'Order'**
  String get causeOrder;

  /// No description provided for @causeClient.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get causeClient;

  /// No description provided for @messagingClientSms.
  ///
  /// In en, this message translates to:
  /// **'Client SMS'**
  String get messagingClientSms;

  /// No description provided for @messagingOwnerWa.
  ///
  /// In en, this message translates to:
  /// **'Owner WhatsApp'**
  String get messagingOwnerWa;

  /// No description provided for @messagingClientSmsHint.
  ///
  /// In en, this message translates to:
  /// **'Manual client SMS opens the phone SMS app. Auto D-1 still uses the device job when keys exist — it does not send from this box.'**
  String get messagingClientSmsHint;

  /// No description provided for @messagingOwnerWaHint.
  ///
  /// In en, this message translates to:
  /// **'Lawyer-only WhatsApp via wa.me (you tap). Auto WABA send is removed.'**
  String get messagingOwnerWaHint;

  /// No description provided for @messagingOpenDeviceSms.
  ///
  /// In en, this message translates to:
  /// **'Open device SMS'**
  String get messagingOpenDeviceSms;

  /// No description provided for @messagingOpenWa.
  ///
  /// In en, this message translates to:
  /// **'Open WhatsApp'**
  String get messagingOpenWa;

  /// No description provided for @messagingNeedPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter a mobile number'**
  String get messagingNeedPhone;

  /// No description provided for @messagingLogTitle.
  ///
  /// In en, this message translates to:
  /// **'Last send log (this phone)'**
  String get messagingLogTitle;

  /// No description provided for @messagingAdvanced.
  ///
  /// In en, this message translates to:
  /// **'Bulk / adapter (advanced)'**
  String get messagingAdvanced;

  /// No description provided for @messagingClientSmsOn.
  ///
  /// In en, this message translates to:
  /// **'Allow auto client SMS (D-1 job)'**
  String get messagingClientSmsOn;

  /// No description provided for @messagingOwnerWaOn.
  ///
  /// In en, this message translates to:
  /// **'Show owner WhatsApp wa.me (not auto-send)'**
  String get messagingOwnerWaOn;

  /// No description provided for @commSectionClient.
  ///
  /// In en, this message translates to:
  /// **'Client SMS'**
  String get commSectionClient;

  /// No description provided for @commSectionOwner.
  ///
  /// In en, this message translates to:
  /// **'Owner WhatsApp'**
  String get commSectionOwner;

  /// No description provided for @dashToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get dashToday;

  /// No description provided for @dashTodayLine.
  ///
  /// In en, this message translates to:
  /// **'Today: collected ৳ {recv} · expense ৳ {exp}'**
  String dashTodayLine(String recv, String exp);

  /// No description provided for @onboardingBrand.
  ///
  /// In en, this message translates to:
  /// **'Lawyer Diary'**
  String get onboardingBrand;

  /// No description provided for @onboardingCountry.
  ///
  /// In en, this message translates to:
  /// **'Bangladesh'**
  String get onboardingCountry;

  /// No description provided for @onboardingPickLang.
  ///
  /// In en, this message translates to:
  /// **'Choose app language'**
  String get onboardingPickLang;

  /// No description provided for @onboardingStart.
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get onboardingStart;

  /// No description provided for @aiTitle.
  ///
  /// In en, this message translates to:
  /// **'AI assistant'**
  String get aiTitle;

  /// No description provided for @aiDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'Case-aware AI is off without a key. No legal advice is invented. This is not a substitute for a lawyer.'**
  String get aiDisclaimer;

  /// No description provided for @aiPromptLabel.
  ///
  /// In en, this message translates to:
  /// **'Question (sends only if a key exists)'**
  String get aiPromptLabel;

  /// No description provided for @aiAsk.
  ///
  /// In en, this message translates to:
  /// **'Ask'**
  String get aiAsk;

  /// No description provided for @ocrTitle.
  ///
  /// In en, this message translates to:
  /// **'Scan / OCR'**
  String get ocrTitle;

  /// No description provided for @ocrDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'CAMERA is not in v1 cloud OCR. Without OCR_API_URL no text is extracted — no fake output.'**
  String get ocrDisclaimer;

  /// No description provided for @ocrNeedCamera.
  ///
  /// In en, this message translates to:
  /// **'OCR key is present, but a photo cannot be taken without CAMERA.'**
  String get ocrNeedCamera;

  /// No description provided for @ocrStatus.
  ///
  /// In en, this message translates to:
  /// **'Check OCR status'**
  String get ocrStatus;

  /// No description provided for @courtDirCrCognizance.
  ///
  /// In en, this message translates to:
  /// **'CR cognizance courts'**
  String get courtDirCrCognizance;

  /// No description provided for @waTplHearing.
  ///
  /// In en, this message translates to:
  /// **'Hearing reminder'**
  String get waTplHearing;

  /// No description provided for @waTplFee.
  ///
  /// In en, this message translates to:
  /// **'Fee reminder'**
  String get waTplFee;

  /// No description provided for @waTplGeneral.
  ///
  /// In en, this message translates to:
  /// **'General message'**
  String get waTplGeneral;

  /// No description provided for @waComposeTitle.
  ///
  /// In en, this message translates to:
  /// **'Write message'**
  String get waComposeTitle;

  /// No description provided for @waComposeHint.
  ///
  /// In en, this message translates to:
  /// **'Add the rest of the message after the template'**
  String get waComposeHint;

  /// No description provided for @lawDailyEmptySearch.
  ///
  /// In en, this message translates to:
  /// **'No act or section matches this search'**
  String get lawDailyEmptySearch;

  /// No description provided for @lawDailyEmptySearchSub.
  ///
  /// In en, this message translates to:
  /// **'Try a section number or the act’s short name. Full statute text is on bdlaws.'**
  String get lawDailyEmptySearchSub;

  /// No description provided for @hybridReload.
  ///
  /// In en, this message translates to:
  /// **'Reload'**
  String get hybridReload;

  /// No description provided for @hybridForward.
  ///
  /// In en, this message translates to:
  /// **'Forward'**
  String get hybridForward;

  /// No description provided for @whatsAppLabel.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get whatsAppLabel;

  /// No description provided for @forgotPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'01XXXXXXXXX'**
  String get forgotPhoneLabel;

  /// No description provided for @forgotInvalidPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid Bangladesh mobile number.'**
  String get forgotInvalidPhone;

  /// No description provided for @forgotInvalidOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code.'**
  String get forgotInvalidOtp;

  /// No description provided for @forgotWeakPassword.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters.'**
  String get forgotWeakPassword;

  /// No description provided for @forgotNetwork.
  ///
  /// In en, this message translates to:
  /// **'Network error. Try again.'**
  String get forgotNetwork;

  /// No description provided for @messagingWabaReady.
  ///
  /// In en, this message translates to:
  /// **'Auto WhatsApp (WABA) is unused — SIM SMS only.'**
  String get messagingWabaReady;

  /// No description provided for @messagingWabaEmpty.
  ///
  /// In en, this message translates to:
  /// **'Auto WhatsApp removed. Manual wa.me still works.'**
  String get messagingWabaEmpty;

  /// No description provided for @commQuotaZero.
  ///
  /// In en, this message translates to:
  /// **'No SMS credits left this month (local count).'**
  String get commQuotaZero;

  /// No description provided for @commAdapterFailed.
  ///
  /// In en, this message translates to:
  /// **'Gateway did not accept this SMS.'**
  String get commAdapterFailed;

  /// No description provided for @templateListDisclaimer.
  ///
  /// In en, this message translates to:
  /// **'MAMLAQ drafts — structure follows public CPC/Court Fees blanks; not a gazette form. Verify law and facts before filing.'**
  String get templateListDisclaimer;

  /// No description provided for @templateGenerateOff.
  ///
  /// In en, this message translates to:
  /// **'PDF generate is off — not advocate-approved. Educational fields: {fields}'**
  String templateGenerateOff(String fields);

  /// No description provided for @templatePendingReview.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get templatePendingReview;

  /// No description provided for @templateEduChip.
  ///
  /// In en, this message translates to:
  /// **'Educational · {version} · verify before filing'**
  String templateEduChip(String version);

  /// No description provided for @conflictOpLine.
  ///
  /// In en, this message translates to:
  /// **'op {id} · server v{ver}'**
  String conflictOpLine(String id, String ver);

  /// No description provided for @teamDefaultName.
  ///
  /// In en, this message translates to:
  /// **'Chamber'**
  String get teamDefaultName;

  /// No description provided for @calToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get calToday;

  /// No description provided for @calDaysCount.
  ///
  /// In en, this message translates to:
  /// **'{count} days'**
  String calDaysCount(int count);

  /// No description provided for @bdlawsSource.
  ///
  /// In en, this message translates to:
  /// **'Source: bdlaws.minlaw.gov.bd'**
  String get bdlawsSource;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bn', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppLocalizationsBn();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
