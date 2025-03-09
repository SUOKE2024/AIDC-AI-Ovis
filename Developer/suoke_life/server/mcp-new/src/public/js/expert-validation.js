/**
 * 索克生活 - 声诊临床验证专家评审界面
 * 用于专家评审声诊结果，提供反馈，并用于模型优化
 */

// 全局变量
let currentCase = null // 当前评审的案例
let currentPage = 1 // 当前页码
const pageSize = 10 // 每页显示数量
let totalCases = 0 // 案例总数
let expertInfo = null // 专家信息
let ratingValue = 0 // 当前评分
let suggestionCount = 1 // 建议计数器

// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  // 初始化专家信息
  fetchExpertInfo()

  // 初始化评分控件
  initRatingStars()

  // 加载验证案例列表
  loadCasesList()

  // 加载批次筛选选项
  loadBatchOptions()

  // 初始化图表
  initCharts()

  // 绑定事件处理
  bindEvents()

  // 检查URL参数，如果有caseId，直接加载该案例
  const urlParams = new URLSearchParams(window.location.search)
  const caseId = urlParams.get('caseId')
  if (caseId) {
    loadCaseForReview(caseId)
    // 切换到评审标签
    document.getElementById('review-tab').click()
  }

  // 初始化帮助提示
  initTooltips()
})

/**
 * 绑定页面事件处理函数
 */
function bindEvents () {
  // 刷新案例列表按钮
  document.getElementById('refreshCasesBtn').addEventListener('click', function () {
    loadCasesList()
  })

  // 状态筛选变更事件
  document.getElementById('statusFilter').addEventListener('change', function () {
    currentPage = 1 // 重置页码
    loadCasesList()
  })

  // 分类筛选变更事件
  document.getElementById('categoryFilter').addEventListener('change', function () {
    currentPage = 1 // 重置页码
    loadCasesList()
  })

  // 批次筛选变更事件
  document.getElementById('batchFilter').addEventListener('change', function () {
    currentPage = 1 // 重置页码
    loadCasesList()
  })

  // 添加建议按钮
  document.getElementById('addSuggestionBtn').addEventListener('click', function () {
    addSuggestionField()
  })

  // 评审表单提交
  document.getElementById('reviewForm')?.addEventListener('submit', function (e) {
    e.preventDefault()
    submitReview()
  })

  // 历史标签页激活事件
  document.getElementById('history-tab').addEventListener('click', function () {
    loadHistoryList()
  })

  // 指标标签页激活事件
  document.getElementById('metrics-tab').addEventListener('click', function () {
    loadPerformanceMetrics()
  })

  // 匹配分数滑块变更事件
  document.getElementById('matchScore')?.addEventListener('input', function () {
    document.getElementById('matchScoreValue').textContent = this.value

    // 根据分数设置匹配程度
    const matchLevel = document.getElementById('matchLevel')
    if (this.value >= 0.7) {
      matchLevel.value = '高'
    } else if (this.value >= 0.4) {
      matchLevel.value = '中'
    } else {
      matchLevel.value = '低'
    }
  })
}

/**
 * 初始化评分星星控件
 */
function initRatingStars () {
  const stars = document.querySelectorAll('.rating-star')

  stars.forEach(star => {
    star.addEventListener('click', function () {
      const rating = parseInt(this.getAttribute('data-rating'))
      ratingValue = rating

      // 更新隐藏字段值
      document.getElementById('concordanceRating').value = rating

      // 更新星星显示
      stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'))
        if (starRating <= rating) {
          s.classList.add('active')
        } else {
          s.classList.remove('active')
        }
      })
    })

    // 鼠标悬停效果
    star.addEventListener('mouseenter', function () {
      const rating = parseInt(this.getAttribute('data-rating'))

      stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'))
        if (starRating <= rating) {
          s.classList.add('active')
        }
      })
    })

    star.addEventListener('mouseleave', function () {
      stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'))
        if (starRating <= ratingValue) {
          s.classList.add('active')
        } else {
          s.classList.remove('active')
        }
      })
    })
  })
}

/**
 * 初始化图表
 */
function initCharts () {
  // 准备图表容器和配置
  const accuracyCtx = document.getElementById('accuracyChart')?.getContext('2d')
  const concordanceCtx = document.getElementById('concordanceChart')?.getContext('2d')
  const disharmonyCtx = document.getElementById('disharmonyChart')?.getContext('2d')

  if (!accuracyCtx || !concordanceCtx || !disharmonyCtx) return

  // 创建准确率图表 (先使用示例数据)
  new Chart(accuracyCtx, {
    type: 'line',
    data: {
      labels: ['批次1', '批次2', '批次3', '批次4', '批次5'],
      datasets: [{
        label: '准确率',
        data: [0.65, 0.7, 0.68, 0.75, 0.82],
        borderColor: '#35BB78',
        backgroundColor: 'rgba(53, 187, 120, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: '声诊分析准确率趋势'
        }
      },
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: function (value) {
              return (value * 100) + '%'
            }
          }
        }
      }
    }
  })

  // 创建一致性评分图表
  new Chart(concordanceCtx, {
    type: 'bar',
    data: {
      labels: ['1分', '2分', '3分', '4分', '5分'],
      datasets: [{
        label: '评分分布',
        data: [5, 12, 25, 30, 18],
        backgroundColor: [
          'rgba(220, 53, 69, 0.7)',
          'rgba(255, 193, 7, 0.7)',
          'rgba(255, 193, 7, 0.7)',
          'rgba(40, 167, 69, 0.7)',
          'rgba(40, 167, 69, 0.7)'
        ],
        borderColor: [
          'rgb(220, 53, 69)',
          'rgb(255, 193, 7)',
          'rgb(255, 193, 7)',
          'rgb(40, 167, 69)',
          'rgb(40, 167, 69)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: '专家一致性评分分布'
        }
      }
    }
  })

  // 创建病证准确率图表
  new Chart(disharmonyCtx, {
    type: 'radar',
    data: {
      labels: ['肝郁气滞', '脾胃湿热', '肺气虚', '心阴虚', '肾阳虚', '心脾两虚'],
      datasets: [{
        label: '准确率',
        data: [0.85, 0.7, 0.75, 0.65, 0.8, 0.72],
        backgroundColor: 'rgba(53, 187, 120, 0.2)',
        borderColor: '#35BB78',
        pointBackgroundColor: '#35BB78',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#35BB78'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '不同病证的检测准确率'
        }
      },
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0,
          suggestedMax: 1,
          ticks: {
            callback: function (value) {
              return (value * 100) + '%'
            }
          }
        }
      }
    }
  })
}

/**
 * 获取专家信息
 */
async function fetchExpertInfo () {
  try {
    const response = await fetch('/api/experts/profile')
    if (!response.ok) throw new Error('获取专家信息失败')

    expertInfo = await response.json()

    // 更新专家姓名显示
    document.getElementById('expertName').textContent = expertInfo.name + ' ' + expertInfo.title
  } catch (error) {
    console.error('获取专家信息出错:', error)
    showNotification('获取专家信息失败', 'danger')
  }
}

/**
 * 加载验证案例列表
 */
async function loadCasesList () {
  try {
    // 显示加载指示器
    document.getElementById('casesTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                </td>
            </tr>
        `

    // 获取筛选条件
    const status = document.getElementById('statusFilter').value
    const category = document.getElementById('categoryFilter').value
    const batch = document.getElementById('batchFilter').value

    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage,
      limit: pageSize
    })

    if (status) params.append('status', status)
    if (category) params.append('category', category)
    if (batch) params.append('batch', batch)

    // 发送请求获取案例列表
    const response = await fetch(`/api/clinical-validation/cases?${params.toString()}`)
    if (!response.ok) throw new Error('获取案例列表失败')

    const data = await response.json()

    // 更新总数和渲染列表
    totalCases = data.total
    renderCasesList(data.cases)
    renderPagination(totalCases, currentPage, pageSize, 'casesPagination', navigateToPage)
  } catch (error) {
    console.error('加载案例列表出错:', error)
    document.getElementById('casesTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-circle"></i> 加载失败: ${error.message}
                </td>
            </tr>
        `
  }
}

/**
 * 渲染案例列表
 * @param {Array} cases 案例数据列表
 */
function renderCasesList (cases) {
  const tableBody = document.getElementById('casesTableBody')

  if (!cases || cases.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-inbox"></i> 没有找到匹配的验证案例
                </td>
            </tr>
        `
    return
  }

  let html = ''

  cases.forEach(caseItem => {
    // 格式化状态显示
    const statusClass = getStatusClass(caseItem.status)
    const statusText = getStatusText(caseItem.status)

    // 格式化时间
    const submittedDate = new Date(caseItem.submittedAt).toLocaleString('zh-CN')

    html += `
            <tr>
                <td>${caseItem.caseId}</td>
                <td>
                    ${caseItem.patientInfo.age}岁 ${caseItem.patientInfo.gender}<br>
                    <small class="text-muted">${caseItem.patientInfo.chiefComplaint}</small>
                </td>
                <td>${caseItem.traditionalDiagnosis.diagnosis}</td>
                <td><span class="case-status ${statusClass}">${statusText}</span></td>
                <td>${caseItem.category}</td>
                <td>${submittedDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary review-btn" data-case-id="${caseItem.caseId}" title="开始评审">
                        <i class="bi bi-clipboard-check"></i> 评审
                    </button>
                </td>
            </tr>
        `
  })

  tableBody.innerHTML = html

  // 绑定评审按钮点击事件
  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const caseId = this.getAttribute('data-case-id')
      loadCaseForReview(caseId)
      // 切换到评审标签
      document.getElementById('review-tab').click()
    })
  })
}

/**
 * 获取状态CSS类名
 * @param {string} status 状态码
 * @returns {string} CSS类名
 */
function getStatusClass (status) {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'in_review': return 'status-in-review'
    case 'completed': return 'status-completed'
    case 'insufficient_data': return 'status-insufficient'
    default: return ''
  }
}

/**
 * 获取状态显示文本
 * @param {string} status 状态码
 * @returns {string} 显示文本
 */
function getStatusText (status) {
  switch (status) {
    case 'pending': return '等待分析'
    case 'in_review': return '待评审'
    case 'completed': return '已完成'
    case 'insufficient_data': return '数据不足'
    default: return '未知状态'
  }
}

/**
 * 加载批次选项
 */
async function loadBatchOptions () {
  try {
    const response = await fetch('/api/clinical-validation/batches')
    if (!response.ok) throw new Error('获取批次信息失败')

    const batches = await response.json()

    const batchSelect = document.getElementById('batchFilter')
    let html = '<option value="">全部批次</option>'

    batches.forEach(batch => {
      html += `<option value="${batch.id}">${batch.name} (${batch.count}例)</option>`
    })

    batchSelect.innerHTML = html
  } catch (error) {
    console.error('加载批次选项出错:', error)
  }
}

/**
 * 渲染分页控件
 * @param {number} total 总记录数
 * @param {number} currentPage 当前页码
 * @param {number} pageSize 每页记录数
 * @param {string} containerId 分页容器ID
 * @param {Function} callback 页码点击回调函数
 */
function renderPagination (total, currentPage, pageSize, containerId, callback) {
  const totalPages = Math.ceil(total / pageSize)
  const container = document.getElementById(containerId)

  if (!container) return

  let html = ''

  // 上一页按钮
  html += `
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="上一页">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `

  // 页码按钮
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  for (let i = startPage; i <= endPage; i++) {
    html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `
  }

  // 下一页按钮
  html += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="下一页">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `

  container.innerHTML = html

  // 绑定页码点击事件
  container.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault()
      const page = parseInt(this.getAttribute('data-page'))

      if (page > 0 && page <= totalPages) {
        callback(page)
      }
    })
  })
}

/**
 * 页码导航
 * @param {number} page 目标页码
 */
function navigateToPage (page) {
  currentPage = page
  loadCasesList()
}

/**
 * 加载案例进行评审
 * @param {string} caseId 案例ID
 */
async function loadCaseForReview (caseId) {
  try {
    // 显示加载指示器
    document.getElementById('reviewFormContainer').innerHTML = `
            <div class="d-flex justify-content-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `

    // 发送请求获取案例详情
    const response = await fetch(`/api/clinical-validation/cases/${caseId}`)
    if (!response.ok) throw new Error('获取案例详情失败')

    currentCase = await response.json()

    // 渲染评审表单
    renderReviewForm(currentCase)

    // 加载经典参考
    loadClassicReferences(currentCase)
  } catch (error) {
    console.error('加载案例详情出错:', error)
    document.getElementById('reviewFormContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载案例失败: ${error.message}
            </div>
        `
  }
}

/**
 * 渲染评审表单
 * @param {Object} caseData 案例数据
 */
function renderReviewForm (caseData) {
  // 使用模板渲染评审表单
  const template = document.getElementById('reviewFormTemplate')
  const container = document.getElementById('reviewFormContainer')

  if (!template || !container) return

  container.innerHTML = template.innerHTML

  // 填充案例ID到隐藏字段
  document.getElementById('caseIdInput').value = caseData.caseId

  // 填充基本数据字段
  fillTemplateFields(caseData)

  // 渲染音色特征
  renderTimbreFeatures(caseData.voiceDiagnosis.results.timbreAnalysis.features)

  // 渲染潜在病证
  renderDisharmonies(caseData.voiceDiagnosis.results.potentialDisharmonies)

  // 渲染推荐建议
  renderRecommendations(caseData.voiceDiagnosis.results.recommendations)

  // 设置音频播放器源
  const audioPlayer = document.getElementById('audioPlayer')
  if (audioPlayer && caseData.voiceDiagnosis.audioUrl) {
    audioPlayer.src = caseData.voiceDiagnosis.audioUrl
  }

  // 渲染比较表格
  renderComparisonTable(caseData)

  // 重新初始化评分星星
  initRatingStars()

  // 重新绑定事件
  bindReviewFormEvents()
}

/**
 * 填充模板字段
 * @param {Object} data 数据对象
 */
function fillTemplateFields (data) {
  // 获取所有具有data-field属性的元素
  const fields = document.querySelectorAll('[data-field]')

  fields.forEach(field => {
    const path = field.getAttribute('data-field').split('.')
    let value = data

    // 遍历路径获取嵌套值
    for (const key of path) {
      if (value && value[key] !== undefined) {
        value = value[key]
      } else {
        value = null
        break
      }
    }

    // 设置字段值
    if (value !== null) {
      field.textContent = value
    } else {
      field.textContent = '未提供'
    }
  })
}

/**
 * 渲染音色特征
 * @param {Array} features 特征列表
 */
function renderTimbreFeatures (features) {
  const container = document.getElementById('timbreFeatures')
  if (!container || !features) return

  let html = ''

  features.forEach(feature => {
    html += `
            <div class="disharmony-tag">
                ${feature.name}: ${feature.value}
            </div>
        `
  })

  container.innerHTML = html
}

/**
 * 渲染潜在病证
 * @param {Array} disharmonies 病证列表
 */
function renderDisharmonies (disharmonies) {
  const container = document.getElementById('potentialDisharmonies')
  if (!container || !disharmonies) return

  let html = ''

  disharmonies.forEach(item => {
    const confidenceClass = item.confidence >= 0.7
      ? 'success'
      : (item.confidence >= 0.4 ? 'warning' : 'danger')

    html += `
            <div class="mb-2">
                <div class="d-flex justify-content-between">
                    <strong>${item.name}</strong>
                    <span class="text-${confidenceClass}">${Math.round(item.confidence * 100)}%</span>
                </div>
                <div class="progress" style="height: 5px;">
                    <div class="progress-bar bg-${confidenceClass}" role="progressbar" 
                         style="width: ${item.confidence * 100}%" 
                         aria-valuenow="${item.confidence * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"></div>
                </div>
                <small class="text-muted">${item.description || ''}</small>
            </div>
        `
  })

  container.innerHTML = html
}

/**
 * 渲染调理建议
 * @param {Array} recommendations 建议列表
 */
function renderRecommendations (recommendations) {
  const container = document.getElementById('recommendationsList')
  if (!container || !recommendations) return

  let html = ''

  recommendations.forEach(item => {
    html += `<li>${item}</li>`
  })

  container.innerHTML = html
}

/**
 * 渲染比较表格
 * @param {Object} caseData 案例数据
 */
function renderComparisonTable (caseData) {
  const tableBody = document.getElementById('comparisonTableBody')
  if (!tableBody) return

  const traditional = caseData.traditionalDiagnosis
  const voice = caseData.voiceDiagnosis.results

  // 计算并显示主要诊断匹配情况
  const diagnosisMatchScore = calculateMatchScore(traditional.diagnosis, voice.potentialDisharmonies)
  const diagnosisMatchClass = getMatchClass(diagnosisMatchScore)

  const html = `
        <tr class="${diagnosisMatchClass}">
            <td>主要诊断</td>
            <td>${traditional.diagnosis}</td>
            <td>${voice.potentialDisharmonies?.[0]?.name || '未检测'}</td>
        </tr>
        <tr>
            <td>关联脏腑</td>
            <td>${extractOrgans(traditional.diagnosis) || '未指定'}</td>
            <td>${voice.associatedOrgan || '未检测'}</td>
        </tr>
        <tr>
            <td>治疗/调理方向</td>
            <td>${traditional.treatment || '未提供'}</td>
            <td>${voice.recommendations?.[0] || '未提供'}</td>
        </tr>
    `

  tableBody.innerHTML = html
}

/**
 * 计算诊断匹配分数
 * @param {string} traditionalDiagnosis 传统诊断
 * @param {Array} potentialDisharmonies 潜在病证
 * @returns {number} 匹配分数 (0-1)
 */
function calculateMatchScore (traditionalDiagnosis, potentialDisharmonies) {
  if (!traditionalDiagnosis || !potentialDisharmonies || potentialDisharmonies.length === 0) {
    return 0
  }

  // 简单实现：检查潜在病证中是否包含传统诊断
  const lowerTraditional = traditionalDiagnosis.toLowerCase()

  for (const disharmony of potentialDisharmonies) {
    if (lowerTraditional.includes(disharmony.name.toLowerCase())) {
      return disharmony.confidence || 0.5
    }
  }

  // 未找到匹配，返回第一个病证的置信度的一半
  return (potentialDisharmonies[0].confidence || 0.5) / 2
}

/**
 * 获取匹配度CSS类名
 * @param {number} score 匹配分数
 * @returns {string} CSS类名
 */
function getMatchClass (score) {
  if (score >= 0.7) return 'match-high'
  if (score >= 0.4) return 'match-medium'
  return 'match-low'
}

/**
 * 从诊断文本中提取脏腑信息
 * @param {string} diagnosis 诊断文本
 * @returns {string} 脏腑列表
 */
function extractOrgans (diagnosis) {
  if (!diagnosis) return ''

  const organs = []
  const organPatterns = {
    肝: /肝/,
    心: /心/,
    脾: /脾/,
    肺: /肺/,
    肾: /肾/,
    胃: /胃/,
    胆: /胆/,
    大肠: /大肠|大腸/,
    小肠: /小肠|小腸/,
    膀胱: /膀胱/
  }

  for (const [organ, pattern] of Object.entries(organPatterns)) {
    if (pattern.test(diagnosis)) {
      organs.push(organ)
    }
  }

  return organs.join('、') || '未明确'
}

/**
 * 绑定评审表单事件
 */
function bindReviewFormEvents () {
  // 评审表单提交
  const form = document.getElementById('reviewForm')
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      submitReview()
    })
  }

  // 匹配分数滑块变更事件
  const matchScore = document.getElementById('matchScore')
  if (matchScore) {
    matchScore.addEventListener('input', function () {
      document.getElementById('matchScoreValue').textContent = this.value

      // 根据分数设置匹配程度
      const matchLevel = document.getElementById('matchLevel')
      if (this.value >= 0.7) {
        matchLevel.value = '高'
      } else if (this.value >= 0.4) {
        matchLevel.value = '中'
      } else {
        matchLevel.value = '低'
      }
    })
  }

  // 添加建议按钮
  const addSuggestionBtn = document.getElementById('addSuggestionBtn')
  if (addSuggestionBtn) {
    addSuggestionBtn.addEventListener('click', function () {
      addSuggestionField()
    })
  }
}

/**
 * 添加建议输入字段
 */
function addSuggestionField () {
  const container = document.querySelector('.suggestions-container')
  const button = document.getElementById('addSuggestionBtn')

  if (!container || !button) return

  const suggestionItem = document.createElement('div')
  suggestionItem.className = 'suggestion-item'
  suggestionItem.innerHTML = `
        <div class="mb-2">
            <select class="form-select" name="suggestions[${suggestionCount}].field">
                <option value="dominantTone">主导音调</option>
                <option value="primaryDisharmony">主要病证</option>
                <option value="timbreFeatures">音色特征</option>
                <option value="recommendations">调理建议</option>
            </select>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control" name="suggestions[${suggestionCount}].correctValue" placeholder="正确值">
        </div>
        <div class="mb-2">
            <input type="text" class="form-control" name="suggestions[${suggestionCount}].note" placeholder="说明(可选)">
        </div>
        <button type="button" class="btn btn-sm btn-outline-danger remove-suggestion-btn">
            <i class="bi bi-trash"></i> 移除
        </button>
    `

  // 插入到按钮前面
  container.insertBefore(suggestionItem, button)

  // 绑定移除按钮事件
  suggestionItem.querySelector('.remove-suggestion-btn').addEventListener('click', function () {
    container.removeChild(suggestionItem)
  })

  // 增加计数器
  suggestionCount++
}

/**
 * 提交评审
 */
async function submitReview () {
  try {
    // 获取表单数据
    const form = document.getElementById('reviewForm')
    if (!form) return

    const formData = new FormData(form)
    const reviewData = {
      caseId: formData.get('caseId'),
      isAccurate: formData.get('isAccurate') === 'true',
      concordanceRating: parseInt(formData.get('concordanceRating')),
      concordanceAnalysis: {
        matchLevel: formData.get('concordanceAnalysis.matchLevel'),
        matchScore: parseFloat(formData.get('concordanceAnalysis.matchScore'))
      },
      comments: formData.get('comments'),
      shouldAdjustModel: formData.get('shouldAdjustModel') === 'on',
      suggestions: []
    }

    // 收集所有建议
    const suggestionFields = document.querySelectorAll('[name^="suggestions["][name$="].field"]')

    suggestionFields.forEach(field => {
      const index = field.name.match(/\[(\d+)\]/)[1]
      const fieldName = formData.get(`suggestions[${index}].field`)
      const correctValue = formData.get(`suggestions[${index}].correctValue`)
      const note = formData.get(`suggestions[${index}].note`)

      if (fieldName && correctValue) {
        reviewData.suggestions.push({
          field: fieldName,
          correctValue,
          note
        })
      }
    })

    // 验证必填字段
    if (reviewData.concordanceRating === 0) {
      showNotification('请为一致性评分选择1-5分', 'warning')
      return
    }

    // 显示提交中状态
    const submitButton = document.getElementById('submitReviewBtn')
    const originalButtonText = submitButton.innerHTML
    submitButton.disabled = true
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 提交中...'

    // 发送评审数据
    const response = await fetch('/api/clinical-validation/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '提交评审失败')
    }

    const result = await response.json()

    // 显示成功通知
    showNotification('评审已成功提交', 'success')

    // 重新加载案例列表并切换到案例标签
    loadCasesList()
    document.getElementById('cases-tab').click()

    // 重置评审表单
    document.getElementById('reviewFormContainer').innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i> 评审已成功提交，感谢您的宝贵意见！
            </div>
        `
  } catch (error) {
    console.error('提交评审出错:', error)
    showNotification('提交评审失败: ' + error.message, 'danger')
  } finally {
    // 恢复按钮状态
    const submitButton = document.getElementById('submitReviewBtn')
    if (submitButton) {
      submitButton.disabled = false
      submitButton.innerHTML = '<i class="bi bi-check-circle"></i> 提交评审'
    }
  }
}

/**
 * 加载经典参考
 * @param {Object} caseData 案例数据
 */
async function loadClassicReferences (caseData) {
  try {
    const container = document.getElementById('classicReferencesContainer')
    if (!container) return

    // 显示加载状态
    container.innerHTML = `
            <div class="d-flex justify-content-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `

    // 获取诊断词
    let diagnosisTerms = []
    if (caseData.traditionalDiagnosis && caseData.traditionalDiagnosis.diagnosis) {
      diagnosisTerms = caseData.traditionalDiagnosis.diagnosis.split(/\s+/)
    }

    // 获取参考文献
    const references = await fetch('/api/clinical-validation/references')
    if (!references.ok) throw new Error('获取参考文献失败')

    const referenceData = await references.json()

    // 渲染参考文献
    renderReferences(referenceData.references)
  } catch (error) {
    console.error('加载经典参考出错:', error)
    container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载经典参考失败: ${error.message}
            </div>
        `
  }
}

/**
 * 渲染参考文献
 * @param {Array} references 参考文献列表
 */
function renderReferences (references) {
  const container = document.getElementById('classicReferencesContainer')
  if (!container || !references || references.length === 0) return

  let html = ''

  references.forEach(reference => {
    html += `
            <div class="reference-item">
                <strong>${reference.title}</strong>
                <p>${reference.summary}</p>
                <a href="${reference.url}" target="_blank">查看原文</a>
            </div>
        `
  })

  container.innerHTML = html
}

/**
 * 加载历史评审记录
 */
async function loadHistoryList () {
  try {
    // 显示加载指示器
    document.getElementById('historyTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                </td>
            </tr>
        `

    // 发送请求获取历史记录
    const response = await fetch(`/api/clinical-validation/reviews?expert=${expertInfo.id}&page=${currentPage}&limit=${pageSize}`)
    if (!response.ok) throw new Error('获取历史记录失败')

    const data = await response.json()

    // 更新总数和渲染列表
    totalCases = data.total
    renderHistoryList(data.reviews)
    renderPagination(totalCases, currentPage, pageSize, 'historyPagination', navigateToHistoryPage)

    // 添加导出按钮
    addExportButton()
  } catch (error) {
    console.error('加载历史记录出错:', error)
    document.getElementById('historyTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-circle"></i> 加载失败: ${error.message}
                </td>
            </tr>
        `
  }
}

/**
 * 渲染历史评审记录
 * @param {Array} reviews 评审记录列表
 */
function renderHistoryList (reviews) {
  const tableBody = document.getElementById('historyTableBody')

  if (!reviews || reviews.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="bi bi-inbox"></i> 暂无评审历史记录
                </td>
            </tr>
        `
    return
  }

  let html = ''

  reviews.forEach(review => {
    // 格式化评审时间
    const reviewDate = new Date(review.reviewedAt).toLocaleString('zh-CN')

    // 确定一致性评分的颜色
    const ratingClass = review.concordanceRating >= 4
      ? 'text-success'
      : (review.concordanceRating >= 3 ? 'text-warning' : 'text-danger')

    html += `
            <tr>
                <td>${review.reviewId}</td>
                <td>${review.caseId}</td>
                <td>${review.mainDiagnosis}</td>
                <td class="${ratingClass}">
                    ${review.concordanceRating} / 5
                    <div class="small">${review.concordanceAnalysis.matchLevel}匹配</div>
                </td>
                <td>${reviewDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-review-btn" data-review-id="${review.reviewId}" title="查看详情">
                        <i class="bi bi-eye"></i> 查看
                    </button>
                </td>
            </tr>
        `
  })

  tableBody.innerHTML = html

  // 绑定查看按钮点击事件
  document.querySelectorAll('.view-review-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const reviewId = this.getAttribute('data-review-id')
      showReviewDetails(reviewId)
    })
  })
}

/**
 * 历史记录页码导航
 * @param {number} page 目标页码
 */
function navigateToHistoryPage (page) {
  currentPage = page
  loadHistoryList()
}

/**
 * 显示评审详情
 * @param {string} reviewId 评审ID
 */
async function showReviewDetails (reviewId) {
  try {
    // 实现查看评审详情的逻辑
    const response = await fetch(`/api/clinical-validation/reviews/${reviewId}`)
    if (!response.ok) throw new Error('获取评审详情失败')

    const reviewData = await response.json()

    // 可以在模态框中显示评审详情
    // 这里简单实现一个模态框
    const modalHtml = `
            <div class="modal fade" id="reviewDetailModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">评审详情 #${reviewId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p><strong>案例ID：</strong> ${reviewData.caseId}</p>
                                    <p><strong>评审日期：</strong> ${new Date(reviewData.reviewedAt).toLocaleString('zh-CN')}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>一致性评分：</strong> ${reviewData.concordanceRating} / 5</p>
                                    <p><strong>匹配程度：</strong> ${reviewData.concordanceAnalysis.matchLevel} (${reviewData.concordanceAnalysis.matchScore})</p>
                                </div>
                            </div>
                            
                            <div class="alert ${reviewData.isAccurate ? 'alert-success' : 'alert-warning'}">
                                <i class="bi ${reviewData.isAccurate ? 'bi-check-circle' : 'bi-exclamation-triangle'}"></i>
                                声诊分析结果被评定为 <strong>${reviewData.isAccurate ? '准确' : '不准确'}</strong>
                            </div>
                            
                            <h6>评审意见</h6>
                            <div class="card mb-3">
                                <div class="card-body">
                                    ${reviewData.comments || '无评审意见'}
                                </div>
                            </div>
                            
                            <h6>修正建议</h6>
                            <div class="table-responsive">
                                <table class="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th>字段</th>
                                            <th>正确值</th>
                                            <th>说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reviewData.suggestions && reviewData.suggestions.length > 0
                                            ? reviewData.suggestions.map(s => `
                                                <tr>
                                                    <td>${s.field}</td>
                                                    <td>${s.correctValue}</td>
                                                    <td>${s.note || ''}</td>
                                                </tr>
                                            `).join('')
                                            : '<tr><td colspan="3" class="text-center">无修正建议</td></tr>'
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        `

    // 添加模态框到DOM
    const modalContainer = document.createElement('div')
    modalContainer.innerHTML = modalHtml
    document.body.appendChild(modalContainer)

    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('reviewDetailModal'))
    modal.show()

    // 监听模态框关闭事件，清理DOM
    document.getElementById('reviewDetailModal').addEventListener('hidden.bs.modal', function () {
      document.body.removeChild(modalContainer)
    })
  } catch (error) {
    console.error('加载评审详情出错:', error)
    showNotification('加载评审详情失败: ' + error.message, 'danger')
  }
}

/**
 * 加载性能指标数据
 */
async function loadPerformanceMetrics () {
  try {
    // 显示加载状态
    const containers = [
      document.getElementById('batchStatsContainer'),
      document.getElementById('progressContainer')
    ]

    containers.forEach(container => {
      if (container) {
        container.innerHTML = `
                    <div class="d-flex justify-content-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                    </div>
                `
      }
    })

    // 发送请求获取性能指标数据
    const response = await fetch('/api/clinical-validation/metrics')
    if (!response.ok) throw new Error('获取性能指标失败')

    const data = await response.json()

    // 更新图表数据
    updatePerformanceCharts(data)

    // 渲染批次统计
    renderBatchStats(data.currentBatch)

    // 渲染验证进度
    renderValidationProgress(data.progress)

    // 添加导出按钮
    addReportExportButton()
  } catch (error) {
    console.error('加载性能指标出错:', error)
    const containers = [
      document.getElementById('batchStatsContainer'),
      document.getElementById('progressContainer')
    ]

    containers.forEach(container => {
      if (container) {
        container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
                    </div>
                `
      }
    })
  }
}

/**
 * 更新性能图表
 * @param {Object} data 性能数据
 */
function updatePerformanceCharts (data) {
  // 更新准确率图表
  const accuracyChart = Chart.getChart('accuracyChart')
  if (accuracyChart && data.accuracyTrend) {
    accuracyChart.data.labels = data.accuracyTrend.map(item => item.batch)
    accuracyChart.data.datasets[0].data = data.accuracyTrend.map(item => item.accuracy)
    accuracyChart.update()
  }

  // 更新一致性评分图表
  const concordanceChart = Chart.getChart('concordanceChart')
  if (concordanceChart && data.concordanceDistribution) {
    concordanceChart.data.datasets[0].data = [
      data.concordanceDistribution['1'] || 0,
      data.concordanceDistribution['2'] || 0,
      data.concordanceDistribution['3'] || 0,
      data.concordanceDistribution['4'] || 0,
      data.concordanceDistribution['5'] || 0
    ]
    concordanceChart.update()
  }

  // 更新病证准确率图表
  const disharmonyChart = Chart.getChart('disharmonyChart')
  if (disharmonyChart && data.disharmonyAccuracy) {
    disharmonyChart.data.labels = data.disharmonyAccuracy.map(item => item.name)
    disharmonyChart.data.datasets[0].data = data.disharmonyAccuracy.map(item => item.accuracy)
    disharmonyChart.update()
  }
}

/**
 * 渲染批次统计
 * @param {Object} batchData 当前批次数据
 */
function renderBatchStats (batchData) {
  const container = document.getElementById('batchStatsContainer')
  if (!container || !batchData) return

  const html = `
        <div class="row">
            <div class="col-6">
                <div class="mb-3">
                    <div class="small text-muted">批次名称</div>
                    <div class="h5">${batchData.name}</div>
                </div>
            </div>
            <div class="col-6">
                <div class="mb-3">
                    <div class="small text-muted">开始日期</div>
                    <div>${new Date(batchData.startDate).toLocaleDateString('zh-CN')}</div>
                </div>
            </div>
        </div>
        
        <div class="row mt-2">
            <div class="col-4">
                <div class="small text-muted">案例总数</div>
                <div class="h5">${batchData.totalCases}</div>
            </div>
            <div class="col-4">
                <div class="small text-muted">已评审</div>
                <div class="h5">${batchData.reviewedCases}</div>
            </div>
            <div class="col-4">
                <div class="small text-muted">准确率</div>
                <div class="h5 ${batchData.accuracy >= 0.7 ? 'text-success' : 'text-warning'}">
                    ${Math.round(batchData.accuracy * 100)}%
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="small text-muted">评审进度</div>
                <div class="progress mt-1">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${(batchData.reviewedCases / batchData.totalCases) * 100}%" 
                         aria-valuenow="${batchData.reviewedCases}" 
                         aria-valuemin="0" 
                         aria-valuemax="${batchData.totalCases}">
                        ${Math.round((batchData.reviewedCases / batchData.totalCases) * 100)}%
                    </div>
                </div>
            </div>
        </div>
    `

  container.innerHTML = html
}

/**
 * 渲染验证进度
 * @param {Object} progressData 验证进度数据
 */
function renderValidationProgress (progressData) {
  const container = document.getElementById('progressContainer')
  if (!container || !progressData) return

  const html = `
        <div class="row">
            <div class="col-4">
                <div class="small text-muted">总案例数</div>
                <div class="h5">${progressData.totalCases}</div>
            </div>
            <div class="col-4">
                <div class="small text-muted">已验证</div>
                <div class="h5">${progressData.validatedCases}</div>
            </div>
            <div class="col-4">
                <div class="small text-muted">验证专家</div>
                <div class="h5">${progressData.expertsCount}</div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="small text-muted">总体进度</div>
                <div class="progress mt-1">
                    <div class="progress-bar bg-primary" role="progressbar" 
                         style="width: ${(progressData.validatedCases / progressData.totalCases) * 100}%" 
                         aria-valuenow="${progressData.validatedCases}" 
                         aria-valuemin="0" 
                         aria-valuemax="${progressData.totalCases}">
                        ${Math.round((progressData.validatedCases / progressData.totalCases) * 100)}%
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="small text-muted">按病证类型分布</div>
                <div class="d-flex flex-wrap mt-1">
                    ${progressData.byDisharmonyType.map(item => `
                        <div class="me-2 mb-2">
                            <span class="badge bg-light text-dark">${item.name}: ${item.count}例</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `

  container.innerHTML = html
}

/**
 * 显示通知消息
 * @param {string} message 消息内容
 * @param {string} type 消息类型 (success, warning, danger, info)
 */
function showNotification (message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.className = `alert alert-${type} notification-toast`
  notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${type === 'success'
? 'bi-check-circle'
                          : type === 'warning'
? 'bi-exclamation-triangle'
                          : type === 'danger' ? 'bi-x-circle' : 'bi-info-circle'} me-2"></i>
            <span>${message}</span>
        </div>
    `

  // 添加样式
  notification.style.position = 'fixed'
  notification.style.top = '1rem'
  notification.style.right = '1rem'
  notification.style.zIndex = '9999'
  notification.style.minWidth = '300px'
  notification.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
  notification.style.opacity = '0'
  notification.style.transition = 'opacity 0.3s ease-in-out'

  // 添加到文档
  document.body.appendChild(notification)

  // 淡入效果
  setTimeout(() => {
    notification.style.opacity = '1'
  }, 10)

  // 自动移除
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

/**
 * 导出评审数据为CSV格式
 */
function exportReviewData () {
  try {
    // 获取表头
    const headers = ['评审ID', '案例ID', '主要诊断', '一致性评分', '评审时间']

    // 获取当前评审数据
    const reviewData = []
    document.querySelectorAll('#historyTableBody tr').forEach(row => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 5) {
        reviewData.push([
          cells[0].textContent, // 评审ID
          cells[1].textContent, // 案例ID
          cells[2].textContent, // 主要诊断
          cells[3].textContent.split('/')[0].trim(), // 一致性评分
          cells[4].textContent // 评审时间
        ])
      }
    })

    // 创建CSV内容
    let csvContent = headers.join(',') + '\n'
    reviewData.forEach(row => {
      csvContent += row.join(',') + '\n'
    })

    // 创建下载链接
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `声诊评审数据_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)

    // 触发下载
    link.click()

    // 移除链接元素
    document.body.removeChild(link)

    showNotification('数据导出成功', 'success')
  } catch (error) {
    console.error('导出数据出错:', error)
    showNotification('导出数据失败: ' + error.message, 'danger')
  }
}

/**
 * 在历史记录标签页中添加导出按钮
 */
function addExportButton () {
  // 检查是否已经存在导出按钮
  if (document.querySelector('#exportBtn')) return

  const historyTab = document.getElementById('history-content')
  if (!historyTab) return

  const exportButton = document.createElement('button')
  exportButton.id = 'exportBtn'
  exportButton.className = 'btn btn-sm btn-outline-primary mt-3'
  exportButton.innerHTML = '<i class="bi bi-download"></i> 导出评审数据'
  exportButton.addEventListener('click', exportReviewData)

  // 插入到分页导航之前
  const pagination = historyTab.querySelector('#historyPagination')
  if (pagination) {
    pagination.parentNode.insertBefore(exportButton, pagination)
  } else {
    historyTab.appendChild(exportButton)
  }
}

/**
 * 导出性能指标数据为PDF
 */
function exportPerformanceReport () {
  showNotification('正在准备PDF报告...', 'info')

  // 获取图表
  const charts = {
    accuracy: document.getElementById('accuracyChart'),
    concordance: document.getElementById('concordanceChart'),
    disharmony: document.getElementById('disharmonyChart')
  }

  // 获取批次统计
  const batchStats = document.getElementById('batchStatsContainer').textContent

  // 获取验证进度
  const progress = document.getElementById('progressContainer').textContent

  // 这里通常会使用jsPDF或类似库生成PDF
  // 由于是演示代码，我们只显示一个通知

  setTimeout(() => {
    showNotification('PDF报告生成功能需要集成jsPDF库，请联系开发团队', 'warning')
  }, 1500)
}

/**
 * 在指标标签页中添加导出按钮
 */
function addReportExportButton () {
  // 检查是否已经存在导出按钮
  if (document.querySelector('#reportExportBtn')) return

  const metricsTab = document.getElementById('metrics-content')
  if (!metricsTab) return

  const exportButton = document.createElement('button')
  exportButton.id = 'reportExportBtn'
  exportButton.className = 'btn btn-outline-primary mt-3'
  exportButton.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> 导出性能报告'
  exportButton.addEventListener('click', exportPerformanceReport)

  // 插入到第一个图表前
  const firstChart = metricsTab.querySelector('.card')
  if (firstChart) {
    metricsTab.insertBefore(exportButton, firstChart)
  } else {
    metricsTab.appendChild(exportButton)
  }
}

/**
 * 初始化帮助提示
 */
function initTooltips () {
  // 添加帮助图标到需要说明的字段旁
  const helpFields = [
    { selector: 'label[for="concordanceRating"]', text: '评分标准：1分表示完全不符，5分表示完全一致' },
    { selector: 'label[for="matchLevel"]', text: '匹配程度反映声诊结果与传统诊断的契合度' },
    { selector: 'label[for="suggestions"]', text: '提供具体的修正建议，以帮助改进声诊算法' },
    { selector: 'label[for="shouldAdjustModel"]', text: '勾选此项将使用您的评审结果来优化声诊模型' }
  ]

  helpFields.forEach(field => {
    const element = document.querySelector(field.selector)
    if (element) {
      const helpIcon = document.createElement('span')
      helpIcon.className = 'tooltip-info'
      helpIcon.innerHTML = '<i class="bi bi-question-circle text-muted"></i>'
      helpIcon.title = field.text
      element.appendChild(helpIcon)
    }
  })

  // 使用Bootstrap的tooltip功能初始化提示
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
}
