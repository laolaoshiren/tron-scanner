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
          
          <div v-if="form.startBlock && form.endBlock" class="block-count">
            <el-tag type="info">
              总计 {{ form.endBlock - form.startBlock + 1 }} 个区块
              <template v-if="latestBlock">
                （约 {{ formatBlocksToTime(form.endBlock - form.startBlock + 1) }}）
              </template>
            </el-tag>
          </div>
          
          <div class="quick-select">
            <el-button-group class="mb-10">
              <el-button @click="selectTimeRange('today')">今日</el-button>
              <el-button @click="selectTimeRange('yesterday')">昨日</el-button>
              <el-button @click="selectTimeRange('7days')">近7天</el-button>
              <el-button @click="selectTimeRange('15days')">近15天</el-button>
            </el-button-group>
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
          <el-radio-group v-model="form.addressFilterMode" size="small">
            <el-radio :value="'none'">不启用</el-radio>
            <el-radio :value="'whitelist'">白名单</el-radio>
            <el-radio :value="'blacklist'">黑名单</el-radio>
          </el-radio-group>
          <el-radio-group v-model="form.addressFilterType" size="small" :disabled="form.addressFilterMode === 'none'">
            <el-radio :value="'both'">发送方或接收方</el-radio>
            <el-radio :value="'from'">仅发送方</el-radio>
            <el-radio :value="'to'">仅接收方</el-radio>
          </el-radio-group>
          <el-button 
            @click="showAddressDialog" 
            size="small" 
            :disabled="form.addressFilterMode === 'none'"
          >
            编辑{{ form.addressFilterMode === 'whitelist' ? '白' : '黑' }}名单
          </el-button>
          <span v-if="form.addressFilterMode !== 'none'" class="address-count">
            ({{ form.addressFilterMode === 'whitelist' ? form.whitelistAddresses.length : form.blacklistAddresses.length }} 个地址)
          </span>
        </div>
      </el-form-item>

      <el-form-item label="高级选项">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <el-checkbox v-model="form.enableContractCheck">
            检测并标注智能合约地址（会降低扫描速度）
          </el-checkbox>
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-checkbox v-model="form.parallelScan">
              启用并行扫描（更快的扫描速度）
            </el-checkbox>
            <template v-if="form.parallelScan">
              <span>线程数：</span>
              <el-input-number 
                v-model="form.threadCount" 
                :min="2" 
                :max="10" 
                size="small"
              />
              <el-checkbox v-model="form.autoThrottle">
                智能限速（自动调整请求频率，避免被限制）
              </el-checkbox>
            </template>
          </div>
        </div>
      </el-form-item>

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

    <!-- 扫描进度 -->
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

    <!-- 扫描结果 -->
    <div v-if="loading || transactions.length > 0" class="results">
      <h2>扫描结果</h2>
      <div class="scan-stats">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="扫描区块数">
            {{ form.endBlock - form.startBlock + 1 }}
          </el-descriptions-item>
          <el-descriptions-item label="成功区块数">
            {{ successBlocks }}
          </el-descriptions-item>
          <el-descriptions-item label="失败区块数">
            {{ failedBlocks }}
          </el-descriptions-item>
          <el-descriptions-item label="找到交易数">
            {{ transactions.length }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-table 
        :data="transactions" 
        style="width: 100%" 
        class="custom-table" 
        border
        :resizable="false"
        :table-layout="fixed"
      >
        <el-table-column prop="block" label="区块" width="100">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.block }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="140">
          <template #default="{ row }">
            <span class="fixed-content">{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hash" label="交易哈希" width="160">
          <template #default="{ row }">
            <a :href="getTxUrl(row.hash)" target="_blank" class="hash-link">{{ row.hash.slice(0, 8) }}...{{ row.hash.slice(-8) }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="from" label="发送方" width="280">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 2px">
              <span style="min-width: 130px; font-family: monospace;">
                <a :href="getAddressUrl(row.from)" target="_blank" class="address-link">
                  {{ formatAddress(row.from, row.fromIsContract) }}
                </a>
              </span>
              <el-button-group size="small" style="transform: scale(0.9);">
                <el-button type="primary" @click="addToWhitelist(row.from)" title="添加到白名单">白</el-button>
                <el-button type="danger" @click="addToBlacklist(row.from)" title="添加到黑名单">黑</el-button>
                <el-button type="info" @click="copyAddress(row.from)" title="复制地址">复</el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="to" label="接收方" width="280">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 2px">
              <span style="min-width: 130px; font-family: monospace;">
                <template v-if="row.to === '(合约创建)'">
                  <span class="contract-address">{{ row.to }}</span>
                </template>
                <template v-else>
                  <a :href="getAddressUrl(row.to)" target="_blank" class="address-link">
                    {{ formatAddress(row.to, row.toIsContract) }}
                  </a>
                </template>
              </span>
              <el-button-group size="small" style="transform: scale(0.9);">
                <el-button type="primary" @click="addToWhitelist(row.to)" title="添加到白名单" :disabled="row.to === '(合约创建)'">白</el-button>
                <el-button type="danger" @click="addToBlacklist(row.to)" title="添加到黑名单" :disabled="row.to === '(合约创建)'">黑</el-button>
                <el-button type="info" @click="copyAddress(row.to)" title="复制地址" :disabled="row.to === '(合约创建)'">复</el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span class="fixed-content">{{ row.amount }}</span>
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
  addressFilterMode: 'none',
  addressFilterType: 'both',
  whitelistAddresses: [],
  blacklistAddresses: [],
  enableContractCheck: false,
  parallelScan: false,
  threadCount: 5,
  autoThrottle: true
})

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
  const currentBlock = form.value.startBlock + Math.floor((form.value.endBlock - form.value.startBlock) * percentage / 100)
  return `已扫描至区块 ${currentBlock} (${percentage}%)`
}

const shouldFilterNote = (note) => {
  if (!form.value.noteFilter) return false
  const keywords = form.value.noteFilter.toLowerCase().split(/\s+/).filter(k => k)
  if (keywords.length === 0) return false
  const noteText = note.toLowerCase()
  return keywords.some(keyword => noteText.includes(keyword))
}

const showAddressDialog = () => {
  const addresses = form.value.addressFilterMode === 'whitelist' 
    ? form.value.whitelistAddresses 
    : form.value.blacklistAddresses
  addressInput.value = addresses.join('\n')
  addressDialogVisible.value = true
}

const saveAddresses = () => {
  const addresses = addressInput.value
    .split('\n')
    .map(addr => addr.trim())
    .filter(addr => addr && addr.length === 34)
  
  if (form.value.addressFilterMode === 'whitelist') {
    form.value.whitelistAddresses = [...new Set(addresses)]
  } else {
    form.value.blacklistAddresses = [...new Set(addresses)]
  }
  
  addressDialogVisible.value = false
  
  ElMessage.success(`已保存 ${addresses.length} 个有效${form.value.addressFilterMode === 'whitelist' ? '白名单' : '黑名单'}地址`)
}

const checkAddressMatch = (from, to) => {
  if (form.value.addressFilterMode === 'none') return true
  
  const fromAddr = (from || '').toLowerCase()
  const toAddr = (to || '').toLowerCase()
  const addressList = (form.value.addressFilterMode === 'whitelist' 
    ? form.value.whitelistAddresses 
    : form.value.blacklistAddresses
  ).map(addr => addr.toLowerCase())
  
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
        
        try {
          toAddress = tronWeb.address.fromHex(value.to_address || value.to)
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
  processedBlockCount.value = 0
  currentScanningBlock.value = form.value.startBlock
  successBlocks.value = 0
  failedBlocks.value = 0
  const tronWeb = getTronWeb()

  try {
    const totalBlocks = form.value.endBlock - form.value.startBlock + 1
    let blockNumbers = []
    
    if (form.value.scanOrder === 'asc') {
      for (let i = form.value.startBlock; i <= form.value.endBlock; i++) {
        blockNumbers.push(i)
      }
    } else {
      for (let i = form.value.endBlock; i >= form.value.startBlock; i--) {
        blockNumbers.push(i)
      }
    }

    if (form.value.parallelScan) {
      const chunkSize = Math.ceil(blockNumbers.length / form.value.threadCount)
      const chunks = []
      
      for (let i = 0; i < blockNumbers.length; i += chunkSize) {
        chunks.push(blockNumbers.slice(i, i + chunkSize))
      }

      const tasks = chunks.map(async (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          if (!scanning.value) break

          const blockNum = chunk[i]
          currentScanningBlock.value = blockNum

          try {
            if (form.value.autoThrottle) {
              await rateLimiter.wait()
            }

            const block = await tronWeb.trx.getBlock(blockNum)
            
            if (form.value.autoThrottle) {
              rateLimiter.success()
            }

            if (block && block.transactions) {
              successBlocks.value++
              for (const tx of block.transactions) {
                if (!scanning.value) break
                
                if (tx.raw_data && tx.raw_data.contract) {
                  for (const contract of tx.raw_data.contract) {
                    const result = await processTransaction(tx, blockNum, contract)
                    if (result) {
                      transactions.value.push(result)
                    }
                  }
                }
              }
            }
          } catch (error) {
            failedBlocks.value++
            console.error(`扫描区块 ${blockNum} 失败:`, error)
            if (form.value.autoThrottle) {
              rateLimiter.error()
              if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                await new Promise(resolve => setTimeout(resolve, 5000))
              }
            }
          }

          processedBlockCount.value++
          scanProgress.value = Math.floor(processedBlockCount.value / totalBlocks * 100)
        }
      })

      await Promise.all(tasks)
    } else {
      for (let i = 0; i < blockNumbers.length; i++) {
        if (!scanning.value) break

        const blockNum = blockNumbers[i]
        currentScanningBlock.value = blockNum
        
        try {
          const block = await tronWeb.trx.getBlock(blockNum)
          if (block && block.transactions) {
            successBlocks.value++
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
          }
        } catch (error) {
          failedBlocks.value++
          console.error(`扫描区块 ${blockNum} 失败:`, error)
        }

        processedBlockCount.value++
        scanProgress.value = Math.floor(processedBlockCount.value / totalBlocks * 100)
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

const saveSettings = () => {
  try {
    localStorage.setItem('tronScannerSettings', JSON.stringify({
      network: form.value.network,
      scanOrder: form.value.scanOrder,
      tokenTypes: form.value.tokenTypes,
      noteFilter: form.value.noteFilter,
      addressFilterMode: form.value.addressFilterMode,
      addressFilterType: form.value.addressFilterType,
      whitelistAddresses: form.value.whitelistAddresses,
      blacklistAddresses: form.value.blacklistAddresses,
      enableContractCheck: form.value.enableContractCheck,
      parallelScan: form.value.parallelScan,
      threadCount: form.value.threadCount,
      autoThrottle: form.value.autoThrottle
    }))
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

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

onMounted(async () => {
  loadSettings()
  await refreshLatestBlock()
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
  if (!form.value.whitelistAddresses.includes(address)) {
    form.value.whitelistAddresses.push(address)
    ElMessage.success('已添加到白名单')
    saveSettings()
  } else {
    ElMessage.info('该地址已在白名单中')
  }
}

const addToBlacklist = (address) => {
  if (!form.value.blacklistAddresses.includes(address)) {
    form.value.blacklistAddresses.push(address)
    ElMessage.success('已添加到黑名单')
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
</script>

<style scoped>
.container {
  max-width: 1600px;
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
  white-space: nowrap;
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
</style> 