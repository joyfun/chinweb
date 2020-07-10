<template>
  <div class="app-container">
    <div class="filter-container">
      <el-dropdown v-has-any-permission="['dept:add','dept:delete','dept:export']" trigger="click" class="filter-item">
        <el-button>
          {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="o in nodeinvoke" :key="o.remotePath" @click.native="invokeAction(o)">{{ $t('links[\''+o.name+'\']') }} </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

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
import linkhelper from '@/utils/linkhelper'

export default {
  name: 'NodesTable',
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
  props: {
    title: {
      type: String,
      default: ''
    },
    rpath: {
      type: String,
      default: '/sys'
    }},
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

  },
  mounted() {
    // this.listNode('/downstream/C-Modbus')
    this.listNode(this.rpath, this.updateCurr)
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
    invokeAction(data, val) {
      this.$link.requester.listOnce(data.remotePath).then(rnode => {
        console.log(rnode)
        this.curNode = rnode
        if (rnode.getConfig('$params')) {
          this.invokeAttr = linkhelper.getInvokeAttr(rnode)
          this.add()
        } else {
          this.$link.requestr.invokeOnce(rnode.remotePath, {}).then(resp => {
            if (resp.error) {
              this.$message({
                message: resp.error,
                type: 'warning'
              })
            } else {
              this.$emit('close')
            }
          })
        }
      })
    },
    nodeUpdate(path) {
      console.log(path)
      const index = path.lastIndexOf('/')
      const nodepath = path.substring(0, index)

      const tree = this.$refs.nodeTree
      const cNode = tree.getNode(nodepath)
      if (cNode) {
        cNode.loaded = false
        cNode.expand()// 主动调用展开节点方法，重新查询该节点下的所有子节点
      }
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
    listNode: function(path, cb) {
    //   if (this.auth.auth) {
      const { requester } = this.$link
      requester.listOnce(path).then((rnode) => {
        console.log(rnode)
        rnode.invokes = linkhelper.getInvoke(rnode)
        if (!rnode.invokes) {
          rnode.invokes = []
        }
        Vue.set(this, 'nodeinvoke', rnode.invokes)
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
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
