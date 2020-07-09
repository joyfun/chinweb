<template>
  <div class="app-container">
    <!-- <div class="filter-container">
      <el-input v-model="queryParams.clientId" :placeholder="$t('table.client.clientId')" class="filter-item search-item" />
      <el-button class="filter-item" type="primary" plain @click="search">
        {{ $t('table.edit') }}
      </el-button>
      <el-button v-for="item in nodeinvoke" :key="item.remotePath" class="filter-item" type="primary" plain @click="prepareInvoke(item)">
        {{ item.name }}
      </el-button>

      {{ nodeattrs }}
    </div> -->

    <el-table
      ref="table"
      :key="tableKey"
      v-loading="loading"
      :data="nodeChildren"
      border
      fit
      style="width: 100%;"
    >
      <el-table-column type="selection" align="center" width="40px" />
      <el-table-column :label="$t('common.name')" prop="name" :show-overflow-tooltip="true" align="center" min-width="120px">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.path')" :show-overflow-tooltip="true" align="center" min-width="150px">
        <template slot-scope="scope">
          <span>{{ scope.row.remotePath }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.value')" prop="nodevalue" align="center" min-width="240px" sortable="custom">
        <template slot-scope="scope">
          <span>{{ scope.row.nodevalue }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.operation')" align="center" min-width="150px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-dropdown strigger="click" class="filter-item">
            <el-button @click="prepareInvoke(row)">
              {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="o in row.invokeAttr"
                :key="o.remotePath"
                @click.native="invokeAction(o)"
              >{{ o.name }} </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="pagination.num" :limit.sync="pagination.size" @pagination="search" />
    <node-param
      ref="edit"
      :dialog-visible="dialog.isVisible"
      :title="dialog.title"
      :type="dialog.type"
      :remote-node="curNode"
      :invoke-attr="invokeAttr"
      @close="editClose"
      @success="editSuccess"
    />
  </div>
</template>
<script>
import Vue from 'vue'
import Pagination from '@/components/Pagination'
import NodeParam from './Params'

const { DSLink } = require('dslink/js/web')

export default {
  name: 'DriverManage',
  components: { Pagination, NodeParam },
  filters: {
    approveFilter(status) {
      const map = {
        1: 'success',
        0: 'danger'
      }
      return map[status]
    }
  },
  data() {
    return {
      auth: {},
      curNode: {},
      requster: {},
      nodeinvoke: [],
      nodeParams: {},
      nodeChildren: [],
      nodeattrs: [],
      invokeAttr: [],
      dialog: {
        isVisible: false,
        title: '',
        type: ''
      },
      curDevice: {},
      pointDialog: {
        isVisible: false,
        title: '',
        type: ''
      },
      tableKey: 0,
      loading: false,
      list: [],
      total: 0,
      queryParams: {},
      selection: [],
      pagination: {
        size: 10,
        num: 1
      }
    }
  },
  computed: {
    // invokeAttr: {
    //   get() {
    //     var ret = []
    //     if (this.curNode && this.curNode.remotePath) {
    //       var params = this.curNode.getConfig('$params')
    //       if (params) {
    //         params.forEach(element => {
    //           var matchs = element.type.match(/(^enum\[)(.+)(\])/)
    //           if (matchs && matchs.length > 2) {
    //             element.type = 'enum'
    //             element.enums = matchs[2].split(',')
    //           }
    //           ret.push(element)
    //         })
    //       }
    //     }
    //     return ret
    //   }
    // }
  },
  mounted() {
    // this.listNode('/downstream/C-Modbus')
    this.listNode('/downstream', this.updateCurr)
  },
  methods: {
    getNodeParams(rnode) {
      var param = {}
      if (rnode && rnode.remotePath) {
        var params = rnode.getConfig('$params')
        if (params) {
          params.forEach(element => {
            if (element.default !== undefined) { param[element.name] = element.default } else {
              param[element.name] = 0
            }
          })
        }
      }
      return param
    },
    getInvoke(node) {
      var ivks = []
      if (node) {
        if (node.children) {
          for (var element of node.children) {
            if (element[1].get('$invokable')) {
              ivks.push(element[1])
            }
          }
        }
      }
      return ivks
    },
    getAttribute(node) {
      var attrs = []
      if (node) {
        if (node.children) {
          for (var element of node.children) {
            if (element[1].getConfig('$type') === 'string' || element[1].getConfig('$type') === 'number') {
              attrs.push(element[1])
            }
          }
        }
      }
      return attrs
    },
    getInvokeAttr(rnode) {
      var ret = []
      rnode.getConfig('$params').forEach(element => {
        var matchs = element.type.match(/(^enum\[)(.+)(\])/)
        if (matchs && matchs.length > 2) {
          element.type = 'enum'
          element.enums = matchs[2].split(',')
        }
        ret.push(element)
      })
      return ret
    },
    updateCurr: function(rnode) {
    //   console.log(rnode)
    //   Vue.set(this, 'curNode', rnode)
    //   Vue.set(this, 'nodeinvoke', this.getInvoke(rnode))
    //   Vue.set(this, 'nodeattrs', this.getAttribute(rnode))
      Vue.set(this, 'nodeChildren', this.nodeChildArray(rnode))
    },
    nodeChildArray: function(rnode) {
      var tdata = []
      if (rnode.children) {
        for (var element of rnode.children) {
          if (element.length < 2) {
            continue
          }
          if (element[1].get('$is') === 'node' || element[1].get('$is') === 'static' || element[1].get('$is') === 'dsa/link') {
            if (element[1].get('$type') || element[1].get('$invokable') || element[1].get('$hidden')) {
              //   console.log(element[1])
            } else {
              tdata.push(element[1])
            }
          }
        }
      }
      return tdata
    },
    refreshAuth: function(cb, node, resolve) {
      if (this.$link && this.$link.status) {
        this.$link.close()
      }
      this.$get('jsconn').then(async(r) => {
        if (r.data) {
          this.auth = r.data

          // const url = 'ws://'+window.location.host+'/ws?auth=' + this.auth.auth + '&dsId=' + this.auth.dsId
          const url = 'ws://localhost:8080/ws?auth=' + this.auth.auth + '&dsId=' + this.auth.dsId
          const link = new DSLink(url, 'json')
          Vue.prototype.$link = link
          this.$link.connect()

          if (cb) {
            cb(node, resolve)
          }
        }
      })
    },
    listNode: function(path, cb) {
    //   if (this.auth.auth) {
      const { requester } = this.$link
      requester.listOnce(path).then((rnode) => {
        if (cb) {
          cb(rnode)
        }
      }
      )
    //   } else {
    //     this.refreshAuth(this.listNode, path, cb)
    //   }
    },
    prepareInvoke(data) {
      this.$link.requester.listOnce(data.remotePath).then(rnode => {
        console.log(rnode)
        Vue.set(data, 'invokeAttr', this.getInvoke(rnode))
      })
    },
    invokeAction(data, val) {
    //   console.log(data.configs)
      this.$link.requester.listOnce(data.remotePath).then(rnode => {
        this.curNode = rnode
        this.invokeAttr = this.getInvokeAttr(rnode)
        this.add()
      })
    },
    editSuccess() {
      this.search()
    },
    editClose() {
      this.dialog.isVisible = false
      this.pointDialog.isVisible = false
    },
    pointsClose() {
      this.pointDialog.isVisible = false
    },
    onSelectChange(selection) {
      this.selection = selection
    },
    add() {
      Vue.set(this.dialog, 'isVisible', true)
      this.dialog.title = this.$t('common.add')

      this.dialog.type = 'add'
      console.log(this.dialog)
    },
    pointsAdd(index) {
      this.curDevice = this.list[index]
      console.log(this.curDevice)
      this.pointDialog.title = this.$t('common.add')
      this.pointDialog.isVisible = true
      this.pointDialog.type = 'add'
    },
    edit(row) {
      this.$refs.edit.setClient(row)
      this.dialog.title = this.$t('common.edit')
      this.dialog.isVisible = true
      this.dialog.type = 'edit'
    },
    unlock(row) {
      this.$get(`auth/client/secret/${row.clientId}`).then((r) => {
        this.$message({
          showClose: true,
          message: this.$t('tips.clientOriginSecret') + r.data.data,
          duration: 0,
          type: 'success'
        })
      })
    },
    batchDelete() {
      if (!this.selection.length) {
        this.$message({
          message: this.$t('tips.noDataSelected'),
          type: 'warning'
        })
        return
      }
      this.$confirm(this.$t('tips.confirmDelete'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        const clientIds = []
        this.selection.forEach((c) => {
          clientIds.push(c.clientId)
        })
        this.delete(clientIds)
      }).catch(() => {
        this.clearSelections()
      })
    },
    singleDelete(index) {
      this.$confirm(this.$t('tips.confirmDelete') + index, this.$t('common.tips'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        this.list.splice(index, 1)
        console.log(this.list)
        this.save()
      }).catch(() => {
        this.clearSelections()
      })
    //   this.$refs.table.toggleRowSelection(row, true)
    //   this.batchDelete()
    },
    delete(clientIds) {
      this.loading = true
    //   this.$delete(`auth/client`, { clientIds }).then(() => {
    //     this.$message({
    //       message: this.$t('tips.deleteSuccess'),
    //       type: 'success'
    //     })
    //     this.search()
    //   })
    },
    clearSelections() {
      this.$refs.table.clearSelection()
    },
    search() {
    //   this.fetch({
    //     ...this.queryParams
    //   })
    },
    save(client) {
      if (client && client.port) {
        this.list.push(client)
      }
      this.buttonLoading = true
      // create
      this.$postJson('api/devices', { devices: this.list }).then(() => {
        this.buttonLoading = false
        this.isVisible = false
        this.$message({
          message: this.$t('tips.updateSuccess'),
          type: 'success'
        })
        this.$emit('success')
      })
    },
    reset() {
      this.queryParams = {}
      this.search()
    },
    fetch(params = {}) {
      this.$get('api/devices', {
        ...params
      }).then((r) => {
        this.list = r.data
        // console.log(this.list)
        this.loading = false
      })
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
