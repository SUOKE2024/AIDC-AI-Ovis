import Flutter
import UIKit
import MetalKit
import GLKit

class VtkMeridianPlugin: NSObject, FlutterPlugin {
    static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(name: "com.suokelife.suoke_life/vtk_meridian", binaryMessenger: registrar.messenger())
        let instance = VtkMeridianPlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
        
        let factory = VtkMeridianViewFactory(messenger: registrar.messenger())
        registrar.register(factory, withId: "com.suokelife.suoke_life/vtk_meridian_view")
    }
    
    func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "loadModel":
            guard let args = call.arguments as? [String: Any],
                  let modelName = args["modelName"] as? String else {
                result(FlutterError(code: "MISSING_PARAM", message: "Missing modelName parameter", details: nil))
                return
            }
            
            let lodLevel = args["lodLevel"] as? String ?? "medium"
            
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    let modelData = try self.loadModelFromAssets(modelName: modelName, lodLevel: lodLevel)
                    result(FlutterStandardTypedData(bytes: modelData))
                } catch {
                    result(FlutterError(code: "LOAD_ERROR", message: "Failed to load model: \(error.localizedDescription)", details: nil))
                }
            }
            
        case "optimizeModel":
            guard let args = call.arguments as? [String: Any],
                  let modelData = args["modelData"] as? FlutterStandardTypedData else {
                result(FlutterError(code: "MISSING_PARAM", message: "Missing modelData parameter", details: nil))
                return
            }
            
            let targetSize = args["targetSize"] as? Int ?? 50000
            
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    let optimizedModel = try self.optimizeModel(modelData: modelData.data, targetSize: targetSize)
                    result(FlutterStandardTypedData(bytes: optimizedModel))
                } catch {
                    result(FlutterError(code: "OPTIMIZE_ERROR", message: "Failed to optimize model: \(error.localizedDescription)", details: nil))
                }
            }
            
        case "renderToImage":
            guard let args = call.arguments as? [String: Any],
                  let modelData = args["modelData"] as? FlutterStandardTypedData else {
                result(FlutterError(code: "MISSING_PARAM", message: "Missing modelData parameter", details: nil))
                return
            }
            
            let width = args["width"] as? Int ?? 512
            let height = args["height"] as? Int ?? 512
            
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    let imageData = try self.renderModelToImage(modelData: modelData.data, width: width, height: height)
                    result(FlutterStandardTypedData(bytes: imageData))
                } catch {
                    result(FlutterError(code: "RENDER_ERROR", message: "Failed to render model: \(error.localizedDescription)", details: nil))
                }
            }
            
        default:
            result(FlutterMethodNotImplemented)
        }
    }
    
    // 从资源加载模型
    private func loadModelFromAssets(modelName: String, lodLevel: String) throws -> Data {
        guard let path = Bundle.main.path(forResource: "\(modelName)_\(lodLevel)", ofType: "vtk", inDirectory: "assets/models") else {
            throw NSError(domain: "VtkMeridianPlugin", code: 404, userInfo: [NSLocalizedDescriptionKey: "Model file not found"])
        }
        
        return try Data(contentsOf: URL(fileURLWithPath: path))
    }
    
    // 优化模型
    private func optimizeModel(modelData: Data, targetSize: Int) throws -> Data {
        // 模型简化和优化的实现
        // TODO: 实现实际的模型优化逻辑，这里仅作为占位符
        return modelData
    }
    
    // 将模型渲染为图像
    private func renderModelToImage(modelData: Data, width: Int, height: Int) throws -> Data {
        // 将模型渲染为图像的实现
        // TODO: 实现实际的模型渲染逻辑，这里仅作为占位符
        
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        let image = renderer.image { context in
            UIColor.black.setFill()
            context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
        
        guard let imageData = image.pngData() else {
            throw NSError(domain: "VtkMeridianPlugin", code: 500, userInfo: [NSLocalizedDescriptionKey: "Failed to convert image to data"])
        }
        
        return imageData
    }
}

// MARK: - VtkMeridianViewFactory

class VtkMeridianViewFactory: NSObject, FlutterPlatformViewFactory {
    private let messenger: FlutterBinaryMessenger
    
    init(messenger: FlutterBinaryMessenger) {
        self.messenger = messenger
        super.init()
    }
    
    func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
        return VtkMeridianView(frame: frame, viewId: viewId, args: args as? [String: Any], messenger: messenger)
    }
    
    func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
        return FlutterStandardMessageCodec.sharedInstance()
    }
}

// MARK: - VtkMeridianView

class VtkMeridianView: NSObject, FlutterPlatformView {
    private let frame: CGRect
    private let viewId: Int64
    private let messenger: FlutterBinaryMessenger
    private let metalView: MTKView
    private let methodChannel: FlutterMethodChannel
    private var currentModelData: Data?
    private var renderer: VtkMetalRenderer?
    
    init(frame: CGRect, viewId: Int64, args: [String: Any]?, messenger: FlutterBinaryMessenger) {
        self.frame = frame
        self.viewId = viewId
        self.messenger = messenger
        
        // 创建 Metal 视图
        let device = MTLCreateSystemDefaultDevice()!
        metalView = MTKView(frame: frame, device: device)
        metalView.colorPixelFormat = .bgra8Unorm
        metalView.depthStencilPixelFormat = .depth32Float
        metalView.clearColor = MTLClearColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0)
        
        // 创建方法通道
        methodChannel = FlutterMethodChannel(
            name: "com.suokelife.suoke_life/vtk_meridian_view_\(viewId)",
            binaryMessenger: messenger
        )
        
        super.init()
        
        // 创建渲染器
        renderer = VtkMetalRenderer(view: metalView, device: device)
        metalView.delegate = renderer
        
        // 设置方法通道处理器
        setupMethodChannel()
        
        // 如果有初始模型名称，加载模型
        if let initialModelName = args?["initialModelName"] as? String {
            loadModel(modelName: initialModelName)
        }
        
        // 设置触摸事件处理
        let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePanGesture(_:)))
        metalView.addGestureRecognizer(panGesture)
        
        let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinchGesture(_:)))
        metalView.addGestureRecognizer(pinchGesture)
    }
    
    func view() -> UIView {
        return metalView
    }
    
    private func setupMethodChannel() {
        methodChannel.setMethodCallHandler { [weak self] (call, result) in
            guard let self = self else { return }
            
            switch call.method {
            case "loadModel":
                guard let args = call.arguments as? [String: Any],
                      let modelName = args["modelName"] as? String else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing modelName parameter", details: nil))
                    return
                }
                
                self.loadModel(modelName: modelName)
                result(true)
                
            case "setRotation":
                guard let args = call.arguments as? [String: Any] else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing rotation parameters", details: nil))
                    return
                }
                
                let rotX = args["rotationX"] as? Double ?? 0.0
                let rotY = args["rotationY"] as? Double ?? 0.0
                let rotZ = args["rotationZ"] as? Double ?? 0.0
                
                self.renderer?.setRotation(x: Float(rotX), y: Float(rotY), z: Float(rotZ))
                result(true)
                
            case "setScale":
                guard let args = call.arguments as? [String: Any],
                      let scale = args["scale"] as? Double else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing scale parameter", details: nil))
                    return
                }
                
                self.renderer?.setScale(Float(scale))
                result(true)
                
            case "setAcupointVisibility":
                guard let args = call.arguments as? [String: Any],
                      let visible = args["visible"] as? Bool else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing visible parameter", details: nil))
                    return
                }
                
                self.renderer?.setAcupointVisibility(visible)
                result(true)
                
            case "highlightAcupoint":
                guard let args = call.arguments as? [String: Any],
                      let acupointId = args["acupointId"] as? String else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing acupointId parameter", details: nil))
                    return
                }
                
                self.renderer?.highlightAcupoint(acupointId: acupointId)
                result(true)
                
            case "enableEnergyFlow":
                guard let args = call.arguments as? [String: Any],
                      let enabled = args["enabled"] as? Bool,
                      let intensity = args["intensity"] as? Double else {
                    result(FlutterError(code: "MISSING_PARAM", message: "Missing energy flow parameters", details: nil))
                    return
                }
                
                self.renderer?.setEnergyFlow(enabled: enabled, intensity: Float(intensity))
                result(true)
                
            default:
                result(FlutterMethodNotImplemented)
            }
        }
    }
    
    private func loadModel(modelName: String) {
        // 从资源加载模型
        guard let path = Bundle.main.path(forResource: modelName, ofType: "vtk", inDirectory: "assets/models") else {
            print("模型文件未找到: \(modelName)")
            return
        }
        
        do {
            let modelData = try Data(contentsOf: URL(fileURLWithPath: path))
            currentModelData = modelData
            renderer?.setModelData(modelData)
        } catch {
            print("加载模型失败: \(error.localizedDescription)")
        }
    }
    
    @objc private func handlePanGesture(_ gesture: UIPanGestureRecognizer) {
        let translation = gesture.translation(in: metalView)
        gesture.setTranslation(.zero, in: metalView)
        
        let rotationX = Float(translation.y) * 0.01
        let rotationY = Float(translation.x) * 0.01
        
        methodChannel.invokeMethod("onPan", arguments: [
            "rotationX": rotationX,
            "rotationY": rotationY,
            "state": gesture.state.rawValue
        ])
    }
    
    @objc private func handlePinchGesture(_ gesture: UIPinchGestureRecognizer) {
        let scale = gesture.scale
        gesture.scale = 1.0
        
        methodChannel.invokeMethod("onPinch", arguments: [
            "scale": scale,
            "state": gesture.state.rawValue
        ])
    }
}

// MARK: - VtkMetalRenderer

class VtkMetalRenderer: NSObject, MTKViewDelegate {
    private let device: MTLDevice
    private let commandQueue: MTLCommandQueue
    private let view: MTKView
    
    private var rotationX: Float = 0
    private var rotationY: Float = 0
    private var rotationZ: Float = 0
    private var scale: Float = 1.0
    private var acupointsVisible: Bool = true
    private var energyFlowEnabled: Bool = false
    private var energyFlowIntensity: Float = 1.0
    private var highlightedAcupoint: String?
    private var modelData: Data?
    
    init(view: MTKView, device: MTLDevice) {
        self.view = view
        self.device = device
        self.commandQueue = device.makeCommandQueue()!
        super.init()
    }
    
    func setRotation(x: Float, y: Float, z: Float) {
        rotationX = x
        rotationY = y
        rotationZ = z
    }
    
    func setScale(_ scale: Float) {
        self.scale = scale
    }
    
    func setAcupointVisibility(_ visible: Bool) {
        acupointsVisible = visible
    }
    
    func highlightAcupoint(acupointId: String) {
        highlightedAcupoint = acupointId
    }
    
    func setEnergyFlow(enabled: Bool, intensity: Float) {
        energyFlowEnabled = enabled
        energyFlowIntensity = intensity
    }
    
    func setModelData(_ data: Data) {
        modelData = data
    }
    
    // MTKViewDelegate methods
    
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        // 视图大小变化的处理
    }
    
    func draw(in view: MTKView) {
        // 获取命令缓冲区
        guard let commandBuffer = commandQueue.makeCommandBuffer(),
              let renderPassDescriptor = view.currentRenderPassDescriptor,
              let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
            return
        }
        
        // TODO: 实现实际的 VTK 渲染逻辑
        // 这里应该使用 Metal 渲染命令渲染 3D 模型
        
        renderEncoder.endEncoding()
        
        if let drawable = view.currentDrawable {
            commandBuffer.present(drawable)
        }
        
        commandBuffer.commit()
    }
}