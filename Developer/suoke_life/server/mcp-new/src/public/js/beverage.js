/**
 * 养生饮品生成系统前端逻辑
 */
document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const categoryCards = document.querySelectorAll('.category-card')
  const continueButton = document.getElementById('continueButton')
  const categorySelection = document.getElementById('categorySelection')
  const beverageForm = document.getElementById('beverageForm')
  const backButton = document.getElementById('backToCategories')
  const beverageCategoryName = document.getElementById('beverageCategoryName')
  const beverageCategoryInput = document.getElementById('beverageCategory')
  const generationForm = document.getElementById('generationForm')
  const loadingSpinner = document.getElementById('loadingSpinner')
  const resultContainer = document.getElementById('resultContainer')

  // 特殊部分显示控制
  const herbSection = document.getElementById('herbSection')
  const wineSection = document.getElementById('wineSection')
  const formulaSection = document.getElementById('formulaSection')

  // 季节相关元素
  const seasonSelect = document.getElementById('season')
  const solarTermSelect = document.getElementById('solarTerm')

  // 饮品类别名称映射
  const categoryNames = {
    medicinal_food: '药食同源类饮品',
    herbal_spice: '香料类饮品',
    classic_formula: '古方经方类饮品',
    medicinal_wine: '药酒类饮品',
    infused_wine: '泡酒类饮品'
  }

  // 选择的饮品分类
  let selectedCategory = null

  // 初始化页面
  initPage()

  /**
     * 初始化页面
     */
  function initPage () {
    // 根据当前时间设置默认季节
    updateCurrentSeasonAndTerm()

    // 为分类卡片添加点击事件
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        // 移除其他卡片的选中状态
        categoryCards.forEach(c => c.classList.remove('selected'))

        // 设置当前卡片选中状态
        card.classList.add('selected')

        // 存储选中的分类
        selectedCategory = card.dataset.category

        // 启用继续按钮
        continueButton.disabled = false
      })
    })

    // 继续按钮点击事件
    continueButton.addEventListener('click', () => {
      if (selectedCategory) {
        // 显示对应的表单
        showBeverageForm(selectedCategory)
      }
    })

    // 返回按钮点击事件
    backButton.addEventListener('click', (e) => {
      e.preventDefault()

      // 隐藏表单，显示分类选择
      beverageForm.classList.add('hidden')
      categorySelection.classList.remove('hidden')

      // 隐藏结果容器
      resultContainer.style.display = 'none'
    })

    // 季节变化时更新节气
    seasonSelect.addEventListener('change', function () {
      updateSolarTermOptions(this.value)
    })

    // 表单提交事件
    generationForm.addEventListener('submit', async function (e) {
      e.preventDefault()

      // 显示加载动画
      loadingSpinner.style.display = 'block'
      resultContainer.style.display = 'none'

      // 收集表单数据
      const formData = new FormData(generationForm)
      const formObject = {}

      // 将FormData转为对象
      for (const [key, value] of formData.entries()) {
        if (formObject[key]) {
          if (!Array.isArray(formObject[key])) {
            formObject[key] = [formObject[key]]
          }
          formObject[key].push(value)
        } else {
          formObject[key] = value
        }
      }

      // 处理复选框数据
      const symptoms = []
      document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
        symptoms.push(checkbox.value)
      })
      formObject.symptoms = symptoms

      // 处理健康目标数据（如果存在）
      if (selectedCategory === 'medicinal_wine' || selectedCategory === 'infused_wine') {
        const healthGoals = []
        document.querySelectorAll('input[name="healthGoals"]:checked').forEach(checkbox => {
          healthGoals.push(checkbox.value)
        })
        formObject.healthGoals = healthGoals
      }

      // 处理饮食偏好和限制
      if (formObject.dietaryPreferences) {
        formObject.dietaryPreferences = formObject.dietaryPreferences.split('、').map(item => item.trim())
      } else {
        formObject.dietaryPreferences = []
      }

      if (formObject.dietaryRestrictions) {
        formObject.dietaryRestrictions = formObject.dietaryRestrictions.split('、').map(item => item.trim())
      } else {
        formObject.dietaryRestrictions = []
      }

      try {
        // 发送请求到API
        const response = await fetch('/api/recipe/beverage/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify(formObject)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || '生成饮品失败')
        }

        const beverageData = await response.json()

        // 隐藏加载动画
        loadingSpinner.style.display = 'none'

        // 显示结果
        renderBeverageResult(beverageData)

        // 滚动到结果区域
        resultContainer.scrollIntoView({ behavior: 'smooth' })
      } catch (error) {
        console.error('生成饮品失败:', error)

        // 隐藏加载动画
        loadingSpinner.style.display = 'none'

        // 显示错误信息
        resultContainer.style.display = 'block'
        resultContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        ${error.message || '生成饮品失败，请稍后再试'}
                    </div>
                `
      }
    })
  }

  /**
     * 显示饮品生成表单
     * @param {string} category 饮品分类ID
     */
  function showBeverageForm (category) {
    // 隐藏分类选择，显示表单
    categorySelection.classList.add('hidden')
    beverageForm.classList.remove('hidden')

    // 设置表单标题和分类值
    beverageCategoryName.textContent = categoryNames[category] || '养生饮品'
    beverageCategoryInput.value = category

    // 根据分类显示不同的表单部分
    if (category === 'medicinal_food' || category === 'herbal_spice') {
      herbSection.style.display = 'block'
      wineSection.style.display = 'none'
      formulaSection.style.display = 'none'
    } else if (category === 'classic_formula') {
      herbSection.style.display = 'none'
      wineSection.style.display = 'none'
      formulaSection.style.display = 'block'
    } else if (category === 'medicinal_wine' || category === 'infused_wine') {
      herbSection.style.display = 'none'
      wineSection.style.display = 'block'
      formulaSection.style.display = 'none'
    }
  }

  /**
     * 渲染饮品生成结果
     * @param {Object} beverage 饮品数据
     */
  function renderBeverageResult (beverage) {
    // 根据饮品类型选择模板
    let template

    if (beverage.category === 'medicinal_wine' || beverage.category === 'infused_wine') {
      template = renderWineResult(beverage)
    } else if (beverage.category === 'classic_formula') {
      template = renderFormulaResult(beverage)
    } else {
      template = renderHerbalResult(beverage)
    }

    // 显示结果容器
    resultContainer.style.display = 'block'
    resultContainer.innerHTML = template

    // 添加收藏和历史记录按钮事件
    const saveButton = document.getElementById('saveBeverage')
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        saveBeverageToFavorites(beverage)
      })
    }
  }

  /**
     * 渲染草本饮品结果（药食同源类和香料类）
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML模板
     */
  function renderHerbalResult (beverage) {
    const ingredientsList = beverage.ingredients.map(ingredient => `
            <div class="d-flex align-items-center mb-2">
                <div class="bg-success text-white rounded-circle p-1 me-2" style="width: 28px; height: 28px; text-align: center;">
                    <i class="bi bi-flower1"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = beverage.functions.map(func =>
            `<span class="badge bg-light text-dark me-2 mb-2">${func}</span>`
    ).join('')

    return `
            <div class="section-card beverage-result">
                <div class="text-end mb-3">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                </div>
                
                <h2 class="mb-3">${beverage.name}</h2>
                <p class="lead">${beverage.description}</p>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h4>配方成分</h4>
                        <div class="ingredients-list mb-4">
                            ${ingredientsList}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h4>药膳功效</h4>
                        <div class="mb-3">
                            ${functionsList}
                        </div>
                        <div class="mb-3">
                            <div><strong>性味：</strong> ${beverage.nature || '平'} | ${beverage.taste || '甘'}</div>
                            <div><strong>适宜季节：</strong> ${beverage.season || '四季'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  /**
     * 渲染经方古方结果
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML模板
     */
  function renderFormulaResult (beverage) {
    const ingredientsList = beverage.ingredients.map(ingredient => `
            <div class="d-flex align-items-center mb-2">
                <div class="bg-warning text-white rounded-circle p-1 me-2" style="width: 28px; height: 28px; text-align: center;">
                    <i class="bi bi-mortarboard-fill"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = beverage.functions.map(func =>
            `<span class="badge bg-light text-dark me-2 mb-2">${func}</span>`
    ).join('')

    return `
            <div class="section-card beverage-result">
                <div class="alert alert-warning mb-3">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>专业指导建议：</strong> ${beverage.professionalGuidance || '此方来源于中医经典著作，建议在专业中医师指导下使用。'}
                </div>
                
                <div class="text-end mb-3">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                </div>
                
                <h2 class="mb-3">${beverage.name}</h2>
                <div class="mb-2 text-muted">
                    <i class="bi bi-book me-1"></i> 出处：${beverage.source || '经典古籍'}
                </div>
                <p class="lead">${beverage.description || `这是一款来自${beverage.source || '经典古籍'}的传统方剂。`}</p>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h4>方剂组成</h4>
                        <div class="ingredients-list mb-4">
                            ${ingredientsList}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h4>功效与主治</h4>
                        <div class="mb-3">
                            ${functionsList}
                        </div>
                        <div class="mb-3">
                            <div><strong>性质：</strong> ${beverage.nature || '平'}</div>
                            <div><strong>适应证：</strong> ${beverage.suitableConditions ? beverage.suitableConditions.join('、') : ''}</div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <h4>制备方法</h4>
                        <p>${beverage.preparationMethod || ''}</p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h4>适宜体质</h4>
                        <p>${beverage.suitableConstitutions ? beverage.suitableConstitutions.join('、') : ''}</p>
                    </div>
                    <div class="col-md-6">
                        <h4>禁忌</h4>
                        <p>${beverage.contraindications ? beverage.contraindications.join('、') : '无特殊禁忌'}</p>
                    </div>
                </div>
            </div>
        `
  }

  /**
     * 渲染药酒和泡酒结果
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML模板
     */
  function renderWineResult (beverage) {
    const ingredientsList = beverage.ingredients.map(ingredient => `
            <div class="d-flex align-items-center mb-2">
                <div class="bg-danger text-white rounded-circle p-1 me-2" style="width: 28px; height: 28px; text-align: center;">
                    <i class="bi bi-flower2"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = beverage.functions.map(func =>
            `<span class="badge bg-light text-dark me-2 mb-2">${func}</span>`
    ).join('')

    const warningList = (beverage.alcoholWarnings || []).map(warning =>
            `<li>${warning}</li>`
    ).join('')

    return `
            <div class="section-card beverage-result">
                <div class="alert alert-danger mb-3">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>酒精饮品警告：</strong> 含酒精成分，请遵循以下使用建议：
                    <ul class="mb-0 mt-2">
                        ${warningList}
                    </ul>
                </div>
                
                <div class="text-end mb-3">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                </div>
                
                <h2 class="mb-3">${beverage.name}</h2>
                <div class="mb-2">
                    <span class="badge bg-danger me-2">
                        酒精度数: ${beverage.alcoholContent || '40度'}
                    </span>
                    <span class="badge bg-secondary">
                        基酒: ${beverage.baseWine || '白酒'}
                    </span>
                </div>
                <p class="lead">${beverage.description || ''}</p>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h4>配方成分</h4>
                        <div class="ingredients-list mb-4">
                            ${ingredientsList}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h4>功效与作用</h4>
                        <div class="mb-3">
                            ${functionsList}
                        </div>
                        <div class="mb-3">
                            <div><strong>建议用量：</strong> ${beverage.dosage || '每次10-20毫升，每日1-2次'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <h4>制备方法</h4>
                        <p>${beverage.preparationMethod || ''}</p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h4>适宜体质</h4>
                        <p>${beverage.suitableConstitutions ? beverage.suitableConstitutions.join('、') : ''}</p>
                    </div>
                    <div class="col-md-6">
                        <h4>禁忌</h4>
                        <p>${beverage.contraindications ? beverage.contraindications.join('、') : '无特殊禁忌'}</p>
                    </div>
                </div>
            </div>
        `
  }

  /**
     * 更新当前季节和节气
     */
  function updateCurrentSeasonAndTerm () {
    // 获取当前日期
    const now = new Date()
    const month = now.getMonth() + 1

    // 根据月份确定季节
    let season
    if (month >= 3 && month <= 5) {
      season = '春'
    } else if (month >= 6 && month <= 8) {
      season = '夏'
    } else if (month >= 9 && month <= 11) {
      season = '秋'
    } else {
      season = '冬'
    }

    // 更新季节选择
    if (seasonSelect) {
      seasonSelect.value = season

      // 更新节气选项
      updateSolarTermOptions(season)
    }
  }

  /**
     * 根据季节更新节气选项
     * @param {string} season 季节
     */
  function updateSolarTermOptions (season) {
    if (!solarTermSelect) return

    // 清空当前选项
    solarTermSelect.innerHTML = '<option value="" selected>请选择节气（可选）</option>'

    // 根据季节设置对应的节气
    const seasonalTerms = {
      春: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨'],
      夏: ['立夏', '小满', '芒种', '夏至', '小暑', '大暑'],
      秋: ['立秋', '处暑', '白露', '秋分', '寒露', '霜降'],
      冬: ['立冬', '小雪', '大雪', '冬至', '小寒', '大寒']
    }

    const terms = seasonalTerms[season] || []

    // 添加节气选项
    terms.forEach(term => {
      const option = document.createElement('option')
      option.value = term
      option.textContent = term
      solarTermSelect.appendChild(option)
    })
  }

  /**
     * 获取用户认证令牌
     * @returns {string|null} 认证令牌或null
     */
  function getAuthToken () {
    return localStorage.getItem('authToken')
  }

  /**
     * 保存饮品配方到收藏夹
     * @param {Object} beverage 饮品数据
     */
  function saveBeverageToFavorites (beverage) {
    // 检查登录状态
    if (!getAuthToken()) {
      alert('请先登录，然后再收藏配方')
      return
    }

    // 获取现有收藏
    const favorites = JSON.parse(localStorage.getItem('favoriteBeverages') || '[]')

    // 检查是否已收藏
    const isAlreadySaved = favorites.some(item => item.id === beverage.id)

    if (isAlreadySaved) {
      alert('此配方已收藏')
      return
    }

    // 添加到收藏
    favorites.push({
      id: beverage.id,
      name: beverage.name,
      category: beverage.category,
      description: beverage.description,
      savedAt: new Date().toISOString()
    })

    // 保存到本地存储
    localStorage.setItem('favoriteBeverages', JSON.stringify(favorites))

    // 更新按钮状态
    const saveButton = document.getElementById('saveBeverage')
    if (saveButton) {
      saveButton.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> 已收藏'
      saveButton.classList.remove('btn-outline-success')
      saveButton.classList.add('btn-success')
      saveButton.disabled = true
    }

    // 显示成功消息
    alert('配方已成功收藏')
  }
})
