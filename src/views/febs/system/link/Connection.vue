<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="queryParams.username" :placeholder="$t('common.name')" class="filter-item search-item" />
      <el-button class="filter-item" type="primary" plain @click="search">
        {{ $t('table.search') }}
      </el-button>
      <el-dropdown v-has-any-permission="['user:add','user:delete','user:reset','user:export']" trigger="click" class="filter-item">
        <el-button>
          {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="o in nodeinvoke" :key="o.remotePath">{{ o.name }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <el-table
      ref="table"
      :key="tableKey"
      v-loading="loading"
      :data="nodeattrs"
      border
      fit
      style="width: 100%;"
      @selection-change="onSelectChange"
      @sort-change="sortChange"
    >
      <el-table-column type="selection" align="center" width="40px" />
      <el-table-column :label="$t('common.name')" prop="name" :show-overflow-tooltip="true" align="center" min-width="120px">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column
        :label="$t('table.user.sex')"
        :filters="[{ text: $t('common.sex.male'), value: '0' }, { text: $t('common.sex.female'), value: '1' }, { text: $t('common.sex.secret'), value: '2' }]"
        :filter-method="filterSex"
        class-name="status-col"
      >
        <template slot-scope="{row}">
          <el-tag :type="row.sex | sexFilter">
            {{ transSex(row.sex) }}
          </el-tag>
        </template>
      </el-table-column> -->
      <el-table-column :label="$t('common.path')" :show-overflow-tooltip="true" align="center" min-width="150px">
        <template slot-scope="scope">
          <span>{{ scope.row.remotePath }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column :label="$t('table.user.dept')" align="center" min-width="100px">
        <template slot-scope="scope">
          <span>{{ scope.row.deptName }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.user.status')"
        :filters="[{ text: $t('common.status.valid'), value: '1' }, { text: $t('common.status.invalid'), value: '0' }]"
        :filter-method="filterStatus"
        class-name="status-col"
      >
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status === '1' ? $t('common.status.valid') : $t('common.status.invalid') }}
          </el-tag>
        </template>
      </el-table-column> -->
      <el-table-column :label="$t('common.value')" prop="value" align="center" min-width="240px" sortable="custom">
        <template slot-scope="scope">
          <span>{{ scope.row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.operation')" align="center" min-width="150px" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <i v-hasPermission="['user:view']" class="el-icon-view table-operation" style="color: #87d068;" @click="view(row)" />
          <i v-hasPermission="['user:update']" class="el-icon-setting table-operation" style="color: #2db7f5;" @click="edit(row)" />
          <i v-hasPermission="['user:delete']" class="el-icon-delete table-operation" style="color: #f50;" @click="singleDelete(row)" />
          <el-link v-has-no-permission="['user:view','user:update','user:delete']" class="no-perm">
            {{ $t('tips.noPermission') }}
          </el-link>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="pagination.num" :limit.sync="pagination.size" @pagination="search" />
    <!-- <user-edit
      ref="edit"
      :dialog-visible="dialog.isVisible"
      :title="dialog.title"
      @success="editSuccess"
      @close="editClose"
    />
   <user-view
      ref="view"
      :dialog-visible="userViewVisible"
      @close="viewClose"
    /> -->
  </div>
</template>

<script>
import Vue from 'vue'
import Pagination from '@/components/Pagination'

export default {
  name: 'Settings',
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
    currentUser() {
      return this.$store.state.account.user
    }
  },
  mounted() {
    this.listNode('/sys', this.updateCurr)
  },
  methods: {
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
              this.readNode(element[1]).then(rnode => {
                console.log(rnode)
                element[1].value = rnode.value
              })
              attrs.push(element[1])
            }
          }
        }
      }
      return attrs
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
    updateCurr: function(rnode) {
      Vue.set(this, 'curNode', rnode)
      Vue.set(this, 'nodeinvoke', this.getInvoke(rnode))
      Vue.set(this, 'nodeattrs', this.getAttribute(rnode))
    },
    listNode: function(path, cb) {
      if (this.auth.auth) {
        const { requester } = this.$link

        requester.listOnce(path).then((rnode) => {
          if (cb) {
            cb(rnode)
          }
        }
        )
      } else {
        this.refreshAuth(this.listNode, path)
      }
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
    singleDelete(row) {
      this.$refs.table.toggleRowSelection(row, true)
      this.batchDelete()
    },
    batchDelete() {
      if (!this.selection.length) {
        this.$message({
          message: this.$t('tips.noDataSelected'),
          type: 'warning'
        })
        return
      }
      let contain = false
      this.$confirm(this.$t('tips.confirmDelete'), this.$t('common.tips'), {
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
        type: 'warning'
      }).then(() => {
        const userIds = []
        this.selection.forEach((u) => {
          if (u.userId === this.currentUser.userId) {
            contain = true
            return
          }
          userIds.push(u.userId)
        })
        if (contain) {
          this.$message({
            message: this.$t('tips.containCurrentUser'),
            type: 'warning'
          })
          this.clearSelections()
        } else {
          this.delete(userIds)
        }
      }).catch(() => {
        this.clearSelections()
      })
    },
    clearSelections() {
      this.$refs.table.clearSelection()
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
    view(row) {
      this.readNode(row).then(rnode => {
        console.log(rnode)
      })
      //   this.$refs.view.setUser(row)
      console.log(this.nodeattrs)
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
