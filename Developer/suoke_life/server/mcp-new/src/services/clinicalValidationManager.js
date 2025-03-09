const fs = require('fs').promises
const path = require('path')

class ClinicalValidationManager {
  constructor (options = {}) {
    this.basePath = options.basePath || path.join(process.cwd(), 'data', 'voice', 'clinical_validation')
    this.logger = options.logger || console
  }

  async initialize () {
    try {
      // 确保目录存在
      await fs.mkdir(this.basePath, { recursive: true })

      // 初始化索引文件
      const indexPath = path.join(this.basePath, 'index.json')

      try {
        await fs.access(indexPath)
      } catch {
        // 创建新的索引文件
        const initialIndex = {
          totalCases: 0,
          lastUpdated: new Date().toISOString(),
          categories: {}
        }

        await fs.writeFile(
          indexPath,
          JSON.stringify(initialIndex, null, 2),
          'utf8'
        )
      }

      this.logger.info('临床验证管理器初始化成功')
    } catch (error) {
      this.logger.error('临床验证管理器初始化失败', error)
      throw error
    }
  }

  async createCase (caseData) {
    try {
      // 读取索引
      const indexPath = path.join(this.basePath, 'index.json')
      const index = JSON.parse(await fs.readFile(indexPath, 'utf8'))

      // 生成案例ID
      const caseId = `CV${String(index.totalCases + 1).padStart(4, '0')}`

      // 准备案例数据
      const completeCase = {
        id: caseId,
        createdAt: new Date().toISOString(),
        ...caseData
      }

      // 保存案例文件
      const casePath = path.join(this.basePath, `${caseId}.json`)
      await fs.writeFile(
        casePath,
        JSON.stringify(completeCase, null, 2),
        'utf8'
      )

      // 更新索引
      index.totalCases++
      index.lastUpdated = new Date().toISOString()

      // 更新分类计数
      const diagnosis = caseData.traditionalDiagnosis?.diagnosis
      if (diagnosis) {
        index.categories[diagnosis] = (index.categories[diagnosis] || 0) + 1
      }

      await fs.writeFile(
        indexPath,
        JSON.stringify(index, null, 2),
        'utf8'
      )

      return caseId
    } catch (error) {
      this.logger.error('创建验证案例失败', error)
      throw error
    }
  }

  async getCases (options = {}) {
    const {
      limit = 10,
      offset = 0,
      diagnosis = null,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      educationalOnly = false,
      minMatchScore = 0
    } = options

    try {
      // 读取所有案例文件
      const files = await fs.readdir(this.basePath)
      const caseFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json')

      const results = []
      let totalMatched = 0

      for (const file of caseFiles) {
        const caseData = JSON.parse(
          await fs.readFile(path.join(this.basePath, file), 'utf8')
        )

        // 应用过滤条件
        let match = true

        if (diagnosis && caseData.traditionalDiagnosis?.diagnosis !== diagnosis) {
          match = false
        }

        if (educationalOnly && !caseData.educationalValue?.recommendedForTraining) {
          match = false
        }

        if (minMatchScore > 0 && (!caseData.concordanceAnalysis?.matchScore ||
            caseData.concordanceAnalysis.matchScore < minMatchScore)) {
          match = false
        }

        if (match) {
          results.push(caseData)
          totalMatched++
        }
      }

      // 排序
      results.sort((a, b) => {
        // 处理嵌套属性，如concordanceAnalysis.matchScore
        const aValue = sortBy.includes('.')
          ? sortBy.split('.').reduce((obj, key) => obj?.[key], a)
          : a[sortBy]

        const bValue = sortBy.includes('.')
          ? sortBy.split('.').reduce((obj, key) => obj?.[key], b)
          : b[sortBy]

        // 确保值存在，否则排在末尾
        const aExists = aValue !== undefined && aValue !== null
        const bExists = bValue !== undefined && bValue !== null

        if (!aExists && !bExists) return 0
        if (!aExists) return 1
        if (!bExists) return -1

        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : 1
        }
        return aValue > bValue ? 1 : -1
      })

      return {
        total: totalMatched,
        data: results.slice(offset, offset + limit),
        metadata: {
          filters: {
            diagnosis,
            educationalOnly,
            minMatchScore
          },
          pagination: {
            limit,
            offset,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(totalMatched / limit)
          }
        }
      }
    } catch (error) {
      this.logger.error('查询验证案例失败', error)
      return {
        total: 0,
        data: [],
        error: error.message
      }
    }
  }
}

module.exports = ClinicalValidationManager
