const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')
const AudioProcessor = require('../utils/audioProcessor')

class VoiceDatasetManager {
  constructor (options = {}) {
    this.basePath = options.basePath || path.join(process.cwd(), 'data', 'voice')
    this.samplesPath = path.join(this.basePath, 'clinical_samples')
    this.audioPath = path.join(this.samplesPath, 'audio')
    this.metadataPath = path.join(this.samplesPath, 'metadata')
    this.featuresPath = path.join(this.samplesPath, 'features')
    this.manifestPath = path.join(this.samplesPath, 'manifest.json')

    this.audioProcessor = new AudioProcessor(options)
    this.logger = options.logger || console
  }

  async initialize () {
    try {
      // 确保目录结构存在
      await fs.mkdir(this.samplesPath, { recursive: true })
      await fs.mkdir(this.audioPath, { recursive: true })
      await fs.mkdir(this.metadataPath, { recursive: true })
      await fs.mkdir(this.featuresPath, { recursive: true })

      // 检查和初始化清单文件
      try {
        await fs.access(this.manifestPath)
      } catch {
        // 创建新的清单文件
        const initialManifest = {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          totalSamples: 0,
          categories: {
            healthy: 0,
            disharmony: {
              spleen: 0,
              lung: 0,
              liver: 0,
              heart: 0,
              kidney: 0
            }
          },
          metadataFormat: {
            // 相关格式定义
          }
        }

        await fs.writeFile(
          this.manifestPath,
          JSON.stringify(initialManifest, null, 2),
          'utf8'
        )
      }

      this.logger.info('语音数据集管理器初始化成功')
    } catch (error) {
      this.logger.error('语音数据集管理器初始化失败', error)
      throw error
    }
  }

  async importSample (audioFile, metadata) {
    try {
      // 1. 读取清单
      const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'))

      // 2. 生成新样本ID
      const sampleId = `VS${String(manifest.totalSamples + 1).padStart(4, '0')}`

      // 3. 复制音频文件
      const targetFilename = `${sampleId}.wav`
      const targetPath = path.join(this.audioPath, targetFilename)

      if (typeof audioFile === 'string') {
        // 复制文件
        await fs.copyFile(audioFile, targetPath)
      } else {
        // 写入Buffer
        await fs.writeFile(targetPath, audioFile)
      }

      // 4. 标准化音频格式
      this.normalizeAudio(targetPath)

      // 5. 提取特征
      const features = await this.audioProcessor.extractFeatures(targetPath)
      const featuresPath = path.join(this.featuresPath, `${sampleId}_features.json`)
      await fs.writeFile(
        featuresPath,
        JSON.stringify(features, null, 2),
        'utf8'
      )

      // 6. 保存元数据
      const completeMetadata = {
        id: sampleId,
        filename: targetFilename,
        ...metadata,
        features: `features/${sampleId}_features.json`,
        importedAt: new Date().toISOString()
      }

      await fs.writeFile(
        path.join(this.metadataPath, `${sampleId}.json`),
        JSON.stringify(completeMetadata, null, 2),
        'utf8'
      )

      // 7. 更新清单
      manifest.totalSamples++

      // 更新分类计数
      if (metadata.diagnosis && metadata.diagnosis.primary) {
        const category = this.mapDiagnosisToCategory(metadata.diagnosis.primary)
        if (category in manifest.categories.disharmony) {
          manifest.categories.disharmony[category]++
        }
      } else {
        manifest.categories.healthy++
      }

      manifest.lastUpdated = new Date().toISOString()

      await fs.writeFile(
        this.manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf8'
      )

      return sampleId
    } catch (error) {
      this.logger.error('样本导入失败', error)
      throw error
    }
  }

  mapDiagnosisToCategory (diagnosis) {
    // 将诊断映射到对应的脏腑分类
    const mapping = {
      脾虚: 'spleen',
      气虚: 'spleen',
      湿困脾: 'spleen',
      食积: 'spleen',
      痰湿: 'spleen',

      肺气虚: 'lung',
      肺阴虚: 'lung',
      风寒束肺: 'lung',
      肺热: 'lung',
      痰浊阻肺: 'lung'

      // 其他映射...
    }

    return mapping[diagnosis] || 'other'
  }

  normalizeAudio (audioPath) {
    try {
      // 使用ffmpeg进行音频标准化处理
      // 注意：这需要系统中安装ffmpeg
      execSync(`ffmpeg -y -i "${audioPath}" -ar 44100 -ac 1 -acodec pcm_s16le "${audioPath}.tmp" && mv "${audioPath}.tmp" "${audioPath}"`)
      return true
    } catch (error) {
      this.logger.error('音频标准化失败', error)
      return false
    }
  }

  async querySamples (filters = {}) {
    try {
      const allFiles = await fs.readdir(this.metadataPath)
      const metadataFiles = allFiles.filter(file => file.endsWith('.json'))

      const results = []

      for (const file of metadataFiles) {
        const metadata = JSON.parse(
          await fs.readFile(path.join(this.metadataPath, file), 'utf8')
        )

        // 应用过滤器
        let match = true

        if (filters.dominantTone && metadata.dominantTone !== filters.dominantTone) {
          match = false
        }

        if (filters.diagnosis && (!metadata.diagnosis ||
            !metadata.diagnosis.primary.includes(filters.diagnosis))) {
          match = false
        }

        if (filters.ageRange && (
          metadata.age < filters.ageRange[0] ||
            metadata.age > filters.ageRange[1])) {
          match = false
        }

        if (filters.gender && metadata.gender !== filters.gender) {
          match = false
        }

        if (match) {
          results.push(metadata)
        }
      }

      return results
    } catch (error) {
      this.logger.error('查询样本失败', error)
      return []
    }
  }

  async getSampleAudio (sampleId) {
    try {
      const audioPath = path.join(this.audioPath, `${sampleId}.wav`)
      return await fs.readFile(audioPath)
    } catch (error) {
      this.logger.error(`获取样本音频失败: ${sampleId}`, error)
      throw error
    }
  }

  async exportTrainingData (outputPath, options = {}) {
    // 为ML模型导出训练数据
    // 实现细节略
  }

  /**
   * 验证样本元数据
   * @param {Object} metadata - 样本元数据
   * @returns {Object} 验证结果，包含valid字段和可能的错误信息
   */
  validateSampleMetadata (metadata) {
    // 必填字段列表
    const requiredFields = [
      'id', 'gender', 'age', 'constitution', 'dominantTone', 'diagnosis'
    ]

    // 检查缺失的必填字段
    const missingFields = []
    requiredFields.forEach(field => {
      if (field === 'diagnosis') {
        // 诊断需要特殊处理，确保至少有主要诊断
        if (!metadata.diagnosis || !metadata.diagnosis.primary) {
          missingFields.push('diagnosis.primary')
        }
      } else if (!metadata[field]) {
        missingFields.push(field)
      }
    })

    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: `缺少必填字段: ${missingFields.join(', ')}`
      }
    }

    // 验证字段类型和值范围
    const validationErrors = []

    // 验证年龄
    if (typeof metadata.age !== 'number' || metadata.age < 1 || metadata.age > 120) {
      validationErrors.push('年龄必须是1-120之间的数字')
    }

    // 验证性别
    if (!['男', '女'].includes(metadata.gender)) {
      validationErrors.push('性别必须是"男"或"女"')
    }

    // 验证体质类型
    const validConstitutions = [
      '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质',
      '湿热质', '血瘀质', '气郁质', '特禀质'
    ]
    if (!validConstitutions.includes(metadata.constitution)) {
      validationErrors.push(`体质类型必须是以下之一: ${validConstitutions.join(', ')}`)
    }

    // 验证主导音调
    const validTones = ['gong', 'shang', 'jue', 'zhi', 'yu']
    if (!validTones.includes(metadata.dominantTone)) {
      validationErrors.push(`主导音调必须是以下之一: ${validTones.join(', ')}`)
    }

    // 验证专家评分
    if (metadata.expertRating) {
      if (typeof metadata.expertRating !== 'number' ||
          metadata.expertRating < 1 ||
          metadata.expertRating > 5) {
        validationErrors.push('专家评分必须是1-5之间的数字')
      }
    }

    // 验证ID格式
    if (!/^VS\d{4}$/.test(metadata.id)) {
      validationErrors.push('ID必须符合格式要求，如VS0001')
    }

    // 返回验证结果
    if (validationErrors.length > 0) {
      return {
        valid: false,
        errors: validationErrors.join('; ')
      }
    }

    return { valid: true }
  }
}

module.exports = VoiceDatasetManager
