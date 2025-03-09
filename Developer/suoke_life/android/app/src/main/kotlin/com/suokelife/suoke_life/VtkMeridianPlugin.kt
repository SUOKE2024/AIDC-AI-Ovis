package com.suokelife.suoke_life

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.opengl.GLSurfaceView
import android.view.MotionEvent
import androidx.annotation.NonNull
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import io.flutter.plugin.common.StandardMessageCodec
import io.flutter.plugin.platform.PlatformView
import io.flutter.plugin.platform.PlatformViewFactory
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import vtk.*

class VtkMeridianPlugin : FlutterPlugin, MethodCallHandler {
    private lateinit var channel: MethodChannel
    private lateinit var context: Context
    private val executor = Executors.newSingleThreadExecutor()
    
    // VTK相关对象
    private var renderer: vtkRenderer? = null
    private var renderWindow: vtkRenderWindow? = null
    private var humanModelActor: vtkActor? = null
    private var meridianActor: vtkActor? = null
    private var acupointActors = mutableMapOf<String, vtkActor>()
    
    override fun onAttachedToEngine(@NonNull flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        context = flutterPluginBinding.applicationContext
        channel = MethodChannel(flutterPluginBinding.binaryMessenger, "com.suokelife.suoke_life/vtk_meridian")
        channel.setMethodCallHandler(this)
        
        flutterPluginBinding.platformViewRegistry.registerViewFactory(
            "com.suokelife.suoke_life/vtk_meridian_view",
            VtkMeridianViewFactory(flutterPluginBinding.binaryMessenger, context)
        )
    }
    
    override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
        when (call.method) {
            "initVtkEngine" -> executor.execute { initVtkEngine(result) }
            "loadMeridianModel" -> {
                val meridianType = call.argument<Int>("meridianType") ?: 0
                executor.execute { loadMeridianModel(meridianType, result) }
            }
            "getAcupointDetails" -> {
                val acupointId = call.argument<String>("acupointId") ?: ""
                executor.execute { getAcupointDetails(acupointId, result) }
            }
            "simulateAcupuncture" -> {
                val acupointId = call.argument<String>("acupointId") ?: ""
                val depth = call.argument<Double>("depth") ?: 0.0
                val angle = call.argument<Double>("angle") ?: 0.0
                executor.execute { simulateAcupuncture(acupointId, depth, angle, result) }
            }
            "captureModelSnapshot" -> {
                val rotationX = call.argument<Double>("rotationX") ?: 0.0
                val rotationY = call.argument<Double>("rotationY") ?: 0.0
                val scale = call.argument<Double>("scale") ?: 1.0
                executor.execute { captureModelSnapshot(rotationX, rotationY, scale, result) }
            }
            "loadModel" -> {
                val modelName = call.argument<String>("modelName") ?: return result.error("MISSING_PARAM", "Missing modelName parameter", null)
                val lodLevel = call.argument<String>("lodLevel") ?: "medium"
                
                executor.execute {
                    try {
                        // 加载模型的实现
                        val modelBytes = loadModelFromAssets(modelName, lodLevel)
                        result.success(modelBytes)
                    } catch (e: Exception) {
                        result.error("LOAD_ERROR", "Failed to load model: ${e.message}", null)
                    }
                }
            }
            "optimizeModel" -> {
                val modelData = call.argument<ByteArray>("modelData") ?: return result.error("MISSING_PARAM", "Missing modelData parameter", null)
                val targetSize = call.argument<Int>("targetSize") ?: 50000
                
                executor.execute {
                    try {
                        // 模型优化实现
                        val optimizedModel = optimizeModel(modelData, targetSize)
                        result.success(optimizedModel)
                    } catch (e: Exception) {
                        result.error("OPTIMIZE_ERROR", "Failed to optimize model: ${e.message}", null)
                    }
                }
            }
            "renderToImage" -> {
                val modelData = call.argument<ByteArray>("modelData") ?: return result.error("MISSING_PARAM", "Missing modelData parameter", null)
                val width = call.argument<Int>("width") ?: 512
                val height = call.argument<Int>("height") ?: 512
                
                executor.execute {
                    try {
                        // 渲染到图像实现
                        val imageBytes = renderModelToImage(modelData, width, height)
                        result.success(imageBytes)
                    } catch (e: Exception) {
                        result.error("RENDER_ERROR", "Failed to render model: ${e.message}", null)
                    }
                }
            }
            else -> {
                result.notImplemented()
            }
        }
    }
    
    private fun initVtkEngine(result: Result) {
        try {
            // 初始化VTK渲染器和窗口
            renderer = vtkRenderer.New()
            renderWindow = vtkRenderWindow.New()
            renderWindow!!.AddRenderer(renderer)
            
            // 设置背景色
            renderer!!.SetBackground(0.9, 0.9, 0.9)
            
            // 设置离屏渲染
            renderWindow!!.SetOffScreenRendering(1)
            renderWindow!!.SetSize(800, 1200)
            
            result.success(true)
        } catch (e: Exception) {
            result.success(false)
        }
    }
    
    private fun loadMeridianModel(meridianType: Int, result: Result) {
        try {
            // 清除现有模型
            if (humanModelActor != null) {
                renderer!!.RemoveActor(humanModelActor)
            }
            if (meridianActor != null) {
                renderer!!.RemoveActor(meridianActor)
            }
            
            // 加载人体模型
            val humanModel = loadHumanModel()
            humanModelActor = humanModel
            renderer!!.AddActor(humanModelActor)
            
            // 加载经络模型
            val meridian = loadMeridianData(meridianType)
            meridianActor = meridian
            renderer!!.AddActor(meridianActor)
            
            // 加载穴位
            loadAcupoints(meridianType)
            
            // 重置相机位置
            renderer!!.ResetCamera()
            
            // 渲染
            renderWindow!!.Render()
            
            result.success(true)
        } catch (e: Exception) {
            result.success(false)
        }
    }
    
    private fun loadHumanModel(): vtkActor {
        // 这里应该是从资源文件加载人体模型
        // 示例中使用简单几何体代替
        val cylinderSource = vtkCylinderSource()
        cylinderSource.SetHeight(1.5)
        cylinderSource.SetRadius(0.3)
        cylinderSource.SetResolution(20)
        
        val mapper = vtkPolyDataMapper()
        mapper.SetInputConnection(cylinderSource.GetOutputPort())
        
        val actor = vtkActor()
        actor.SetMapper(mapper)
        actor.GetProperty().SetColor(0.8, 0.8, 0.8)
        actor.GetProperty().SetOpacity(0.5)
        
        return actor
    }
    
    private fun loadMeridianData(meridianType: Int): vtkActor {
        // 根据经络类型加载对应的经络数据
        // 示例使用线条代替
        val points = vtkPoints()
        
        // 基于meridianType添加不同的点
        when (meridianType) {
            0 -> { // 肺经
                points.InsertNextPoint(0.0, 0.5, 0.3)
                points.InsertNextPoint(0.1, 0.4, 0.3)
                points.InsertNextPoint(0.2, 0.3, 0.3)
                points.InsertNextPoint(0.3, 0.1, 0.3)
            }
            1 -> { // 大肠经
                points.InsertNextPoint(0.3, 0.1, 0.3)
                points.InsertNextPoint(0.2, 0.0, 0.3)
                points.InsertNextPoint(0.1, -0.1, 0.3)
                points.InsertNextPoint(0.0, -0.3, 0.3)
            }
            // 其他经络...
        }
        
        val lineSource = vtkLineSource()
        lineSource.SetPoints(points)
        
        val mapper = vtkPolyDataMapper()
        mapper.SetInputConnection(lineSource.GetOutputPort())
        
        val actor = vtkActor()
        actor.SetMapper(mapper)
        
        // 根据经络类型设置颜色
        when (meridianType) {
            0 -> actor.GetProperty().SetColor(0.0, 0.0, 1.0) // 肺经 - 蓝色
            1 -> actor.GetProperty().SetColor(1.0, 0.5, 0.0) // 大肠经 - 橙色
            // 其他经络颜色...
        }
        
        actor.GetProperty().SetLineWidth(3.0)
        
        return actor
    }
    
    private fun loadAcupoints(meridianType: Int) {
        // 清除现有穴位
        for (actor in acupointActors.values) {
            renderer!!.RemoveActor(actor)
        }
        acupointActors.clear()
        
        // 加载新穴位
        val acupointData = getAcupointsForMeridian(meridianType)
        for (acupoint in acupointData) {
            val sphereSource = vtkSphereSource()
            sphereSource.SetCenter(acupoint.x, acupoint.y, acupoint.z)
            sphereSource.SetRadius(0.03)
            sphereSource.SetPhiResolution(16)
            sphereSource.SetThetaResolution(16)
            
            val mapper = vtkPolyDataMapper()
            mapper.SetInputConnection(sphereSource.GetOutputPort())
            
            val actor = vtkActor()
            actor.SetMapper(mapper)
            actor.GetProperty().SetColor(1.0, 0.0, 0.0) // 红色
            
            acupointActors[acupoint.id] = actor
            renderer!!.AddActor(actor)
        }
    }
    
    private fun getAcupointsForMeridian(meridianType: Int): List<AcupointData> {
        // 根据经络类型返回穴位数据
        val acupoints = mutableListOf<AcupointData>()
        
        when (meridianType) {
            0 -> { // 肺经
                acupoints.add(AcupointData("LU1", "中府", 0.0, 0.5, 0.3))
                acupoints.add(AcupointData("LU5", "尺泽", 0.2, 0.3, 0.3))
                acupoints.add(AcupointData("LU7", "列缺", 0.3, 0.1, 0.3))
            }
            1 -> { // 大肠经
                acupoints.add(AcupointData("LI4", "合谷", 0.3, 0.0, 0.3))
                acupoints.add(AcupointData("LI11", "曲池", 0.1, -0.1, 0.3))
            }
            // 其他经络穴位...
        }
        
        return acupoints
    }
    
    private fun getAcupointDetails(acupointId: String, result: Result) {
        // 根据穴位ID返回详细信息
        val detailsArray = JSONArray()
        
        // 示例数据 - 实际应从数据库或资源文件加载
        when (acupointId) {
            "LU1" -> {
                addLayerDetail(detailsArray, "表皮层", "穴位表面标记点", 0.0, 
                    listOf("表皮"), listOf("感觉神经末梢"), listOf("毛细血管"))
                
                addLayerDetail(detailsArray, "真皮层", "含有丰富的血管和神经末梢", 0.2,
                    listOf("真皮结缔组织"), listOf("触觉感受器"), listOf("静脉丛"))
                
                addLayerDetail(detailsArray, "皮下组织", "针体通过区域", 0.5,
                    listOf("脂肪组织"), listOf("皮下神经网"), listOf("皮下静脉"))
                
                addLayerDetail(detailsArray, "肌肉层", "主要作用层", 1.0,
                    listOf("胸大肌"), listOf("胸神经"), listOf("胸外侧动脉"))
            }
            "LI4" -> {
                addLayerDetail(detailsArray, "表皮层", "穴位表面标记点", 0.0,
                    listOf("表皮"), listOf("感觉神经末梢"), listOf("毛细血管"))
                
                addLayerDetail(detailsArray, "皮下组织", "针体通过区域", 0.3,
                    listOf("手背薄层脂肪"), listOf("指背神经"), listOf("手背静脉"))
                
                addLayerDetail(detailsArray, "肌肉层", "主要作用层", 0.5,
                    listOf("第一骨间肌"), listOf("尺神经分支"), listOf("掌骨间动脉"))
            }
            // 其他穴位...
        }
        
        result.success(detailsArray.toString())
    }
    
    private fun addLayerDetail(
        array: JSONArray,
        layerName: String,
        description: String,
        depth: Double,
        tissues: List<String>,
        nerves: List<String>,
        vessels: List<String>
    ) {
        val layerObject = JSONObject()
        layerObject.put("layerName", layerName)
        layerObject.put("description", description)
        layerObject.put("depth", depth)
        
        val tissuesArray = JSONArray()
        for (tissue in tissues) {
            tissuesArray.put(tissue)
        }
        layerObject.put("tissues", tissuesArray)
        
        val nervesArray = JSONArray()
        for (nerve in nerves) {
            nervesArray.put(nerve)
        }
        layerObject.put("nerves", nervesArray)
        
        val vesselsArray = JSONArray()
        for (vessel in vessels) {
            vesselsArray.put(vessel)
        }
        layerObject.put("vessels", vesselsArray)
        
        array.put(layerObject)
    }
    
    private fun simulateAcupuncture(acupointId: String, depth: Double, angle: Double, result: Result) {
        // 模拟针灸效果
        val simulationResult = JSONObject()
        
        // 根据穴位ID、刺入深度和角度进行模拟
        // 实际应使用VTK的有限元分析或物理模拟
        
        // 示例结果
        simulationResult.put("success", true)
        simulationResult.put("message", "针灸模拟完成")
        
        val stimulatedTissues = JSONArray()
        
        // 根据深度决定刺激的组织
        if (depth > 0.5) {
            val tissue = JSONObject()
            tissue.put("name", "肌肉组织")
            tissue.put("type", "muscle")
            tissue.put("stimulationLevel", 0.8)
            stimulatedTissues.put(tissue)
        }
        
        if (depth > 0.3) {
            val tissue = JSONObject()
            tissue.put("name", "皮下组织")
            tissue.put("type", "subcutaneous")
            tissue.put("stimulationLevel", 0.6)
            stimulatedTissues.put(tissue)
        }
        
        if (depth > 0) {
            val tissue = JSONObject()
            tissue.put("name", "表皮")
            tissue.put("type", "epidermis")
            tissue.put("stimulationLevel", 0.3)
            stimulatedTissues.put(tissue)
        }
        
        simulationResult.put("stimulatedTissues", stimulatedTissues)
        
        result.success(simulationResult.toString())
    }
    
    private fun captureModelSnapshot(rotationX: Double, rotationY: Double, scale: Double, result: Result) {
        try {
            // 应用旋转和缩放
            humanModelActor?.RotateX(rotationX)
            humanModelActor?.RotateY(rotationY)
            humanModelActor?.SetScale(scale)
            
            meridianActor?.RotateX(rotationX)
            meridianActor?.RotateY(rotationY)
            meridianActor?.SetScale(scale)
            
            for (actor in acupointActors.values) {
                actor.RotateX(rotationX)
                actor.RotateY(rotationY)
                actor.SetScale(scale)
            }
            
            // 渲染场景
            renderWindow!!.Render()
            
            // 获取图像
            val windowToImageFilter = vtkWindowToImageFilter()
            windowToImageFilter.SetInput(renderWindow)
            windowToImageFilter.Update()
            
            // 将渲染结果转换为Bitmap
            val width = renderWindow!!.GetSize()[0]
            val height = renderWindow!!.GetSize()[1]
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            
            // 将VTK渲染结果复制到Bitmap
            // 实际代码需要处理像素数据转换
            
            // 转换为字节数组
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            
            result.success(outputStream.toByteArray())
        } catch (e: Exception) {
            result.success(null)
        }
    }
    
    override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        executor.shutdown()
        
        // 释放VTK资源
        renderer?.Delete()
        renderWindow?.Delete()
        humanModelActor?.Delete()
        meridianActor?.Delete()
        
        for (actor in acupointActors.values) {
            actor.Delete()
        }
    }
    
    data class AcupointData(
        val id: String,
        val name: String,
        val x: Double,
        val y: Double,
        val z: Double
    )
}

// VTK 经络视图工厂
class VtkMeridianViewFactory(private val messenger: io.flutter.plugin.common.BinaryMessenger, private val context: Context) :
    PlatformViewFactory(StandardMessageCodec.INSTANCE) {
    
    override fun create(context: Context, viewId: Int, args: Any?): PlatformView {
        val creationParams = args as? Map<String, Any>
        return VtkMeridianView(context, viewId, creationParams, messenger)
    }
}

// VTK 经络视图
class VtkMeridianView(
    private val context: Context,
    private val id: Int,
    private val creationParams: Map<String, Any>?,
    private val messenger: io.flutter.plugin.common.BinaryMessenger
) : PlatformView {
    
    private val methodChannel: MethodChannel = MethodChannel(messenger, "com.suokelife.suoke_life/vtk_meridian_view_$id")
    private val glSurfaceView: GLSurfaceView = GLSurfaceView(context)
    private var currentModelData: ByteArray? = null
    private var renderer: VtkRenderer? = null
    
    init {
        setupGLSurfaceView()
        setupMethodChannel()
        
        // 获取初始参数
        creationParams?.let {
            it["initialModelName"]?.let { modelName ->
                loadModel(modelName as String)
            }
        }
    }
    
    private fun setupGLSurfaceView() {
        glSurfaceView.setEGLContextClientVersion(2)
        renderer = VtkRenderer()
        glSurfaceView.setRenderer(renderer)
        glSurfaceView.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY
        
        // 设置触摸事件处理
        glSurfaceView.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE, MotionEvent.ACTION_UP -> {
                    methodChannel.invokeMethod("onTouch", mapOf(
                        "x" to event.x,
                        "y" to event.y,
                        "action" to event.action
                    ))
                    true
                }
                else -> false
            }
        }
    }
    
    private fun setupMethodChannel() {
        methodChannel.setMethodCallHandler { call, result ->
            when (call.method) {
                "loadModel" -> {
                    val modelName = call.argument<String>("modelName") ?: return@setMethodCallHandler result.error("MISSING_PARAM", "Missing modelName parameter", null)
                    loadModel(modelName)
                    result.success(true)
                }
                "setRotation" -> {
                    val rotX = call.argument<Double>("rotationX") ?: 0.0
                    val rotY = call.argument<Double>("rotationY") ?: 0.0
                    val rotZ = call.argument<Double>("rotationZ") ?: 0.0
                    renderer?.setRotation(rotX.toFloat(), rotY.toFloat(), rotZ.toFloat())
                    glSurfaceView.requestRender()
                    result.success(true)
                }
                "setScale" -> {
                    val scale = call.argument<Double>("scale") ?: 1.0
                    renderer?.setScale(scale.toFloat())
                    glSurfaceView.requestRender()
                    result.success(true)
                }
                "setAcupointVisibility" -> {
                    val visible = call.argument<Boolean>("visible") ?: true
                    renderer?.setAcupointVisibility(visible)
                    glSurfaceView.requestRender()
                    result.success(true)
                }
                "highlightAcupoint" -> {
                    val acupointId = call.argument<String>("acupointId")
                    if (acupointId != null) {
                        renderer?.highlightAcupoint(acupointId)
                        glSurfaceView.requestRender()
                        result.success(true)
                    } else {
                        result.error("MISSING_PARAM", "Missing acupointId parameter", null)
                    }
                }
                "enableEnergyFlow" -> {
                    val enabled = call.argument<Boolean>("enabled") ?: false
                    val intensity = call.argument<Double>("intensity") ?: 1.0
                    renderer?.setEnergyFlow(enabled, intensity.toFloat())
                    glSurfaceView.requestRender()
                    result.success(true)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }
    
    private fun loadModel(modelName: String) {
        // 从资产加载模型
        try {
            val assetManager = context.assets
            val inputStream = assetManager.open("assets/models/$modelName.vtk")
            currentModelData = inputStream.readBytes()
            renderer?.setModelData(currentModelData)
            glSurfaceView.requestRender()
        } catch (e: Exception) {
            println("加载模型失败: ${e.message}")
        }
    }
    
    override fun getView(): android.view.View {
        return glSurfaceView
    }
    
    override fun dispose() {
        methodChannel.setMethodCallHandler(null)
    }
}

// VTK 渲染器
class VtkRenderer : GLSurfaceView.Renderer {
    private var rotationX = 0f
    private var rotationY = 0f
    private var rotationZ = 0f
    private var scale = 1f
    private var acupointsVisible = true
    private var energyFlowEnabled = false
    private var energyFlowIntensity = 1f
    private var highlightedAcupoint: String? = null
    private var modelData: ByteArray? = null
    
    fun setRotation(x: Float, y: Float, z: Float) {
        rotationX = x
        rotationY = y
        rotationZ = z
    }
    
    fun setScale(scale: Float) {
        this.scale = scale
    }
    
    fun setAcupointVisibility(visible: Boolean) {
        acupointsVisible = visible
    }
    
    fun highlightAcupoint(acupointId: String) {
        highlightedAcupoint = acupointId
    }
    
    fun setEnergyFlow(enabled: Boolean, intensity: Float) {
        energyFlowEnabled = enabled
        energyFlowIntensity = intensity
    }
    
    fun setModelData(data: ByteArray?) {
        modelData = data
    }
    
    override fun onSurfaceCreated(gl: GL10, config: EGLConfig) {
        // 初始化 OpenGL 环境
        gl.glClearColor(0.0f, 0.0f, 0.0f, 0.0f)
        gl.glEnable(GL10.GL_DEPTH_TEST)
    }
    
    override fun onSurfaceChanged(gl: GL10, width: Int, height: Int) {
        // 设置视口大小
        gl.glViewport(0, 0, width, height)
    }
    
    override fun onDrawFrame(gl: GL10) {
        // 绘制场景
        gl.glClear(GL10.GL_COLOR_BUFFER_BIT or GL10.GL_DEPTH_BUFFER_BIT)
        
        // TODO: 实现实际的 VTK 渲染逻辑
        // 这里应该使用 JNI 将绘制命令传递给 VTK 本地库
    }
}