// 简单的语法测试脚本
try {
  const voiceDiagnosisService = require('./src/services/voiceDiagnosisService')
  console.log('VoiceDiagnosisService 文件语法正确')
  const voiceDatasetManager = require('./src/tools/voiceDatasetManager')
  console.log('VoiceDatasetManager 文件语法正确')
  console.log('所有导入的文件语法正确')
} catch (error) {
  console.error('语法测试失败:', error.message)
}
