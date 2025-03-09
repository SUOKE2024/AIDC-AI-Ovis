/**
 * 养生饮品详情页面脚本
 */
document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const beverageTitle = document.getElementById('beverageTitle')
  const beverageSubtitle = document.getElementById('beverageSubtitle')
  const loadingSpinner = document.getElementById('loadingSpinner')
  const errorMessage = document.getElementById('errorMessage')
  const errorText = document.getElementById('errorText')
  const beverageDetail = document.getElementById('beverageDetail')
  const saveBeverageBtn = document.getElementById('saveBeverage')

  // 饮品类别名称映射
  const categoryNames = {
    medicinal_food: '药食同源类',
    herbal_spice: '香料类',
    classic_formula: '古方经方类',
    medicinal_wine: '药酒类',
    infused_wine: '泡酒类'
  }

  // 初始化页面
  initPage()

  /**
     * 初始化页面
     */
  function initPage () {
    // 获取URL参数中的饮品ID
    const urlParams = new URLSearchParams(window.location.search)
    const beverageId = urlParams.get('id')

    if (!beverageId) {
      showError('未找到饮品ID，请返回重试')
      return
    }

    // 加载饮品详情
    loadBeverageDetail(beverageId)

    // 收藏按钮事件
    if (saveBeverageBtn) {
      saveBeverageBtn.addEventListener('click', () => {
        saveBeverageToFavorites()
      })
    }
  }

  /**
     * 加载饮品详情
     * @param {string} beverageId 饮品ID
     */
  async function loadBeverageDetail (beverageId) {
    try {
      // 显示加载动画
      loadingSpinner.style.display = 'block'
      beverageDetail.style.display = 'none'
      errorMessage.style.display = 'none'

      // 首先检查是否在收藏中
      const favorites = JSON.parse(localStorage.getItem('favoriteBeverages') || '[]')
      const favorite = favorites.find(item => item.id === beverageId)

      // 如果在收藏中且有详细数据，直接使用
      if (favorite && favorite.fullData) {
        renderBeverageDetail(favorite.fullData)
        return
      }

      // 否则从API获取
      const response = await fetch(`/api/recipe/beverage/${beverageId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error(response.status === 404 ? '饮品不存在' : '获取饮品详情失败')
      }

      const beverage = await response.json()

      // 渲染饮品详情
      renderBeverageDetail(beverage)
    } catch (error) {
      console.error('加载饮品详情失败:', error)
      showError(error.message || '加载饮品详情失败，请稍后再试')
    }
  }

  /**
     * 显示错误消息
     * @param {string} message 错误消息
     */
  function showError (message) {
    loadingSpinner.style.display = 'none'
    beverageDetail.style.display = 'none'
    errorMessage.style.display = 'block'
    errorText.textContent = message
  }

  /**
     * 渲染饮品详情
     * @param {Object} beverage 饮品数据
     */
  function renderBeverageDetail (beverage) {
    // 更新页面标题
    beverageTitle.textContent = beverage.name
    beverageSubtitle.textContent = `${categoryNames[beverage.category] || '养生饮品'}`

    // 根据饮品类型渲染不同的详情模板
    let detailContent

    if (beverage.category === 'medicinal_wine' || beverage.category === 'infused_wine') {
      detailContent = renderWineDetail(beverage)
    } else if (beverage.category === 'classic_formula') {
      detailContent = renderFormulaDetail(beverage)
    } else {
      detailContent = renderHerbalDetail(beverage)
    }

    // 更新详情内容
    beverageDetail.innerHTML = detailContent

    // 更新收藏按钮状态
    updateSaveButtonState(beverage.id)

    // 隐藏加载动画，显示详情
    loadingSpinner.style.display = 'none'
    beverageDetail.style.display = 'block'

    // 设置收藏按钮事件
    const saveBtn = document.getElementById('saveBeverage')
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveBeverageToFavorites(beverage)
      })
    }
  }

  /**
     * 渲染草本饮品详情（药食同源类和香料类）
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML内容
     */
  function renderHerbalDetail (beverage) {
    const ingredientsList = (beverage.ingredients || []).map(ingredient => `
            <div class="ingredient-item">
                <div class="ingredient-icon" style="background-color: #35BB78;">
                    <i class="bi bi-flower1"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = (beverage.functions || []).map(func =>
            `<span class="health-tag">${func}</span>`
    ).join('')

    return `
            <div class="section-card">
                <span class="category-badge badge-${beverage.category || 'medicinal_food'}">
                    ${categoryNames[beverage.category] || '养生饮品'}
                </span>
                
                <div class="action-buttons">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                    <a href="/beverage.html" class="btn btn-outline-primary">
                        <i class="bi bi-plus-circle"></i> 生成新配方
                    </a>
                </div>
                
                <h2 class="mb-3">${beverage.name}</h2>
                <p class="lead">${beverage.description || ''}</p>
                
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
                            ${beverage.solarTerm ? `<div><strong>节气：</strong> ${beverage.solarTerm}</div>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <h4>制备方法</h4>
                        <p>${beverage.preparationMethod || '暂无详细制备方法'}</p>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h4>适宜人群</h4>
                        <p>${beverage.suitableFor ? beverage.suitableFor.join('、') : beverage.suitableConstitutions ? beverage.suitableConstitutions.join('、') : '一般体质'}</p>
                    </div>
                    <div class="col-md-6">
                        <h4>禁忌人群</h4>
                        <p>${beverage.contraindications ? beverage.contraindications.join('、') : '无特殊禁忌'}</p>
                    </div>
                </div>
            </div>
        `
  }

  /**
     * 渲染经方古方详情
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML内容
     */
  function renderFormulaDetail (beverage) {
    const ingredientsList = (beverage.ingredients || []).map(ingredient => `
            <div class="ingredient-item">
                <div class="ingredient-icon" style="background-color: #FF9800;">
                    <i class="bi bi-mortarboard-fill"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = (beverage.functions || []).map(func =>
            `<span class="health-tag">${func}</span>`
    ).join('')

    return `
            <div class="section-card">
                <div class="alert alert-warning mb-3">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>专业指导建议：</strong> ${beverage.professionalGuidance || '此方来源于中医经典著作，建议在专业中医师指导下使用。'}
                </div>
                
                <span class="category-badge badge-${beverage.category || 'classic_formula'}">
                    ${categoryNames[beverage.category] || '古方经方类'}
                </span>
                
                <div class="action-buttons">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                    <a href="/beverage.html" class="btn btn-outline-primary">
                        <i class="bi bi-plus-circle"></i> 生成新配方
                    </a>
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
     * 渲染药酒和泡酒详情
     * @param {Object} beverage 饮品数据
     * @returns {string} HTML内容
     */
  function renderWineDetail (beverage) {
    const ingredientsList = (beverage.ingredients || []).map(ingredient => `
            <div class="ingredient-item">
                <div class="ingredient-icon" style="background-color: #E53935;">
                    <i class="bi bi-flower2"></i>
                </div>
                <div>
                    <strong>${ingredient.name}</strong> ${ingredient.amount || ''}
                    <div class="text-muted small">${ingredient.property || ''} | ${ingredient.meridian || ''}</div>
                </div>
            </div>
        `).join('')

    const functionsList = (beverage.functions || []).map(func =>
            `<span class="health-tag">${func}</span>`
    ).join('')

    const warningList = (beverage.alcoholWarnings || [
      '18岁以下人群禁用',
      '孕妇及哺乳期妇女禁用',
      '驾车前或服用某些药物期间禁用',
      '肝病患者禁用'
    ]).map(warning =>
            `<li>${warning}</li>`
    ).join('')

    return `
            <div class="section-card">
                <div class="alert alert-danger mb-3">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>酒精饮品警告：</strong> 含酒精成分，请遵循以下使用建议：
                    <ul class="mb-0 mt-2">
                        ${warningList}
                    </ul>
                </div>
                
                <span class="category-badge badge-${beverage.category || 'medicinal_wine'}">
                    ${categoryNames[beverage.category] || '药酒类'}
                </span>
                
                <div class="action-buttons">
                    <button id="saveBeverage" class="btn btn-outline-success">
                        <i class="bi bi-bookmark-plus"></i> 收藏此配方
                    </button>
                    <a href="/beverage.html" class="btn btn-outline-primary">
                        <i class="bi bi-plus-circle"></i> 生成新配方
                    </a>
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
     * 更新收藏按钮状态
     * @param {string} beverageId 饮品ID
     */
  function updateSaveButtonState (beverageId) {
    const favorites = JSON.parse(localStorage.getItem('favoriteBeverages') || '[]')
    const isAlreadySaved = favorites.some(item => item.id === beverageId)

    const saveButton = document.getElementById('saveBeverage')
    if (saveButton) {
      if (isAlreadySaved) {
        saveButton.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> 已收藏'
        saveButton.classList.remove('btn-outline-success')
        saveButton.classList.add('btn-success')
        saveButton.disabled = true
      } else {
        saveButton.innerHTML = '<i class="bi bi-bookmark-plus"></i> 收藏此配方'
        saveButton.classList.remove('btn-success')
        saveButton.classList.add('btn-outline-success')
        saveButton.disabled = false
      }
    }
  }

  /**
     * 保存饮品到收藏夹
     * @param {Object} beverage 饮品数据
     */
  function saveBeverageToFavorites (beverage) {
    if (!beverage) return

    // 检查登录状态
    if (!getAuthToken()) {
      alert('请先登录，然后再收藏配方')
      return
    }

    try {
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
        savedAt: new Date().toISOString(),
        fullData: beverage // 保存完整数据以便离线查看
      })

      // 保存到本地存储
      localStorage.setItem('favoriteBeverages', JSON.stringify(favorites))

      // 更新按钮状态
      updateSaveButtonState(beverage.id)

      // 显示成功消息
      alert('配方已成功收藏')
    } catch (error) {
      console.error('保存收藏失败:', error)
      alert('保存收藏失败，请稍后再试')
    }
  }

  /**
     * 获取用户认证令牌
     * @returns {string|null} 认证令牌或null
     */
  function getAuthToken () {
    return localStorage.getItem('authToken')
  }
})
