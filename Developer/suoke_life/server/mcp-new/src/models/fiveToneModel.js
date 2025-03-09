/**
 * 五音分析模型
 * 基于中医五音理论，分析声音特征与脏腑状态的关联
 */

class FiveToneModel {
  /**
   * 初始化五音分析模型
   * @param {Object} options - 配置选项
   * @param {Object} options.logger - 日志服务
   */
  constructor (options = {}) {
    this.logger = options.logger || console

    // 五音特性描述
    this.toneCharacteristics = {
      gong: {
        name: '宫音',
        organ: '脾',
        property: '中正和缓',
        emotion: '思',
        season: '长夏',
        flavor: '甘',
        color: '黄',
        tone: '柔和圆润',
        description: '宫音厚重和缓，如洪钟大吕，对应脾之功能',
        frequencyRange: [150, 300]
      },
      shang: {
        name: '商音',
        organ: '肺',
        property: '轻清肃降',
        emotion: '悲',
        season: '秋',
        flavor: '辛',
        color: '白',
        tone: '清脆悦耳',
        description: '商音清越明亮，如金石声，对应肺之功能',
        frequencyRange: [300, 450]
      },
      jue: {
        name: '角音',
        organ: '肝',
        property: '柔和条达',
        emotion: '怒',
        season: '春',
        flavor: '酸',
        color: '青',
        tone: '尖锐高亢',
        description: '角音尖锐挺拔，如木声，对应肝之功能',
        frequencyRange: [450, 600]
      },
      zhi: {
        name: '徵音',
        organ: '心',
        property: '阳热升浮',
        emotion: '喜',
        season: '夏',
        flavor: '苦',
        color: '赤',
        tone: '洪亮激越',
        description: '徵音洪亮激越，如火势上炎，对应心之功能',
        frequencyRange: [600, 750]
      },
      yu: {
        name: '羽音',
        organ: '肾',
        property: '沉着内敛',
        emotion: '恐',
        season: '冬',
        flavor: '咸',
        color: '黑',
        tone: '深沉含蓄',
        description: '羽音沉默深长，如水流潺潺，对应肾之功能',
        frequencyRange: [750, 900]
      }
    }

    // 五音与病证对应关系
    this.toneDisharmonyMapping = {
      gong: {
        deficiency: ['脾虚', '气虚', '中气下陷'],
        excess: ['湿困脾', '食积', '痰湿']
      },
      shang: {
        deficiency: ['肺气虚', '肺阴虚'],
        excess: ['风寒束肺', '肺热', '痰浊阻肺']
      },
      jue: {
        deficiency: ['肝血虚', '肝阴虚'],
        excess: ['肝气郁结', '肝阳上亢', '肝胆湿热']
      },
      zhi: {
        deficiency: ['心气虚', '心血虚', '心阴虚'],
        excess: ['心火亢盛', '痰蒙心神', '心血瘀阻']
      },
      yu: {
        deficiency: ['肾阳虚', '肾阴虚', '肾精亏'],
        excess: ['肾水不济', '下焦湿热']
      }
    }
  }

  /**
   * 识别主导音调
   * @param {Object} audioFeatures - 音频特征
   * @returns {string} 主导音调代码
   */
  identifyDominantTone (audioFeatures) {
    try {
      this.logger.info('识别主导音调')

      // 检查是否有频率特征数据
      if (!audioFeatures || !audioFeatures.frequency || !audioFeatures.frequency.dominantTone) {
        this.logger.warn('音频特征中缺少主导音调信息，使用频率能量进行计算')

        // 如果没有预计算的主导音调，尝试从能量分布计算
        if (audioFeatures.frequency && audioFeatures.frequency.toneEnergies) {
          return this.calculateDominantToneFromEnergies(audioFeatures.frequency.toneEnergies)
        }

        // 如果没有音调能量，使用基于多种特征的综合判断
        return this.estimateDominantTone(audioFeatures)
      }

      return audioFeatures.frequency.dominantTone
    } catch (error) {
      this.logger.error('识别主导音调失败', error)
      // 默认返回宫音（脾）
      return 'gong'
    }
  }

  /**
   * 从音调能量分布中计算主导音调
   * @param {Object} toneEnergies - 各音调能量值
   * @returns {string} 主导音调代码
   */
  calculateDominantToneFromEnergies (toneEnergies) {
    let maxEnergy = 0
    let dominantTone = 'gong' // 默认宫音

    Object.entries(toneEnergies).forEach(([tone, energy]) => {
      if (energy > maxEnergy) {
        maxEnergy = energy
        dominantTone = tone
      }
    })

    return dominantTone
  }

  /**
   * 基于多种特征估计主导音调
   * @param {Object} audioFeatures - 音频特征
   * @returns {string} 主导音调代码
   */
  estimateDominantTone (audioFeatures) {
    // 这里应该实现一个复杂的算法，综合考虑各种音频特征
    // 例如频谱质心、音色、强度等特征

    // 简化版：结合基频和音色特征做简单判断
    const toneScores = {
      gong: 0,
      shang: 0,
      jue: 0,
      zhi: 0,
      yu: 0
    }

    // 考虑基频
    const fundamental = audioFeatures.frequency?.fundamentalFrequency || 0
    if (fundamental > 0) {
      Object.entries(this.toneCharacteristics).forEach(([tone, chars]) => {
        const [min, max] = chars.frequencyRange
        if (fundamental >= min && fundamental <= max) {
          toneScores[tone] += 3 // 基频落在范围内，加3分
        } else {
          // 计算基频到范围的接近程度
          const dist = Math.min(Math.abs(fundamental - min), Math.abs(fundamental - max))
          const maxPossibleDist = 500 // 假设最大可能距离
          const proximityScore = Math.max(0, 1 - dist / maxPossibleDist) * 2
          toneScores[tone] += proximityScore
        }
      })
    }

    // 考虑音色特征
    if (audioFeatures.timbre) {
      // 宫音（脾）特征：温暖、圆润、厚重
      if (audioFeatures.timbre.warmth > 0.6) toneScores.gong += 1

      // 商音（肺）特征：清脆、明亮
      if (audioFeatures.timbre.brightness > 0.7) toneScores.shang += 1

      // 角音（肝）特征：尖锐、锋利
      if (audioFeatures.timbre.sharpness > 0.7) toneScores.jue += 1

      // 徵音（心）特征：洪亮、开放
      if (audioFeatures.timbre.spectralContrast > 0.7) toneScores.zhi += 1

      // 羽音（肾）特征：深沉、含蓄
      if (audioFeatures.timbre.brightness < 0.3 && audioFeatures.timbre.warmth > 0.4) {
        toneScores.yu += 1
      }
    }

    // 考虑强度特征
    if (audioFeatures.intensity) {
      // 宫音：中等强度，稳定
      if (audioFeatures.intensity.averageIntensity > 0.4 &&
          audioFeatures.intensity.averageIntensity < 0.6 &&
          audioFeatures.intensity.intensityVariation < 0.2) {
        toneScores.gong += 0.5
      }

      // 商音：适中偏弱，有变化
      if (audioFeatures.intensity.averageIntensity < 0.5 &&
          audioFeatures.intensity.intensityVariation > 0.15) {
        toneScores.shang += 0.5
      }

      // 角音：起伏较大
      if (audioFeatures.intensity.intensityVariation > 0.25) {
        toneScores.jue += 0.5
      }

      // 徵音：强度高
      if (audioFeatures.intensity.averageIntensity > 0.6) {
        toneScores.zhi += 0.5
      }

      // 羽音：强度低
      if (audioFeatures.intensity.averageIntensity < 0.4) {
        toneScores.yu += 0.5
      }
    }

    // 找出得分最高的音调
    let maxScore = 0
    let dominantTone = 'gong'

    Object.entries(toneScores).forEach(([tone, score]) => {
      if (score > maxScore) {
        maxScore = score
        dominantTone = tone
      }
    })

    this.logger.info('估计的主导音调', { dominantTone, scores: toneScores })
    return dominantTone
  }

  /**
   * 获取音调与脏腑的对应关系
   * @param {string} tone - 音调代码
   * @returns {Object} 音调与脏腑的对应关系
   */
  getToneOrganRelationship (tone) {
    return this.toneCharacteristics[tone] || null
  }

  /**
   * 获取音调相关的病证
   * @param {string} tone - 音调代码
   * @param {boolean} isDeficiency - 是否取虚证
   * @returns {string[]} 相关病证列表
   */
  getToneRelatedDisharmonies (tone, isDeficiency = true) {
    const mapping = this.toneDisharmonyMapping[tone]
    if (!mapping) {
      return []
    }

    return isDeficiency ? mapping.deficiency : mapping.excess
  }

  /**
   * 分析声音特征与病证的关联
   * @param {string} dominantTone - 主导音调
   * @param {Object} audioFeatures - 音频特征
   * @returns {Object} 分析结果
   */
  analyzeVoicePattern (dominantTone, audioFeatures) {
    const toneInfo = this.getToneOrganRelationship(dominantTone)
    if (!toneInfo) {
      return {
        tone: dominantTone,
        organ: '未知',
        pattern: '未能确定',
        confidence: 0.3,
        possibleDisharmonies: []
      }
    }

    // 判断是虚还是实
    const isDeficiency = this.determineDeficiencyPattern(audioFeatures)

    // 获取相关病证
    const possibleDisharmonies = this.getToneRelatedDisharmonies(dominantTone, isDeficiency)

    // 计算每个病证的可能性分数
    const scoredDisharmonies = possibleDisharmonies.map(name => {
      const score = this.calculateDisharmonyScore(name, audioFeatures)
      return { name, score }
    })

    // 按分数排序
    scoredDisharmonies.sort((a, b) => b.score - a.score)

    // 计算整体置信度
    const confidence = scoredDisharmonies.length > 0
      ? scoredDisharmonies[0].score
      : 0.4

    return {
      tone: dominantTone,
      organ: toneInfo.organ,
      pattern: isDeficiency ? '虚证' : '实证',
      confidence,
      possibleDisharmonies: scoredDisharmonies
    }
  }

  /**
   * 判断是否为虚证
   * @param {Object} audioFeatures - 音频特征
   * @returns {boolean} 是否为虚证
   */
  determineDeficiencyPattern (audioFeatures) {
    // 虚证特征：音量低、音色弱、能量低
    // 实证特征：音量高、音色强、能量高

    if (!audioFeatures) {
      return true // 默认虚证
    }

    let deficiencyScore = 0
    let excessScore = 0

    // 分析强度特征
    if (audioFeatures.intensity) {
      // 强度低，偏向虚证
      if (audioFeatures.intensity.averageIntensity < 0.4) {
        deficiencyScore += 1
      } else if (audioFeatures.intensity.averageIntensity > 0.6) {
        // 强度高，偏向实证
        excessScore += 1
      }
    }

    // 分析时域特征
    if (audioFeatures.time) {
      // RMS低，偏向虚证
      if (audioFeatures.time.rms < 0.3) {
        deficiencyScore += 1
      } else if (audioFeatures.time.rms > 0.6) {
        // RMS高，偏向实证
        excessScore += 1
      }
    }

    // 分析频域特征
    if (audioFeatures.frequency) {
      // 频谱能量分布
      const energyDist = audioFeatures.frequency.energyDistribution
      if (energyDist) {
        // 低频能量高，偏向实证
        if (energyDist.low > 0.6) {
          excessScore += 1
        }

        // 高频能量高，偏向虚证（特别是阴虚）
        if (energyDist.high > 0.4) {
          deficiencyScore += 0.5
        }
      }
    }

    // 分析音色特征
    if (audioFeatures.timbre) {
      // 音色暗淡无力，偏向虚证
      if (audioFeatures.timbre.brightness < 0.4) {
        deficiencyScore += 0.5
      }

      // 音色明亮刺耳，偏向实证或阳亢
      if (audioFeatures.timbre.brightness > 0.7 && audioFeatures.timbre.sharpness > 0.6) {
        excessScore += 0.5
      }
    }

    this.logger.info('虚实分析', { deficiencyScore, excessScore })

    // 比较分数决定虚实
    return deficiencyScore >= excessScore
  }

  /**
   * 计算特定病证的可能性分数
   * @param {string} disharmonyName - 病证名称
   * @param {Object} audioFeatures - 音频特征
   * @returns {number} 可能性分数 (0-1)
   */
  calculateDisharmonyScore (disharmonyName, audioFeatures) {
    // 每种病证的特征匹配规则
    // 这里应该实现一个复杂的规则系统
    // 简化版：返回基于病证名称的模拟评分

    const baseScore = 0.6 + (Math.random() * 0.3) // 基础分数(0.6-0.9)

    // 根据不同病证调整分数
    switch (disharmonyName) {
      case '脾虚':
        // 脾虚：音调弱，音色平淡
        if (audioFeatures.intensity?.averageIntensity < 0.35 &&
            audioFeatures.timbre?.brightness < 0.5) {
          return Math.min(baseScore + 0.15, 1.0)
        }
        break

      case '肺气虚':
        // 肺气虚：音短促，弱，不继
        if (audioFeatures.rhythm?.pauseFrequency > 0.3 &&
            audioFeatures.intensity?.averageIntensity < 0.4) {
          return Math.min(baseScore + 0.15, 1.0)
        }
        break

      case '肝气郁结':
        // 肝气郁结：音抑郁，不舒
        if (audioFeatures.rhythm?.rhythmicRegularity < 0.5) {
          return Math.min(baseScore + 0.1, 1.0)
        }
        break

      case '心阴虚':
        // 心阴虚：音高亢，急躁
        if (audioFeatures.frequency?.spectralCentroid > 1000 &&
            audioFeatures.rhythm?.speechRate > 4) {
          return Math.min(baseScore + 0.2, 1.0)
        }
        break

      case '肾阳虚':
        // 肾阳虚：音低沉，无力
        if (audioFeatures.frequency?.spectralCentroid < 500 &&
            audioFeatures.intensity?.averageIntensity < 0.3) {
          return Math.min(baseScore + 0.2, 1.0)
        }
        break
    }

    return baseScore
  }

  /**
   * 分析声音变化趋势
   * @param {Array<Object>} audioFeaturesSequence - 一系列音频特征
   * @returns {Object} 变化趋势分析
   */
  analyzeVoiceTrend (audioFeaturesSequence) {
    if (!audioFeaturesSequence || audioFeaturesSequence.length < 2) {
      return { reliable: false, trend: '样本不足以分析趋势' }
    }

    // 实际应用需要分析声音各项特征的变化趋势
    // 简化版：返回基本结论
    return {
      reliable: true,
      trend: '声音特征保持稳定',
      details: {
        intensityTrend: '稳定',
        pitchTrend: '稳定',
        timbreTrend: '稳定'
      }
    }
  }
}

module.exports = FiveToneModel
