import 'app_localizations.dart';

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  String get appName => 'Suoke Life';

  String get welcomeMessage => 'Welcome to Suoke Life App';

  String get homeTabTitle => 'Home';

  String get exploreTabTitle => 'Explore';

  String get suokeTabTitle => 'Suoke';

  String get lifeTabTitle => 'Life';

  String get profileTabTitle => 'Profile';

  @override
  String get appTitle => 'Suoke Life';

  @override
  String get greetingMessage => 'Hello, World!';
}
