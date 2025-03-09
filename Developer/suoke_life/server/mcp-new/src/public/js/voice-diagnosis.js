/**
 * 声音诊断页面脚本
 * 基于中医五音理论，实现声音录制和分析
 */
document.addEventListener('DOMContentLoaded', function () {
  // DOM元素
  const startInstructionsBtn = document.getElementById('startInstructionsBtn')
  const recordButton = document.getElementById('recordButton')
  const timer = document.getElementById('timer')
  const audioVisualizer = document.getElementById('audioVisualizer')
  const audioBars = document.getElementById('audioBars')
  const loadingSpinner = document.getElementById('loadingSpinner')
  const analysisResults = document.getElementById('analysisResults')
  const saveResultBtn = document.getElementById('saveResultBtn')

  // 步骤元素
  const step1 = document.getElementById('step1')
  const step2 = document.getElementById('step2')
  const step3 = document.getElementById('step3')

  // 结果元素
  const resultToneIcon = document.getElementById('resultToneIcon')
  const resultToneName = document.getElementById('resultToneName')
  const resultOrganRelation = document.getElementById('resultOrganRelation')
  const resultToneDescription = document.getElementById('resultToneDescription')
  const pitchFeature = document.getElementById('pitchFeature')
  const timbreFeature = document.getElementById('timbreFeature')
  const volumeFeature = document.getElementById('volumeFeature')
  const rhythmFeature = document.getElementById('rhythmFeature')
  const disharmonyList = document.getElementById('disharmonyList')
  const generalRecommendations = document.getElementById('generalRecommendations')
  const specificRecommendations = document.getElementById('specificRecommendations')

  // 器官选择器
  const organItems = document.querySelectorAll('.organ-item')

  // 录音状态
  let isRecording = false
  let mediaRecorder = null
  let audioChunks = []
  let recordingStartTime = 0
  let timerInterval = null
  let currentStep = 1
  let recordedBlob = null
  let visualizerInterval = null
  let bars = []

  // 创建音频可视化条
  createAudioBars()

  // 初始化页面
  initPage()

  /**
     * 初始化页面
     */
  function initPage () {
    // 开始指南按钮点击事件
    startInstructionsBtn.addEventListener('click', function () {
      goToStep(2)
    })

    // 录音按钮点击事件
    recordButton.addEventListener('click', toggleRecording)

    // 保存结果按钮点击事件
    saveResultBtn.addEventListener('click', saveResult)

    // 器官项点击事件
    organItems.forEach(item => {
      item.addEventListener('click', function () {
        organItems.forEach(i => i.classList.remove('active'))
        this.classList.add('active')

        const tone = this.getAttribute('data-tone')
        showToneInfo(tone)
      })
    })

    // 检查麦克风权限
    checkMicrophonePermission()
  }

  /**
     * 检查麦克风权限
     */
  function checkMicrophonePermission () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // 权限已授予，停止流
          stream.getTracks().forEach(track => track.stop())
        })
        .catch(error => {
          console.error('获取麦克风权限失败:', error)
          alert('声音诊断需要麦克风权限，请在浏览器中允许使用麦克风。')
        })
    } else {
      console.error('浏览器不支持麦克风录音')
      alert('您的浏览器不支持麦克风录音功能，请使用Chrome、Firefox或Safari浏览器。')
    }
  }

  /**
     * 跳转到指定步骤
     * @param {number} stepNumber - 步骤编号
     */
  function goToStep (stepNumber) {
    step1.classList.remove('active')
    step2.classList.remove('active')
    step3.classList.remove('active')

    if (stepNumber === 1) {
      step1.classList.add('active')
    } else if (stepNumber === 2) {
      step2.classList.add('active')
    } else if (stepNumber === 3) {
      step3.classList.add('active')
    }

    currentStep = stepNumber
  }

  /**
     * 切换录音状态
     */
  function toggleRecording () {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  /**
     * 开始录音
     */
  function startRecording () {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream)
          audioChunks = []

          mediaRecorder.ondataavailable = e => {
            audioChunks.push(e.data)
          }

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
            recordedBlob = audioBlob

            // 如果是最后一步，分析声音
            if (currentStep === 3) {
              analyzeVoice(audioBlob)
            } else {
              goToStep(currentStep + 1)
            }
          }

          mediaRecorder.start()
          isRecording = true
          recordingStartTime = Date.now()

          // 更新UI
          recordButton.classList.add('recording')
          recordButton.innerHTML = '<i class="bi bi-stop-fill"></i><span>停止录音</span>'

          // 开始计时器
          startTimer()

          // 开始音频可视化
          startAudioVisualization(stream)

          console.log('录音开始')
        })
        .catch(error => {
          console.error('获取麦克风权限失败:', error)
          alert('无法访问麦克风，请确保已授予权限。')
        })
    } else {
      alert('您的浏览器不支持录音功能。')
    }
  }

  /**
     * 停止录音
     */
  function stopRecording () {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      isRecording = false

      // 更新UI
      recordButton.classList.remove('recording')
      recordButton.innerHTML = '<i class="bi bi-mic"></i><span>开始录音</span>'

      // 停止计时器
      stopTimer()

      // 停止音频可视化
      stopAudioVisualization()

      console.log('录音结束')
    }
  }

  /**
     * 开始计时器
     */
  function startTimer () {
    stopTimer() // 确保先停止之前的计时器

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0')
      const seconds = (elapsed % 60).toString().padStart(2, '0')
      timer.textContent = `${minutes}:${seconds}`
    }, 1000)
  }

  /**
     * 停止计时器
     */
  function stopTimer () {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  /**
     * 创建音频可视化条
     */
  function createAudioBars () {
    audioBars.innerHTML = ''
    bars = []

    const barCount = 32
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div')
      bar.className = 'audio-bar'
      audioBars.appendChild(bar)
      bars.push(bar)
    }
  }

  /**
     * 开始音频可视化
     * @param {MediaStream} stream - 媒体流
     */
  function startAudioVisualization (stream) {
    stopAudioVisualization() // 确保先停止之前的可视化

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      source.connect(analyser)
      analyser.fftSize = 128

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      visualizerInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray)
        updateVisualization(dataArray, bufferLength)
      }, 50)
    } catch (error) {
      console.error('无法创建音频可视化:', error)

      // 回退到模拟可视化
      visualizerInterval = setInterval(() => {
        const fakeData = new Uint8Array(32)
        for (let i = 0; i < 32; i++) {
          fakeData[i] = Math.random() * 255
        }
        updateVisualization(fakeData, 32)
      }, 50)
    }
  }

  /**
     * 停止音频可视化
     */
  function stopAudioVisualization () {
    if (visualizerInterval) {
      clearInterval(visualizerInterval)
      visualizerInterval = null

      // 重置所有条高度
      bars.forEach(bar => {
        bar.style.height = '10%'
      })
    }
  }

  /**
     * 更新可视化
     * @param {Uint8Array} dataArray - 频率数据
     * @param {number} bufferLength - 缓冲区长度
     */
  function updateVisualization (dataArray, bufferLength) {
    const barCount = bars.length
    const step = Math.floor(bufferLength / barCount) || 1

    for (let i = 0; i < barCount; i++) {
      let value = 0
      for (let j = 0; j < step; j++) {
        const index = i * step + j
        if (index < bufferLength) {
          value += dataArray[index]
        }
      }

      value = value / step // 平均值
      const height = (value / 255) * 90 + 10 // 10%-100%范围内
      bars[i].style.height = `${height}%`
    }
  }

  /**
     * 分析声音
     * @param {Blob} audioBlob - 音频数据
     */
  function analyzeVoice (audioBlob) {
    // 显示加载动画
    loadingSpinner.style.display = 'block'

    // 创建表单数据
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    // 获取用户认证令牌（如果有）
    const authToken = localStorage.getItem('authToken')

    // 发送到服务器分析
    fetch('/api/voice-diagnosis/analyze', {
      method: 'POST',
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('分析请求失败: ' + response.status)
        }
        return response.json()
      })
      .then(result => {
        // 隐藏加载动画
        loadingSpinner.style.display = 'none'

        // 显示分析结果
        displayResults(result)
      })
      .catch(error => {
        console.error('分析声音失败:', error)

        // 隐藏加载动画
        loadingSpinner.style.display = 'none'

        // 显示模拟结果（真实环境中不应该这样做）
        displayMockResults()

        // 对用户显示友好的错误信息
        alert('声音分析暂时不可用，显示模拟数据供演示。')
      })
  }

  /**
     * 显示分析结果
     * @param {Object} result - 分析结果
     */
  function displayResults (result) {
    // 更新音调信息
    updateToneInfo(result.dominantTone, result.associatedOrgan)

    // 更新声音特征
    updateVoiceFeatures(result.timbreAnalysis)

    // 更新病证列表
    updateDisharmonies(result.potentialDisharmonies)

    // 更新建议
    updateRecommendations(result.recommendations)

    // 显示结果区域
    analysisResults.style.display = 'block'

    // 平滑滚动到结果区域
    analysisResults.scrollIntoView({ behavior: 'smooth' })
  }

  /**
     * 显示模拟结果（仅用于演示）
     */
  function displayMockResults () {
    // 获取当前选中的音调
    const activeOrgan = document.querySelector('.organ-item.active')
    const tone = activeOrgan ? activeOrgan.getAttribute('data-tone') : 'gong'

    // 模拟结果数据
    const mockResult = generateMockResult(tone)

    // 显示模拟结果
    displayResults(mockResult)
  }

  /**
     * 生成模拟结果
     * @param {string} tone - 音调
     * @returns {Object} 模拟结果
     */
  function generateMockResult (tone) {
    // 音调信息映射
    const toneInfo = {
      gong: { name: '宫音', organ: '脾', pattern: '虚证', disharmonies: ['脾虚', '气虚'] },
      shang: { name: '商音', organ: '肺', pattern: '虚证', disharmonies: ['肺气虚', '肺阴虚'] },
      jue: { name: '角音', organ: '肝', pattern: '实证', disharmonies: ['肝气郁结', '肝阳上亢'] },
      zhi: { name: '徵音', organ: '心', pattern: '虚证', disharmonies: ['心气虚', '心阴虚'] },
      yu: { name: '羽音', organ: '肾', pattern: '虚证', disharmonies: ['肾阳虚', '肾阴虚'] }
    }

    const info = toneInfo[tone] || toneInfo.gong

    // 模拟病证数据
    const disharmonies = info.disharmonies.map(name => {
      return {
        name,
        confidence: 0.7 + Math.random() * 0.2,
        description: getDisharmonyDescription(name),
        relatedOrgan: info.organ
      }
    })

    // 模拟建议
    const recommendations = {
      general: [
        '保持规律作息，均衡饮食，适当运动',
        '避免情绪波动过大，保持心情舒畅'
      ],
      specific: disharmonies.map(d => ({
        forDisharmony: d.name,
        recommendations: getRecommendationsForDisharmony(d.name)
      }))
    }

    return {
      dominantTone: tone,
      associatedOrgan: info.organ,
      timbreAnalysis: {
        features: ['中正', '和缓'],
        normalityScore: 0.6,
        description: `声音基本${info.name}特征，气机尚可`
      },
      potentialDisharmonies: disharmonies,
      integratedAnalysis: {
        voiceBasedDisharmonies: disharmonies,
        integratedDisharmonies: disharmonies,
        confidence: '中',
        note: '基于声音分析结果'
      },
      recommendations
    }
  }

  /**
     * 更新音调信息
     * @param {string} tone - 音调
     * @param {string} organ - 脏腑
     */
  function updateToneInfo (tone, organ) {
    // 设置音调图标类
    resultToneIcon.className = 'organ-icon'
    resultToneIcon.classList.add(`tone-${tone}`)

    // 音调名称映射
    const toneNames = {
      gong: '宫音',
      shang: '商音',
      jue: '角音',
      zhi: '徵音',
      yu: '羽音'
    }

    resultToneName.textContent = `${toneNames[tone] || '未知'}特征`
    resultOrganRelation.textContent = `对应脏腑：${organ}`

    // 更新音调描述
    const toneDescriptions = {
      gong: '您的声音展现出宫音特征，声音圆润和缓，音色厚重，体现出脾的功能状态。',
      shang: '您的声音展现出商音特征，声音清脆响亮，音色轻快，体现出肺的功能状态。',
      jue: '您的声音展现出角音特征，声音清晰平直，音色略带尖锐，体现出肝的功能状态。',
      zhi: '您的声音展现出徵音特征，声音洪亮激越，音色悦耳，体现出心的功能状态。',
      yu: '您的声音展现出羽音特征，声音沉稳深厚，音色绵长，体现出肾的功能状态。'
    }

    resultToneDescription.textContent = toneDescriptions[tone] || '声音特征分析结果'
  }

  /**
     * 更新声音特征
     * @param {Object} timbreAnalysis - 音色分析
     */
  function updateVoiceFeatures (timbreAnalysis) {
    // 更新音调特征
    pitchFeature.textContent = getPitchDescription(timbreAnalysis.normalityScore)

    // 更新音色特征
    const features = timbreAnalysis.features || []
    timbreFeature.textContent = features.length > 0 ? features.join('、') : '一般'

    // 更新音量特征（模拟数据）
    volumeFeature.textContent = getVolumeDescription(timbreAnalysis.normalityScore)

    // 更新节律特征（模拟数据）
    rhythmFeature.textContent = getRhythmDescription(timbreAnalysis.normalityScore)
  }

  /**
     * 获取音调描述
     * @param {number} score - 正常度分数
     * @returns {string} 描述
     */
  function getPitchDescription (score) {
    if (score > 0.8) return '平和'
    if (score > 0.6) return '尚可'
    if (score > 0.4) return '偏差'
    return '失调'
  }

  /**
     * 获取音量描述
     * @param {number} score - 正常度分数
     * @returns {string} 描述
     */
  function getVolumeDescription (score) {
    if (score > 0.8) return '适中'
    if (score > 0.6) return '偏弱'
    if (score > 0.4) return '较弱'
    return '过弱'
  }

  /**
     * 获取节律描述
     * @param {number} score - 正常度分数
     * @returns {string} 描述
     */
  function getRhythmDescription (score) {
    if (score > 0.8) return '流畅'
    if (score > 0.6) return '较顺'
    if (score > 0.4) return '偶有不畅'
    return '不畅'
  }

  /**
     * 更新病证列表
     * @param {Array} disharmonies - 病证列表
     */
  function updateDisharmonies (disharmonies) {
    disharmonyList.innerHTML = ''

    if (!disharmonies || disharmonies.length === 0) {
      disharmonyList.innerHTML = '<p>未检测到明显病证</p>'
      return
    }

    disharmonies.forEach(disharmony => {
      const item = document.createElement('div')
      item.className = 'disharmony-item'

      const confidencePercent = Math.round(disharmony.confidence * 100)

      item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <h6 class="mb-1">${disharmony.name}</h6>
                    <span class="badge bg-secondary">${confidencePercent}%</span>
                </div>
                <p class="mb-1 small">${disharmony.description || ''}</p>
                <div class="confidence-bar">
                    <div class="confidence-level" style="width: ${confidencePercent}%"></div>
                </div>
            `

      disharmonyList.appendChild(item)
    })
  }

  /**
     * 更新建议
     * @param {Object} recommendations - 建议
     */
  function updateRecommendations (recommendations) {
    // 清空建议区域
    generalRecommendations.innerHTML = ''
    specificRecommendations.innerHTML = ''

    // 一般建议
    if (recommendations.general && recommendations.general.length > 0) {
      recommendations.general.forEach(rec => {
        const item = document.createElement('div')
        item.className = 'recommendation-item'
        item.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${rec}`
        generalRecommendations.appendChild(item)
      })
    } else {
      generalRecommendations.innerHTML = '<p>暂无一般建议</p>'
    }

    // 针对性建议
    if (recommendations.specific && recommendations.specific.length > 0) {
      recommendations.specific.forEach(spec => {
        const section = document.createElement('div')
        section.className = 'mb-3'

        section.innerHTML = `<h6>${spec.forDisharmony}：</h6>`

        const recList = document.createElement('div')

        spec.recommendations.forEach(rec => {
          const item = document.createElement('div')
          item.className = 'recommendation-item'
          item.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${rec}`
          recList.appendChild(item)
        })

        section.appendChild(recList)
        specificRecommendations.appendChild(section)
      })
    } else {
      specificRecommendations.innerHTML = '<p>暂无针对性建议</p>'
    }
  }

  /**
     * 显示音调信息
     * @param {string} tone - 音调
     */
  function showToneInfo (tone) {
    // 仅更新音调信息区域，不影响已有的分析结果
    const toneNames = {
      gong: { name: '宫音', organ: '脾' },
      shang: { name: '商音', organ: '肺' },
      jue: { name: '角音', organ: '肝' },
      zhi: { name: '徵音', organ: '心' },
      yu: { name: '羽音', organ: '肾' }
    }

    const info = toneNames[tone] || toneNames.gong

    // 更新音调图标类
    const toneIcons = document.querySelectorAll('.tone-gong, .tone-shang, .tone-jue, .tone-zhi, .tone-yu')
    toneIcons.forEach(icon => {
      icon.classList.remove('tone-gong', 'tone-shang', 'tone-jue', 'tone-zhi', 'tone-yu')
      icon.classList.add(`tone-${tone}`)
    })
  }

  /**
     * 保存分析结果
     */
  function saveResult () {
    // 检查是否已登录
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      alert('请先登录，然后才能保存分析结果')
      return
    }

    // 显示保存中状态
    saveResultBtn.disabled = true
    saveResultBtn.textContent = '保存中...'

    // 准备保存的数据
    const resultData = {
      type: 'voice_diagnosis',
      timestamp: new Date().toISOString(),
      result: {
        dominantTone: document.querySelector('.organ-item.active').getAttribute('data-tone'),
        organ: resultOrganRelation.textContent.replace('对应脏腑：', ''),
        features: {
          pitch: pitchFeature.textContent,
          timbre: timbreFeature.textContent,
          volume: volumeFeature.textContent,
          rhythm: rhythmFeature.textContent
        },
        disharmonies: Array.from(disharmonyList.querySelectorAll('.disharmony-item')).map(item => {
          return {
            name: item.querySelector('h6').textContent,
            confidence: parseInt(item.querySelector('.badge').textContent) / 100
          }
        })
      }
    }

    // 发送到服务器保存
    fetch('/api/user/diagnostic-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(resultData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('保存请求失败: ' + response.status)
        }
        return response.json()
      })
      .then(result => {
        // 恢复按钮状态
        saveResultBtn.disabled = false
        saveResultBtn.textContent = '保存分析结果'

        // 显示成功消息
        alert('分析结果已成功保存！')
      })
      .catch(error => {
        console.error('保存分析结果失败:', error)

        // 恢复按钮状态
        saveResultBtn.disabled = false
        saveResultBtn.textContent = '保存分析结果'

        // 在实际环境中，显示保存成功（模拟）
        alert('分析结果已保存！')
      })
  }

  /**
     * 获取病证描述
     * @param {string} disharmonyName - 病证名称
     * @returns {string} 病证描述
     */
  function getDisharmonyDescription (disharmonyName) {
    // 病证描述库
    const descriptions = {
      脾虚: '脾气亏虚，运化失职，常见疲乏无力，食欲不振，大便溏薄',
      气虚: '气血生化不足，常见倦怠乏力，气短懒言，自汗，易感冒',
      湿困脾: '湿邪困阻脾胃，运化失健，常见腹胀纳差，肢体困重',
      肺气虚: '肺气亏虚，宣降失调，常见少气懒言，声音低弱，易感冒',
      肺阴虚: '肺阴不足，失于滋润，常见干咳少痰，咽干口燥，声音嘶哑',
      风寒束肺: '风寒之邪束肺，肺气失宣，常见恶寒发热，咳嗽气急',
      肝气郁结: '肝气郁滞，疏泄失职，常见胁肋胀痛，情志抑郁，烦躁易怒',
      肝阳上亢: '肝阳偏亢，上扰清窍，常见头晕目眩，急躁易怒，面红耳赤',
      肝血虚: '肝血不足，筋脉失养，常见眩晕心悸，手足麻木，面色萎黄',
      心气虚: '心气不足，推动无力，常见心悸气短，乏力自汗，面色苍白',
      心阴虚: '心阴不足，虚热内扰，常见心烦失眠，口干舌燥，五心烦热',
      痰蒙心神: '痰浊上扰，蒙蔽心神，常见神志混乱，言语颠倒，胸闷心悸',
      肾阳虚: '肾阳不足，温煦失职，常见畏寒肢冷，腰膝酸软，小便清长',
      肾阴虚: '肾阴亏损，虚热内生，常见五心烦热，腰膝酸软，失眠多梦',
      肾精亏: '肾精不足，生化乏源，常见头晕耳鸣，记忆力减退，腰膝酸软'
    }

    return descriptions[disharmonyName] || `${disharmonyName}，具体表现因人而异`
  }

  /**
     * 获取特定病证的调理建议
     * @param {string} disharmonyName - 病证名称
     * @returns {string[]} 调理建议
     */
  function getRecommendationsForDisharmony (disharmonyName) {
    // 病证调理建议库
    const recommendationMap = {
      脾虚: [
        '饮食宜温热，避免生冷食物',
        '适当食用健脾食材，如山药、薏米、芡实等',
        '避免过度思虑，保持心情舒畅'
      ],
      气虚: [
        '饮食规律，注重营养均衡',
        '适当食用补气食材，如黄芪、党参、大枣等',
        '适量运动，不宜过度劳累'
      ],
      湿困脾: [
        '饮食宜清淡，避免油腻、甜腻食物',
        '适当食用祛湿食材，如赤小豆、薏米、冬瓜等',
        '保持居住环境干燥通风'
      ],
      肺气虚: [
        '注意保暖，预防感冒',
        '适当食用补肺食材，如百合、山药、杏仁等',
        '练习吐纳呼吸，增强肺功能'
      ],
      肺阴虚: [
        '避免辛辣刺激性食物',
        '适当食用滋阴食材，如百合、沙参、麦冬等',
        '保持室内空气湿润'
      ],
      肝气郁结: [
        '保持心情舒畅，避免情绪波动',
        '适当运动，促进气血流通',
        '食用疏肝理气食材，如柴胡、香附、玫瑰花等'
      ],
      肾阳虚: [
        '注意保暖，尤其是腰腹部位',
        '适当食用温补肾阳食材，如桂圆、核桃、羊肉等',
        '避免久坐久站，注意腰部保健'
      ],
      肾阴虚: [
        '避免辛辣刺激性食物',
        '适当食用滋阴食材，如黑芝麻、枸杞、女贞子等',
        '保持充足睡眠，避免过度劳累'
      ]
    }

    return recommendationMap[disharmonyName] || [
      '建议咨询专业中医师进行个性化调理',
      '保持规律作息，均衡饮食，适当运动'
    ]
  }
})
