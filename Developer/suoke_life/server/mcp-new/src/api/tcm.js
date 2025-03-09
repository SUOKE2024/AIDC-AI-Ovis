const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const loggerService = require('../services/loggerService')
const tcmService = require('../services/tcmService')

// 获取中药材列表
router.get('/herbs', (req, res) => {
  try {
    const { category, property, limit } = req.query
    loggerService.info('请求中药材列表', { category, property, limit })

    const dataPath = path.join(__dirname, '../resources/tcm/data/herbs.json')

    // 检查文件是否存在，如果不存在，创建目录并写入初始数据
    if (!fs.existsSync(dataPath)) {
      loggerService.info('中药材数据文件不存在，创建初始数据')
      const dirPath = path.dirname(dataPath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const initialData = {
        herbs: [
          {
            id: 'herb001',
            name: '人参',
            pinyin: 'renshen',
            nature: '甘、微苦',
            property: '微温',
            meridian: '脾、肺、心',
            function: '大补元气，复脉固脱，补脾益肺，生津养血，安神益智',
            application: '适用于气虚体弱、脾胃虚弱、肺虚喘咳、心悸失眠等症'
          },
          {
            id: 'herb002',
            name: '黄芪',
            pinyin: 'huangqi',
            nature: '甘',
            property: '微温',
            meridian: '脾、肺',
            function: '补气升阳，益卫固表，利水消肿，生肌排脓',
            application: '适用于气虚乏力、食少便溏、自汗、水肿、创伤不愈等症'
          },
          {
            id: 'herb003',
            name: '当归',
            pinyin: 'danggui',
            nature: '甘、辛',
            property: '温',
            meridian: '肝、心、脾',
            function: '补血活血，调经止痛，润肠通便',
            application: '适用于血虚萎黄、月经不调、经闭痛经、虚寒腹痛、肠燥便秘等症'
          },
          {
            id: 'herb004',
            name: '白术',
            pinyin: 'baizhu',
            nature: '甘、苦',
            property: '温',
            meridian: '脾、胃',
            function: '健脾益气，燥湿利水，止汗，安胎',
            application: '适用于脾虚食少、腹胀、腹泻、水肿、自汗等症'
          },
          {
            id: 'herb005',
            name: '茯苓',
            pinyin: 'fuling',
            nature: '甘、淡',
            property: '平',
            meridian: '心、肺、脾、肾',
            function: '利水渗湿，健脾宁心',
            application: '适用于水肿尿少、痰饮眩悸、脾虚食少、心神不安等症'
          }
        ]
      }

      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2))
    }

    // 读取中药材数据
    const herbsData = fs.readFileSync(dataPath, 'utf8')
    let herbs = JSON.parse(herbsData).herbs

    // 根据查询条件筛选
    if (category) {
      herbs = herbs.filter(herb => herb.category === category)
    }

    if (property) {
      herbs = herbs.filter(herb => herb.property.includes(property))
    }

    // 限制返回数量
    if (limit && !isNaN(parseInt(limit))) {
      herbs = herbs.slice(0, parseInt(limit))
    }

    res.json({ herbs })
  } catch (err) {
    loggerService.error('获取中药材数据失败', { error: err.message })
    res.status(500).json({ error: '无法加载药材数据', details: err.message })
  }
})

// 获取方剂列表
router.get('/formulas', (req, res) => {
  try {
    const { category, limit } = req.query
    loggerService.info('请求方剂列表', { category, limit })

    const dataPath = path.join(__dirname, '../resources/tcm/data/formulas.json')

    // 检查文件是否存在，如果不存在，创建目录并写入初始数据
    if (!fs.existsSync(dataPath)) {
      loggerService.info('方剂数据文件不存在，创建初始数据')
      const dirPath = path.dirname(dataPath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const initialData = {
        formulas: [
          {
            id: 'formula001',
            name: '四君子汤',
            pinyin: 'sijunzitang',
            category: '补气剂',
            composition: '人参、白术、茯苓、甘草',
            function: '补脾益气',
            application: '适用于脾胃虚弱，气虚乏力，食少便溏等症'
          },
          {
            id: 'formula002',
            name: '四物汤',
            pinyin: 'siwutang',
            category: '补血剂',
            composition: '当归、川芎、白芍、熟地黄',
            function: '补血调经',
            application: '适用于血虚萎黄，月经不调，经行腹痛等症'
          },
          {
            id: 'formula003',
            name: '六味地黄丸',
            pinyin: 'liuweidihuangwan',
            category: '滋阴剂',
            composition: '熟地黄、山药、山茱萸、泽泻、牡丹皮、茯苓',
            function: '滋阴补肾',
            application: '适用于肾阴虚所致的腰膝酸软，头晕耳鸣，盗汗，五心烦热等症'
          },
          {
            id: 'formula004',
            name: '补中益气汤',
            pinyin: 'buzhongyiqitang',
            category: '补气剂',
            composition: '黄芪、人参、白术、甘草、当归、陈皮、升麻、柴胡',
            function: '补中益气，升阳举陷',
            application: '适用于脾胃虚弱，中气下陷，久泻脱肛，子宫脱垂等症'
          },
          {
            id: 'formula005',
            name: '桂枝汤',
            pinyin: 'guizhitang',
            category: '解表剂',
            composition: '桂枝、白芍、生姜、大枣、甘草',
            function: '发汗解表，调和营卫',
            application: '适用于风寒感冒，恶风发热，头痛，无汗等症'
          }
        ]
      }

      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2))
    }

    // 读取方剂数据
    const formulasData = fs.readFileSync(dataPath, 'utf8')
    let formulas = JSON.parse(formulasData).formulas

    // 根据查询条件筛选
    if (category) {
      formulas = formulas.filter(formula => formula.category === category)
    }

    // 限制返回数量
    if (limit && !isNaN(parseInt(limit))) {
      formulas = formulas.slice(0, parseInt(limit))
    }

    res.json({ formulas })
  } catch (err) {
    loggerService.error('获取方剂数据失败', { error: err.message })
    res.status(500).json({ error: '无法加载方剂数据', details: err.message })
  }
})

// 获取理论知识
router.get('/theories', (req, res) => {
  try {
    const { category } = req.query
    loggerService.info('请求理论知识', { category })

    const dataPath = path.join(__dirname, '../resources/tcm/data/theories.json')

    // 检查文件是否存在，如果不存在，创建目录并写入初始数据
    if (!fs.existsSync(dataPath)) {
      loggerService.info('理论知识数据文件不存在，创建初始数据')
      const dirPath = path.dirname(dataPath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const initialData = {
        theories: [
          {
            id: 'theory001',
            name: '阴阳学说',
            category: '基础理论',
            description: '阴阳学说是中医理论的核心，认为宇宙万物和人体生命现象都可以用阴阳对立统一来解释。阴阳在人体中的体现包括：上下、内外、寒热、虚实等。'
          },
          {
            id: 'theory002',
            name: '五行学说',
            category: '基础理论',
            description: '五行学说是中医理论的重要组成部分，以木、火、土、金、水五种物质的运动变化来概括自然界中事物的属性和变化规律。在中医中，五行对应着五脏、五味、五色等。'
          },
          {
            id: 'theory003',
            name: '脏腑学说',
            category: '基础理论',
            description: '脏腑学说是研究人体内脏功能活动规律的理论。包括五脏（心、肝、脾、肺、肾）、六腑（胆、胃、小肠、大肠、膀胱、三焦）及其相互关系。'
          },
          {
            id: 'theory004',
            name: '经络学说',
            category: '基础理论',
            description: '经络学说是研究人体经络系统分布和功能的理论。经络是运行气血的通道，联系脏腑、体表、四肢、官窍，构成一个完整的网络系统。'
          },
          {
            id: 'theory005',
            name: '气血津液学说',
            category: '基础理论',
            description: '气血津液学说研究人体内气、血、津、液四种基本物质的生成、功能和相互关系。这四种物质共同维持着人体的正常生理功能。'
          }
        ]
      }

      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2))
    }

    // 读取理论知识数据
    const theoriesData = fs.readFileSync(dataPath, 'utf8')
    let theories = JSON.parse(theoriesData).theories

    // 根据查询条件筛选
    if (category) {
      theories = theories.filter(theory => theory.category === category)
    }

    res.json({ theories })
  } catch (err) {
    loggerService.error('获取理论知识数据失败', { error: err.message })
    res.status(500).json({ error: '无法加载理论数据', details: err.message })
  }
})

// 搜索中医知识
router.get('/search', async (req, res) => {
  try {
    const { query, category, limit } = req.query

    if (!query) {
      return res.status(400).json({ error: '缺少搜索关键词' })
    }

    loggerService.info('搜索中医知识', { query, category, limit })

    const results = await tcmService.searchKnowledge(query, { category, limit: parseInt(limit) || 10 })
    res.json(results)
  } catch (err) {
    loggerService.error('搜索中医知识失败', { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
