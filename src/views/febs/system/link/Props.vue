<template>
  <el-dialog
    :title="title"
    width="800px"
    top="50px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="isVisible"
  >    <el-table
         ref="table"
         :key="tableKey"
         v-loading="loading"
         :data="nodeattrs"
         border
         fit
         style="width: 100%;"
       >
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
           <template slot-scope="scope">
             <i class="el-icon-view table-operation" style="color: #87d068;" @click="view(scope.row,scope.$index)" />
           </template>
         </el-table-column>
       </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="pagination.num" :limit.sync="pagination.size" @pagination="search" />
  </el-dialog>
</template>

<script>
import Vue from 'vue'
import Pagination from '@/components/Pagination'
import linkhelper from '@/utils/linkhelper'

export default {
  name: 'NodeProperties',
  components: { Pagination },
  filters: {
    sexFilter(status) {
      const map = {
        0: 'success',
        1: 'danger',
        2: 'info'
      }
      return map[status]
    },
    statusFilter(status) {
      const map = {
        0: 'danger',
        1: 'success'
      }
      return map[status]
    }
  },
  props: {
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
    },
    path: {
      type: String,
      default: '/'
    }
  },
  data() {
    return {
      auth: {},
      curNode: {},
      requster: {},
      nodeinvoke: [],
      nodeattrs: [],
      dialog: {
        isVisible: false,
        title: ''
      },
      userViewVisible: false,
      tableKey: 0,
      loading: false,
      list: null,
      total: 0,
      queryParams: {},
      sort: {},
      selection: [],
      pagination: {
        size: 10,
        num: 1
      }
    }
  },

  computed: {
    isVisible: {
      get() {
        return this.dialogVisible
      },
      set() {
        this.close()
        this.reset()
      }
    }
  },
  watch: {
    isVisible(val) {
      console.log(this.path)
      if (val) {
        this.listNode(this.path, this.updateCurr)
      }
    }
  },
  methods: {
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
    updateCurr: function(rnode) {
      console.log('updateCurr')
      console.log(rnode)
      Vue.set(this, 'curNode', rnode)
      Vue.set(this, 'nodeinvoke', linkhelper.getInvoke(rnode))
      Vue.set(this, 'nodeattrs', linkhelper.getAttribute(rnode))
      console.log(this.nodeattrs)

      this.nodeattrs.forEach((row, index) => {
        this.view(row, index)
      })
      console.log(this.nodeattrs)
    },
    listNode: function(path, cb) {
      this.$link.requester.listOnce(path).then((rnode) => {
        if (cb) {
          cb(rnode)
        }
      }
      )
    },
    readNode: function(node) {
      const { requester } = this.$link
      return requester.subscribeOnce(node.remotePath)
    },
    transSex(sex) {
      switch (sex) {
        case '0':
          return this.$t('common.sex.male')
        case '1':
          return this.$t('common.sex.female')
        default:
          return this.$t('common.sex.secret')
      }
    },
    filterStatus(value, row) {
      return row.status === value
    },
    filterSex(value, row) {
      return row.sex === value
    },
    viewClose() {
      this.userViewVisible = false
    },
    editClose() {
      this.dialog.isVisible = false
    },
    editSuccess() {
      this.search()
    },
    onSelectChange(selection) {
      this.selection = selection
    },
    search() {
      this.listNode('/sys/startTime')
    },
    reset() {
      this.queryParams = {}
      this.sort = {}
      this.$refs.table.clearSort()
      this.$refs.table.clearFilter()
      this.search()
    },
    delete(userIds) {
      this.loading = true
      this.$delete(`system/user/${userIds}`).then(() => {
        this.$message({
          message: this.$t('tips.deleteSuccess'),
          type: 'success'
        })
        this.search()
      })
    },
    updateRow(row) {
      console.log(row)
      this.$set(this.nodeattrs, row.$index, row)
    },
    view(row, index) {
      // console.log(JSON.stringify(row))
      this.readNode(row).then(rnode => {
        console.log(rnode.remotePath)
        console.log(rnode)
        row.nodevalue = rnode.value
        this.$set(this.nodeattrs, index, row)
      })
      this.userViewVisible = true
    },
    edit(row) {
      let roleId = []
      if (row.roleId && typeof row.roleId === 'string') {
        roleId = row.roleId.split(',')
        row.roleId = roleId
      }
      this.$get(`system/user/${row.userId}`).then((r) => {
        row.deptIds = r.data.data
        this.$refs.edit.setUser(row)
        this.dialog.title = this.$t('common.edit')
        this.dialog.isVisible = true
      })
    },
    close() {
      this.$emit('close')
    },
    sortChange(val) {
      this.sort.field = val.prop
      this.sort.order = val.order
      this.search()
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
