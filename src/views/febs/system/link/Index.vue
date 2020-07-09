<template>
  <div class="dept">
    <el-row :gutter="10">
      <el-col :xs="24" :sm="12">
        <div class="app-container">
          <div class="filter-container">
            <!-- <el-input v-model="deptName" :placeholder="$t('table.dept.deptName')" class="filter-item search-item" />
            <el-button class="filter-item" type="primary" plain @click="readNode">
              {{ $t('table.search') }}
            </el-button>
            <el-button class="filter-item" type="warning" plain @click="reset">
              {{ $t('table.reset') }}
            </el-button>
            <el-dropdown v-has-any-permission="['dept:add','dept:delete','dept:export']" trigger="click" class="filter-item">
              <el-button>
                {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button> -->
            <!-- <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-for="o in nodeinvoke" :key="o.remotePath" @click="invokeAction">{{ o.name }} </el-dropdown-item>
            </el-dropdown-menu>
            </el-dropdown> -->
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
            <span>{{ dept.deptId === '' ? this.$t('common.action') : this.$t('common.edit') }}</span>
          </div>
          <div>
            <!-- <div v-for="item in nodeattrs" :key="item.remotePath">
              {{ item.remotePath }}
            </div> -->
            <el-button v-for="item in nodeinvoke" :key="item.remotePath" class="filter-item" type="primary" plain @click="invokeAction(item)">
              {{ item.name }}
            </el-button>

            <node-param
              ref="edit"
              :dialog-visible="dialog.isVisible"
              :title="dialog.title"
              :type="dialog.type"
              :remote-node="curNode"
              :invoke-attr="invokeAttr"
              @close="editClose"
            />
          </div>
        </el-card>
        <el-card class="box-card" style="margin-top: -2rem;">
          <el-row>
            <el-col :span="24" style="text-align: right">
              <el-button type="primary" plain :loading="buttonLoading" @click="submit">{{ dept.deptId === '' ? this.$t('common.action') : this.$t('common.edit') }}</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import Vue from 'vue'
import NodeParam from './Params'
import linkhelper from '@/utils/linkhelper'

// import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
export default {
  name: 'LinkManager',
  components: { NodeParam },
  filters: {

  },
  data() {
    return {
      auth: {},
      curNode: {},
      nodeinvoke: [],
      nodeattrs: [],
      invokeAttr: [],
      dialog: {
        isVisible: false,
        title: '',
        type: ''
      },
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
    // nodeinvoke: function() {
    //   console.log('##### computed')
    //   return this.getInvoke(this.curNode)
    // }
  },
  mounted() {
    // request.getDslink()
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
    invokeAction(data, val) {
    //   console.log(data.configs)

      this.$link.requester.listOnce(data.remotePath).then(rnode => {
        console.log(rnode)
        this.curNode = rnode
        if (rnode.getConfig('$params')) {
          this.invokeAttr = linkhelper.getInvokeAttr(rnode)
          this.add()
        } else {
          this.$link.requester.invokeOnce(rnode.remotePath, {}).then(resp => {
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
    showNode(node) {
      // node.get("$is")==='node'||)
      return false
    },
    loadRoot: async function() {
      this.deptTree = this.readNode('/downstream/ModbusLink')
    },
    nodeChildArray: function(rnode) {
      var tdata = []
      if (rnode.children) {
        for (var element of rnode.children) {
          if (element.length < 2) {
            continue
          }
          if (element[1].get('$is') === 'node' || element[1].get('$is') === 'static' || element[1].get('$is') === 'dsa/link') {
            if (element[1].get('$invokable') || element[1].get('$hidden')) {
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
      const { requester } = this.$link
      var path = '/downstream'

      if (node && node.data && node.data.remotePath) {
        path = node.data.remotePath
      }
      requester.listOnce(path).then((rnode) => {
        console.log(path)
        console.log(rnode)
        node.data = rnode
        Vue.set(this, 'curNode', rnode)
        // nodeinvoke = this.getInvoke(ndata)
        Vue.set(this, 'nodeinvoke', linkhelper.getInvoke(rnode))
        Vue.set(this, 'nodeattrs', linkhelper.getAttribute(rnode))

        // console.log(rnode.children)
        resolve(this.nodeChildArray(rnode))
      }

      )
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
      console.log(ndata)
      //   Vue.set(this.cur)
      //   console.log(this)
      Vue.set(this, 'curNode', ndata)
      this.nodeinvoke = linkhelper.getInvoke(ndata)
      this.nodeattrs = linkhelper.getAttribute(ndata)
      //   console.log(this.curNode)
      //   console.log(this.nodeinvoke)
      // console.log(data.getSimpleMap())
      for (var element of ndata.children) {
        console.log(element[1].get('$invokable'))
      }
    },
    add() {
      Vue.set(this.dialog, 'isVisible', true)
      this.dialog.title = this.$t('common.action')

      this.dialog.type = 'add'
    },
    editClose() {
      this.dialog.isVisible = false
      this.pointDialog.isVisible = false
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
    //   this.$refs.form.clearValidate()
    //   this.$refs.form.resetFields()
    //   this.dept = this.initDept()
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
