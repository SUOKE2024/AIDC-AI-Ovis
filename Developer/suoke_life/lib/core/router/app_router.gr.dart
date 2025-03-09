// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'app_router.dart';

abstract class _$AppRouter extends RootStackRouter {
  // ignore: unused_element
  _$AppRouter({super.navigatorKey});

  @override
  final Map<String, PageFactory> pagesMap = {
    ChatRoute.name: (routeData) {
      final args = routeData.argsAs<ChatRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: ChatPage(
          key: args.key,
          contactName: args.contactName,
          contactAvatar: args.contactAvatar,
          isAI: args.isAI,
        ),
      );
    },
    ConstitutionAssessmentRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ConstitutionAssessmentPage(),
      );
    },
    ConstitutionResultRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ConstitutionResultPage(),
      );
    },
    DesignSystemShowcaseRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const DesignSystemShowcasePage(),
      );
    },
    ExplorationDetailRoute.name: (routeData) {
      final args = routeData.argsAs<ExplorationDetailRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: ExplorationDetailPage(
          key: args.key,
          item: args.item,
        ),
      );
    },
    ExploreRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ExplorePage(),
      );
    },
    HealthRegimenRoute.name: (routeData) {
      final args = routeData.argsAs<HealthRegimenRouteArgs>();
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: HealthRegimenPage(
          key: args.key,
          constitutionTypeStr: args.constitutionTypeStr,
        ),
      );
    },
    HomeRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const HomePage(),
      );
    },
    LifeRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const LifePage(),
      );
    },
    LoginRoute.name: (routeData) {
      final args = routeData.argsAs<LoginRouteArgs>(
          orElse: () => const LoginRouteArgs());
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: LoginPage(
          key: args.key,
          onLoginSuccess: args.onLoginSuccess,
        ),
      );
    },
    MainDashboardRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const MainDashboardPage(),
      );
    },
    NotFoundRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const NotFoundPage(),
      );
    },
    ProfileRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ProfilePage(),
      );
    },
    PulseDiagnosisRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const PulseDiagnosisPage(),
      );
    },
    SuokeRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const SuokePage(),
      );
    },
    ThemeSettingsRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const ThemeSettingsPage(),
      );
    },
    TongueDiagnosisRoute.name: (routeData) {
      final args = routeData.argsAs<TongueDiagnosisRouteArgs>(
          orElse: () => const TongueDiagnosisRouteArgs());
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: TongueDiagnosisPage(
          key: args.key,
          imagePath: args.imagePath,
        ),
      );
    },
    WelcomeRoute.name: (routeData) {
      return AutoRoutePage<dynamic>(
        routeData: routeData,
        child: const WelcomePage(),
      );
    },
  };
}

/// generated route for
/// [ChatPage]
class ChatRoute extends PageRouteInfo<ChatRouteArgs> {
  ChatRoute({
    Key? key,
    required String contactName,
    required String contactAvatar,
    bool isAI = false,
    List<PageRouteInfo>? children,
  }) : super(
          ChatRoute.name,
          args: ChatRouteArgs(
            key: key,
            contactName: contactName,
            contactAvatar: contactAvatar,
            isAI: isAI,
          ),
          initialChildren: children,
        );

  static const String name = 'ChatRoute';

  static const PageInfo<ChatRouteArgs> page = PageInfo<ChatRouteArgs>(name);
}

class ChatRouteArgs {
  const ChatRouteArgs({
    this.key,
    required this.contactName,
    required this.contactAvatar,
    this.isAI = false,
  });

  final Key? key;

  final String contactName;

  final String contactAvatar;

  final bool isAI;

  @override
  String toString() {
    return 'ChatRouteArgs{key: $key, contactName: $contactName, contactAvatar: $contactAvatar, isAI: $isAI}';
  }
}

/// generated route for
/// [ConstitutionAssessmentPage]
class ConstitutionAssessmentRoute extends PageRouteInfo<void> {
  const ConstitutionAssessmentRoute({List<PageRouteInfo>? children})
      : super(
          ConstitutionAssessmentRoute.name,
          initialChildren: children,
        );

  static const String name = 'ConstitutionAssessmentRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ConstitutionResultPage]
class ConstitutionResultRoute extends PageRouteInfo<void> {
  const ConstitutionResultRoute({List<PageRouteInfo>? children})
      : super(
          ConstitutionResultRoute.name,
          initialChildren: children,
        );

  static const String name = 'ConstitutionResultRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [DesignSystemShowcasePage]
class DesignSystemShowcaseRoute extends PageRouteInfo<void> {
  const DesignSystemShowcaseRoute({List<PageRouteInfo>? children})
      : super(
          DesignSystemShowcaseRoute.name,
          initialChildren: children,
        );

  static const String name = 'DesignSystemShowcaseRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ExplorationDetailPage]
class ExplorationDetailRoute extends PageRouteInfo<ExplorationDetailRouteArgs> {
  ExplorationDetailRoute({
    Key? key,
    required ExplorationItem item,
    List<PageRouteInfo>? children,
  }) : super(
          ExplorationDetailRoute.name,
          args: ExplorationDetailRouteArgs(
            key: key,
            item: item,
          ),
          initialChildren: children,
        );

  static const String name = 'ExplorationDetailRoute';

  static const PageInfo<ExplorationDetailRouteArgs> page =
      PageInfo<ExplorationDetailRouteArgs>(name);
}

class ExplorationDetailRouteArgs {
  const ExplorationDetailRouteArgs({
    this.key,
    required this.item,
  });

  final Key? key;

  final ExplorationItem item;

  @override
  String toString() {
    return 'ExplorationDetailRouteArgs{key: $key, item: $item}';
  }
}

/// generated route for
/// [ExplorePage]
class ExploreRoute extends PageRouteInfo<void> {
  const ExploreRoute({List<PageRouteInfo>? children})
      : super(
          ExploreRoute.name,
          initialChildren: children,
        );

  static const String name = 'ExploreRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [HealthRegimenPage]
class HealthRegimenRoute extends PageRouteInfo<HealthRegimenRouteArgs> {
  HealthRegimenRoute({
    Key? key,
    required String constitutionTypeStr,
    List<PageRouteInfo>? children,
  }) : super(
          HealthRegimenRoute.name,
          args: HealthRegimenRouteArgs(
            key: key,
            constitutionTypeStr: constitutionTypeStr,
          ),
          initialChildren: children,
        );

  static const String name = 'HealthRegimenRoute';

  static const PageInfo<HealthRegimenRouteArgs> page =
      PageInfo<HealthRegimenRouteArgs>(name);
}

class HealthRegimenRouteArgs {
  const HealthRegimenRouteArgs({
    this.key,
    required this.constitutionTypeStr,
  });

  final Key? key;

  final String constitutionTypeStr;

  @override
  String toString() {
    return 'HealthRegimenRouteArgs{key: $key, constitutionTypeStr: $constitutionTypeStr}';
  }
}

/// generated route for
/// [HomePage]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute({List<PageRouteInfo>? children})
      : super(
          HomeRoute.name,
          initialChildren: children,
        );

  static const String name = 'HomeRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [LifePage]
class LifeRoute extends PageRouteInfo<void> {
  const LifeRoute({List<PageRouteInfo>? children})
      : super(
          LifeRoute.name,
          initialChildren: children,
        );

  static const String name = 'LifeRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [LoginPage]
class LoginRoute extends PageRouteInfo<LoginRouteArgs> {
  LoginRoute({
    Key? key,
    void Function()? onLoginSuccess,
    List<PageRouteInfo>? children,
  }) : super(
          LoginRoute.name,
          args: LoginRouteArgs(
            key: key,
            onLoginSuccess: onLoginSuccess,
          ),
          initialChildren: children,
        );

  static const String name = 'LoginRoute';

  static const PageInfo<LoginRouteArgs> page = PageInfo<LoginRouteArgs>(name);
}

class LoginRouteArgs {
  const LoginRouteArgs({
    this.key,
    this.onLoginSuccess,
  });

  final Key? key;

  final void Function()? onLoginSuccess;

  @override
  String toString() {
    return 'LoginRouteArgs{key: $key, onLoginSuccess: $onLoginSuccess}';
  }
}

/// generated route for
/// [MainDashboardPage]
class MainDashboardRoute extends PageRouteInfo<void> {
  const MainDashboardRoute({List<PageRouteInfo>? children})
      : super(
          MainDashboardRoute.name,
          initialChildren: children,
        );

  static const String name = 'MainDashboardRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [NotFoundPage]
class NotFoundRoute extends PageRouteInfo<void> {
  const NotFoundRoute({List<PageRouteInfo>? children})
      : super(
          NotFoundRoute.name,
          initialChildren: children,
        );

  static const String name = 'NotFoundRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ProfilePage]
class ProfileRoute extends PageRouteInfo<void> {
  const ProfileRoute({List<PageRouteInfo>? children})
      : super(
          ProfileRoute.name,
          initialChildren: children,
        );

  static const String name = 'ProfileRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [PulseDiagnosisPage]
class PulseDiagnosisRoute extends PageRouteInfo<void> {
  const PulseDiagnosisRoute({List<PageRouteInfo>? children})
      : super(
          PulseDiagnosisRoute.name,
          initialChildren: children,
        );

  static const String name = 'PulseDiagnosisRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [SuokePage]
class SuokeRoute extends PageRouteInfo<void> {
  const SuokeRoute({List<PageRouteInfo>? children})
      : super(
          SuokeRoute.name,
          initialChildren: children,
        );

  static const String name = 'SuokeRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [ThemeSettingsPage]
class ThemeSettingsRoute extends PageRouteInfo<void> {
  const ThemeSettingsRoute({List<PageRouteInfo>? children})
      : super(
          ThemeSettingsRoute.name,
          initialChildren: children,
        );

  static const String name = 'ThemeSettingsRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}

/// generated route for
/// [TongueDiagnosisPage]
class TongueDiagnosisRoute extends PageRouteInfo<TongueDiagnosisRouteArgs> {
  TongueDiagnosisRoute({
    Key? key,
    String? imagePath,
    List<PageRouteInfo>? children,
  }) : super(
          TongueDiagnosisRoute.name,
          args: TongueDiagnosisRouteArgs(
            key: key,
            imagePath: imagePath,
          ),
          initialChildren: children,
        );

  static const String name = 'TongueDiagnosisRoute';

  static const PageInfo<TongueDiagnosisRouteArgs> page =
      PageInfo<TongueDiagnosisRouteArgs>(name);
}

class TongueDiagnosisRouteArgs {
  const TongueDiagnosisRouteArgs({
    this.key,
    this.imagePath,
  });

  final Key? key;

  final String? imagePath;

  @override
  String toString() {
    return 'TongueDiagnosisRouteArgs{key: $key, imagePath: $imagePath}';
  }
}

/// generated route for
/// [WelcomePage]
class WelcomeRoute extends PageRouteInfo<void> {
  const WelcomeRoute({List<PageRouteInfo>? children})
      : super(
          WelcomeRoute.name,
          initialChildren: children,
        );

  static const String name = 'WelcomeRoute';

  static const PageInfo<void> page = PageInfo<void>(name);
}
