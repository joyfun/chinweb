<template>
  <div class="dept">
    <el-row :gutter="10">
      <el-col :xs="24" :sm="18">
        <div class="app-container">
          <div class="filter-container">
            <!-- <el-input v-model="deptName" :placeholder="$t('table.dept.deptName')" class="filter-item search-item" />
            <el-button class="filter-item" type="primary" plain @click="readNode">
              {{ $t('table.search') }}
            </el-button>
            <el-button class="filter-item" type="warning" plain @click="reset">
              {{ $t('table.reset') }}
            </el-button>
            -->
            <el-dropdown v-has-any-permission="['dept:add','dept:delete','dept:export']" trigger="click" class="filter-item">
              <el-button>
                {{ $t('table.more') }}<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-for="o in nodeinvoke" :key="o.remotePath" @click.native="invokeAction(o)">{{ $t('links[\''+o.name+'\']') }} </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-upload
              class="upload-demo"
              accept="application/json"
              action="udefined"
              :before-upload="loadModel"
              auto-upload
            >
              <el-button size="small" type="primary">点击上传</el-button>
              <!-- <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div> -->
            </el-upload></div>
          <el-tree
            ref="nodeTree"
            node-key="remotePath"
            :load="readNode"
            :check-strictly="true"
            :props="treeProps"
            accordion
            lazy
            highlight-current
            :filter-node-method="filterNode"
            @node-click="nodeClick"
          ><span slot-scope="{ node, data }" class="custom-tree-node">
            <span>{{ node.label }}</span>
            <span style="position:absolute;right:0;">
              <i class="el-icon-info table-operation" style="color: #87d068;" @click="showProps(data)" />
            </span></span></el-tree>
        </div>
        <node-param
          ref="edit"
          :dialog-visible="dialog.isVisible"
          :title="dialog.title"
          :type="dialog.type"
          :remote-node="curNode"
          :invoke-attr="invokeAttr"
          @updateParent="nodeUpdate"
          @close="editClose"
        />
        <node-properties
          ref="props"
          :dialog-visible="propsDialog.isVisible"
          :title="dialog.title"
          :type="dialog.type"
          :path="curNode.remotePath"
          @close="editClose"
        />
      </el-col>
    </el-row>
  </div>
</template>
<script>
import Vue from 'vue'
import NodeParam from './Params'
import NodeProperties from './Props'

import linkhelper from '@/utils/linkhelper'

// import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
export default {
  name: 'DataManager',
  components: { NodeParam, NodeProperties },
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
      propsDialog: {
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
              this.nodeUpdate(data.remotePath)
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
    filterNode(value, data) {
      // 根据是否有type 和 disconnectedTs来隐藏删除的node
      if (!data.get('$type') && data.getConfig('$disconnectedTs')) {
        console.log('hide node')
        return false
      }
      //   if (data.getConfig('$disconnectedTs')) {
      //     return false
      //   }
      return true

    //   if (data != null && data.getConfig('$disconnectedTs')) {
    //     console.log('node filter  ' + data.name)
    //     return true
    //   }
    //   if (!value) return true
    //   return data.label.indexOf(value) !== -1
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
              this.$link.requester.listOnce(element[1].remotePath).then(rnode => {
                rnode.invokes = linkhelper.getInvoke(rnode)
                console.log(rnode)
              })
              tdata.push(element[1])
            }
          }
        }
      }
      return tdata
    },
    readNode: function(node, resolve) {
      const { requester } = this.$link
      var path = '/data'

      if (node && node.data && node.data.remotePath) {
        path = node.data.remotePath
      }
      requester.listOnce(path).then((rnode) => {
        node.data = rnode
        rnode.invokes = linkhelper.getInvoke(rnode)
        if (!rnode.invokes) {
          rnode.invokes = []
        }
        Vue.set(this, 'curNode', rnode)
        // nodeinvoke = this.getInvoke(ndata)
        Vue.set(this, 'nodeinvoke', rnode.invokes)
        Vue.set(this, 'nodeattrs', linkhelper.getAttribute(rnode))

        resolve(this.nodeChildArray(rnode))
        this.$refs.nodeTree.filter('$is')
      }

      )
    },
    renderContent(h, { node, data, store }) {
      console.log(data)
      return (
        <span class='custom-tree-node'>
          <span>{node.label}</span>
          <span>
            <el-dropdown strigger='click' class='filter-item'>
              <el-button click='prepareInvoke(row)'>
                { this.$t('table.more') },<i class='el-icon-arrow-down  el-icon--right' />
              </el-button>
              <el-dropdown-menu slot='dropdown'>
                {data.invokes.forEach((o, idx) => {
                  return (<el-dropdown-item
                    key='o.remotePath'
                    click='invokeAction(o)'
                  >   {o.name}</el-dropdown-item>)
                })}

              </el-dropdown-menu>
            </el-dropdown>
          </span>
        </span>)
    },
    nodeClick(ndata, node, el) {
      console.log(ndata)
      //   Vue.set(this.cur)
      //   console.log(this)
      Vue.set(this, 'curNode', ndata)
      ndata.invokes = linkhelper.getInvoke(ndata)
      this.nodeinvoke = ndata.invokes

      this.nodeattrs = linkhelper.getAttribute(ndata)
      //   console.log(this.curNode)
      //   console.log(this.nodeinvoke)
      // console.log(data.getSimpleMap())
      for (var element of ndata.children) {
        console.log(element[1].get('$invokable'))
      }
    },
    nodeUpdate(path) {
      console.log(path)
      const index = path.lastIndexOf('/')
      var nodepath = path.substring(0, index)
      const tree = this.$refs.nodeTree
      const cNode = tree.getNode(nodepath)
      if (cNode) {
        cNode.loaded = false
        cNode.expand()// 主动调用展开节点方法，重新查询该节点下的所有子节点
      } else if (nodepath.length > 1) {
        this.nodeUpdate(nodepath)
      }
    },
    add() {
      Vue.set(this.dialog, 'isVisible', true)
      this.dialog.title = this.$t('common.action')

      this.dialog.type = 'add'
    },
    showProps(rnode) {
      Vue.set(this.propsDialog, 'isVisible', true)
      this.propsDialog.title = this.$t('common.action')
      this.propsDialog.type = 'view'
    },
    editClose() {
      this.dialog.isVisible = false
      this.propsDialog.isVisible = false
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
    },
    loadModel(selectedFile) {
      // 获取读取我文件的File对象
      // var selectedFile = document.getElementById('files').files[0]
      var name = selectedFile.name// 读取选中文件的文件名
      var size = selectedFile.size// 读取选中文件的大小
      console.log('文件名:' + name + '大小:' + size + '类型' + selectedFile.type)

      var reader = new FileReader()// 这是核心,读取操作就是由它完成.
      reader.readAsText(selectedFile)// 读取文件的内容,也可以读取文件的URL
      reader.onload = function() {
        // 当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可
        var model = JSON.parse(this.result)
        console.log(model)
      }
      return false
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
