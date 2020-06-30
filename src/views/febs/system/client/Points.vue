<template>
  <el-dialog
    :title="title"
    :width="width"
    top="50px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="isVisible"
  >
    <div class="filter-container">
      <el-form ref="form" :model="point" label-position="right" label-width="165px">
        <el-form-item :label="$t('table.client.address')" prop="name">
          <el-input v-model="client.name" :readonly="type === 'add' ? false : 'readonly'" />
        </el-form-item>
        <el-form-item :label="$t('table.client.type')" prop="type">
          <el-select v-model="client.type" value="" placeholder="" style="width:100%" @change="fillPort">
            <el-option
              v-for="item in addressType"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('table.client.dataType')" prop="datatype">
          <el-select v-model="client.datatype" value="" placeholder="" style="width:100%" @change="fillPort">
            <el-option
              v-for="item in ntype"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      <!-- <el-form-item :label="$t('table.client.webServerRedirectUri')" prop="webServerRedirectUri">
        <el-input v-model="client.webServerRedirectUri" />
      </el-form-item>
      <el-form-item :label="$t('table.client.accessTokenValidity')" prop="accessTokenValidity">
        <el-input v-model="client.accessTokenValidity" />
      </el-form-item>
      <el-form-item :label="$t('table.client.refreshTokenValidity')" prop="refreshTokenValidity">
        <el-input v-model="client.refreshTokenValidity" />
      </el-form-item>
      <el-form-item :label="$t('table.client.autoapprove')" prop="autoapprove">
        <el-select v-model="client.autoapprove" placeholder="" value="" style="width:100%">
          <el-option label="true" value="1" />
          <el-option label="false" value="0" />
        </el-select>
      </el-form-item> -->
      </el-form>

      <el-button class="filter-item" type="info" plain @click="startLink">
        {{ $t('common.save') }}
      </el-button>
    </div>
    <!-- <el-table :data="plist" border fit highlight-current-row style="width: 100%"> -->
    <el-table
      ref="table"
      :data="plist"
      border
      fit
      style="width: 100%;"
      :highlight-current-row="true"
    >
      <el-table-column label="名称" prop="name" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ bacnet_type[scope.row.type] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="地址" prop="address" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.address }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数值类型" prop="vtype" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ ntype[scope.row.vtype] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="格式" prop="order" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.order }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.operation')" align="center" min-width="60px" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <!-- <i v-hasPermission="['client:decrypt']" class="el-icon-unlock table-operation" style="color: #87d068;" @click="unlock(row)" />
          <i v-hasPermission="['client:update']" class="el-icon-setting table-operation" style="color: #2db7f5;" @click="edit(row)" /> -->
          <i class="el-icon-delete table-operation" style="color: #f50;" @click="singleDelete(scope.$index)" />
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script>
const { DSLink } = require('dslink/js/web')

export default {
  name: 'InlineEditTable',
  props: {
    deviceInfo: {},
    dialogVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      point: {},
      screenWidth: 0,
      buttonLoading: false,
      width: this.initWidth(),
      client: this.initClient(),

      bacnet_type: ['AI', 'AO', 'BI', 'BO', 'BV', 'CAL'],
      modbus_type: ['DI', 'DO', 'AI', 'AO'],
      ntype: ['bool', 'int', 'float'],
      byteorder: ['', 'abcd', 'bacd', 'cdab', 'dcba']
    }
  },
  computed: {
    addressType: {
      get() {
        if (this.deviceInfo.type === 'modbus') {
          return this.modbus_type
        } return this.bacnet_type
      },
      set() {}
    },
    isVisible: {
      get() {
        return this.dialogVisible
      },
      set() {
        this.close()
        this.reset()
      }
    },
    plist: {
      get() {
        // return this.deviceInfo.points
        if (this.deviceInfo && this.deviceInfo.points) { return this.deviceInfo.points }
        return []
      },
      set(val) {
        this.deviceInfo.plist = val
      }
    }
  },
  watch: {
    isVisible(val) {
      console.log(val)
      if (val) {
        this.getPoints(this.deviceInfo)
      }
    }
  },
  mounted() {
    window.onresize = () => {
      return (() => {
        this.width = this.initWidth()
      })()
    }
  },
  typeFomratter(row, column) {
    // if(row.type)
  },
  created() {
    // this.getPoints()
  },
  methods: {
    getPoints(devInfo) {
      this.$get('api/points', { deviceId: devInfo.deviceId }).then((res) => {
        this.deviceInfo = res.data
        if (res.data.points) { this.plist = res.data.points }
      })
    },
    startLink() {
    //   console.log('btn clicke')
      this.$get('jsconn').then(async(r) => {
        if (r.data) {
          const url = 'ws://localhost:8080/ws?auth=' + r.data.auth + '&dsId=' + r.data.dsId
          const link = new DSLink(url, 'json')
          link.connect()
          const { requester } = link
          console.log(await requester.subscribe('/sys/dataOutPerSecond', (val) => { console.log(val) }))
          console.log(
            (await requester.listOnce('/sys'))
              .children
          )
          console.log(
            (await requester.invokeOnce('/sys/get_server_log', { lines: 5 }))
              .result.log
          )
        }
      })

      //    console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));
    },
    addPoints(point) {
      this.deviceInfo.points.push(point)
    },
    savePoints() {
      this.deviceInfo.points = this.plist
      delete this.deviceInfo.plist
      this.$postJson('api/points', this.deviceInfo).then((res) => {
        this.$message({
          message: this.$t('tips.updateSuccess'),
          type: 'success'
        })
        this.deviceInfo = res.data
        if (res.data.points) { this.plist = res.data.points }
      })
    },
    initWidth() {
      this.screenWidth = document.body.clientWidth
      if (this.screenWidth < 991) {
        return '90%'
      } else if (this.screenWidth < 1400) {
        return '45%'
      } else {
        return '800px'
      }
    },
    fillPort(val) {
      console.log(val)
      if (val === 'bacnet') {
        this.client.port = 47808
      } else if (val === 'modbus') {
        this.client.port = 502
      }
    },
    initClient() {
      return {
      }
    },
    setClient(val) {
      this.client = { ...val }
      let authorizedGrantTypes = []
      if (this.client.authorizedGrantTypes && typeof this.client.authorizedGrantTypes === 'string') {
        authorizedGrantTypes = this.client.authorizedGrantTypes.split(',')
        this.client.authorizedGrantTypes = authorizedGrantTypes
      }
      this.client.clientSecret = '******'
      this.client.autoapprove = this.client.autoapprove !== null ? this.client.autoapprove + '' : ''
    },
    submitForm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          // this.buttonLoading = true
          if (this.type === 'add') {
            // create
            this.$parent.save(this.client)
            this.close()
          }
        } else {
          return false
        }
      })
    },
    close() {
      this.$emit('close')
    },
    reset() {
      if (this.$refs.form) {
        this.$refs.form.clearValidate()
        this.$refs.form.resetFields()
      }
      this.client = this.initClient()
    },
    singleDelete(index) {
      this.$confirm(this.$t('tips.confirmDelete'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        this.plist.splice(index, 1)
        this.savePoints()
      }).catch(() => {
        // this.clearSelections()
      })
    //   this.$refs.table.toggleRowSelection(row, true)
    //   this.batchDelete()
    }
  }
}
</script>

<style scoped>
.edit-input {
  padding-right: 100px;
}
.cancel-btn {
  position: absolute;
  right: 15px;
  top: 10px;
}
</style>
