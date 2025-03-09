// server/mcp-new/src/di/providers.js

// 引入各模块的提供者
const coreProviders = require('./providers/core-providers')
const userProviders = require('./providers/user-providers')
const tcmProviders = require('./providers/tcm-providers')
const voiceDiagnosisProviders = require('./providers/voice-diagnosis-providers')
const adaptiveLearningProviders = require('./providers/adaptive-learning-providers')

// 导出所有提供者
module.exports = {
  ...coreProviders,
  ...userProviders,
  ...tcmProviders,
  ...voiceDiagnosisProviders,
  ...adaptiveLearningProviders
}
