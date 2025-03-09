const fs = require('fs')
const path = require('path')
const loggerService = require('./loggerService')

class TCMService {
  constructor () {
    this.name = '中医知识服务'
    this.dataPath = path.join(__dirname, '../resources/tcm/data')

    // 确保目录存在
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }
  }

  // 搜索中医知识
  async searchKnowledge (query, options = {}) {
    loggerService.info('搜索中医知识', { query, options })

    try {
      const category = options.category
      const limit = options.limit || 10

      // 加载所有可搜索的知识
      const herbs = await this._loadData('herbs.json', 'herbs')
      const formulas = await this._loadData('formulas.json', 'formulas')
      const theories = await this._loadData('theories.json', 'theories')

      // 根据分类筛选要搜索的数据集
      const searchSources = []

      if (!category || category === '药材') {
        searchSources.push({ data: herbs, type: '药材' })
      }

      if (!category || category === '方剂') {
        searchSources.push({ data: formulas, type: '方剂' })
      }

      if (!category || category === '理论') {
        searchSources.push({ data: theories, type: '理论' })
      }

      // 搜索结果
      let results = []

      // 对每个数据源进行搜索
      for (const source of searchSources) {
        const sourceResults = this._searchInSource(query, source.data, source.type)
        results = results.concat(sourceResults)
      }

      // 按相关性排序
      results.sort((a, b) => b.relevance - a.relevance)

      // 限制返回数量
      results = results.slice(0, limit)

      return {
        query,
        results,
        total: results.length,
        metadata: {
          searchTime: new Date().toISOString()
        }
      }
    } catch (error) {
      loggerService.error('搜索中医知识失败', { query, error: error.message })
      throw new Error(`搜索中医知识失败: ${error.message}`)
    }
  }

  // 在单个数据源中搜索
  _searchInSource (query, data, type) {
    const results = []
    const queryTerms = query.toLowerCase().split(/\s+/)

    for (const item of data) {
      let relevance = 0
      const searchableText = this._getSearchableText(item, type)

      // 检查每个查询词在可搜索文本中的出现
      for (const term of queryTerms) {
        if (searchableText.includes(term)) {
          // 根据匹配位置和类型增加相关性分数
          relevance += this._calculateRelevance(item, term, type)
        }
      }

      // 如果有相关性，添加到结果中
      if (relevance > 0) {
        results.push({
          id: item.id,
          type,
          name: item.name,
          description: this._getDescription(item, type),
          relevance,
          data: item
        })
      }
    }

    return results
  }

  // 获取可搜索文本
  _getSearchableText (item, type) {
    let text = ''

    // 根据不同类型，组合不同字段进行搜索
    switch (type) {
      case '药材':
        text = `${item.name} ${item.pinyin} ${item.nature} ${item.property} ${item.meridian} ${item.function} ${item.application}`.toLowerCase()
        break
      case '方剂':
        text = `${item.name} ${item.pinyin} ${item.category} ${item.composition} ${item.function} ${item.application}`.toLowerCase()
        break
      case '理论':
        text = `${item.name} ${item.category} ${item.description}`.toLowerCase()
        break
      default:
        text = JSON.stringify(item).toLowerCase()
    }

    return text
  }

  // 计算相关性分数
  _calculateRelevance (item, term, type) {
    let score = 1 // 基础分数

    // 如果在名称中匹配，增加分数
    if (item.name.toLowerCase().includes(term)) {
      score += 5
    }

    // 根据不同类型，对不同字段的匹配进行加权
    switch (type) {
      case '药材':
        if (item.function && item.function.toLowerCase().includes(term)) {
          score += 3
        }
        if (item.application && item.application.toLowerCase().includes(term)) {
          score += 2
        }
        break
      case '方剂':
        if (item.function && item.function.toLowerCase().includes(term)) {
          score += 3
        }
        if (item.composition && item.composition.toLowerCase().includes(term)) {
          score += 2
        }
        break
      case '理论':
        if (item.description && item.description.toLowerCase().includes(term)) {
          score += 3
        }
        break
    }

    return score
  }

  // 获取描述文本
  _getDescription (item, type) {
    switch (type) {
      case '药材':
        return `${item.nature}，${item.property}。归经：${item.meridian}。功效：${item.function}`
      case '方剂':
        return `组成：${item.composition}。功效：${item.function}`
      case '理论':
        return item.description
      default:
        return ''
    }
  }

  // 加载数据
  async _loadData (filename, dataKey) {
    try {
      const filePath = path.join(this.dataPath, filename)

      if (!fs.existsSync(filePath)) {
        return []
      }

      const fileData = fs.readFileSync(filePath, 'utf8')
      const parsedData = JSON.parse(fileData)

      return parsedData[dataKey] || []
    } catch (error) {
      loggerService.error(`加载数据文件${filename}失败`, { error: error.message })
      return []
    }
  }
}

module.exports = new TCMService()
