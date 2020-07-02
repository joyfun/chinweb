<template>
  <div class="dept">
    <el-row :gutter="10">
      <el-col :xs="24" :sm="12">
        <div class="app-container">
          <div class="filter-container">
            <el-input v-model="deptName" :placeholder="$t('table.dept.deptName')" class="filter-item search-item" />
            <el-button class="filter-item" type="primary" plain @click="readNode">
              {{ $t('table.search') }}
            </el-button>
            <el-button class="filter-item" type="warning" plain @click="reset">
              {{ $t('table.reset') }}
            </el-button>
            <el-dropdown v-has-any-permission="['dept:add','dept:delete','dept:export']" trigger="click" class="filter-item">
              <el-button>
                {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-for="o in nodeinvoke" :key="o">{{ o.name }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <el-tree
            ref="deptTree"
            node-key="remotePath"
            :load="readNode"
            :check-strictly="true"
            :props="treeProps"
            accordion
            lazy
            highlight-current
            :filter-node-method="filterNode"
            @node-click="nodeClick"
          />
        </div>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>{{ dept.deptId === '' ? this.$t('common.add') : this.$t('common.edit') }}</span>
          </div>
          <div>
            <!-- <el-row>{{ curNode }}</el-row> -->
            <el-row>{{ nodeinvoke }}</el-row>

            <el-form ref="form" :model="dept" :rules="rules" label-position="right" label-width="100px">
              <el-form-item :label="$t('table.dept.parentId')" prop="parentId">
                <treeselect
                  v-model="dept.parentId"
                  :multiple="false"
                  :options="deptTree"
                  :clear-value-text="$t('common.clear')"
                  placeholder=" "
                  style="width:100%"
                />
              </el-form-item>
              <el-form-item :label="$t('table.dept.deptName')" prop="deptName">
                <el-input v-model="dept.deptName" />
              </el-form-item>
              <el-form-item :label="$t('table.dept.orderNum')" prop="orderNum">
                <el-input-number v-model="dept.orderNum" :min="0" :max="100" @change="handleNumChange" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
        <el-card class="box-card" style="margin-top: -2rem;">
          <el-row>
            <el-col :span="24" style="text-align: right">
              <el-button type="primary" plain :loading="buttonLoading" @click="submit">{{ dept.deptId === '' ? this.$t('common.add') : this.$t('common.edit') }}</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import Vue from 'vue'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
const { DSLink } = require('dslink/js/web')

export default {
  name: 'LinkManager',
  components: { Treeselect },
  filters: {

  },
  data() {
    return {
      auth: {},
      curNode: {},
      deptName: '',
      buttonLoading: false,
      deptTree: [],
      treeProps: {
        children: 'subNode',
        label: function(data, node) {
          return data.name
        }
      },
      dept: this.initDept(),
      rules: {
        deptName: [
          { required: true, message: this.$t('rules.require'), trigger: 'blur' },
          { min: 3, max: 10, message: this.$t('rules.range3to10'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    nodeinvoke: function() {
      console.log('##### computed')
      return this.getInvoke(this.curNode)
    }
  },
  mounted() {
    // this.refreshAuth()
  //  this.initDeptTree()
  },
  methods: {
    initDept() {
      return {
        deptId: '',
        deptName: '',
        parentId: null,
        orderNum: 0
      }
    },
    getInvoke(node) {
      var ivks = []
      if (node) {
        console.log(node.children)
        if (node.children) {
          console.log(node.children.size)
          console.log(typeof (node.children))
          for (var element of node.children) {
            console.log(element[0])
            if (element[1].get('$invokable')) {
              console.log('######')
              ivks.push(element[1])
            }
          }
        }
      }
      return ivks
    },
    showNode(node) {
      // node.get("$is")==='node'||)
      return false
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
          this.$link = link
          this.$link.connect()

          if (cb) {
            cb(node, resolve)
          }
        }
      })
    },
    loadRoot: async function() {
      this.deptTree = this.readNode('/downstream')
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
    readNode: function(node, resolve) {
      if (this.auth.auth) {
        const { requester } = this.$link
        var path = '/'

        if (node && node.data && node.data.remotePath) {
          path = node.data.remotePath
        }
        requester.listOnce(path).then((rnode) => {
          console.log(path)
          node.data = rnode
          console.log(rnode.children)
          resolve(this.nodeChildArray(rnode))
        }

        )
      } else {
        this.refreshAuth(this.readNode, node, resolve)
      }
    },
    initDeptTree() {
      this.$get('system/dept').then((r) => {
        this.deptTree = r.data.data.rows
      })
    },
    exportExcel() {
      this.$download('system/dept/excel', {
        deptName: this.deptName
      }, `dept_${new Date().getTime()}.xlsx`)
    },
    handleNumChange(val) {
      this.dept.orderNum = val
    },
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    nodeClick(ndata, node, el) {
    //   console.log(data)
    //   console.log(node)
    //   Vue.set(this.cur)
    //   console.log(this)
      Vue.set(this, 'curNode', ndata)
      // this.nodeinvoke = this.getInvoke(data)
      //   console.log(this.curNode)
      //   console.log(this.nodeinvoke)
      // console.log(data.getSimpleMap())
      for (var element of ndata.children) {
        console.log(element[1].get('$invokable'))
      }
    },
    add() {
      this.resetForm()
      this.$message({
        message: this.$t('tips.createTips'),
        type: 'info'
      })
    },
    deleteDept() {
      const checked = this.$refs.deptTree.getCheckedKeys()
      if (checked.length === 0) {
        this.$message({
          message: this.$t('tips.noNodeSelected'),
          type: 'warning'
        })
      } else {
        this.$confirm(this.$t('tips.confirmDeleteNode'), this.$t('common.tips'), {
          confirmButtonText: this.$t('common.confirm'),
          cancelButtonText: this.$t('common.cancel'),
          type: 'warning'
        }).then(() => {
          this.dept.deptIds = checked.join(',')
          this.$delete(`system/dept/${this.dept.deptIds}`).then(() => {
            this.$message({
              message: this.$t('tips.deleteSuccess'),
              type: 'success'
            })
            this.reset()
          })
        }).catch(() => {
          this.$refs.deptTree.setCheckedKeys([])
        })
      }
    },
    search() {
      this.$refs.deptTree.filter(this.deptName)
    },
    reset() {
      this.initDeptTree()
      this.deptName = ''
      this.resetForm()
    },
    submit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.buttonLoading = true
          this.dept.createTime = this.dept.modifyTime = null
          if (this.dept.deptId) {
            this.$put('system/dept', { ...this.dept }).then(() => {
              this.buttonLoading = false
              this.$message({
                message: this.$t('tips.updateSuccess'),
                type: 'success'
              })
              this.reset()
            })
          } else {
            this.$post('system/dept', { ...this.dept }).then(() => {
              this.buttonLoading = false
              this.$message({
                message: this.$t('tips.createSuccess'),
                type: 'success'
              })
              this.reset()
            })
          }
        } else {
          return false
        }
      })
    },
    resetForm() {
      this.$refs.form.clearValidate()
      this.$refs.form.resetFields()
      this.dept = this.initDept()
    }
  }
}
</script>
<style lang="scss" scoped>
  .dept {
    margin: 10px;
    .app-container {
      margin: 0 0 10px 0 !important;
    }
  }
  .el-card.is-always-shadow {
    box-shadow: none;
  }
  .el-card {
    border-radius: 0;
    border: none;
    .el-card__header {
      padding: 10px 20px !important;
      border-bottom: 1px solid #f1f1f1 !important;
    }
  }
</style>
<style lang="scss">
  .vue-treeselect__menu {
    max-height: 165px !important;
  }
</style>
