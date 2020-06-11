<template>
  <div class="app-container">
    <el-table
      ref="table"
      :key="tableKey"
      v-loading="loading"
      :data="list"
      border
      fit
      style="width: 100%;"
      :highlight-current-row="true"
      @selection-change="onSelectChange"
    >
      <el-table-column type="selection" align="center" width="40px" />
      <el-table-column :label="$t('table.client.clientId')" prop="deviceId" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.deviceId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" prop="name" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.client.type')" prop="type" :show-overflow-tooltip="true" align="center" min-width="100px">
        <template slot-scope="scope">
          <el-tag size="medium">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.client.host')" prop="host" :show-overflow-tooltip="true" align="center" min-width="100px">
        <template slot-scope="scope">
          <span>{{ scope.row.host }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.client.port')" prop="port" :show-overflow-tooltip="true" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.port }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.client.site')" prop="slave" :show-overflow-tooltip="true" align="center" min-width="170px">
        <template slot-scope="scope">
          <span>{{ scope.row.slave }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('table.operation')" align="center" min-width="150px" class-name="small-padding fixed-width" fixed="right">
        <!-- <template slot-scope="{row}">
          <i v-hasPermission="['client:decrypt']" class="el-icon-unlock table-operation" style="color: #87d068;" @click="unlock(row)" />
          <i v-hasPermission="['client:update']" class="el-icon-setting table-operation" style="color: #2db7f5;" @click="edit(row)" />
          <i v-hasPermission="['client:delete']" class="el-icon-delete table-operation" style="color: #f50;" @click="singleDelete(row)" />
          <el-link v-has-no-permission="['client:decrypt','client:update','client:delete']" class="no-perm">
            {{ $t('tips.noPermission') }}
          </el-link>
        </template> -->
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="pagination.num" :limit.sync="pagination.size" @pagination="search" />
    <client-edit
      ref="edit"
      :dialog-visible="dialog.isVisible"
      :title="dialog.title"
      :type="dialog.type"
      @close="editClose"
      @success="editSuccess"
    />
  </div>
</template>
<script>
import Pagination from '@/components/Pagination'
import ClientEdit from './Edit'

export default {
  name: 'ClientManage',
  components: { Pagination, ClientEdit },
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
      dialog: {
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
  mounted() {
    this.fetch()
  },
  methods: {
    transApprove(v) {
      switch (v) {
        case 0:
          return 'false'
        case 1:
          return 'true'
        default:
          return ''
      }
    },
    editSuccess() {
      this.search()
    },
    editClose() {
      this.dialog.isVisible = false
    },
    onSelectChange(selection) {
      this.selection = selection
    },
    add() {
      this.dialog.title = this.$t('common.add')
      this.dialog.isVisible = true
      this.dialog.type = 'add'
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
    singleDelete(row) {
      this.$refs.table.toggleRowSelection(row, true)
      this.batchDelete()
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
      this.fetch({
        ...this.queryParams
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
        console.log(this.list)
        this.loading = false
      })
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
