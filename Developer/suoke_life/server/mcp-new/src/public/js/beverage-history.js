/**
 * 养生饮品历史记录页面脚本
 */
document.addEventListener('DOMContentLoaded', function () {
  // 获取DOM元素
  const tabButtons = document.querySelectorAll('.tab-button')
  const tabPanes = document.querySelectorAll('.tab-pane')
  const historyList = document.getElementById('historyList')
  const favoritesList = document.getElementById('favoritesList')

  // 饮品类别名称映射
  const categoryNames = {
    medicinal_food: '药食同源类',
    herbal_spice: '香料类',
    classic_formula: '古方经方类',
    medicinal_wine: '药酒类',
    infused_wine: '泡酒类'
  }

  // 饮品类别图标映射
  const categoryIcons = {
    medicinal_food: 'bi-flower1',
    herbal_spice: 'bi-flower3',
    classic_formula: 'bi-book',
    medicinal_wine: 'bi-cup-hot',
    infused_wine: 'bi-cup'
  }

  // 初始化页面
  initPage()

  /**
     * 初始化页面
     */
  function initPage () {
    // 加载生成历史
    loadHistory()

    // 加载收藏
    loadFavorites()

    // 标签页切换
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // 更新按钮状态
        tabButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')

        // 获取目标标签页
        const targetTab = button.dataset.tab

        // 切换标签页
        tabPanes.forEach(pane => pane.style.display = 'none')
        document.getElementById(`${targetTab}Tab`).style.display = 'block'
      })
    })
  }

  /**
     * 加载饮品生成历史
     */
  async function loadHistory () {
    try {
      // 检查登录状态
      if (!getAuthToken()) {
        showEmptyState(historyList, '请先登录查看生成历史', 'bi-person-lock')
        return
      }

      // 获取历史数据
      const response = await fetch('/api/recipe/beverage/user/list', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('获取历史记录失败')
      }

      const historyData = await response.json()

      // 检查是否有历史记录
      if (!historyData || historyData.length === 0) {
        showEmptyState(historyList, '暂无生成历史', 'bi-clock-history')
        return
      }

      // 渲染历史记录
      renderBeverageList(historyList, historyData)
    } catch (error) {
      console.error('加载历史失败:', error)
      showEmptyState(historyList, '加载历史失败，请稍后再试', 'bi-exclamation-circle')
    }
  }

  /**
     * 加载收藏的饮品
     */
  function loadFavorites () {
    try {
      // 获取收藏数据
      const favorites = JSON.parse(localStorage.getItem('favoriteBeverages') || '[]')

      // 检查是否有收藏
      if (favorites.length === 0) {
        showEmptyState(favoritesList, '暂无收藏的饮品', 'bi-bookmark')
        return
      }

      // 渲染收藏列表
      renderBeverageList(favoritesList, favorites, true)
    } catch (error) {
      console.error('加载收藏失败:', error)
      showEmptyState(favoritesList, '加载收藏失败，请稍后再试', 'bi-exclamation-circle')
    }
  }

  /**
     * 渲染饮品列表
     * @param {HTMLElement} container 容器元素
     * @param {Array} beverages 饮品数据数组
     * @param {boolean} isFavorites 是否为收藏列表
     */
  function renderBeverageList (container, beverages, isFavorites = false) {
    // 清空容器
    container.innerHTML = ''

    // 创建列表
    beverages.forEach(beverage => {
      // 创建卡片
      const card = document.createElement('div')
      card.className = 'history-card'

      // 格式化日期
      const date = new Date(beverage.createdAt || beverage.savedAt)
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

      // 设置卡片内容
      card.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="beverage-icon icon-${beverage.category || 'medicinal_food'} me-3">
                        <i class="bi ${categoryIcons[beverage.category] || 'bi-cup'}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <span class="category-badge badge-${beverage.category || 'medicinal_food'}">
                            ${categoryNames[beverage.category] || '养生饮品'}
                        </span>
                        <h5 class="mb-1">${beverage.name}</h5>
                        <p class="text-muted mb-1 small">${beverage.description || ''}</p>
                        <div class="text-muted small">
                            <i class="bi bi-clock me-1"></i> ${formattedDate}
                        </div>
                    </div>
                    <div>
                        <a href="/beverage-detail.html?id=${beverage.id}" class="btn btn-outline-primary btn-sm">
                            查看详情
                        </a>
                        ${isFavorites
? `
                            <button class="btn btn-outline-danger btn-sm ms-2" onclick="removeFavorite('${beverage.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        `
: ''}
                    </div>
                </div>
            `

      // 添加到容器
      container.appendChild(card)
    })
  }

  /**
     * 显示空状态
     * @param {HTMLElement} container 容器元素
     * @param {string} message 消息
     * @param {string} icon 图标类名
     */
  function showEmptyState (container, message, icon) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="bi ${icon}"></i>
                <p>${message}</p>
            </div>
        `
  }

  /**
     * 获取用户认证令牌
     * @returns {string|null} 认证令牌或null
     */
  function getAuthToken () {
    return localStorage.getItem('authToken')
  }

  /**
     * 从收藏中移除饮品
     * @param {string} id 饮品ID
     */
  window.removeFavorite = function (id) {
    // 确认是否删除
    if (!confirm('确定要取消收藏此饮品吗？')) {
      return
    }

    try {
      // 获取收藏数据
      let favorites = JSON.parse(localStorage.getItem('favoriteBeverages') || '[]')

      // 过滤掉要删除的项
      favorites = favorites.filter(item => item.id !== id)

      // 保存更新后的收藏
      localStorage.setItem('favoriteBeverages', JSON.stringify(favorites))

      // 重新加载收藏
      loadFavorites()
    } catch (error) {
      console.error('删除收藏失败:', error)
      alert('删除收藏失败，请稍后再试')
    }
  }
})
