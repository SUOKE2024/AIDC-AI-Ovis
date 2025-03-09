const tf = require('@tensorflow/tfjs-node')
const fs = require('fs').promises
const path = require('path')

class VoiceMLModel {
  constructor (options = {}) {
    this.logger = options.logger || console
    this.modelPath = options.modelPath || path.join(process.cwd(), 'data', 'models', 'voice_diagnosis')
    this.model = null
    this.mfccProcessor = options.mfccProcessor
    this.initialized = false
  }

  async initialize () {
    try {
      // 加载预训练模型
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`)
      this.classLabels = JSON.parse(await fs.readFile(path.join(this.modelPath, 'labels.json'), 'utf8'))
      this.initialized = true
      this.logger.info('声音ML模型加载成功')
    } catch (error) {
      this.logger.error('声音ML模型加载失败', error)
      // 回退到基础模型
      await this.createBaselineModel()
    }
  }

  async createBaselineModel () {
    // 创建一个简单的基线模型
    const model = tf.sequential()
    model.add(tf.layers.dense({ inputShape: [13], units: 64, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 5, activation: 'softmax' })) // 5个音调分类

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    this.model = model
    this.classLabels = ['gong', 'shang', 'jue', 'zhi', 'yu']
    this.initialized = true
  }

  async predictTone (mfccFeatures) {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      // 转换为张量
      const inputTensor = tf.tensor2d([mfccFeatures])

      // 预测
      const predictions = this.model.predict(inputTensor)
      const predictionArray = await predictions.array()

      // 释放张量
      inputTensor.dispose()
      predictions.dispose()

      // 获取分类结果
      const predictionValues = predictionArray[0]
      const toneScores = {}

      this.classLabels.forEach((tone, i) => {
        toneScores[tone] = predictionValues[i]
      })

      // 找出得分最高的音调
      let maxScore = 0
      let dominantTone = 'gong' // 默认

      Object.entries(toneScores).forEach(([tone, score]) => {
        if (score > maxScore) {
          maxScore = score
          dominantTone = tone
        }
      })

      return {
        dominantTone,
        confidence: maxScore,
        toneScores
      }
    } catch (error) {
      this.logger.error('ML模型预测失败', error)
      return { dominantTone: 'gong', confidence: 0.5, toneScores: {} }
    }
  }

  async predictDisharmony (audioFeatures, dominantTone) {
    // 根据音调和音频特征预测可能的病证
    if (!this.disharmonyModel) {
      // 这里应该加载专门用于病证预测的模型
      return null
    }

    try {
      // 示例实现 - 真实情况下应该基于实际模型
      const featuresArray = []

      // 整合关键特征
      if (audioFeatures.timbre) {
        featuresArray.push(
          audioFeatures.timbre.brightness || 0,
          audioFeatures.timbre.roughness || 0,
          audioFeatures.timbre.warmth || 0,
          audioFeatures.timbre.sharpness || 0
        )
      }

      if (audioFeatures.intensity) {
        featuresArray.push(
          audioFeatures.intensity.averageIntensity || 0,
          audioFeatures.intensity.intensityVariation || 0
        )
      }

      const inputTensor = tf.tensor2d([featuresArray])
      const predictions = this.disharmonyModel.predict(inputTensor)

      // 假设输出是各种病证的概率
      const results = await predictions.array()

      inputTensor.dispose()
      predictions.dispose()

      return results[0] // 病证预测结果
    } catch (error) {
      this.logger.error('病证预测失败', error)
      return null
    }
  }
}

module.exports = VoiceMLModel
