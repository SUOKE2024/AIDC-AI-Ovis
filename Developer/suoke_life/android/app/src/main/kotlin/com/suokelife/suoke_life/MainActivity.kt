package com.suokelife.suoke_life

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // 注册VTK经络服务插件
        flutterEngine.plugins.add(VtkMeridianPlugin())
    }
}
