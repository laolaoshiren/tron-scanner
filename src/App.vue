<template>
  <div class="container">
    <h1>Tron交易扫描器</h1>
    
    <el-form :model="form" label-width="80px" class="function-area">
      <!-- 第一行：基础设置 -->
      <div class="form-row">
        <el-form-item label="网络">
          <el-select v-model="form.network" placeholder="请选择网络" @change="handleNetworkChange">
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
      </div>

      <!-- 第二行：区块范围和快速选择 -->
      <div class="form-row">
        <el-form-item label="区块范围">
          <div class="range-inputs">
            <el-input-number v-model="form.startBlock" :min="1" :max="form.endBlock || 999999999" placeholder="起始区块" />
            <span class="separator">至</span>
            <el-input-number v-model="form.endBlock" :min="form.startBlock || 1" :max="latestBlock || 999999999" placeholder="结束区块" />
            <div v-if="form.startBlock && form.endBlock" class="block-count">
              <el-tag type="info">
                总计 {{ form.endBlock - form.startBlock + 1 }} 个区块
                <template v-if="latestBlock">（约 {{ formatBlocksToTime(form.endBlock - form.startBlock + 1) }}）</template>
              </el-tag>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="快速选择">
          <el-button-group>
            <el-button @click="selectTimeRange('today')">今日</el-button>
            <el-button @click="selectTimeRange('yesterday')">昨日</el-button>
            <el-button @click="selectTimeRange('7days')">近7天</el-button>
            <el-button @click="selectTimeRange('15days')">近15天</el-button>
          </el-button-group>
        </el-form-item>
      </div>

      <!-- 第三行：区块数量快速选择 -->
      <div class="form-row">
        <el-form-item label="区块数量">
          <el-button-group>
            <el-button @click="selectLastNBlocks(100)">最近100个区块</el-button>
            <el-button @click="selectLastNBlocks(1000)">最近1000个区块</el-button>
            <el-button @click="selectLastNBlocks(10000)">最近1万个区块</el-button>
            <el-button @click="selectLastNBlocks(50000)">最近5万个区块</el-button>
            <el-button @click="selectLastNBlocks(100000)">最近10万个区块</el-button>
            <el-button @click="selectLastNBlocks(500000)">最近50万个区块</el-button>
            <el-button @click="selectLastNBlocks(1000000)" type="warning">最近100万个区块</el-button>
          </el-button-group>
        </el-form-item>
      </div>

      <!-- 第四行：过滤选项 -->
      <div class="form-row">
        <el-form-item label="备注过滤">
          <div style="display: flex; align-items: center; gap: 15px;">
            <el-input
              v-model="form.noteFilter"
              placeholder="输入关键词过滤掉包含这些关键词的交易（多个关键词用空格分隔）"
              clearable
              style="width: 500px;"
            />
            <el-checkbox v-model="form.filterChineseOnly">
              仅显示中文备注
            </el-checkbox>
          </div>
        </el-form-item>
      </div>

      <!-- 第五行：钱包筛选 -->
      <div class="form-row">
        <el-form-item label="钱包筛选">
          <el-radio-group v-model="form.addressFilterMode">
            <el-radio :value="'none'">不启用</el-radio>
            <el-radio :value="'whitelist'">白名单</el-radio>
            <el-radio :value="'blacklist'">黑名单</el-radio>
          </el-radio-group>
          <el-radio-group v-model="form.addressFilterType" :disabled="form.addressFilterMode === 'none'" style="margin-left: 15px">
            <el-radio :value="'both'">发送方或接收方</el-radio>
            <el-radio :value="'from'">仅发送方</el-radio>
            <el-radio :value="'to'">仅接收方</el-radio>
          </el-radio-group>
          <template v-if="form.addressFilterMode !== 'none'">
            <el-button @click="showAddressDialog">
              编辑{{ form.addressFilterMode === 'whitelist' ? '白' : '黑' }}名单
            </el-button>
            <span class="address-count">
              当前{{ form.addressFilterMode === 'whitelist' ? '白' : '黑' }}名单：{{ getAddressListCount(form.addressFilterMode) }} 个地址
            </span>
          </template>
        </el-form-item>
      </div>

      <!-- 第六行：高级选项 -->
      <div class="form-row">
        <el-form-item label="高级选项">
          <el-checkbox v-model="form.enableContractCheck">
            检测并标注智能合约地址
          </el-checkbox>
          <el-checkbox v-model="form.parallelScan" style="margin-left: 15px">
            启用并行扫描
          </el-checkbox>
          <template v-if="form.parallelScan">
            <span style="margin-left: 15px">线程数：</span>
            <el-input-number 
              v-model="form.threadCount" 
              :min="2" 
              :max="20"
              style="width: 100px"
            />
            <el-checkbox v-model="form.autoThrottle" style="margin-left: 15px">
              智能限速
            </el-checkbox>
          </template>
        </el-form-item>
      </div>

      <!-- 第七行：操作按钮 -->
      <div class="form-row">
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="scanBlocks"
          >
            开始扫描
          </el-button>
          <el-button 
            type="danger" 
            @click="stopScan" 
            :disabled="!loading"
          >
            停止扫描
          </el-button>
          <el-button 
            type="success" 
            @click="refreshLatestBlock" 
            :loading="refreshing"
          >
            刷新最新区块
          </el-button>
          <div v-if="latestBlock" class="latest-block">
            <el-alert
              :title="'当前最新区块: ' + latestBlock"
              type="info"
              :closable="false"
            />
          </div>
        </el-form-item>
      </div>
    </el-form>

    <!-- 添加地址编辑对话框 -->
    <el-dialog
      v-model="addressDialogVisible"
      :title="form.addressFilterMode === 'whitelist' ? '编辑白名单' : '编辑黑名单'"
      width="600px"
    >
      <div class="address-dialog-content">
        <div class="address-tips">
          请输入钱包地址，每行一个：
        </div>
        <el-input
          v-model="addressInput"
          type="textarea"
          :rows="15"
          placeholder="输入钱包地址，每行一个"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddresses">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 扫描结果和进度 -->
    <div v-if="loading || transactions.length > 0 || successBlocks > 0" class="results">
      <div class="results-header">
        <div class="results-left">
          <h2 class="results-title">扫描结果</h2>
          <div class="results-content">
            <el-descriptions :column="4" border size="small" class="scan-stats">
              <el-descriptions-item label="扫描区块数">
                {{ form.endBlock - form.startBlock + 1 }}
              </el-descriptions-item>
              <el-descriptions-item label="成功区块数">
                {{ successBlocks }}
              </el-descriptions-item>
              <el-descriptions-item label="失败区块数">
                <el-tooltip
                  effect="dark"
                  content="未成功数/累计失败数"
                  placement="top"
                >
                  <span style="cursor: help">{{ failedBlocks }}/{{ totalFailedBlocks }}</span>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="找到交易数">
                {{ transactions.length }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        <div class="results-right">
          <div v-if="loading" class="scan-progress">
            <div class="current-block">
              正在扫描区块: {{ currentScanningBlock }}
            </div>
            <el-progress 
              :percentage="scanProgress" 
              :format="progressFormat"
              :stroke-width="18"
              status="success"
              style="width: 100%"
            />
          </div>
        </div>
      </div>

      <el-table 
        v-if="transactions.length > 0"
        :data="transactions" 
        style="width: 100%; margin-top: 15px;" 
        class="custom-table" 
        border
        :resizable="false"
        :table-layout="fixed"
      >
        <el-table-column prop="block" label="区块" width="100" align="center">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.block }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="timestamp" label="时间" width="160" align="center">
          <template #default="{ row }">
            <span class="fixed-content" style="white-space: nowrap; font-family: monospace;">{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="hash" label="交易哈希" width="160" align="center">
          <template #default="{ row }">
            <a :href="getTxUrl(row.hash)" target="_blank" class="hash-link" style="white-space: nowrap; display: inline-block;">{{ row.hash.slice(0, 8) }}...{{ row.hash.slice(-8) }}</a>
          </template>
        </el-table-column>

        <el-table-column prop="from" label="发送方" width="320" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
              <span style="min-width: 120px; font-family: monospace; text-align: left;">
                <template v-if="row.from === '(合约创建)'">
                  <span class="contract-creation" style="text-align: center; display: block;">{{ row.from }}</span>
                </template>
                <template v-else>
                  <a :href="getAddressUrl(row.from)" target="_blank" class="address-link">
                    <template v-if="row.fromIsContract">[合]</template>{{ row.from.slice(0, 8) }}...{{ row.from.slice(-8) }}
                  </a>
                </template>
              </span>
              <el-button-group>
                <el-button type="primary" size="small" @click="addToWhitelist(row.from)" :disabled="row.from === '(合约创建)'" title="添加到白名单">白</el-button>
                <el-button type="danger" size="small" @click="addToBlacklist(row.from)" :disabled="row.from === '(合约创建)'" title="添加到黑名单">黑</el-button>
                <el-button type="info" size="small" @click="copyAddress(row.from)" :disabled="row.from === '(合约创建)'" title="复制地址">复</el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="to" label="接收方" width="320" align="center">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
              <span style="min-width: 120px; font-family: monospace; text-align: left;">
                <template v-if="row.to === '(合约创建)'">
                  <span class="contract-creation" style="text-align: center; display: block;">{{ row.to }}</span>
                </template>
                <template v-else>
                  <a :href="getAddressUrl(row.to)" target="_blank" class="address-link">
                    <template v-if="row.toIsContract">[合]</template>{{ row.to.slice(0, 8) }}...{{ row.to.slice(-8) }}
                  </a>
                </template>
              </span>
              <el-button-group>
                <el-button type="primary" size="small" @click="addToWhitelist(row.to)" :disabled="row.to === '(合约创建)'" title="添加到白名单">白</el-button>
                <el-button type="danger" size="small" @click="addToBlacklist(row.to)" :disabled="row.to === '(合约创建)'" title="添加到黑名单">黑</el-button>
                <el-button type="info" size="small" @click="copyAddress(row.to)" :disabled="row.to === '(合约创建)'" title="复制地址">复</el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="金额" width="100" align="center">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.amount }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="代币类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.type === 'TriggerSmartContract' ? 'warning' : 'success'"
              size="small"
            >
              {{ row.type === 'TriggerSmartContract' ? 'TRC20' : 'TRX' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="tokenName" label="代币名称" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              type="info"
              size="small"
            >
              {{ row.tokenName || 'TRX' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="note" label="备注" min-width="500">
          <template #default="{ row }">
            <div class="note-content">{{ row.note }}</div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
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
  filterChineseOnly: false,
  addressFilterMode: 'none',
  addressFilterType: 'both',
  enableContractCheck: false,
  parallelScan: false,
  threadCount: 5,
  autoThrottle: true
})

const networkAddressLists = ref({
  mainnet: {
    whitelistAddresses: [],
    blacklistAddresses: []
  },
  shasta: {
    whitelistAddresses: [],
    blacklistAddresses: []
  },
  nile: {
    whitelistAddresses: [],
    blacklistAddresses: []
  }
})

const getCurrentNetworkAddressList = (type) => {
  return networkAddressLists.value[form.value.network][`${type}Addresses`]
}

const loading = ref(false)
const refreshing = ref(false)
const transactions = ref([])
const latestBlock = ref(null)
const scanning = ref(false)
const scanProgress = ref(0)
const currentScanningBlock = ref(0)
const processedBlockCount = ref(0)
const addressDialogVisible = ref(false)
const addressInput = ref('')
const contractCache = ref(new Map())
const successBlocks = ref(0)
const failedBlocks = ref(0)
const totalFailedBlocks = ref(0)
const failedBlockSet = ref(new Set())
const maxRetries = 10
const isInitialLoad = ref(true)

const rateLimiter = {
  queue: [],
  lastRequestTime: 0,
  minInterval: 50,
  maxInterval: 2000,
  currentInterval: 50,
  errorCount: 0,
  
  async wait() {
    const now = Date.now()
    const timeToWait = Math.max(0, this.lastRequestTime + this.currentInterval - now)
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait))
    }
    this.lastRequestTime = Date.now()
  },
  
  success() {
    this.errorCount = Math.max(0, this.errorCount - 1)
    if (this.errorCount === 0 && this.currentInterval > this.minInterval) {
      this.currentInterval = Math.max(this.minInterval, this.currentInterval * 0.8)
    }
  },
  
  error() {
    this.errorCount++
    if (this.errorCount > 2) {
      this.currentInterval = Math.min(this.maxInterval, this.currentInterval * 1.5)
    }
  }
}

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

const refreshLatestBlock = async () => {
  refreshing.value = true
  try {
    const blockNum = await getLatestBlock()
    if (blockNum) {
      latestBlock.value = blockNum
      form.value.endBlock = blockNum
      form.value.startBlock = Math.max(1, blockNum - 99)
    }
  } finally {
    refreshing.value = false
  }
}

const handleNetworkChange = async () => {
  form.value.startBlock = 1
  form.value.endBlock = null
  transactions.value = []
  await refreshLatestBlock()
}

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

const stopScan = () => {
  scanning.value = false
  loading.value = false
  ElMessage.info('已停止扫描')
}

const formatAddress = (address, isContract) => {
  if (!address || address === '(创建合约)' || address === '(合约创建)') return address
  return `${isContract ? '[合] ' : ''}${address.slice(0, 6)}...${address.slice(-6)}`
}

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

const progressFormat = (percentage) => {
  return `已成功扫描 ${successBlocks.value}/${form.value.endBlock - form.value.startBlock + 1} 个区块`
}

const shouldFilterNote = (note) => {
  if (form.value.filterChineseOnly && !/[\u4e00-\u9fa5]/.test(note)) {
    return true
  }
  
  if (!form.value.noteFilter) return false
  const keywords = form.value.noteFilter.toLowerCase().split(/\s+/).filter(k => k)
  if (keywords.length === 0) return false
  const noteText = note.toLowerCase()
  return keywords.some(keyword => noteText.includes(keyword))
}

const showAddressDialog = () => {
  const listType = form.value.addressFilterMode === 'whitelist' ? 'whitelistAddresses' : 'blacklistAddresses'
  const addresses = networkAddressLists.value[form.value.network][listType]
  addressInput.value = addresses.join('\n')
  addressDialogVisible.value = true
}

const saveAddresses = () => {
  const addresses = addressInput.value
    .split('\n')
    .map(addr => addr.trim())
    .filter(addr => addr && addr.length === 34)
  
  const listType = form.value.addressFilterMode === 'whitelist' ? 'whitelistAddresses' : 'blacklistAddresses'
  networkAddressLists.value[form.value.network][listType] = [...new Set(addresses)]
  
  addressDialogVisible.value = false
  
  ElMessage.success(`已保存 ${addresses.length} 个有效${form.value.addressFilterMode === 'whitelist' ? '白名单' : '黑名单'}地址`)
}

const checkAddressMatch = (from, to) => {
  if (form.value.addressFilterMode === 'none') return true
  
  const fromAddr = (from || '').toLowerCase()
  const toAddr = (to || '').toLowerCase()
  const addressList = getCurrentNetworkAddressList(form.value.addressFilterMode === 'whitelist' ? 'whitelist' : 'blacklist')
    .map(addr => addr.toLowerCase())
  
  let isInList = false
  switch (form.value.addressFilterType) {
    case 'from':
      isInList = fromAddr && addressList.includes(fromAddr)
      break
    case 'to':
      isInList = toAddr && addressList.includes(toAddr)
      break
    case 'both':
    default:
      isInList = (fromAddr && addressList.includes(fromAddr)) || (toAddr && addressList.includes(toAddr))
      break
  }
  
  return form.value.addressFilterMode === 'whitelist' ? isInList : !isInList
}

const checkIsContract = async (address) => {
  if (!address || address === '(创建合约)' || address === '(合约创建)') return false
  
  if (contractCache.value.has(address)) {
    return contractCache.value.get(address)
  }

  try {
    const tronWeb = getTronWeb()
    const code = await tronWeb.trx.getContract(address)
    const isContract = !!code
    contractCache.value.set(address, isContract)
    return isContract
  } catch (e) {
    console.warn('检查合约状态失败:', e)
    return false
  }
}

const processTransaction = async (tx, blockNum, contract) => {
  try {
    if (tx.raw_data.data) {
      const tronWeb = getTronWeb()
      const note = tronWeb.toUtf8(tx.raw_data.data)
      if (note && !shouldFilterNote(note)) {
        const { value } = contract.parameter
        const fromAddress = tronWeb.address.fromHex(value.owner_address || value.from || value.from_address)
        let toAddress = ''
        let tokenName = 'TRX'
        
        try {
          toAddress = tronWeb.address.fromHex(value.to_address || value.to)
          // 如果是TRC20交易，尝试获取代币名称
          if (contract.type === 'TriggerSmartContract' && value.contract_address) {
            try {
              const tokenContract = await tronWeb.contract().at(tronWeb.address.fromHex(value.contract_address))
              tokenName = await tokenContract.symbol().call()
            } catch (e) {
              console.warn('获取代币名称失败:', e)
            }
          }
        } catch (e) {
          console.warn('无法解析接收方地址:', e)
        }
        
        if (!fromAddress && !toAddress) return null

        let isFromContract = false
        let isToContract = false

        if (form.value.enableContractCheck) {
          [isFromContract, isToContract] = await Promise.all([
            checkIsContract(fromAddress),
            checkIsContract(toAddress)
          ])
        }

        if (checkAddressMatch(fromAddress || '', toAddress || '')) {
          return {
            block: blockNum,
            timestamp: tx.raw_data.timestamp,
            hash: tx.txID,
            from: fromAddress || '(创建合约)',
            fromIsContract: isFromContract,
            to: toAddress || '(合约创建)',
            toIsContract: isToContract,
            amount: value.amount ? value.amount / 1000000 : '转账',
            type: contract.type,
            tokenName,
            note
          }
        }
      }
    }
  } catch (e) {
    console.error('处理交易失败:', e)
  }
  return null
}

const scanBlocks = async () => {
  if (loading.value) {
    ElMessage.warning('扫描正在进行中')
    return
  }

  // 重置计数器
  successBlocks.value = 0
  failedBlocks.value = 0
  totalFailedBlocks.value = 0
  failedBlockSet.value.clear()
  transactions.value = []
  scanProgress.value = 0
  
  try {
    loading.value = true
    scanning.value = true
    
    const tronWeb = getTronWeb()
    const startBlock = Number(form.value.startBlock)
    const endBlock = Number(form.value.endBlock)
    const totalBlocks = endBlock - startBlock + 1
    
    // 生成区块号数组
    let blockNumbers = Array.from(
      { length: totalBlocks }, 
      (_, i) => form.value.scanOrder === 'asc' ? startBlock + i : endBlock - i
    )
    
    // 并行扫描逻辑
    if (form.value.parallelScan) {
      const threads = Math.min(form.value.threadCount, blockNumbers.length)
      const chunks = []
      const chunkSize = Math.ceil(blockNumbers.length / threads)
      
      for (let i = 0; i < blockNumbers.length; i += chunkSize) {
        chunks.push(blockNumbers.slice(i, i + chunkSize))
      }
      
      await Promise.all(chunks.map(chunk => processBlockChunk(chunk, tronWeb)))
    } else {
      await processBlockChunk(blockNumbers, tronWeb)
    }
    
    // 处理失败的区块
    while (failedBlockSet.value.size > 0 && scanning.value) {
      const failedBlocks = Array.from(failedBlockSet.value)
      failedBlockSet.value.clear() // 清空集合，准备记录新的失败
      
      // 增加延迟，避免频繁请求
      await new Promise(resolve => setTimeout(resolve, rateLimiter.currentInterval * 2))
      
      // 重试失败的区块
      if (form.value.parallelScan) {
        const threads = Math.min(form.value.threadCount, failedBlocks.length)
        const chunks = []
        const chunkSize = Math.ceil(failedBlocks.length / threads)
        
        for (let i = 0; i < failedBlocks.length; i += chunkSize) {
          chunks.push(failedBlocks.slice(i, i + chunkSize))
        }
        
        await Promise.all(chunks.map(chunk => processBlockChunk(chunk, tronWeb, true)))
      } else {
        await processBlockChunk(failedBlocks, tronWeb, true)
      }
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
    processedBlockCount.value = 0
  }
}

const processBlockChunk = async (blockNumbers, tronWeb, isRetry = false) => {
  const totalBlocks = form.value.endBlock - form.value.startBlock + 1
  
  for (let i = 0; i < blockNumbers.length; i++) {
    if (!scanning.value) break
    
    const blockNum = blockNumbers[i]
    currentScanningBlock.value = blockNum
    
    try {
      if (form.value.autoThrottle) {
        await rateLimiter.wait()
      }
      
      const block = await tronWeb.trx.getBlock(blockNum)
      if (block && block.transactions) {
        // 如果之前失败过，现在成功了，从失败集合中移除
        if (failedBlockSet.value.has(blockNum)) {
          failedBlockSet.value.delete(blockNum)
          failedBlocks.value = failedBlockSet.value.size
        }
        successBlocks.value++
        // 更新进度条为成功区块数的比例
        scanProgress.value = Math.floor(successBlocks.value / totalBlocks * 100)
        
        for (const tx of block.transactions) {
          if (tx.raw_data && tx.raw_data.contract) {
            for (const contract of tx.raw_data.contract) {
              const result = await processTransaction(tx, blockNum, contract)
              if (result) {
                transactions.value.push(result)
              }
            }
          }
        }
        rateLimiter.success()
      }
    } catch (error) {
      console.error(`扫描区块 ${blockNum} 失败:`, error)
      rateLimiter.error()
      
      // 如果是首次失败，增加总失败数
      if (!failedBlockSet.value.has(blockNum) && !isRetry) {
        totalFailedBlocks.value++
      }
      // 添加到当前失败集合
      failedBlockSet.value.add(blockNum)
      failedBlocks.value = failedBlockSet.value.size
      
      if (form.value.autoThrottle) {
        await new Promise(resolve => setTimeout(resolve, rateLimiter.currentInterval))
      }
    }
  }
}

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('tronScannerSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      form.value = {
        ...form.value,
        ...settings,
        startBlock: Number(settings.startBlock) || form.value.startBlock,
        endBlock: Number(settings.endBlock) || form.value.endBlock,
        threadCount: Number(settings.threadCount) || form.value.threadCount
      }
      // 加载网络相关的黑白名单
      if (settings.networkAddressLists) {
        networkAddressLists.value = settings.networkAddressLists
      }
    }
  } catch (e) {
    console.error('加载设置失败:', e)
  }
}

const saveSettings = () => {
  if (isInitialLoad.value) {
    return
  }
  try {
    localStorage.setItem('tronScannerSettings', JSON.stringify({
      network: form.value.network,
      scanOrder: form.value.scanOrder,
      tokenTypes: form.value.tokenTypes,
      startBlock: form.value.startBlock,
      endBlock: form.value.endBlock,
      
      noteFilter: form.value.noteFilter,
      filterChineseOnly: form.value.filterChineseOnly,
      addressFilterMode: form.value.addressFilterMode,
      addressFilterType: form.value.addressFilterType,
      networkAddressLists: networkAddressLists.value,
      
      enableContractCheck: form.value.enableContractCheck,
      parallelScan: form.value.parallelScan,
      threadCount: form.value.threadCount,
      autoThrottle: form.value.autoThrottle
    }))
    ElMessage.success('设置已保存')
  } catch (e) {
    console.error('保存设置失败:', e)
    ElMessage.error('保存设置失败')
  }
}

watch(() => ({
  network: form.value.network,
  scanOrder: form.value.scanOrder,
  tokenTypes: form.value.tokenTypes,
  startBlock: form.value.startBlock,
  endBlock: form.value.endBlock,
  noteFilter: form.value.noteFilter,
  filterChineseOnly: form.value.filterChineseOnly,
  addressFilterMode: form.value.addressFilterMode,
  addressFilterType: form.value.addressFilterType,
  networkAddressLists: networkAddressLists.value,
  enableContractCheck: form.value.enableContractCheck,
  parallelScan: form.value.parallelScan,
  threadCount: form.value.threadCount,
  autoThrottle: form.value.autoThrottle
}), () => {
  saveSettings()
}, { 
  deep: true,
  immediate: false 
})

onMounted(async () => {
  loadSettings()
  await refreshLatestBlock()
  // 延迟设置 isInitialLoad 为 false，确保初始化完成
  nextTick(() => {
    isInitialLoad.value = false
  })
})

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

const getTxUrl = (hash) => {
  return `${getExplorerBaseUrl()}/#/transaction/${hash}`
}

const getAddressUrl = (address) => {
  return `${getExplorerBaseUrl()}/#/address/${address}`
}

const addToWhitelist = (address) => {
  const currentList = networkAddressLists.value[form.value.network].whitelistAddresses
  if (!currentList.includes(address)) {
    networkAddressLists.value[form.value.network].whitelistAddresses.push(address)
    ElMessage.success(`已添加到${form.value.network}网络的白名单`)
    saveSettings()
  } else {
    ElMessage.info('该地址已在白名单中')
  }
}

const addToBlacklist = (address) => {
  const currentList = networkAddressLists.value[form.value.network].blacklistAddresses
  if (!currentList.includes(address)) {
    networkAddressLists.value[form.value.network].blacklistAddresses.push(address)
    ElMessage.success(`已添加到${form.value.network}网络的黑名单`)
    saveSettings()
  } else {
    ElMessage.info('该地址已在黑名单中')
  }
}

const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    ElMessage.success('地址已复制')
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败，请手动复制')
  }
}

const selectTimeRange = (range) => {
  if (!latestBlock.value) {
    ElMessage.warning('请等待获取最新区块号')
    return
  }

  const BLOCKS_PER_DAY = 28800
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const sevenDaysAgoStart = new Date(todayStart)
  sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 7)
  const fifteenDaysAgoStart = new Date(todayStart)
  fifteenDaysAgoStart.setDate(fifteenDaysAgoStart.getDate() - 15)

  const latestBlockTime = Math.floor(Date.now() / 1000)
  let startBlock, endBlock

  switch (range) {
    case 'today': {
      const secondsSinceLatestBlock = latestBlockTime - Math.floor(todayStart.getTime() / 1000)
      const blocksSinceStart = Math.floor(secondsSinceLatestBlock / 3)
      startBlock = latestBlock.value - blocksSinceStart
      endBlock = latestBlock.value
      break
    }
    case 'yesterday': {
      const secondsSinceLatestBlock = latestBlockTime - Math.floor(todayStart.getTime() / 1000)
      const blocksSinceToday = Math.floor(secondsSinceLatestBlock / 3)
      const yesterdayBlocks = BLOCKS_PER_DAY
      startBlock = latestBlock.value - blocksSinceToday - yesterdayBlocks
      endBlock = latestBlock.value - blocksSinceToday
      break
    }
    case '7days': {
      const secondsSinceLatestBlock = latestBlockTime - Math.floor(sevenDaysAgoStart.getTime() / 1000)
      const blocksSinceStart = Math.floor(secondsSinceLatestBlock / 3)
      startBlock = latestBlock.value - blocksSinceStart
      endBlock = latestBlock.value
      break
    }
    case '15days': {
      const secondsSinceLatestBlock = latestBlockTime - Math.floor(fifteenDaysAgoStart.getTime() / 1000)
      const blocksSinceStart = Math.floor(secondsSinceLatestBlock / 3)
      startBlock = latestBlock.value - blocksSinceStart
      endBlock = latestBlock.value
      break
    }
  }

  startBlock = Math.max(1, startBlock)
  form.value.startBlock = startBlock
  form.value.endBlock = endBlock

  ElMessage.success(`已选择区块范围：${startBlock} - ${endBlock}`)
}

const formatBlocksToTime = (blocks) => {
  const seconds = blocks * 3  // TRON 3秒一个区块
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  
  return parts.join('')
}

const getAddressListCount = (type) => {
  return networkAddressLists.value[form.value.network][`${type}Addresses`].length
}
</script>

<style scoped>
.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 10px;
}

.results {
  margin-top: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
}

h1 {
  text-align: center;
  margin-bottom: 15px;
  font-size: 20px;
  color: #606266;
}

h2 {
  margin-bottom: 15px;
  font-size: 16px;
}

.function-area {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-row:last-child {
  margin-bottom: 0;
}

:deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 20px;
}

:deep(.el-form-item:last-child) {
  margin-right: 0;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.separator {
  margin: 0 5px;
}

.block-count {
  margin-left: 10px;
}

.latest-block {
  display: inline-block;
  margin-left: 15px;
}

:deep(.el-alert) {
  margin: 0;
  padding: 8px 16px;
}

:deep(.el-button-group .el-button) {
  margin: 0;
}

:deep(.el-input-number) {
  width: 160px;
}

:deep(.el-select) {
  width: 160px;
}

:deep(.el-radio-group) {
  display: flex;
  align-items: center;
}

:deep(.el-checkbox-group) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.address-count {
  margin-left: 10px;
  color: #666;
}

.results-right {
  flex: 2;
  display: flex;
  align-items: center;
  padding-left: 20px;
  width: 100%;
}

.scan-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(.scan-progress .el-progress) {
  width: 100%;
  margin: 0;
  display: flex;
  align-items: center;
}

:deep(.scan-progress .el-progress-bar) {
  flex: 1;
  margin-right: 10px;
}

:deep(.scan-progress .el-progress__text) {
  font-size: 13px !important;
  min-width: 50px !important;
  margin-left: 0 !important;
  padding-left: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.scan-progress .el-progress-bar__outer) {
  height: 16px !important;
  background-color: #e9ecef;
  width: 100%;
}

:deep(.scan-progress .el-progress-bar__inner) {
  transition: width 0.3s ease;
}

.current-block {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.address-dialog-content {
  padding: 0 20px;
}

.address-tips {
  margin-bottom: 10px;
  color: #666;
}

.address-count {
  color: #666;
  font-size: 13px;
}

.contract-address {
  color: #909399;
  font-family: monospace;
  background-color: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e9e9eb;
}

.contract-tag {
  background-color: #909399;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 4px;
}

.scan-stats {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

:deep(.scan-stats .el-descriptions__label) {
  width: 100px;
  color: #606266;
  font-weight: bold;
}

:deep(.scan-stats .el-descriptions__content) {
  color: #409EFF;
  font-weight: bold;
  font-family: monospace;
}

.block-count {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

:deep(.block-count .el-tag) {
  font-family: monospace;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
}

:deep(.el-button-group .el-button--small) {
  padding: 5px 8px;
}

:deep(.el-button-group) {
  margin-left: -2px;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 8px;
  white-space: nowrap;
}

:deep(.el-table__header-wrapper) {
  background-color: #f5f7fa;
}

.note-content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
  padding: 4px 0;
}

:deep(.el-table__column-resize-proxy) {
  display: none;
}

:deep(.el-table) {
  border-collapse: collapse;
  table-layout: fixed;
}

:deep(.el-table__cell) {
  border-right: 1px solid #EBEEF5;
}

:deep(.el-table__header th.el-table__cell) {
  border-right: 1px solid #EBEEF5;
}

:deep(.el-table__column-resize-proxy) {
  display: none !important;
}

:deep(.el-table__column-resize-handle) {
  display: none !important;
}

:deep(.el-table) {
  --el-table-border-color: #EBEEF5;
  table-layout: fixed !important;
}

:deep(.el-table__cell) {
  user-select: none;
}

:deep(.el-table__column-resize-handle),
:deep(.el-table__column-resize-proxy) {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
  width: 0 !important;
}

:deep(.el-table__header) {
  user-select: none;
}

:deep(.el-table__header th) {
  position: relative !important;
}

:deep(.el-table__header th::after) {
  display: none !important;
}

:deep(.el-table--border th.el-table__cell.is-leaf) {
  border-right: 1px solid var(--el-table-border-color);
}

.hash-link {
  color: #409EFF;
  text-decoration: none;
  white-space: nowrap;
  display: inline-block;
  font-family: monospace;
}

.hash-link:hover {
  text-decoration: underline;
  color: #66b1ff;
}

.address-link {
  color: #409EFF;
  text-decoration: none;
  white-space: nowrap;
  display: inline-block;
  font-family: monospace;
  background-color: #f0f9ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e6f2ff;
}

.address-link:hover {
  text-decoration: underline;
  color: #66b1ff;
  background-color: #e6f2ff;
}

.results-header {
  display: flex;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  min-height: 80px;
}

.results-left {
  flex: 3;
  display: flex;
  align-items: center;
  padding-right: 20px;
  border-right: 1px solid #EBEEF5;
}

.results-right {
  flex: 2;
  display: flex;
  align-items: center;
  padding-left: 20px;
  width: 100%;
}

.scan-stats {
  margin: 0;
  width: 100%;
}

:deep(.scan-stats .el-descriptions) {
  width: 100%;
}

:deep(.scan-stats .el-descriptions__body) {
  width: 100%;
}

.results-title {
  white-space: nowrap;
  margin: 0;
  margin-right: 20px;
  font-size: 16px;
}

.results-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
</style> 