<template>
  <div class="container">
    <h1>Tron交易扫描器</h1>
    
    <el-form :model="form" label-width="120px">
      <el-form-item label="网络">
        <el-select v-model="form.network" placeholder="请选择网络" @change="handleNetworkChange" style="width: 180px">
          <el-option label="主网" value="mainnet" />
          <el-option label="Shasta测试网" value="shasta" />
          <el-option label="Nile测试网" value="nile" />
        </el-select>
      </el-form-item>

      <el-form-item label="扫描顺序">
        <el-radio-group v-model="form.scanOrder">
          <el-radio :value="'asc'">从小到大</el-radio>
          <el-radio :value="'desc'">从大到小</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="代币类型">
        <el-checkbox-group v-model="form.tokenTypes">
          <el-checkbox :value="'TRX'">TRX</el-checkbox>
          <el-checkbox :value="'TRC20'">TRC20</el-checkbox>
          <el-checkbox :value="'TRC721'">TRC721</el-checkbox>
          <el-checkbox :value="'TRC1155'">TRC1155</el-checkbox>
          <el-checkbox :value="'TRC10'">TRC10</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="备注过滤">
        <el-input
          v-model="form.noteFilter"
          placeholder="输入关键词过滤掉包含这些关键词的交易（多个关键词用空格分隔）"
          style="width: 400px"
          clearable
        />
      </el-form-item>

      <el-form-item label="区块范围">
        <div class="block-range">
          <el-input-number 
            v-model="form.startBlock" 
            :min="1" 
            :max="form.endBlock || 999999999" 
            :controls="true"
            placeholder="起始区块"
          />
          <span class="separator">至</span>
          <el-input-number 
            v-model="form.endBlock" 
            :min="form.startBlock || 1" 
            :max="latestBlock || 999999999" 
            :controls="true"
            placeholder="结束区块"
          />
          
          <div class="quick-select">
            <el-button-group class="mb-10">
              <el-button @click="selectLastNBlocks(100)">最近100个区块</el-button>
              <el-button @click="selectLastNBlocks(1000)">最近1000个区块</el-button>
              <el-button @click="selectLastNBlocks(10000)">最近1万个区块</el-button>
            </el-button-group>
            <el-button-group class="mb-10">
              <el-button @click="selectLastNBlocks(50000)">最近5万个区块</el-button>
              <el-button @click="selectLastNBlocks(100000)">最近10万个区块</el-button>
              <el-button @click="selectLastNBlocks(500000)">最近50万个区块</el-button>
            </el-button-group>
            <el-button-group>
              <el-button @click="selectLastNBlocks(1000000)" type="warning">最近100万个区块</el-button>
            </el-button-group>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="钱包筛选">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input
            v-model="form.addressFilter"
            placeholder="输入钱包地址（支持多个地址，用空格分隔）"
            style="width: 400px"
            clearable
          />
          <el-radio-group v-model="form.addressFilterType" size="small">
            <el-radio :value="'both'">发送方或接收方</el-radio>
            <el-radio :value="'from'">仅发送方</el-radio>
            <el-radio :value="'to'">仅接收方</el-radio>
          </el-radio-group>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="scanTransactions" :loading="loading" v-if="!loading">
          开始扫描
        </el-button>
        <el-button type="danger" @click="stopScan" v-if="loading">
          停止扫描
        </el-button>
        <el-button @click="refreshLatestBlock" :loading="refreshing">
          刷新最新区块
        </el-button>
      </el-form-item>
    </el-form>

    <div class="block-info" v-if="latestBlock">
      <el-alert
        :title="'当前最新区块: ' + latestBlock"
        type="info"
        :closable="false"
      />
    </div>

    <!-- 添加进度条 -->
    <div v-if="loading" class="scan-progress">
      <div class="current-block">
        正在扫描区块: {{ currentScanningBlock }}
      </div>
      <el-progress 
        :percentage="scanProgress" 
        :format="progressFormat"
        :stroke-width="20"
        status="success"
      />
    </div>

    <div v-if="transactions.length > 0" class="results">
      <h2>扫描结果</h2>
      <el-table :data="transactions" style="width: 100%" class="custom-table">
        <el-table-column prop="block" label="区块" width="100">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.block }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="160">
          <template #default="{ row }">
            <span class="fixed-content">{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hash" label="交易哈希" width="180">
          <template #default="{ row }">
            <a :href="getTxUrl(row.hash)" target="_blank" class="hash-link">{{ row.hash.slice(0, 8) }}...{{ row.hash.slice(-8) }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="from" label="发送方" width="180">
          <template #default="{ row }">
            <a :href="getAddressUrl(row.from)" target="_blank" class="address-link">{{ formatAddress(row.from) }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="to" label="接收方" width="180">
          <template #default="{ row }">
            <a :href="getAddressUrl(row.to)" target="_blank" class="address-link">{{ formatAddress(row.to) }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(TRX)" width="100">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="200">
          <template #default="{ row }">
            <div class="note-content">{{ row.note }}</div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TronWeb from 'tronweb'

const NETWORKS = {
  mainnet: {
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io'
  },
  shasta: {
    fullNode: 'https://api.shasta.trongrid.io',
    solidityNode: 'https://api.shasta.trongrid.io',
    eventServer: 'https://api.shasta.trongrid.io'
  },
  nile: {
    fullNode: 'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io',
    eventServer: 'https://nile.trongrid.io'
  }
}

const form = ref({
  network: 'mainnet',
  startBlock: 1,
  endBlock: 1000,
  scanOrder: 'desc',
  tokenTypes: ['TRX'],
  noteFilter: '',
  addressFilter: '',
  addressFilterType: 'both'  // 'both', 'from', 'to'
})

const loading = ref(false)
const refreshing = ref(false)
const transactions = ref([])
const latestBlock = ref(null)
const scanning = ref(false)
const scanProgress = ref(0)
const currentScanningBlock = ref(0)

// 获取最新区块号
const getLatestBlock = async () => {
  const tronWeb = getTronWeb()
  try {
    const block = await tronWeb.trx.getCurrentBlock()
    if (block && block.block_header && block.block_header.raw_data) {
      return block.block_header.raw_data.number
    }
    throw new Error('无法获取区块信息')
  } catch (error) {
    console.error('获取最新区块失败:', error)
    ElMessage.error('获取最新区块失败：' + error.message)
    return null
  }
}

// 刷新最新区块
const refreshLatestBlock = async () => {
  refreshing.value = true
  try {
    const blockNum = await getLatestBlock()
    if (blockNum) {
      latestBlock.value = blockNum
      // 设置默认显示最近100个区块
      form.value.endBlock = blockNum
      form.value.startBlock = Math.max(1, blockNum - 99) // -99是因为要包含当前区块
    }
  } finally {
    refreshing.value = false
  }
}

// 处理网络变化
const handleNetworkChange = async () => {
  form.value.startBlock = 1
  form.value.endBlock = null  // 设为null，等待获取最新区块后再设置
  transactions.value = []
  await refreshLatestBlock()
}

// 快捷选择最近的N个区块
const selectLastNBlocks = (n) => {
  if (!latestBlock.value) {
    ElMessage.warning('请等待获取最新区块号')
    return
  }
  form.value.endBlock = latestBlock.value
  form.value.startBlock = Math.max(1, latestBlock.value - n + 1)
}

const getTronWeb = () => {
  const network = NETWORKS[form.value.network]
  return new TronWeb({
    fullHost: network.fullNode,
    solidityNode: network.solidityNode,
    eventServer: network.eventServer
  })
}

// 停止扫描
const stopScan = () => {
  scanning.value = false
  loading.value = false
  ElMessage.info('已停止扫描')
}

// 格式化地址显示
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

// 格式化时间显示
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 格式化进度显示
const progressFormat = (percentage) => {
  const currentBlock = form.value.startBlock + Math.floor((form.value.endBlock - form.value.startBlock) * percentage / 100)
  return `已扫描至区块 ${currentBlock} (${percentage}%)`
}

// 检查备注是否应该被过滤掉
const shouldFilterNote = (note) => {
  if (!form.value.noteFilter) return false
  const keywords = form.value.noteFilter.toLowerCase().split(/\s+/).filter(k => k)
  if (keywords.length === 0) return false
  const noteText = note.toLowerCase()
  return keywords.some(keyword => noteText.includes(keyword))
}

// 检查地址是否匹配筛选条件
const checkAddressMatch = (from, to) => {
  if (!form.value.addressFilter) return true
  const addresses = form.value.addressFilter.toLowerCase().split(/\s+/).filter(a => a)
  if (addresses.length === 0) return true

  const fromAddr = from.toLowerCase()
  const toAddr = to.toLowerCase()

  switch (form.value.addressFilterType) {
    case 'from':
      return addresses.includes(fromAddr)
    case 'to':
      return addresses.includes(toAddr)
    case 'both':
    default:
      return addresses.includes(fromAddr) || addresses.includes(toAddr)
  }
}

const scanTransactions = async () => {
  if (!form.value.startBlock || !form.value.endBlock) {
    ElMessage.warning('请输入区块范围')
    return
  }

  if (form.value.endBlock < form.value.startBlock) {
    ElMessage.warning('结束区块不能小于起始区块')
    return
  }

  if (form.value.endBlock - form.value.startBlock > 1000000) {
    ElMessage.warning('为了保证性能，每次最多扫描100万个区块')
    return
  }

  if (form.value.tokenTypes.length === 0) {
    ElMessage.warning('请至少选择一种代币类型')
    return
  }

  loading.value = true
  scanning.value = true
  transactions.value = []
  scanProgress.value = 0
  currentScanningBlock.value = form.value.startBlock
  const tronWeb = getTronWeb()

  try {
    const totalBlocks = form.value.endBlock - form.value.startBlock + 1
    let blockNumbers = []
    
    // 根据扫描顺序生成区块序列
    if (form.value.scanOrder === 'asc') {
      for (let i = form.value.startBlock; i <= form.value.endBlock; i++) {
        blockNumbers.push(i)
      }
    } else {
      for (let i = form.value.endBlock; i >= form.value.startBlock; i--) {
        blockNumbers.push(i)
      }
    }

    for (let i = 0; i < blockNumbers.length; i++) {
      if (!scanning.value) {
        break
      }

      const blockNum = blockNumbers[i]
      currentScanningBlock.value = blockNum
      const block = await tronWeb.trx.getBlock(blockNum)
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.raw_data && tx.raw_data.contract) {
            for (const contract of tx.raw_data.contract) {
              // 检查交易类型是否匹配选择的代币类型
              const contractType = contract.type
              let shouldProcess = false

              if (form.value.tokenTypes.includes('TRX') && contractType === 'TransferContract') {
                shouldProcess = true
              } else if (form.value.tokenTypes.includes('TRC20') && contractType === 'TriggerSmartContract') {
                // 检查是否是TRC20转账
                try {
                  const functionSelector = contract.parameter.value.data.slice(0, 8)
                  if (functionSelector === 'a9059cbb') {  // transfer方法的selector
                    shouldProcess = true
                  }
                } catch (e) {}
              } else if (form.value.tokenTypes.includes('TRC721') && contractType === 'TriggerSmartContract') {
                // 检查是否是TRC721转账
                try {
                  const functionSelector = contract.parameter.value.data.slice(0, 8)
                  if (functionSelector === '23b872dd') {  // transferFrom方法的selector
                    shouldProcess = true
                  }
                } catch (e) {}
              } else if (form.value.tokenTypes.includes('TRC1155') && contractType === 'TriggerSmartContract') {
                // 检查是否是TRC1155转账
                try {
                  const functionSelector = contract.parameter.value.data.slice(0, 8)
                  if (functionSelector === 'f242432a' || functionSelector === '2eb2c2d6') {  // safeTransferFrom或safeBatchTransferFrom
                    shouldProcess = true
                  }
                } catch (e) {}
              } else if (form.value.tokenTypes.includes('TRC10') && contractType === 'TransferAssetContract') {
                shouldProcess = true
              }

              if (shouldProcess) {
                try {
                  if (tx.raw_data.data) {
                    const note = tronWeb.toUtf8(tx.raw_data.data)
                    if (note && !shouldFilterNote(note)) {
                      const { value } = contract.parameter
                      const fromAddress = tronWeb.address.fromHex(value.owner_address || value.from || value.from_address)
                      const toAddress = tronWeb.address.fromHex(value.to_address || value.to)
                      
                      // 添加地址筛选检查
                      if (checkAddressMatch(fromAddress, toAddress)) {
                        transactions.value.push({
                          block: blockNum,
                          timestamp: tx.raw_data.timestamp,
                          hash: tx.txID,
                          from: fromAddress,
                          to: toAddress,
                          amount: value.amount ? value.amount / 1000000 : '转账',
                          type: contractType,
                          note
                        })
                      }
                    }
                  }
                } catch (e) {
                  console.error('解析交易备注失败:', e, tx)
                }
              }
            }
          }
        }
      }

      // 更新进度
      scanProgress.value = Math.floor((i + 1) / totalBlocks * 100)
    }
    
    if (!scanning.value) {
      return
    }

    if (transactions.value.length === 0) {
      ElMessage.info('在指定区块范围内未找到带备注的转账交易')
    } else {
      ElMessage.success(`扫描完成，共找到 ${transactions.value.length} 笔带备注的交易`)
    }
  } catch (error) {
    console.error('扫描错误:', error)
    ElMessage.error('扫描过程中发生错误：' + error.message)
  } finally {
    loading.value = false
    scanning.value = false
    scanProgress.value = 0
    currentScanningBlock.value = 0
  }
}

// 从localStorage加载设置
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('tronScannerSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      form.value = {
        ...form.value,
        ...settings
      }
    }
  } catch (e) {
    console.error('加载设置失败:', e)
  }
}

// 保存设置到localStorage
const saveSettings = () => {
  try {
    localStorage.setItem('tronScannerSettings', JSON.stringify({
      network: form.value.network,
      scanOrder: form.value.scanOrder,
      tokenTypes: form.value.tokenTypes,
      noteFilter: form.value.noteFilter,
      addressFilter: form.value.addressFilter,
      addressFilterType: form.value.addressFilterType
    }))
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

// 监听设置变化并保存
watch(() => ({
  network: form.value.network,
  scanOrder: form.value.scanOrder,
  tokenTypes: form.value.tokenTypes,
  noteFilter: form.value.noteFilter,
  addressFilter: form.value.addressFilter,
  addressFilterType: form.value.addressFilterType
}), () => {
  saveSettings()
}, { deep: true })

// 页面加载时自动获取最新区块和加载设置
onMounted(async () => {
  loadSettings()  // 先加载设置
  await refreshLatestBlock()  // 然后刷新区块
})

// 获取区块浏览器的基础URL
const getExplorerBaseUrl = () => {
  const network = form.value.network
  switch (network) {
    case 'mainnet':
      return 'https://tronscan.org'
    case 'shasta':
      return 'https://shasta.tronscan.org'
    case 'nile':
      return 'https://nile.tronscan.org'
    default:
      return 'https://tronscan.org'
  }
}

// 获取交易URL
const getTxUrl = (hash) => {
  return `${getExplorerBaseUrl()}/#/transaction/${hash}`
}

// 获取地址URL
const getAddressUrl = (address) => {
  return `${getExplorerBaseUrl()}/#/address/${address}`
}
</script>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.results {
  margin-top: 30px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  margin-bottom: 20px;
}

.block-range {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.separator {
  margin: 0 10px;
}

.quick-select {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mb-10 {
  margin-bottom: 10px;
}

.block-info {
  margin: 20px 0;
}

:deep(.el-alert) {
  margin: 20px 0;
}

.custom-table {
  width: 100%;
}

:deep(.custom-table .el-table__cell) {
  padding: 8px;
}

:deep(.custom-table .el-table__cell:not(.note-column)) {
  white-space: nowrap;
}

.note-content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

:deep(.custom-table .el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 8px;
}

:deep(.custom-table .el-table__row) {
  cursor: default;
}

:deep(.custom-table .el-table__row:hover td) {
  background-color: #f5f7fa;
}

.fixed-column {
  width: 1%;
  white-space: nowrap;
}

.fixed-content {
  display: inline-block;
  white-space: nowrap;
  font-family: monospace;
}

:deep(.custom-table .el-table__cell) {
  padding: 8px;
}

:deep(.custom-table .fixed-column) {
  white-space: nowrap !important;
}

.note-content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.hash-link,
.address-link {
  color: #409EFF;
  text-decoration: none;
  font-family: monospace;
}

.hash-link:hover,
.address-link:hover {
  text-decoration: underline;
  color: #66b1ff;
}

.scan-progress {
  margin: 20px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.current-block {
  margin-bottom: 10px;
  padding: 0 4px;
  font-size: 14px;
  color: #606266;
  font-family: monospace;
}

:deep(.scan-progress .el-progress-bar__outer) {
  background-color: #e9ecef;
}

:deep(.scan-progress .el-progress-bar__inner) {
  transition: width 0.3s ease;
}

:deep(.scan-progress .el-progress__text) {
  font-size: 14px !important;
  min-width: 200px !important;
}
</style> 