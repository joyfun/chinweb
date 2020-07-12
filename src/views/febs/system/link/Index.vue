<template>
  <div class="dept">
    <h2>设备选择</h2>
    <el-row ref="dept" :gutter="10">
      <el-col :xs="24" :sm="24">
        <div class="app-container">
          <div class="filter-container">
            <el-upload
              class="upload-demo"
              style="display:none"
              accept="application/json"
              action="udefined"
              :before-upload="loadModel"
              auto-upload
            >
              <el-button id="fileButton" ref="fileButton" size="small" type="primary">点击上传</el-button>
            </el-upload>
          </div>
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
          >
            <span slot-scope="{ node, data }" class="custom-tree-node">
              <span>{{ node.label }}</span>
              <span ref="invokes" class="invoks w1920" @click.stop="log">
                <template v-for="(o, index) in data.invokes">
                  <el-button
                    v-if="index < count"
                    :key="o.remotePath"
                    type="primary"
                    size="mini"
                    :title="$t('links[\''+o.name+'\']')"
                    @click.stop="invokeAction(o)"
                  >{{ $t('links[\''+o.name+'\']') }}</el-button>
                  <el-dropdown
                    v-if="index === count"
                    :key="o.remotePath"
                    v-has-any-permission="['dept:add','dept:delete','dept:export']"
                    class="filter-item"
                    trigger="click"
                    :hide-on-click="false"
                  >
                    <el-button type="primary">
                      {{ $t('table.more') }}
                      <i class="el-icon-arrow-down el-icon--right" />
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <template v-for="(k, i) in data.invokes">
                        <el-dropdown-item
                          v-if="i >= count"
                          :key="k.remotePath"
                          @click.native="invokeAction(k)"
                        >{{ $t('links[\''+k.name+'\']') }}</el-dropdown-item>
                      </template>
                    </el-dropdown-menu>
                  </el-dropdown>
                </template>
                <i
                  class="el-icon-refresh table-operation"
                  style="color: #1890ff;font-size: 1.4rem;"
                  @click.stop="showProps(data)"
                />
                <i
                  style="color: #1890ff;font-size: 1.4rem;"
                  class="el-icon-view table-operation"
                  @click.stop="showCongfigs(data)"
                />
              </span>
            </span>
          </el-tree>
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
        <el-dialog :visible.sync="configVisible">
          <el-row style="margin: 5px 0" class="tip" width:400>
            <el-col :span="6">名称</el-col>
            <el-col :span="18">值</el-col>&nbsp;
          </el-row>
          <el-row
            v-for="(option,index) in curConfig"
            :key="index"
            width:400
            style="margin: 2px 0"
            :class="{ tip: true, odd: true }"
          >
            <el-col :span="6">{{ index }}&nbsp;</el-col>
            <el-col :span="18">{{ option }}&nbsp;</el-col>&nbsp;
          </el-row>
        </el-dialog>
        <tree-dialog :title="title" :tree-dialog-visible.sync="dialogVisible" />
        <!-- :deviceType="deviceType" :newWhAirPanelVisible.sync="whAirPanelVisible" -->
      </el-col>
    </el-row>
  </div>
</template>
<script>
import Vue from 'vue'
import NodeParam from './Params'
import NodeProperties from './Props'
import TreeDialog from './tree-dialog'

import linkhelper from '@/utils/linkhelper'

// import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
export default {
  name: 'LinkManager',
  components: { NodeParam, NodeProperties, TreeDialog },
  filters: {

  },
  data() {
    return {
      auth: {},
      curNode: {},
      configVisible: false,
      nodeinvoke: [],
      nodeattrs: [],
      invokeAttr: [],
      curInvoke: {},
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
        label(data, node) {
          return data.name
        }
      },
      dept: this.initDept(),
      rules: {
        deptName: [
          { required: true, message: this.$t('rules.require'), trigger: 'blur' },
          { min: 3, max: 10, message: this.$t('rules.range3to10'), trigger: 'blur' }
        ]
      },
      count: 4,
      objResize: null,
      dialogVisible: false,
      title: '',
      index: 0
    }
  },
  computed: {
    curConfig: function() {
      var conf = {}
      if (this.curNode && this.curNode.remotePath) {
        this.curNode.forEachConfig((key, val) => {
          if (val instanceof Object || key.indexOf('$') < 0) {
            return
          }
          conf[key] = val
        })
        this.curNode.forEachAttribute((key, val) => {
          if (val instanceof Object || key.indexOf('@') < 0) {
            return
          }
          conf[key] = val
        })
      }
      console.log(conf)
      return conf
    }
    // nodeinvoke: function() {
    //   console.log('##### computed')
    //   return this.getInvoke(this.curNode)
    // }
  },
  created() {
    window.addEventListener('resize', this.getWidth)
    this.getWidth()
  },
  destroyed() {
    window.removeEventListener('resize', this.getWidth)
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
      // 树形弹框的参数 dialogVisible title
      // this.dialogVisible = true
      // this.title = "树形选择"

      if (data.get('$invokable') === 'file') {
        this.curInvoke = data
        document.getElementById('fileButton').click()
        // this.$refs.fileButton.handleClick()
        return
      }
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
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    loadRoot() {
      this.deptTree = this.readNode('/downstream/ModbusLink')
    },
    // 获取子级
    nodeChildArr(rnode) {
      return new Promise((resolve) => {
        var tdata = []
        let flag = true
        if (rnode.children.size > 0) {
          const arr = Array.from(rnode.children)
          this.index = arr.length
          for (let index = 0; index < arr.length; index++) {
            const element = arr[index]
            console.log(element[1])
            if (element[1].get('$is') === 'node' || element[1].get('$is') === 'static' || element[1].get('$is') === 'dsa/link') {
              if (element[1].get('$invokable') || element[1].get('$hidden')) {
                // tdata.push(element[1])
                this.index--
                if (flag) {
                  const timer = setTimeout(() => {
                    if (this.index === 0) {
                      console.log(tdata)
                      resolve(tdata)
                    }
                    clearTimeout(timer)
                  }, 100)
                }
              } else {
                flag = false
                this.$link.requester.listOnce(element[1].remotePath).then(item => {
                  element[1].invokes = linkhelper.getInvoke(item)
                  tdata.push(element[1])
                  this.index--
                  const timer = setTimeout(() => {
                    if (this.index === 0) {
                      console.log(tdata)
                      resolve(tdata)
                    }
                    clearTimeout(timer)
                  }, 100)
                })
              }
            } else {
              this.index--
              if (flag) {
                const timer = setTimeout(() => {
                  if (this.index === 0) {
                    console.log(tdata)
                    resolve(tdata)
                  }
                  clearTimeout(timer)
                }, 100)
              }
            }
          }
        } else {
          resolve(tdata)
        }
      })
    },
    nodeChildArray(rnode) {
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
                console.log('#################')
                console.log(rnode)
              })
              tdata.push(element[1])
            }
          }
        }
      }
      return tdata
    },
    readNode(node, resolve) {
      const { requester } = this.$link
      var path = '/downstream'

      if (node && node.data && node.data.remotePath) {
        path = node.data.remotePath
      }
      requester.listOnce(path).then((rnode) => {
        // console.log(path)
        console.log(node)
        node.data = rnode
        rnode.invokes = linkhelper.getInvoke(rnode)

        // if (path === '/downstream') {
        if (!rnode.invokes) {
          rnode.invokes = []
        }
        // }
        Vue.set(this, 'curNode', rnode)
        // nodeinvoke = this.getInvoke(ndata)
        Vue.set(this, 'nodeinvoke', rnode.invokes)
        Vue.set(this, 'nodeattrs', linkhelper.getAttribute(rnode))
        this.nodeChildArr(rnode).then((res) => {
          console.log(res)
          resolve(res)
        })

        // resolve(this.nodeChildArray(rnode))
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
                {this.$t('table.more')},<i class='el-icon-arrow-down el-icon--right' />
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
      const nodepath = path.substring(0, index)

      const tree = this.$refs.nodeTree
      const cNode = tree.getNode(nodepath)
      if (cNode) {
        cNode.loaded = false
        cNode.expand()// 主动调用展开节点方法，重新查询该节点下的所有子节点
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
    showCongfigs(rnode) {
      this.configVisible = true
    },
    loadModel(selectedFile) {
      // 获取读取我文件的File对象
      // var selectedFile = document.getElementById('files').files[0]
      var name = selectedFile.name// 读取选中文件的文件名
      var size = selectedFile.size// 读取选中文件的大小
      console.log('文件名:' + name + '大小:' + size + '类型' + selectedFile.type)
      if (size > 1000 * 1000) {
        return false
      }

      var reader = new FileReader()// 这是核心,读取操作就是由它完成.
      reader.readAsText(selectedFile)// 读取文件的内容,也可以读取文件的URL
      var that = this
      reader.onload = function() {
        // 当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可
        that.$link.requester.invokeOnce(that.curInvoke.remotePath, { 'JSON': this.result }).then(resp => {
          console.log(resp)
          if (resp.error) {
            that.$message({
              message: resp.error,
              type: 'warning'
            })
          } else {
            that.nodeUpdate(that.curInvoke.remotePath)
            that.$emit('close')
          }
        })
      }
      return false
    },
    getWidth() {
      if (this.$refs.invokes) {
        this.count = Math.floor((this.$refs.invokes.clientWidth - 200) / 125) - 1
      } else {
        this.count = Math.floor((this.$refs.dept.clientWidth * 0.75) / 125) - 1
      }
    },
    log() {

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
  h2 {
    padding: 20px;
    background-color: #fff;
    margin-left: -5px;
    margin-right: -5px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
/deep/ .custom-tree-node {
  display: flex;
  font-size: 14px;
  padding-right: 8px;
  width: 100%;
  .invoks {
    flex-grow: 1;
    text-align: right;
  }
}
/deep/ .el-tree-node__content {
  height: 40px;
  line-height: 40px;
}
.dept {
    .el-row {
    background-color: #fff;
    /deep/ .el-button {
        width: 125px;
        margin-right: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
    }
    /deep/ .el-dropdown-link {
        width: 175px;
        margin-right: 10px;
    }
    .tip {
        background-color: oldlace;
        line-height: 24px;
        .el-col {
        border-right: 2px solid #fff;
        padding-left: 10px;
        }
    }
    .odd {
        background-color: #f0f9eb;
        .el-col {
        border-right: 2px solid #fff;
        padding-left: 5px;
        }
    }
    }
}
</style>
<style lang="scss">
.vue-treeselect__menu {
  max-height: 165px !important;
}
.el-dropdown-link {
  cursor: pointer;
  color: #edf4fa;
}
.el-icon-arrow-down {
  font-size: 12px;
}
</style>
