import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of GeneratedAppLocalizations
/// returned by `GeneratedAppLocalizations.of(context)`.
///
/// Applications need to include `GeneratedAppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: GeneratedAppLocalizations.localizationsDelegates,
///   supportedLocales: GeneratedAppLocalizations.supportedLocales,
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
/// be consistent with the languages listed in the GeneratedAppLocalizations.supportedLocales
/// property.
abstract class GeneratedAppLocalizations {
  GeneratedAppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static GeneratedAppLocalizations? of(BuildContext context) {
    return Localizations.of<GeneratedAppLocalizations>(context, GeneratedAppLocalizations);
  }

  static const LocalizationsDelegate<GeneratedAppLocalizations> delegate = _GeneratedAppLocalizationsDelegate();

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
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('zh', 'CN'),
    Locale('en', 'US'),
    Locale('zh', 'TW'),
    Locale('ja', 'JP'),
    Locale('en'),
    Locale('zh')
  ];

  /// No description provided for @app_name.
  ///
  /// In zh_CN, this message translates to:
  /// **'索克生活'**
  String get app_name;

  /// No description provided for @welcome_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'欢迎来到索克生活'**
  String get welcome_title;

  /// No description provided for @welcome_message.
  ///
  /// In zh_CN, this message translates to:
  /// **'开始您的健康快乐生活之旅。'**
  String get welcome_message;

  /// No description provided for @login_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'登录'**
  String get login_button;

  /// No description provided for @register_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'注册'**
  String get register_button;

  /// No description provided for @logout_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'退出登录'**
  String get logout_button;

  /// No description provided for @forgot_password.
  ///
  /// In zh_CN, this message translates to:
  /// **'忘记密码'**
  String get forgot_password;

  /// No description provided for @reset_password.
  ///
  /// In zh_CN, this message translates to:
  /// **'重置密码'**
  String get reset_password;

  /// No description provided for @email.
  ///
  /// In zh_CN, this message translates to:
  /// **'邮箱'**
  String get email;

  /// No description provided for @password.
  ///
  /// In zh_CN, this message translates to:
  /// **'密码'**
  String get password;

  /// No description provided for @confirm_password.
  ///
  /// In zh_CN, this message translates to:
  /// **'确认密码'**
  String get confirm_password;

  /// No description provided for @username.
  ///
  /// In zh_CN, this message translates to:
  /// **'用户名'**
  String get username;

  /// No description provided for @nickname.
  ///
  /// In zh_CN, this message translates to:
  /// **'昵称'**
  String get nickname;

  /// No description provided for @phone.
  ///
  /// In zh_CN, this message translates to:
  /// **'手机号码'**
  String get phone;

  /// No description provided for @verification_code.
  ///
  /// In zh_CN, this message translates to:
  /// **'验证码'**
  String get verification_code;

  /// No description provided for @send_code.
  ///
  /// In zh_CN, this message translates to:
  /// **'发送验证码'**
  String get send_code;

  /// No description provided for @chat_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'聊天'**
  String get chat_title;

  /// No description provided for @life_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'生活'**
  String get life_title;

  /// No description provided for @explore_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'探索'**
  String get explore_title;

  /// No description provided for @suoke_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'索克'**
  String get suoke_title;

  /// No description provided for @profile_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'我的'**
  String get profile_title;

  /// No description provided for @settings_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'设置'**
  String get settings_title;

  /// No description provided for @edit_profile_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'编辑个人资料'**
  String get edit_profile_title;

  /// No description provided for @admin_dashboard_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'管理仪表盘'**
  String get admin_dashboard_title;

  /// No description provided for @chat_interaction_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'聊天互动'**
  String get chat_interaction_title;

  /// No description provided for @type_message_hint.
  ///
  /// In zh_CN, this message translates to:
  /// **'输入消息...'**
  String get type_message_hint;

  /// No description provided for @send_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'发送'**
  String get send_button;

  /// No description provided for @cancel_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'取消'**
  String get cancel_button;

  /// No description provided for @save_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'保存'**
  String get save_button;

  /// No description provided for @delete_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'删除'**
  String get delete_button;

  /// No description provided for @edit_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'编辑'**
  String get edit_button;

  /// No description provided for @back_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'返回'**
  String get back_button;

  /// No description provided for @retry_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'重试'**
  String get retry_button;

  /// No description provided for @confirm_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'确认'**
  String get confirm_button;

  /// No description provided for @user_profile.
  ///
  /// In zh_CN, this message translates to:
  /// **'用户资料'**
  String get user_profile;

  /// No description provided for @name_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'姓名'**
  String get name_label;

  /// No description provided for @email_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'邮箱'**
  String get email_label;

  /// No description provided for @phone_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'手机号'**
  String get phone_label;

  /// No description provided for @birth_date_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'出生日期'**
  String get birth_date_label;

  /// No description provided for @gender_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'性别'**
  String get gender_label;

  /// No description provided for @height_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'身高'**
  String get height_label;

  /// No description provided for @weight_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'体重'**
  String get weight_label;

  /// No description provided for @blood_type_label.
  ///
  /// In zh_CN, this message translates to:
  /// **'血型'**
  String get blood_type_label;

  /// No description provided for @gender_male.
  ///
  /// In zh_CN, this message translates to:
  /// **'男'**
  String get gender_male;

  /// No description provided for @gender_female.
  ///
  /// In zh_CN, this message translates to:
  /// **'女'**
  String get gender_female;

  /// No description provided for @gender_other.
  ///
  /// In zh_CN, this message translates to:
  /// **'其他'**
  String get gender_other;

  /// No description provided for @health_advice.
  ///
  /// In zh_CN, this message translates to:
  /// **'健康建议'**
  String get health_advice;

  /// No description provided for @drink_water.
  ///
  /// In zh_CN, this message translates to:
  /// **'多喝水。'**
  String get drink_water;

  /// No description provided for @get_sleep.
  ///
  /// In zh_CN, this message translates to:
  /// **'保证充足睡眠。'**
  String get get_sleep;

  /// No description provided for @eat_diet.
  ///
  /// In zh_CN, this message translates to:
  /// **'均衡饮食。'**
  String get eat_diet;

  /// No description provided for @themeMode_light.
  ///
  /// In zh_CN, this message translates to:
  /// **'浅色模式'**
  String get themeMode_light;

  /// No description provided for @themeMode_dark.
  ///
  /// In zh_CN, this message translates to:
  /// **'深色模式'**
  String get themeMode_dark;

  /// No description provided for @themeMode_system.
  ///
  /// In zh_CN, this message translates to:
  /// **'跟随系统'**
  String get themeMode_system;

  /// No description provided for @theme_settings.
  ///
  /// In zh_CN, this message translates to:
  /// **'主题设置'**
  String get theme_settings;

  /// No description provided for @follow_system_theme.
  ///
  /// In zh_CN, this message translates to:
  /// **'跟随系统主题'**
  String get follow_system_theme;

  /// No description provided for @language_settings.
  ///
  /// In zh_CN, this message translates to:
  /// **'语言设置'**
  String get language_settings;

  /// No description provided for @follow_system_language.
  ///
  /// In zh_CN, this message translates to:
  /// **'跟随系统语言'**
  String get follow_system_language;

  /// No description provided for @select_language.
  ///
  /// In zh_CN, this message translates to:
  /// **'选择语言'**
  String get select_language;

  /// No description provided for @font_size_settings.
  ///
  /// In zh_CN, this message translates to:
  /// **'字体大小'**
  String get font_size_settings;

  /// No description provided for @font_size_small.
  ///
  /// In zh_CN, this message translates to:
  /// **'小'**
  String get font_size_small;

  /// No description provided for @font_size_medium.
  ///
  /// In zh_CN, this message translates to:
  /// **'中'**
  String get font_size_medium;

  /// No description provided for @font_size_large.
  ///
  /// In zh_CN, this message translates to:
  /// **'大'**
  String get font_size_large;

  /// No description provided for @font_size_xlarge.
  ///
  /// In zh_CN, this message translates to:
  /// **'超大'**
  String get font_size_xlarge;

  /// No description provided for @notification_settings.
  ///
  /// In zh_CN, this message translates to:
  /// **'通知设置'**
  String get notification_settings;

  /// No description provided for @notification_enabled.
  ///
  /// In zh_CN, this message translates to:
  /// **'启用通知'**
  String get notification_enabled;

  /// No description provided for @notification_sound.
  ///
  /// In zh_CN, this message translates to:
  /// **'通知声音'**
  String get notification_sound;

  /// No description provided for @notification_vibration.
  ///
  /// In zh_CN, this message translates to:
  /// **'通知振动'**
  String get notification_vibration;

  /// No description provided for @privacy_policy.
  ///
  /// In zh_CN, this message translates to:
  /// **'隐私政策'**
  String get privacy_policy;

  /// No description provided for @terms_of_service.
  ///
  /// In zh_CN, this message translates to:
  /// **'服务条款'**
  String get terms_of_service;

  /// No description provided for @about_us.
  ///
  /// In zh_CN, this message translates to:
  /// **'关于我们'**
  String get about_us;

  /// No description provided for @contact_us.
  ///
  /// In zh_CN, this message translates to:
  /// **'联系我们'**
  String get contact_us;

  /// No description provided for @feedback.
  ///
  /// In zh_CN, this message translates to:
  /// **'意见反馈'**
  String get feedback;

  /// No description provided for @rate_app.
  ///
  /// In zh_CN, this message translates to:
  /// **'评分'**
  String get rate_app;

  /// No description provided for @share_app.
  ///
  /// In zh_CN, this message translates to:
  /// **'分享应用'**
  String get share_app;

  /// No description provided for @version.
  ///
  /// In zh_CN, this message translates to:
  /// **'版本'**
  String get version;

  /// No description provided for @account.
  ///
  /// In zh_CN, this message translates to:
  /// **'账户'**
  String get account;

  /// No description provided for @complete_profile.
  ///
  /// In zh_CN, this message translates to:
  /// **'完善您的个人资料'**
  String get complete_profile;

  /// No description provided for @setup_profile.
  ///
  /// In zh_CN, this message translates to:
  /// **'设置个人资料'**
  String get setup_profile;

  /// No description provided for @personal_training.
  ///
  /// In zh_CN, this message translates to:
  /// **'私人训练'**
  String get personal_training;

  /// No description provided for @nutrition_advice.
  ///
  /// In zh_CN, this message translates to:
  /// **'营养建议'**
  String get nutrition_advice;

  /// No description provided for @hiking_trail.
  ///
  /// In zh_CN, this message translates to:
  /// **'徒步旅行'**
  String get hiking_trail;

  /// No description provided for @local_park.
  ///
  /// In zh_CN, this message translates to:
  /// **'本地公园'**
  String get local_park;

  /// No description provided for @morning_walk.
  ///
  /// In zh_CN, this message translates to:
  /// **'晨间散步'**
  String get morning_walk;

  /// No description provided for @lunch.
  ///
  /// In zh_CN, this message translates to:
  /// **'午餐'**
  String get lunch;

  /// No description provided for @morning_walk_desc.
  ///
  /// In zh_CN, this message translates to:
  /// **'在公园散步30分钟'**
  String get morning_walk_desc;

  /// No description provided for @lunch_desc.
  ///
  /// In zh_CN, this message translates to:
  /// **'在家享用健康午餐'**
  String get lunch_desc;

  /// No description provided for @ai_agent.
  ///
  /// In zh_CN, this message translates to:
  /// **'AI 助手'**
  String get ai_agent;

  /// No description provided for @expert.
  ///
  /// In zh_CN, this message translates to:
  /// **'专家'**
  String get expert;

  /// No description provided for @hello_message.
  ///
  /// In zh_CN, this message translates to:
  /// **'你好，有什么可以帮您？'**
  String get hello_message;

  /// No description provided for @what_question.
  ///
  /// In zh_CN, this message translates to:
  /// **'您有什么问题？'**
  String get what_question;

  /// No description provided for @profile_updated.
  ///
  /// In zh_CN, this message translates to:
  /// **'个人资料更新成功！'**
  String get profile_updated;

  /// No description provided for @please_enter_name.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入您的姓名'**
  String get please_enter_name;

  /// No description provided for @please_enter_email.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入您的邮箱'**
  String get please_enter_email;

  /// No description provided for @loading.
  ///
  /// In zh_CN, this message translates to:
  /// **'加载中...'**
  String get loading;

  /// No description provided for @success.
  ///
  /// In zh_CN, this message translates to:
  /// **'成功'**
  String get success;

  /// No description provided for @error.
  ///
  /// In zh_CN, this message translates to:
  /// **'错误'**
  String get error;

  /// No description provided for @no_data.
  ///
  /// In zh_CN, this message translates to:
  /// **'暂无数据'**
  String get no_data;

  /// No description provided for @error_network.
  ///
  /// In zh_CN, this message translates to:
  /// **'网络连接错误，请检查您的网络设置。'**
  String get error_network;

  /// No description provided for @error_server.
  ///
  /// In zh_CN, this message translates to:
  /// **'服务器错误，请稍后再试。'**
  String get error_server;

  /// No description provided for @error_authentication.
  ///
  /// In zh_CN, this message translates to:
  /// **'认证失败，请重新登录。'**
  String get error_authentication;

  /// No description provided for @error_permission.
  ///
  /// In zh_CN, this message translates to:
  /// **'权限不足，无法执行此操作。'**
  String get error_permission;

  /// No description provided for @error_not_found.
  ///
  /// In zh_CN, this message translates to:
  /// **'未找到请求的资源。'**
  String get error_not_found;

  /// No description provided for @error_validation.
  ///
  /// In zh_CN, this message translates to:
  /// **'表单验证失败，请检查您的输入。'**
  String get error_validation;

  /// No description provided for @error_database.
  ///
  /// In zh_CN, this message translates to:
  /// **'数据库错误，请联系管理员。'**
  String get error_database;

  /// No description provided for @error_unknown.
  ///
  /// In zh_CN, this message translates to:
  /// **'发生未知错误，请稍后再试。'**
  String get error_unknown;

  /// No description provided for @tcm_constitution_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'体质辨识'**
  String get tcm_constitution_title;

  /// No description provided for @tcm_tongue_diagnosis.
  ///
  /// In zh_CN, this message translates to:
  /// **'舌诊'**
  String get tcm_tongue_diagnosis;

  /// No description provided for @tcm_pulse_diagnosis.
  ///
  /// In zh_CN, this message translates to:
  /// **'脉诊'**
  String get tcm_pulse_diagnosis;

  /// No description provided for @tcm_face_diagnosis.
  ///
  /// In zh_CN, this message translates to:
  /// **'面诊'**
  String get tcm_face_diagnosis;

  /// No description provided for @tcm_classics.
  ///
  /// In zh_CN, this message translates to:
  /// **'经典著作'**
  String get tcm_classics;

  /// No description provided for @tcm_diagnosis_result.
  ///
  /// In zh_CN, this message translates to:
  /// **'诊断结果'**
  String get tcm_diagnosis_result;

  /// No description provided for @tcm_health_regimen.
  ///
  /// In zh_CN, this message translates to:
  /// **'养生方案'**
  String get tcm_health_regimen;

  /// No description provided for @tcm_prescription.
  ///
  /// In zh_CN, this message translates to:
  /// **'方剂推荐'**
  String get tcm_prescription;

  /// No description provided for @tcm_constitution_questionnaire.
  ///
  /// In zh_CN, this message translates to:
  /// **'体质问卷'**
  String get tcm_constitution_questionnaire;

  /// No description provided for @tcm_constitution_type_neutral.
  ///
  /// In zh_CN, this message translates to:
  /// **'平和质'**
  String get tcm_constitution_type_neutral;

  /// No description provided for @tcm_constitution_type_qi_deficient.
  ///
  /// In zh_CN, this message translates to:
  /// **'气虚质'**
  String get tcm_constitution_type_qi_deficient;

  /// No description provided for @tcm_constitution_type_yang_deficient.
  ///
  /// In zh_CN, this message translates to:
  /// **'阳虚质'**
  String get tcm_constitution_type_yang_deficient;

  /// No description provided for @tcm_constitution_type_yin_deficient.
  ///
  /// In zh_CN, this message translates to:
  /// **'阴虚质'**
  String get tcm_constitution_type_yin_deficient;

  /// No description provided for @tcm_constitution_type_phlegm_dampness.
  ///
  /// In zh_CN, this message translates to:
  /// **'痰湿质'**
  String get tcm_constitution_type_phlegm_dampness;

  /// No description provided for @tcm_constitution_type_damp_heat.
  ///
  /// In zh_CN, this message translates to:
  /// **'湿热质'**
  String get tcm_constitution_type_damp_heat;

  /// No description provided for @tcm_constitution_type_blood_stasis.
  ///
  /// In zh_CN, this message translates to:
  /// **'血瘀质'**
  String get tcm_constitution_type_blood_stasis;

  /// No description provided for @tcm_constitution_type_qi_stagnation.
  ///
  /// In zh_CN, this message translates to:
  /// **'气郁质'**
  String get tcm_constitution_type_qi_stagnation;

  /// No description provided for @tcm_constitution_type_special.
  ///
  /// In zh_CN, this message translates to:
  /// **'特禀质'**
  String get tcm_constitution_type_special;

  /// No description provided for @food_therapy_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'食疗'**
  String get food_therapy_title;

  /// No description provided for @food_seasonal_diet.
  ///
  /// In zh_CN, this message translates to:
  /// **'时令食谱'**
  String get food_seasonal_diet;

  /// No description provided for @food_constitution_diet.
  ///
  /// In zh_CN, this message translates to:
  /// **'体质食谱'**
  String get food_constitution_diet;

  /// No description provided for @food_solar_term.
  ///
  /// In zh_CN, this message translates to:
  /// **'节气饮食'**
  String get food_solar_term;

  /// No description provided for @food_emotion_diet.
  ///
  /// In zh_CN, this message translates to:
  /// **'情绪食疗'**
  String get food_emotion_diet;

  /// No description provided for @food_agricultural_products.
  ///
  /// In zh_CN, this message translates to:
  /// **'优质农产品'**
  String get food_agricultural_products;

  /// No description provided for @food_adopt_land.
  ///
  /// In zh_CN, this message translates to:
  /// **'认养一亩地'**
  String get food_adopt_land;

  /// No description provided for @food_adopt_cow.
  ///
  /// In zh_CN, this message translates to:
  /// **'娟姗奶牛陪你长大'**
  String get food_adopt_cow;

  /// No description provided for @food_corn_maze.
  ///
  /// In zh_CN, this message translates to:
  /// **'AR玉米迷宫探宝'**
  String get food_corn_maze;

  /// No description provided for @food_farm_experience.
  ///
  /// In zh_CN, this message translates to:
  /// **'农事体验活动'**
  String get food_farm_experience;

  /// No description provided for @knowledge_graph_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'知识图谱'**
  String get knowledge_graph_title;

  /// No description provided for @health_portrait_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'健康画像'**
  String get health_portrait_title;

  /// No description provided for @rag_search_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'知识检索'**
  String get rag_search_title;

  /// No description provided for @rag_query_placeholder.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入您的问题或关键词'**
  String get rag_query_placeholder;

  /// No description provided for @rag_search_button.
  ///
  /// In zh_CN, this message translates to:
  /// **'搜索'**
  String get rag_search_button;

  /// No description provided for @rag_search_result.
  ///
  /// In zh_CN, this message translates to:
  /// **'搜索结果'**
  String get rag_search_result;

  /// No description provided for @rag_no_result.
  ///
  /// In zh_CN, this message translates to:
  /// **'暂无相关结果，请尝试其他关键词'**
  String get rag_no_result;

  /// No description provided for @placeholder_username.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入用户名'**
  String get placeholder_username;

  /// No description provided for @placeholder_password.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入密码'**
  String get placeholder_password;

  /// No description provided for @placeholder_email.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入邮箱地址'**
  String get placeholder_email;

  /// No description provided for @placeholder_phone.
  ///
  /// In zh_CN, this message translates to:
  /// **'请输入手机号码'**
  String get placeholder_phone;

  /// No description provided for @placeholder_search.
  ///
  /// In zh_CN, this message translates to:
  /// **'搜索...'**
  String get placeholder_search;

  /// No description provided for @health_data_title.
  ///
  /// In zh_CN, this message translates to:
  /// **'健康数据'**
  String get health_data_title;

  /// No description provided for @health_data_heart_rate.
  ///
  /// In zh_CN, this message translates to:
  /// **'心率'**
  String get health_data_heart_rate;

  /// No description provided for @health_data_blood_pressure.
  ///
  /// In zh_CN, this message translates to:
  /// **'血压'**
  String get health_data_blood_pressure;

  /// No description provided for @health_data_blood_glucose.
  ///
  /// In zh_CN, this message translates to:
  /// **'血糖'**
  String get health_data_blood_glucose;

  /// No description provided for @health_data_sleep.
  ///
  /// In zh_CN, this message translates to:
  /// **'睡眠'**
  String get health_data_sleep;

  /// No description provided for @health_data_steps.
  ///
  /// In zh_CN, this message translates to:
  /// **'步数'**
  String get health_data_steps;

  /// No description provided for @health_data_weight.
  ///
  /// In zh_CN, this message translates to:
  /// **'体重'**
  String get health_data_weight;

  /// No description provided for @health_data_bmi.
  ///
  /// In zh_CN, this message translates to:
  /// **'BMI'**
  String get health_data_bmi;

  /// No description provided for @health_data_water.
  ///
  /// In zh_CN, this message translates to:
  /// **'饮水量'**
  String get health_data_water;

  /// No description provided for @health_data_medicine.
  ///
  /// In zh_CN, this message translates to:
  /// **'用药记录'**
  String get health_data_medicine;

  /// No description provided for @health_data_symptoms.
  ///
  /// In zh_CN, this message translates to:
  /// **'症状记录'**
  String get health_data_symptoms;

  /// No description provided for @today.
  ///
  /// In zh_CN, this message translates to:
  /// **'今天'**
  String get today;

  /// No description provided for @yesterday.
  ///
  /// In zh_CN, this message translates to:
  /// **'昨天'**
  String get yesterday;

  /// No description provided for @this_week.
  ///
  /// In zh_CN, this message translates to:
  /// **'本周'**
  String get this_week;

  /// No description provided for @last_week.
  ///
  /// In zh_CN, this message translates to:
  /// **'上周'**
  String get last_week;

  /// No description provided for @this_month.
  ///
  /// In zh_CN, this message translates to:
  /// **'本月'**
  String get this_month;

  /// No description provided for @last_month.
  ///
  /// In zh_CN, this message translates to:
  /// **'上月'**
  String get last_month;

  /// No description provided for @custom_range.
  ///
  /// In zh_CN, this message translates to:
  /// **'自定义范围'**
  String get custom_range;

  /// No description provided for @close.
  ///
  /// In zh_CN, this message translates to:
  /// **'关闭'**
  String get close;

  /// No description provided for @open.
  ///
  /// In zh_CN, this message translates to:
  /// **'打开'**
  String get open;

  /// No description provided for @add.
  ///
  /// In zh_CN, this message translates to:
  /// **'添加'**
  String get add;

  /// No description provided for @remove.
  ///
  /// In zh_CN, this message translates to:
  /// **'删除'**
  String get remove;

  /// No description provided for @update.
  ///
  /// In zh_CN, this message translates to:
  /// **'更新'**
  String get update;

  /// AI助手小艾的名称
  ///
  /// In zh_CN, this message translates to:
  /// **'小艾'**
  String get ai_assistant_name_1;

  /// AI助手老克的名称
  ///
  /// In zh_CN, this message translates to:
  /// **'老克'**
  String get ai_assistant_name_2;

  /// AI助手小克的名称
  ///
  /// In zh_CN, this message translates to:
  /// **'小克'**
  String get ai_assistant_name_3;

  /// 示例医生姓名
  ///
  /// In zh_CN, this message translates to:
  /// **'张医生'**
  String get doctor_name_example;

  /// AI助手的默认问候语
  ///
  /// In zh_CN, this message translates to:
  /// **'您好，我是您的健康助手小艾，请问有什么我可以帮您的？'**
  String get default_greeting_message;

  /// 推荐食谱的消息
  ///
  /// In zh_CN, this message translates to:
  /// **'今天为您推荐了一些新的健康食谱，要看看吗？'**
  String get recommend_recipe_message;

  /// 健康报告准备就绪的消息
  ///
  /// In zh_CN, this message translates to:
  /// **'您的健康报告已经生成，点击查看详情。'**
  String get health_report_ready_message;

  /// 体检结果良好的消息
  ///
  /// In zh_CN, this message translates to:
  /// **'您的体检结果看起来不错，继续保持！'**
  String get health_checkup_good_message;

  /// No description provided for @tcm_meridian_lung.
  ///
  /// In zh_CN, this message translates to:
  /// **'肺经'**
  String get tcm_meridian_lung;

  /// No description provided for @tcm_meridian_large_intestine.
  ///
  /// In zh_CN, this message translates to:
  /// **'大肠经'**
  String get tcm_meridian_large_intestine;

  /// No description provided for @tcm_meridian_stomach.
  ///
  /// In zh_CN, this message translates to:
  /// **'胃经'**
  String get tcm_meridian_stomach;

  /// No description provided for @tcm_meridian_spleen.
  ///
  /// In zh_CN, this message translates to:
  /// **'脾经'**
  String get tcm_meridian_spleen;

  /// No description provided for @tcm_meridian_heart.
  ///
  /// In zh_CN, this message translates to:
  /// **'心经'**
  String get tcm_meridian_heart;

  /// No description provided for @tcm_meridian_small_intestine.
  ///
  /// In zh_CN, this message translates to:
  /// **'小肠经'**
  String get tcm_meridian_small_intestine;

  /// No description provided for @tcm_acupoint_LU1.
  ///
  /// In zh_CN, this message translates to:
  /// **'中府'**
  String get tcm_acupoint_LU1;

  /// No description provided for @tcm_acupoint_LU5.
  ///
  /// In zh_CN, this message translates to:
  /// **'尺泽'**
  String get tcm_acupoint_LU5;

  /// No description provided for @tcm_acupoint_LU7.
  ///
  /// In zh_CN, this message translates to:
  /// **'列缺'**
  String get tcm_acupoint_LU7;

  /// No description provided for @tcm_acupoint_LI4.
  ///
  /// In zh_CN, this message translates to:
  /// **'合谷'**
  String get tcm_acupoint_LI4;

  /// No description provided for @tcm_acupoint_LI11.
  ///
  /// In zh_CN, this message translates to:
  /// **'曲池'**
  String get tcm_acupoint_LI11;

  /// No description provided for @tcm_acupoint_desc_LU1.
  ///
  /// In zh_CN, this message translates to:
  /// **'肺经的募穴，位于胸部第一肋间隙，锁骨下窝外侧。主治咳嗽、气喘、胸痛等肺系疾病。'**
  String get tcm_acupoint_desc_LU1;

  /// No description provided for @tcm_acupoint_desc_LU5.
  ///
  /// In zh_CN, this message translates to:
  /// **'肺经的合穴，位于肘横纹尺侧端，当肱二头肌腱桡侧凹陷处。主治咳嗽、咽喉肿痛、肘臂痛等。'**
  String get tcm_acupoint_desc_LU5;

  /// No description provided for @tcm_tissue_skin.
  ///
  /// In zh_CN, this message translates to:
  /// **'皮肤'**
  String get tcm_tissue_skin;

  /// No description provided for @tcm_tissue_muscle.
  ///
  /// In zh_CN, this message translates to:
  /// **'肌肉'**
  String get tcm_tissue_muscle;

  /// No description provided for @tcm_tissue_tendon.
  ///
  /// In zh_CN, this message translates to:
  /// **'肌腱'**
  String get tcm_tissue_tendon;

  /// No description provided for @tcm_tissue_bone.
  ///
  /// In zh_CN, this message translates to:
  /// **'骨骼'**
  String get tcm_tissue_bone;

  /// No description provided for @tcm_advanced_meridian_explorer.
  ///
  /// In zh_CN, this message translates to:
  /// **'高级经络探索器'**
  String get tcm_advanced_meridian_explorer;

  /// No description provided for @tcm_toggle_energy_flow.
  ///
  /// In zh_CN, this message translates to:
  /// **'切换能量流动'**
  String get tcm_toggle_energy_flow;

  /// No description provided for @tcm_preload_all_models.
  ///
  /// In zh_CN, this message translates to:
  /// **'预加载所有模型'**
  String get tcm_preload_all_models;

  /// No description provided for @tcm_clear_cache.
  ///
  /// In zh_CN, this message translates to:
  /// **'清除缓存'**
  String get tcm_clear_cache;

  /// No description provided for @tcm_enable_shader_effects.
  ///
  /// In zh_CN, this message translates to:
  /// **'启用着色器效果'**
  String get tcm_enable_shader_effects;

  /// No description provided for @tcm_disable_shader_effects.
  ///
  /// In zh_CN, this message translates to:
  /// **'禁用着色器效果'**
  String get tcm_disable_shader_effects;

  /// No description provided for @tcm_offline_mode_active.
  ///
  /// In zh_CN, this message translates to:
  /// **'离线模式已激活'**
  String get tcm_offline_mode_active;

  /// No description provided for @tcm_cached.
  ///
  /// In zh_CN, this message translates to:
  /// **'已缓存'**
  String get tcm_cached;

  /// No description provided for @tcm_energy_flow_active.
  ///
  /// In zh_CN, this message translates to:
  /// **'能量流动已激活'**
  String get tcm_energy_flow_active;

  /// No description provided for @tcm_energy_flow_intensity.
  ///
  /// In zh_CN, this message translates to:
  /// **'能量流动强度'**
  String get tcm_energy_flow_intensity;

  /// No description provided for @tcm_meridian_bladder.
  ///
  /// In zh_CN, this message translates to:
  /// **'膀胱经'**
  String get tcm_meridian_bladder;

  /// No description provided for @tcm_meridian_kidney.
  ///
  /// In zh_CN, this message translates to:
  /// **'肾经'**
  String get tcm_meridian_kidney;

  /// No description provided for @tcm_meridian_pericardium.
  ///
  /// In zh_CN, this message translates to:
  /// **'心包经'**
  String get tcm_meridian_pericardium;

  /// No description provided for @tcm_meridian_triple_burner.
  ///
  /// In zh_CN, this message translates to:
  /// **'三焦经'**
  String get tcm_meridian_triple_burner;

  /// No description provided for @tcm_meridian_gallbladder.
  ///
  /// In zh_CN, this message translates to:
  /// **'胆经'**
  String get tcm_meridian_gallbladder;

  /// No description provided for @tcm_meridian_liver.
  ///
  /// In zh_CN, this message translates to:
  /// **'肝经'**
  String get tcm_meridian_liver;

  /// No description provided for @tcm_meridian_du_mai.
  ///
  /// In zh_CN, this message translates to:
  /// **'督脉'**
  String get tcm_meridian_du_mai;

  /// No description provided for @tcm_meridian_ren_mai.
  ///
  /// In zh_CN, this message translates to:
  /// **'任脉'**
  String get tcm_meridian_ren_mai;

  /// No description provided for @tcm_acupoint.
  ///
  /// In zh_CN, this message translates to:
  /// **'穴位'**
  String get tcm_acupoint;

  /// No description provided for @tcm_acupoint_desc_LU7.
  ///
  /// In zh_CN, this message translates to:
  /// **'肺经的络穴，位于前臂桡侧缘，桡骨茎突上方1.5寸处。为肺经的重要腧穴，主治头痛、颈项强痛、咳嗽等。'**
  String get tcm_acupoint_desc_LU7;

  /// No description provided for @tcm_acupoint_desc_LI4.
  ///
  /// In zh_CN, this message translates to:
  /// **'大肠经原穴，位于第1、2掌骨间，偏近第2掌骨侧。为全身痛症要穴，有镇痛作用，主治头面部疾患、牙痛、感冒等。'**
  String get tcm_acupoint_desc_LI4;

  /// No description provided for @tcm_acupoint_desc_LI11.
  ///
  /// In zh_CN, this message translates to:
  /// **'大肠经的合穴，位于肘横纹外端，屈肘成90度时，肱骨外上髁与肘横纹连线的中点。主治发热、肘臂痛、高血压等。'**
  String get tcm_acupoint_desc_LI11;

  /// No description provided for @tcm_tissue_levels.
  ///
  /// In zh_CN, this message translates to:
  /// **'组织层次'**
  String get tcm_tissue_levels;

  /// No description provided for @tcm_layer.
  ///
  /// In zh_CN, this message translates to:
  /// **'层'**
  String get tcm_layer;

  /// No description provided for @tcm_needle_depth.
  ///
  /// In zh_CN, this message translates to:
  /// **'针刺深度'**
  String get tcm_needle_depth;

  /// No description provided for @tcm_needle_angle.
  ///
  /// In zh_CN, this message translates to:
  /// **'针刺角度'**
  String get tcm_needle_angle;

  /// No description provided for @tcm_simulate_acupuncture.
  ///
  /// In zh_CN, this message translates to:
  /// **'模拟针灸'**
  String get tcm_simulate_acupuncture;

  /// No description provided for @tcm_detailed_info.
  ///
  /// In zh_CN, this message translates to:
  /// **'详细信息'**
  String get tcm_detailed_info;

  /// No description provided for @tcm_simulation_result.
  ///
  /// In zh_CN, this message translates to:
  /// **'模拟结果'**
  String get tcm_simulation_result;

  /// No description provided for @tcm_success.
  ///
  /// In zh_CN, this message translates to:
  /// **'成功'**
  String get tcm_success;

  /// No description provided for @tcm_failure.
  ///
  /// In zh_CN, this message translates to:
  /// **'失败'**
  String get tcm_failure;

  /// No description provided for @tcm_stimulated_tissues.
  ///
  /// In zh_CN, this message translates to:
  /// **'受刺激组织'**
  String get tcm_stimulated_tissues;

  /// No description provided for @tcm_stimulation_level.
  ///
  /// In zh_CN, this message translates to:
  /// **'刺激级别'**
  String get tcm_stimulation_level;

  /// No description provided for @tcm_no_detailed_info.
  ///
  /// In zh_CN, this message translates to:
  /// **'暂无详细信息'**
  String get tcm_no_detailed_info;

  /// No description provided for @tcm_tissue.
  ///
  /// In zh_CN, this message translates to:
  /// **'组织'**
  String get tcm_tissue;

  /// No description provided for @tcm_nerve.
  ///
  /// In zh_CN, this message translates to:
  /// **'神经'**
  String get tcm_nerve;

  /// No description provided for @tcm_vessel.
  ///
  /// In zh_CN, this message translates to:
  /// **'血管'**
  String get tcm_vessel;

  /// No description provided for @tcm_lod_ultra_low.
  ///
  /// In zh_CN, this message translates to:
  /// **'超低清'**
  String get tcm_lod_ultra_low;

  /// No description provided for @tcm_lod_low.
  ///
  /// In zh_CN, this message translates to:
  /// **'低清'**
  String get tcm_lod_low;

  /// No description provided for @tcm_lod_medium.
  ///
  /// In zh_CN, this message translates to:
  /// **'中清'**
  String get tcm_lod_medium;

  /// No description provided for @tcm_lod_high.
  ///
  /// In zh_CN, this message translates to:
  /// **'高清'**
  String get tcm_lod_high;
}

class _GeneratedAppLocalizationsDelegate extends LocalizationsDelegate<GeneratedAppLocalizations> {
  const _GeneratedAppLocalizationsDelegate();

  @override
  Future<GeneratedAppLocalizations> load(Locale locale) {
    return SynchronousFuture<GeneratedAppLocalizations>(lookupGeneratedAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_GeneratedAppLocalizationsDelegate old) => false;
}

GeneratedAppLocalizations lookupGeneratedAppLocalizations(Locale locale) {

  // Lookup logic when language+country codes are specified.
  switch (locale.languageCode) {
    case 'en': {
  switch (locale.countryCode) {
    case 'US': return GeneratedAppLocalizationsEnUs();
   }
  break;
   }
    case 'zh': {
  switch (locale.countryCode) {
    case 'CN': return GeneratedAppLocalizationsZhCn();
   }
  break;
   }
  }

  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en': return GeneratedAppLocalizationsEn();
    case 'zh': return GeneratedAppLocalizationsZh();
  }

  throw FlutterError(
    'GeneratedAppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
