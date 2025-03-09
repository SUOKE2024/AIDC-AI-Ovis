/**
 * 向量搜索服务
 * 提供向量化和相似度搜索功能
 */

const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')

/**
 * 简单向量相似度计算工具
 */
class VectorUtils {
  /**
   * 计算两个向量之间的余弦相似度
   * @param {number[]} vectorA - 向量A
   * @param {number[]} vectorB - 向量B
   * @returns {number} 余弦相似度，范围[0,1]
   */
  static cosineSimilarity (vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度不匹配')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * 计算两个向量之间的欧几里得距离
   * @param {number[]} vectorA - 向量A
   * @param {number[]} vectorB - 向量B
   * @returns {number} 欧几里得距离
   */
  static euclideanDistance (vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度不匹配')
    }

    let sum = 0

    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i]
      sum += diff * diff
    }

    return Math.sqrt(sum)
  }

  /**
   * 将欧几里得距离转换为相似度得分
   * @param {number} distance - 欧几里得距离
   * @param {number} scale - 缩放因子
   * @returns {number} 相似度得分，范围[0,1]
   */
  static distanceToSimilarity (distance, scale = 1) {
    return 1 / (1 + distance * scale)
  }

  /**
   * 将文本分词为单词数组（简化版）
   * @param {string} text - 输入文本
   * @returns {string[]} 分词结果
   */
  static tokenize (text) {
    // 注意: 这是一个极其简化的分词方法，仅用于演示目的
    // 生产环境应使用专业的NLP库进行分词
    return text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0)
  }

  /**
   * 计算TF-IDF向量（极简版）
   * @param {string} text - 文本
   * @param {Object} idfValues - IDF值字典
   * @param {Set} vocabulary - 词汇表
   * @returns {number[]} TF-IDF向量
   */
  static computeTfIdfVector (text, idfValues, vocabulary) {
    const tokens = this.tokenize(text)
    const vocabArray = Array.from(vocabulary)
    const vector = new Array(vocabulary.size).fill(0)

    // 计算词频
    const termFreq = {}
    tokens.forEach(token => {
      termFreq[token] = (termFreq[token] || 0) + 1
    })

    // 计算TF-IDF
    vocabArray.forEach((term, index) => {
      const tf = termFreq[term] || 0
      const idf = idfValues[term] || 0
      vector[index] = tf * idf
    })

    return vector
  }
}

/**
 * 内存向量存储
 */
class MemoryVectorStore {
  constructor () {
    this.documents = []
    this.vectors = []
    this.vocabulary = new Set()
    this.idfValues = {}
  }

  /**
   * 添加文档
   * @param {Object} document - 文档对象
   * @param {number[]} vector - 向量
   */
  addDocument (document, vector) {
    this.documents.push(document)
    this.vectors.push(vector)
  }

  /**
   * 根据向量查询相似文档
   * @param {number[]} queryVector - 查询向量
   * @param {number} limit - 返回结果数量
   * @param {number} minScore - 最小相似度分数
   * @returns {Array<{document: Object, score: number}>} 相似文档数组
   */
  querySimilar (queryVector, limit = 5, minScore = 0.5) {
    const results = []

    for (let i = 0; i < this.vectors.length; i++) {
      const similarity = VectorUtils.cosineSimilarity(queryVector, this.vectors[i])

      if (similarity >= minScore) {
        results.push({
          document: this.documents[i],
          score: similarity
        })
      }
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score)

    // 限制结果数量
    return results.slice(0, limit)
  }

  /**
   * 根据ID获取文档
   * @param {string} id - 文档ID
   * @returns {Object|null} 文档对象或null
   */
  getDocumentById (id) {
    return this.documents.find(doc => doc.id === id) || null
  }

  /**
   * 移除文档
   * @param {string} id - 文档ID
   * @returns {boolean} 是否成功移除
   */
  removeDocument (id) {
    const index = this.documents.findIndex(doc => doc.id === id)

    if (index === -1) {
      return false
    }

    this.documents.splice(index, 1)
    this.vectors.splice(index, 1)

    return true
  }

  /**
   * 获取文档总数
   * @returns {number} 文档总数
   */
  get size () {
    return this.documents.length
  }
}

/**
 * 文件向量存储
 */
class FileVectorStore {
  /**
   * 创建文件向量存储
   * @param {Object} options - 配置选项
   * @param {string} options.storePath - 存储路径
   */
  constructor (options = {}) {
    this.storePath = options.storePath || path.join(__dirname, '../data/vectors')
    this.documentPath = path.join(this.storePath, 'documents')
    this.vectorPath = path.join(this.storePath, 'vectors')
    this.indexPath = path.join(this.storePath, 'index.json')

    this.memoryStore = new MemoryVectorStore()
    this.documentMap = new Map()

    // 确保目录存在
    this._ensureDirectories()

    // 初始化存储
    this._initStore()
  }

  /**
   * 添加文档
   * @param {Object} document - 文档对象
   * @param {number[]} vector - 向量
   * @returns {Promise<string>} 文档ID
   */
  async addDocument (document, vector) {
    try {
      // 生成ID
      const id = document.id || uuidv4()
      document.id = id

      // 保存到内存
      this.memoryStore.addDocument(document, vector)
      this.documentMap.set(id, { document, vector })

      // 保存到文件
      await this._saveDocument(id, document)
      await this._saveVector(id, vector)
      await this._updateIndex()

      return id
    } catch (error) {
      logger.error(`添加文档失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 批量添加文档
   * @param {Array<{document: Object, vector: number[]}>} items - 文档和向量数组
   * @returns {Promise<string[]>} 文档ID数组
   */
  async addDocuments (items) {
    try {
      const ids = []

      for (const item of items) {
        const id = await this.addDocument(item.document, item.vector)
        ids.push(id)
      }

      return ids
    } catch (error) {
      logger.error(`批量添加文档失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据向量查询相似文档
   * @param {number[]} queryVector - 查询向量
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 返回结果数量
   * @param {number} options.minScore - 最小相似度分数
   * @param {Function} options.filter - 过滤函数
   * @returns {Promise<Array<{document: Object, score: number}>>} 相似文档数组
   */
  async querySimilar (queryVector, options = {}) {
    try {
      const { limit = 5, minScore = 0.5, filter } = options

      // 使用内存存储查询
      let results = this.memoryStore.querySimilar(queryVector, limit, minScore)

      // 应用过滤器
      if (filter && typeof filter === 'function') {
        results = results.filter(item => filter(item.document))
      }

      return results
    } catch (error) {
      logger.error(`相似查询失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据ID获取文档
   * @param {string} id - 文档ID
   * @returns {Promise<Object|null>} 文档对象或null
   */
  async getDocumentById (id) {
    try {
      // 检查内存中是否存在
      const cached = this.documentMap.get(id)
      if (cached) {
        return cached.document
      }

      // 从文件中读取
      const documentFile = path.join(this.documentPath, `${id}.json`)

      if (!fs.existsSync(documentFile)) {
        return null
      }

      const document = JSON.parse(await fs.promises.readFile(documentFile, 'utf8'))
      return document
    } catch (error) {
      logger.error(`获取文档失败: ${error.message}`)
      return null
    }
  }

  /**
   * 根据ID获取向量
   * @param {string} id - 文档ID
   * @returns {Promise<number[]|null>} 向量或null
   */
  async getVectorById (id) {
    try {
      // 检查内存中是否存在
      const cached = this.documentMap.get(id)
      if (cached) {
        return cached.vector
      }

      // 从文件中读取
      const vectorFile = path.join(this.vectorPath, `${id}.json`)

      if (!fs.existsSync(vectorFile)) {
        return null
      }

      const vector = JSON.parse(await fs.promises.readFile(vectorFile, 'utf8'))
      return vector
    } catch (error) {
      logger.error(`获取向量失败: ${error.message}`)
      return null
    }
  }

  /**
   * 移除文档
   * @param {string} id - 文档ID
   * @returns {Promise<boolean>} 是否成功移除
   */
  async removeDocument (id) {
    try {
      // 从内存中移除
      this.memoryStore.removeDocument(id)
      this.documentMap.delete(id)

      // 从文件中移除
      const documentFile = path.join(this.documentPath, `${id}.json`)
      const vectorFile = path.join(this.vectorPath, `${id}.json`)

      if (fs.existsSync(documentFile)) {
        await fs.promises.unlink(documentFile)
      }

      if (fs.existsSync(vectorFile)) {
        await fs.promises.unlink(vectorFile)
      }

      // 更新索引
      await this._updateIndex()

      return true
    } catch (error) {
      logger.error(`移除文档失败: ${error.message}`)
      return false
    }
  }

  /**
   * 获取文档总数
   * @returns {number} 文档总数
   */
  get size () {
    return this.memoryStore.size
  }

  /**
   * 确保目录存在
   * @private
   */
  _ensureDirectories () {
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true })
    }

    if (!fs.existsSync(this.documentPath)) {
      fs.mkdirSync(this.documentPath, { recursive: true })
    }

    if (!fs.existsSync(this.vectorPath)) {
      fs.mkdirSync(this.vectorPath, { recursive: true })
    }
  }

  /**
   * 初始化存储
   * @private
   */
  _initStore () {
    try {
      if (!fs.existsSync(this.indexPath)) {
        // 创建初始索引
        fs.writeFileSync(this.indexPath, JSON.stringify({
          documentCount: 0,
          documents: []
        }), 'utf8')
        return
      }

      // 读取索引
      const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'))

      // 加载文档和向量
      for (const docId of index.documents) {
        const documentFile = path.join(this.documentPath, `${docId}.json`)
        const vectorFile = path.join(this.vectorPath, `${docId}.json`)

        if (fs.existsSync(documentFile) && fs.existsSync(vectorFile)) {
          const document = JSON.parse(fs.readFileSync(documentFile, 'utf8'))
          const vector = JSON.parse(fs.readFileSync(vectorFile, 'utf8'))

          // 加载到内存
          this.memoryStore.addDocument(document, vector)
          this.documentMap.set(docId, { document, vector })
        }
      }
    } catch (error) {
      logger.error(`初始化向量存储失败: ${error.message}`)

      // 创建空索引
      fs.writeFileSync(this.indexPath, JSON.stringify({
        documentCount: 0,
        documents: []
      }), 'utf8')
    }
  }

  /**
   * 保存文档
   * @param {string} id - 文档ID
   * @param {Object} document - 文档对象
   * @private
   */
  async _saveDocument (id, document) {
    const documentFile = path.join(this.documentPath, `${id}.json`)
    await fs.promises.writeFile(documentFile, JSON.stringify(document), 'utf8')
  }

  /**
   * 保存向量
   * @param {string} id - 文档ID
   * @param {number[]} vector - 向量
   * @private
   */
  async _saveVector (id, vector) {
    const vectorFile = path.join(this.vectorPath, `${id}.json`)
    await fs.promises.writeFile(vectorFile, JSON.stringify(vector), 'utf8')
  }

  /**
   * 更新索引
   * @private
   */
  async _updateIndex () {
    const index = {
      documentCount: this.memoryStore.size,
      documents: Array.from(this.documentMap.keys())
    }

    await fs.promises.writeFile(this.indexPath, JSON.stringify(index), 'utf8')
  }
}

/**
 * 向量搜索服务
 */
class VectorSearchService {
  /**
   * 创建向量搜索服务
   * @param {Object} options - 配置选项
   */
  constructor (options = {}) {
    this.vectorStore = new FileVectorStore({
      storePath: options.storePath || path.join(__dirname, '../data/vectors')
    })

    // 特征提取器
    this._featureExtractor = options.featureExtractor || this._defaultFeatureExtractor.bind(this)

    // 向量索引类型
    this.indexType = options.indexType || 'tfidf'

    // 向量维度
    this.dimensions = options.dimensions || 256

    // 词汇表和IDF值
    this.vocabulary = new Set()
    this.idfValues = {}

    logger.info(`向量搜索服务初始化完成，存储类型: FileVectorStore，索引类型: ${this.indexType}`)
  }

  /**
   * 添加文档
   * @param {Object} document - 文档对象
   * @returns {Promise<string>} 文档ID
   */
  async addDocument (document) {
    try {
      // 提取特征
      const vector = await this._featureExtractor(document)

      // 添加到向量存储
      const id = await this.vectorStore.addDocument(document, vector)

      logger.info(`添加文档成功: ${id}`)
      return id
    } catch (error) {
      logger.error(`添加文档失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 批量添加文档
   * @param {Object[]} documents - 文档对象数组
   * @returns {Promise<string[]>} 文档ID数组
   */
  async addDocuments (documents) {
    try {
      // 准备批处理项
      const items = []

      for (const document of documents) {
        // 提取特征
        const vector = await this._featureExtractor(document)
        items.push({ document, vector })
      }

      // 添加到向量存储
      const ids = await this.vectorStore.addDocuments(items)

      logger.info(`批量添加文档成功: ${ids.length} 个文档`)
      return ids
    } catch (error) {
      logger.error(`批量添加文档失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据文本查询相似文档
   * @param {string} text - 查询文本
   * @param {Object} options - 查询选项
   * @returns {Promise<Array<{document: Object, score: number}>>} 相似文档数组
   */
  async searchByText (text, options = {}) {
    try {
      // 提取特征
      const queryVector = await this._extractTextFeatures(text)

      // 查询相似文档
      const results = await this.vectorStore.querySimilar(queryVector, options)

      logger.info(`文本搜索完成，找到 ${results.length} 个结果`)
      return results
    } catch (error) {
      logger.error(`文本搜索失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 根据ID获取文档
   * @param {string} id - 文档ID
   * @returns {Promise<Object|null>} 文档对象或null
   */
  async getDocumentById (id) {
    return await this.vectorStore.getDocumentById(id)
  }

  /**
   * 移除文档
   * @param {string} id - 文档ID
   * @returns {Promise<boolean>} 是否成功移除
   */
  async removeDocument (id) {
    return await this.vectorStore.removeDocument(id)
  }

  /**
   * 获取文档总数
   * @returns {number} 文档总数
   */
  getDocumentCount () {
    return this.vectorStore.size
  }

  /**
   * 默认特征提取器
   * @param {Object} document - 文档对象
   * @returns {Promise<number[]>} 特征向量
   * @private
   */
  async _defaultFeatureExtractor (document) {
    // 简单地从文本中提取特征
    const text = document.text ||
                  document.content ||
                  document.description ||
                  (typeof document === 'string' ? document : JSON.stringify(document))

    return await this._extractTextFeatures(text)
  }

  /**
   * 从文本中提取特征
   * @param {string} text - 文本
   * @returns {Promise<number[]>} 特征向量
   * @private
   */
  async _extractTextFeatures (text) {
    switch (this.indexType) {
      case 'tfidf':
        return this._extractTfIdfFeatures(text)
      case 'random':
        return this._extractRandomFeatures(text)
      default:
        return this._extractTfIdfFeatures(text)
    }
  }

  /**
   * 提取TF-IDF特征
   * @param {string} text - 文本
   * @returns {number[]} TF-IDF特征向量
   * @private
   */
  _extractTfIdfFeatures (text) {
    return VectorUtils.computeTfIdfVector(text, this.idfValues, this.vocabulary)
  }

  /**
   * 提取随机特征（用于测试）
   * @param {string} text - 文本
   * @returns {number[]} 随机特征向量
   * @private
   */
  _extractRandomFeatures (text) {
    // 根据文本生成伪随机向量
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const vector = new Array(this.dimensions).fill(0)

    // 使用伪随机数生成器
    const rng = (a) => {
      let t = a += 0x6D2B79F5
      t = Math.imul(t ^ t >>> 15, t | 1)
      t ^= t + Math.imul(t ^ t >>> 7, t | 61)
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = rng(seed + i) * 2 - 1 // 范围[-1,1]
    }

    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return vector.map(val => val / norm)
  }
}

module.exports = {
  VectorUtils,
  MemoryVectorStore,
  FileVectorStore,
  VectorSearchService
}
